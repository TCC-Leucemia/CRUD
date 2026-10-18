"""Inventário offline e avaliação exploratória explícita, sem rótulos na entrada.

Sem --executar-api, não usa chave nem faz requisições. Os rótulos dos nomes
não são referência clínica validada; os resultados medem concordância com eles.
"""

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

from triagem_hematologica import PROMPT_PATH, criar_requisicao, extrair_texto_completo

RAIZ = Path(__file__).resolve().parents[2]
CLASSES = ("LMA", "LLA", "LMC", "LLC", "NORMAL", "INDETERMINADO", "ERRO")
ROTULOS = {"ALM": "LMA", "AML": "LMA", "ALL": "LLA", "CML": "LMC",
           "LMC": "LMC", "CLL": "LLC", "NORMAL": "NORMAL", "SAUDAVEL": "NORMAL"}


def inventariar(pasta):
    grupos = defaultdict(list)
    for imagem in sorted(pasta.iterdir()):
        if imagem.is_file() and imagem.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            grupos[hashlib.sha256(imagem.read_bytes()).hexdigest()].append(imagem.name)
    casos = []
    for sha, nomes in grupos.items():
        representante = min(nomes, key=lambda nome: (len(nome), nome))
        sufixos = {Path(nome).stem.rsplit("-", 1)[-1].upper() for nome in nomes}
        rotulos = {ROTULOS.get(sufixo) for sufixo in sufixos}
        rotulo = next(iter(rotulos)) if len(rotulos) == 1 else None
        casos.append({
            "sha256": sha, "representante": representante, "arquivos": nomes,
            "quantidade_arquivos": len(nomes), "rotulo_do_nome": rotulo,
            "referencia_clinica_validada": False,
        })
    return casos


def validar_classificacao(texto):
    # Reutiliza o parser real da API, inclusive para rejeitar níveis ausentes,
    # alternativas e duplicatas. Não manter uma segunda regra mais permissiva.
    script = """
const fs = require('node:fs');
const { extrairCamposTecnicos } = require('./tcc2026/api/utils/analiseIA');
try {
    process.stdout.write(JSON.stringify(extrairCamposTecnicos(fs.readFileSync(0, 'utf8'))));
} catch {
    process.exitCode = 2;
}
"""
    resultado = subprocess.run(
        ["node", "-e", script], input=texto, text=True, encoding="utf-8",
        capture_output=True, cwd=RAIZ, timeout=10, check=False,
    )
    if resultado.returncode:
        raise ValueError("Resposta rejeitada pelo contrato da API ou validador Node indisponível.")
    return json.loads(resultado.stdout)["tipo"]


def avaliar(casos, pasta):
    # Importação tardia mantém o inventário utilizável sem SDK ou credencial.
    from dotenv import load_dotenv
    from openai import OpenAI

    load_dotenv(RAIZ / "tcc2026" / ".env")
    cliente = OpenAI(timeout=90, max_retries=0)
    resultados = []
    for caso in casos:
        try:
            resposta = cliente.responses.create(**criar_requisicao(
                pasta / caso["representante"],
                "Não informado", "Não informado", "Não informado", "Não informado",
            ))
            texto = extrair_texto_completo(resposta)
            classe = validar_classificacao(texto)
            resultados.append({
                "sha256": caso["sha256"], "referencia": caso["rotulo_do_nome"],
                "predicao": classe, "texto": texto,
                "modelo_retornado": resposta.model, "status": resposta.status,
                "uso": resposta.usage.model_dump() if resposta.usage else None,
            })
        except Exception as erro:
            resultados.append({
                "sha256": caso["sha256"], "referencia": caso["rotulo_do_nome"],
                "predicao": "ERRO", "tipo_erro": type(erro).__name__,
                "http_status": getattr(erro, "status_code", None),
            })
            # Evita repetir credenciais recusadas ou gastar em uma falha de rede.
            if type(erro).__name__ in {"AuthenticationError", "APIConnectionError"}:
                break
    return resultados


def resumir(resultados):
    matriz = {c: {p: 0 for p in CLASSES} for c in CLASSES[:5]}
    por_classe = {}
    for resultado in resultados:
        ref, pred = resultado["referencia"], resultado["predicao"]
        if ref in matriz:
            matriz[ref][pred] += 1
    for classe, linha in matriz.items():
        total = sum(linha.values())
        por_classe[classe] = {"acertos_rotulo_nome": linha[classe], "avaliados": total}
    return {"matriz_rotulo_do_nome_vs_predicao": matriz, "por_classe": por_classe,
            "aviso": "Concordância exploratória; não é acurácia clínica validada."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pasta", type=Path, default=RAIZ / "tcc2026" / "amostras")
    parser.add_argument("--saida", type=Path,
                        default=RAIZ / "docs" / "validacao-hematologia" / "inventario.json")
    parser.add_argument("--executar-api", action="store_true",
                        help="Envia uma chamada por conteúdo único à OpenAI, com cobrança da API.")
    args = parser.parse_args()
    casos = inventariar(args.pasta)
    if not casos:
        parser.error("Nenhuma imagem JPEG/PNG encontrada.")
    documento = {
        "gerado_em_utc": datetime.now(timezone.utc).isoformat(),
        "total_arquivos": sum(c["quantidade_arquivos"] for c in casos),
        "conteudos_distintos_sha256": len(casos),
        "distribuicao_rotulos_conteudos_distintos": dict(Counter(c["rotulo_do_nome"] for c in casos)),
        "prompt_sha256": hashlib.sha256(PROMPT_PATH.read_bytes()).hexdigest(),
        "modelo_solicitado": "gpt-4.1", "casos": casos,
        "avaliacao_executada": args.executar_api,
        "independencia_clinica": "Não estabelecida; há recortes compartilhados entre arquivos.",
    }
    falhou = False
    if args.executar_api:
        resultados = avaliar(casos, args.pasta)
        documento["resultados"] = resultados
        documento["resumo"] = resumir(resultados)
        documento["casos_nao_executados"] = len(casos) - len(resultados)
        falhou = any(r["predicao"] == "ERRO" for r in resultados)
    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(json.dumps(documento, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"arquivos": documento["total_arquivos"], "conteudos_distintos": len(casos),
                      "api_executada": args.executar_api, "saida": str(args.saida)}, ensure_ascii=False))
    return 1 if falhou else 0


if __name__ == "__main__":
    raise SystemExit(main())

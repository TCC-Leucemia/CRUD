"""Contrato de entrada e saída da triagem; não executa chamadas ao importar."""

import base64
import json
import mimetypes
from pathlib import Path

PROMPT_PATH = Path(__file__).parent / "prompts" / "triagem_hematologica.md"


def criar_requisicao(caminho_da_imagem, idade, sexo, sintomas, historia):
    imagem = Path(caminho_da_imagem)
    tipo_mime, _ = mimetypes.guess_type(imagem.name)
    if tipo_mime not in {"image/jpeg", "image/png"}:
        raise ValueError("A triagem aceita apenas imagens JPEG ou PNG.")
    dados = {
        "idade": idade,
        "sexo": sexo,
        "sintomas": sintomas,
        "historia": historia,
    }
    return {
        "model": "gpt-4.1",
        "instructions": PROMPT_PATH.read_text(encoding="utf-8"),
        "input": [{
            "role": "user",
            "content": [
                {"type": "input_text", "text": json.dumps(dados, ensure_ascii=False)},
                {
                    "type": "input_image",
                    "image_url": f"data:{tipo_mime};base64,"
                    + base64.b64encode(imagem.read_bytes()).decode("ascii"),
                    "detail": "high",
                },
            ],
        }],
        "max_output_tokens": 2600,
    }


def extrair_texto_completo(resposta):
    """Não transforma uma resposta interrompida ou recusada em pré-laudo."""
    if resposta.status != "completed":
        raise ValueError("A IA não concluiu a análise. Tente novamente.")
    for item in getattr(resposta, "output", []):
        for bloco in getattr(item, "content", []):
            if getattr(bloco, "type", None) == "refusal":
                raise ValueError("A IA recusou a análise; nenhum pré-laudo foi gerado.")
    texto = resposta.output_text
    if not texto or not texto.strip():
        raise ValueError("A IA não devolveu um pré-laudo textual. Tente novamente.")
    return texto

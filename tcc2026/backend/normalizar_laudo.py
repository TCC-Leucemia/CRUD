"""Normaliza o texto da análise preliminar antes de gerar o PDF.

- Linhas de separador ("=====", "-----") ganham largura fixa, para não
  ultrapassarem a página nem a caixa de texto da tela.
- A linha "GRAU DE CERTEZA" fica só com a categoria (Alto, Moderado ou Baixo):
  percentuais parecem probabilidade clínica e são removidos.

A mesma regra existe na API (api/utils/analiseIA.js), para registros antigos.
"""
import re

LARGURA_SEPARADOR = 48


def normalizar_texto(texto):
    linhas = []
    for linha in str(texto or "").splitlines():
        limpa = linha.strip()
        if re.fullmatch(r"={5,}", limpa):
            linhas.append("=" * LARGURA_SEPARADOR)
        elif re.fullmatch(r"-{5,}", limpa):
            linhas.append("-" * LARGURA_SEPARADOR)
        elif re.match(r"GRAU\s+DE\s+CERTEZA\s*:", limpa, re.IGNORECASE):
            sem_parenteses = re.sub(r"\s*\([^)]*%[^)]*\)", "", linha)
            linhas.append(re.sub(r"\s*\d+(?:[.,]\d+)?\s*%", "", sem_parenteses).rstrip())
        else:
            linhas.append(linha)
    return "\n".join(linhas)

import io
import os
import re
import sys
import time
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["GRPC_VERBOSITY"] = "ERROR"
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from dotenv import load_dotenv
from openai import OpenAI

import hemoPDF as hemoPDF
from normalizar_laudo import normalizar_texto
from triagem_hematologica import criar_requisicao, extrair_texto_completo

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("API key não encontrada. Verifique o .env (analise_celular)")


def extrair_relatorio_clinico(texto_completo):
    """Remove os campos técnicos que o backend usa para persistir a análise."""
    separador = re.search(r"={10,}", texto_completo)
    if not separador:
        return normalizar_texto(texto_completo)
    return normalizar_texto(texto_completo[separador.start():].strip())


def analisar_celula(caminho_da_imagem, idade, sexo, sintomas, historia):
    try:
        response = client.responses.create(
            **criar_requisicao(caminho_da_imagem, idade, sexo, sintomas, historia)
        )

        laudo_texto = extrair_texto_completo(response)
        relatorio_clinico = extrair_relatorio_clinico(laudo_texto)

        timestamp = int(time.time())
        nome_arquivo_pdf = f"laudo_{timestamp}.pdf"
        hemoPDF.gerar_laudo_pdf(
            relatorio_clinico,
            {
                "idade": idade,
                "sexo": sexo,
                "sintomas": sintomas,
                "historia": historia,
            },
            nome_arquivo_pdf,
        )

        return f"{nome_arquivo_pdf}|||{laudo_texto}"

    except Exception as erro:
        return f"ERRO|||Erro técnico: {str(erro)}"


if __name__ == "__main__":
    if len(sys.argv) >= 6:
        caminho = sys.argv[1].replace('"', "").strip()
        resultado = analisar_celula(
            caminho, sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
        )
        sys.stdout.write(resultado)
        sys.stdout.flush()

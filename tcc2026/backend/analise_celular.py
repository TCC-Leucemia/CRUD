import os
import sys
import io
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
os.environ['GRPC_VERBOSITY'] = 'ERROR'  

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import base64
import mimetypes
from openai import OpenAI
import chromadb
from chromadb.utils import embedding_functions
import time
import hemoPDF as hemoPDF
from dotenv import load_dotenv

# O .env fica na raiz de tcc2026, um nivel acima da pasta backend/
RAIZ_PROJETO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(RAIZ_PROJETO, ".env"))


def obter_cliente():
    # pegando a chave da API direto do .env
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("OPENAI_API_KEY não configurada no arquivo .env")
    return OpenAI(api_key=api_key)

#Hemogram / Lab Values (if available): {hemograma}
def analisar_celula(caminho_da_imagem, idade, sexo, sintomas, historia):
    try:
        sys.stderr.write("DEBUG: Iniciando função analisar_celula...\n")

        sys.stderr.write("DEBUG: Enviando para o OpenAI...\n")

        prompt_especialista = f"""You are an expert Hematopathologist assisting in a diagnostic support system. Analyze the provided peripheral blood smear image alongside the patient's clinical history/hemogram data to evaluate for acute or chronic leukemias.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATIENT CLINICAL & LABORATORY DATA (Use ONLY in Step 5 Synthesis)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Age / Sex: {idade} / {sexo}
Clinical Symptoms: {sintomas}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-ANALYSIS — FIELD READING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
F1. TECHNICAL QUALITY: Staining and focus adequate? [YES / NO / PARTIAL]
F2. FIELD DENSITY:
    - Sparse: < 5% nucleated cells
    - Moderate: 5–30% nucleated cells
    - Dense: > 30% nucleated cells
F3. GENERAL VISUAL PATTERN:
    - Small-monotonous (1 small cell type ≈ RBC size)
    - Medium/Large-monotonous (1 medium-to-large cell type)
    - Myeloid-heterogeneous (mature lobulated/band forms dominate)
    - Blastic-heterogeneous (immature forms dominate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE A — NORMAL / NON-LEUKEMIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A1. Normal leukocyte quantity (not a dense field)? [YES / NO]
A2. Red blood cells with normal morphology? [YES / NO]
A3. Nucleated cells with expected mature morphology (neutrophils, normal lymphocytes)? [YES / NO]
A4. Absence of blasts, abnormal granulations, or Auer rods? [YES / NO]
A5. Absence of abnormal or monotonous cell population? [YES / NO]
Rule: ALL 5 must be YES for Normal. If any abnormal monotony, blasts, or smudge cells are present -> Normal is RULED OUT.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE B — CHRONIC MYELOID LEUKEMIA (CML / LMC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDAMENTAL RULE: Full spectrum of granulocytic maturation visible (Myeloblasts <10%, Promyelocytes, Myelocytes, Metamyelocytes, Bands, Segmented Neutrophils).

B1. Is the full spectrum of maturation present WITHOUT a leukemic hiatus (all intermediate forms present)? [YES / NO]
B2. Are mature neutrophils and band forms the majority of nucleated cells? [YES / NO]
B3. Is basophilia or eosinophilia present? [YES / NO]

Scoring Module B:
- If B1 = YES AND B2 = YES -> CML Very Likely (Confidence: 85-90%)
- If Blasts > 20% OR Leukemic Hiatus Present -> CML RULED OUT (Confidence: 0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE C — CHRONIC LYMPHOCYTIC LEUKEMIA (CLL / LLC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDAMENTAL RULE: CLL = SPARSE to MODERATE field with SMALL, MATURE-APPEARING lymphocytes. Dense fields with large cells EXCLUDE CLL.

C1. Field is SPARSE to MODERATE (<10% nucleated cells)? (Dense field = IMMEDIATE EXCLUSION) [YES / NO]
C2. Nucleated cells are predominantly SMALL (≈ size of RBC, up to 1.2x RBC)? [YES / NO]
C3. Chromatin is DENSE and COMPACT ("soccer ball" pattern, no nucleoli)? [YES / NO]
C4. Nuclei are predominantly ROUND with smooth borders? [YES / NO]
C5. Field is MONOTONOUS (dominated by 1 uniform small cell type)? [YES / NO]
C6. SMUDGE CELLS / GUMPRECHT SHADOWS present? (Disrupted nuclear remnants) [YES / NO - Bonus]

Scoring Module C:
- 5/5 in C1-C5 -> CLL Very Likely (Confidence: 85%)
- 4/5 + Gumprecht -> CLL Very Likely (Confidence: 80%)
- C1 = NO -> CLL RULED OUT (Confidence: 0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE D — ACUTE MYELOID LEUKEMIA (AML / LMA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDAMENTAL RULE: AML is a disease of BLASTS (>20%). Immature myeloid cells dominate with medium-to-large size, variable cytoplasm, fine/open chromatin, and prominent nucleoli.

D1. BLASTS DOMINATE (>20% of nucleated cells)? [YES / NO]
D2. KEY PATHOGNOMONIC SIGN — AUER RODS PRESENT? (Red/purple rod-like structures) [YES / NO]
D3. MATURATION GAP / LEUKEMIC HIATUS PRESENT? (Presence of blasts + mature neutrophils, but ABSENCE of intermediate stages like myelocytes/metamyelocytes) [YES / NO]

Scoring Module D:
- If D2 = YES (Auer Rods) -> AML CONFIRMED IMMEDIATELY (Confidence: 95%)
- If D1 = YES AND D3 = YES -> AML Very Likely (Confidence: 85-90%)
- If D1 = YES BUT D3 = NO -> AML Possible (Confidence: 65%)
- If D1 = NO -> AML RULED OUT (Confidence: 0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE E — ACUTE LYMPHOBLASTIC LEUKEMIA (ALL / LLA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDAMENTAL RULE: ALL has LYMPHOBLASTS — scant/thin rim cytoplasm, round regular nucleus, discrete nucleoli, dense/clumped chromatin.

E1. Lymphoblasts dominate (>20%)? [YES / NO]
E2. Cytoplasm of blasts is SCANT and SMOOTH (thin border)? [YES / NO]
E3. Nucleus is ROUND and REGULAR? [YES / NO]
E4. ABSENCE of granules and ABSENCE of Auer rods? [YES / NO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYNTHESIS & TIE-BREAKERS (Execute in order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Select the module with the highest confidence base.
2. CRITICAL RULE FOR AML vs CML:
   - If Blasts > 20% AND Leukemic Hiatus is YES (intermediate forms missing) -> MUST SELECT AML (CML is RULED OUT).
   - If Full Spectrum Maturation is YES (no hiatus, myelocytes present) AND Blasts < 10% -> MUST SELECT CML.
3. TIE-BREAKERS:
   - Auer Rods present -> AML immediately (overrides all).
   - Gumprecht shadows + sparse field -> CLL over ALL or Normal.
4. CLINICAL ADJUSTMENT (Max ±10%):
   - CML: Age 40–60 + splenomegaly + massive leukocytosis (+10%)
   - CLL: Age >60 + chronic asymptomatic lymphocytosis (+10%)
   - AML/ALL: Acute onset + pancytopenia/fever (+10%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (MANDATORY STRUCTURE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUALIDADE_IMAGEM: [Adequada / Parcial / Inadequada]

PRÉ_ANÁLISE:
- F1 Qualidade: [] | F2 Densidade: [] | F3 Padrão: []

AVALIAÇÃO_DOS_MÓDULOS:
- Módulo A (Normal): Escore ___/5 | Confiança: ___%
- Módulo B (LMC): Espectro Completo: [SIM/NÃO] | Basofilia/Eosinofilia: [SIM/NÃO] | Confiança: ___%
- Módulo C (LLC): C1 Campo Esparso: [SIM/NÃO] | Escore C1-C5: ___/5 | Gumprecht: [SIM/NÃO] | Confiança: ___%
- Módulo D (LMA): Blastos >20%: [SIM/NÃO] | Auer Rods: [SIM/NÃO] | Hiato Leucêmico: [SIM/NÃO] | Confiança: ___%
- Módulo E (LLA): Blastos >20%: [SIM/NÃO] | Citoplasma Escasso: [SIM/NÃO] | Confiança: ___%

DIAGNOSTICO_DIRETO:
- PADRÃO: [Agudo / Crônico / Normal / Inconclusivo]
- LINHAGEM: [Mieloide / Linfoide / Indeterminada / Não Aplicável]
- SUSPEITA_PRINCIPAL: [LMA / LLA / LMC / LLC / Normal / Indeterminado]
- NÍVEL_CONFIANÇA: [Alto (>85%) / Moderado (60-85%) / Baixo (<60%)]

JUSTIFICATIVA_TECNICA:
[Explicação detalhada em 3 a 5 frases justificando o diagnóstico final com base nos critérios dos módulos executados.]

RECOMENDACAO_CLINICA:
[Indicação de exames confirmatórios: Citometria de Fluxo, Cariótipo/PCR BCR-ABL, Mielograma.]"""
        sys.stderr.write(f"DEBUG caminho imagem: {caminho_da_imagem}\n")
        with open(caminho_da_imagem, "rb") as f:
            imagem_base64 = base64.b64encode(f.read()).decode("utf-8")
        tipo_mime = mimetypes.guess_type(caminho_da_imagem)[0] or "image/jpeg"

        response = obter_cliente().responses.create(
            model="gpt-4.1",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt_especialista},
                        {
                            "type": "input_image",
                            "image_url": f"data:{tipo_mime};base64,{imagem_base64}"
                        }
                    ]
                }
            ],
            max_output_tokens=2600
        ) 

        laudo_texto = response.output_text
        if not laudo_texto:
            raise ValueError("A OpenAI não retornou texto para o laudo")
        
        timestamp = time.time_ns()
        nome_arquivo_pdf = f"laudo_{timestamp}.pdf"
        
        hemoPDF.gerar_laudo_pdf(laudo_texto, {
            "idade": idade, 
            "sexo": sexo, 
            "sintomas": sintomas,
            "historia": historia
        }, nome_arquivo_pdf)

        return f"{nome_arquivo_pdf}|||{laudo_texto}"

    except Exception as e:
        return f"ERRO|||Erro técnico: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) >= 6:
        caminho = sys.argv[1].replace('"', '').strip()
        # O sys.stdout.write garante que o Node receba a string pura
        resultado = analisar_celula(caminho, sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
        sys.stdout.write(resultado)
        sys.stdout.flush()

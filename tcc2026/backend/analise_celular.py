import base64
import io
import mimetypes
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

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("API key não encontrada. Verifique o .env (analise_celular)")


def extrair_relatorio_clinico(texto_completo):
    """Remove os campos técnicos que o backend usa para persistir a análise."""
    separador = re.search(r"={10,}", texto_completo)
    if not separador:
        return texto_completo
    return texto_completo[separador.start():].strip()


def analisar_celula(caminho_da_imagem, idade, sexo, sintomas, historia):
    try:
        sys.stderr.write("DEBUG: Iniciando função analisar_celula...\n")

        prompt_especialista = f"""Sim. Este é o prompt antigo, recuperado da versão anterior do projeto:

```text
You are an expert Hematopathologist assisting in a diagnostic support system. Analyze the provided peripheral blood smear image alongside the patient's clinical history/hemogram data to evaluate for acute or chronic leukemias.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATIENT CLINICAL & LABORATORY DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Age / Sex: {idade} / {sexo}
Clinical Symptoms / History: {sintomas}

⚠️ EXCEPTION FOR CLL: unlike the other three leukemias, CLL cannot be
reliably confirmed by morphology alone — mature CLL lymphocytes normally
look nearly identical to normal lymphocytes. CLL is clinically DEFINED by an
absolute lymphocyte count (>5,000/µL, often much higher) plus flow
cytometry. If the clinical data above mentions any leukocyte/lymphocyte
count, or words like "leucocitose"/"linfocitose", extract it and give it
STRONG weight for the CLL hypothesis — this is an exception to the general
"clinical data only ±10% in Synthesis" rule below. For Modules A, B, D, E,
use clinical data only in Synthesis as usual.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY PHYSICAL FACT ABOUT BLOOD SMEAR IMAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Red blood cells outnumber white blood cells by roughly 700:1 in ANY blood
smear, healthy or leukemic. Every field — including real CLL, CML, or AML
fields — will look dominated by red cells, with only a handful of nucleated
(white) cells scattered among them. This is completely normal appearance
and tells you NOTHING about diagnosis by itself.

★ NEVER use "how many total cells are in the field" or "does the field look
dense or sparse" as a diagnostic criterion, anywhere in this analysis. ★

What IS informative: of the white cells you DO see — even if there are only
2, 3, or 4 — what TYPE are they, and what is their proportion to each other?
A normal field should show a MIX of types, mostly neutrophils, occasionally
a lymphocyte or monocyte. If EVERY nucleated cell is the SAME type,
especially small mature lymphocytes with no neutrophils, that is the
abnormal signal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — PRE-ANALYSIS — FIELD READING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
F1. TECHNICAL QUALITY: Staining and focus adequate? [YES / NO / PARTIAL]

F2. List EVERY nucleated cell identifiable in the field, one by one, with its
type: neutrophil, lymphocyte, monocyte, blast, smudge cell, or unclear.

F3. Classify the overall composition:

- MIXED-NORMAL: several different types present, including neutrophils
- MONOTONOUS-SMALL-LYMPHOCYTE: mostly small mature lymphocytes
- MONOTONOUS-BLASTIC: mostly blasts with open chromatin and nucleoli
- MONOTONOUS-GRANULOCYTIC-SPECTRUM: several granulocytic maturation stages

F4. RBC morphology: normal or altered?

F5. LEUKEMIC HIATUS CHECK:
Classify cells into blasts, intermediate forms and mature forms. Is there a
gap in which blasts and mature forms are present but intermediate forms are
absent or very rare?

- YES -> ACUTE pattern
- NO -> CHRONIC myeloid pattern
[PRESENT / ABSENT / N/A]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — MODULE A — NORMAL / NON-LEUKEMIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A1. Red blood cells with normal morphology? [YES / NO]
A2. At least one neutrophil present? [YES / NO]
A3. Nucleated cells show expected mature morphology? [YES / NO]
A4. Absence of blasts, abnormal granulations or Auer rods? [YES / NO]
A5. Composition is mixed-normal? [YES / NO]

ALL five must be YES for Normal.

Scoring:
5/5 -> Normal Likely (75-85%)
4/5 -> Normal Improbable (30%)
≤3/5 -> Normal Ruled Out (0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — MODULE B — CHRONIC MYELOID LEUKEMIA — CML / LMC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LMC is a disease of mature and maturing cells, with a full granulocytic
spectrum and no leukemic hiatus. Mature cells should be the majority and
blasts a minority.

B0. If hiatus is present, CML is very unlikely.

B1. Segmented neutrophils present?
B2. Band forms present?
B3. Metamyelocytes present?
B4. Myelocytes present?
B5. Mature forms outnumber immature forms?
B6. Increased basophils or eosinophils?
B7. Bimodal distribution of mature and immature forms?

Scoring:
B1+B2+B3=YES + B5=YES -> CML Very Likely (90%)
3/4 of B1-B4 + B5=YES -> CML Very Likely (85%)
3/4 of B1-B4 + B5=NO -> CML Likely (65%)
2/4 + B5=YES -> CML Possible (50%)
2/4 + B5=NO -> CML Unlikely (25%)
≤1/4 -> CML Ruled Out (10%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — MODULE C — CHRONIC LYMPHOCYTIC LEUKEMIA — CLL / LLC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLL lymphocytes typically resemble normal mature lymphocytes. The clues are
small mature lymphocytes, absence of neutrophils, smudge cells and laboratory
evidence of lymphocytosis.

C1. Mostly small mature lymphocytes?
C2. Lymphocytes approximately the size of red blood cells?
C3. Dense, clumped chromatin with no visible nucleoli?
C4. Round regular nuclei and scant agranular cytoplasm?
C5. Smudge cells present?
C6. Elevated leukocyte or lymphocyte count mentioned?

Scoring:
C1+C2+C3=YES -> CLL Very Likely (80%)
C5 present -> 90%+
C6=YES -> 90-95%

C3=NO -> evaluate as lymphoblast.
C1=NO -> CLL Ruled Out.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — MODULE D — ACUTE MYELOID LEUKEMIA — AML / LMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LMA is a disease of blasts with a leukemic hiatus. Blasts and mature
neutrophils may coexist while intermediate forms are absent or rare.

D1. Myeloid blasts dominate?
D2. Intermediate forms absent or very rare?
D3. Blast cytoplasm moderate or abundant?
D4. Azurophilic granulations visible?
D5. Auer rod present?
D6. Abnormal cells clearly present in the field?

If D5=YES -> AML Confirmed (95%)
D1+D2=YES + D6=YES -> AML Very Likely (85%)
D1+D2=YES + D3 or D4=YES -> AML Very Likely (80%)
D1+D2=YES -> AML Likely (65%)

Consider CML blast crisis if blasts are high and basophilia or a previous
chronic myeloid history is present.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — MODULE E — ACUTE LYMPHOBLASTIC LEUKEMIA — ALL / LLA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LLA has lymphoblasts with scant smooth cytoplasm, round regular nuclei,
open chromatin and visible nucleoli.

E1. Blasts dominate?
E2. Cytoplasm scant and smooth?
E3. Nucleus round and regular?
E4. Nucleoli discrete?
E5. No azurophilic granules or Auer rods?

Scoring:
E1+E2+E5=YES -> LLA Very Likely (80%)
E2+E3+E4=YES -> LLA Likely (65%)
E2=NO or E5=NO -> LLA Ruled Out
≤2 YES -> LLA Unlikely (10%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — SYNTHESIS AND TIE-BREAKERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Select the module with the highest confidence.

2. If hiatus is present and blasts are present, favor AML over CML.
If the hiatus is absent and the granulocytic spectrum is present, favor CML.

3. For CLL versus Normal, a field containing only small mature lymphocytes
should not automatically be classified as Normal.

4. Condensed chromatin without nucleoli favors CLL.
Open chromatin with nucleoli favors ALL.

5. Tie-breakers:
- Auer rod -> AML
- Smudge cells plus monotonous lymphocytes -> CLL
- Full granulocytic spectrum -> CML
- Scant cytoplasm -> ALL

6. Clinical adjustment:
- CML: age 40-60, splenomegaly and leukocytosis
- CLL: age over 60 and chronic lymphocytosis
- AML: sudden onset, pancytopenia and fever
- ALL: age under 15 or over 50, lymphadenopathy and acute onset

7. Confidence:
HIGH: 75-95%
MODERATE: 45-70%
LOW: below 40%

If the image quality is poor, findings conflict or there are too few cells,
report INDETERMINADO rather than forcing a diagnosis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The response must contain two parts.

All content must be written in Brazilian Portuguese, with correct accents.

The first fields must be exactly:

SUSPEITA_PRINCIPAL: [LMA / LLA / LMC / LLC / NORMAL / INDETERMINADO]

NÍVEL_CONFIANÇA: [ALTO / MODERADO / BAIXO]

Then generate:

================================================================
LAUDO DE HEMATOLOGIA - ANÁLISE MORFOLÓGICA DE ESFREGAÇO DE SANGUE PERIFÉRICO
================================================================

SUSPEITA DIAGNÓSTICA: [diagnóstico completo em português + abreviação]
GRAU DE CERTEZA: [Alto / Moderado / Baixo] ([percentual])

IDENTIFICAÇÃO
----------------------------------------------------------------
Idade: {idade} anos | Sexo: {sexo}

ACHADOS MORFOLÓGICOS
----------------------------------------------------------------
Série vermelha: [descrição objetiva]

Série branca: [descrição das células observadas e predominância]

ACHADOS DETERMINANTES
----------------------------------------------------------------
- [principal achado]
- [segundo achado, se necessário]
- [terceiro achado, se relevante]

CONCLUSÃO
----------------------------------------------------------------
[Resumo objetivo da conclusão e da suspeita diagnóstica.]

================================================================
Laudo gerado por sistema de apoio diagnóstico por Inteligência Artificial.
Requer revisão e validação por médico hematologista responsável.
================================================================

REGRAS:

1. Seja conciso e objetivo.
2. Descreva somente achados suportados pela imagem e pelos dados clínicos.
3. Não invente células, percentuais, exames ou sintomas.
4. Não repita informações.
5. Não mencione módulos internos ou o sistema de pontuação.
6. Não use densidade do campo como critério.
7. Se a imagem for insuficiente ou houver conflito, use:
   SUSPEITA_PRINCIPAL: INDETERMINADO
   NÍVEL_CONFIANÇA: BAIXO
8. O diagnóstico no laudo deve ser igual ao campo SUSPEITA_PRINCIPAL.
9. O nível de confiança também deve ser igual.
10. Se NORMAL, escreva:
    SUSPEITA DIAGNÓSTICA: Sem evidência morfológica de leucemia (Normal)
11. Se INDETERMINADO, escreva:
    SUSPEITA DIAGNÓSTICA: Indeterminado
12. Não inclua recomendações de tratamento.
13. Não inclua texto antes ou depois do relatório.
```
"""

        sys.stderr.write(f"DEBUG caminho imagem: {caminho_da_imagem}\n")
        with open(caminho_da_imagem, "rb") as arquivo:
            imagem_base64 = base64.b64encode(arquivo.read()).decode("utf-8")

        tipo_mime, _ = mimetypes.guess_type(caminho_da_imagem)
        tipo_mime = tipo_mime if tipo_mime in {"image/jpeg", "image/png"} else "image/jpeg"

        response = client.responses.create(
            model="gpt-4.1",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt_especialista},
                        {
                            "type": "input_image",
                            "image_url": f"data:{tipo_mime};base64,{imagem_base64}",
                        },
                    ],
                }
            ],
            max_output_tokens=2600,
        )

        laudo_texto = response.output[0].content[0].text
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

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
from normalizar_laudo import normalizar_texto

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
        sys.stderr.write("DEBUG: Iniciando função analisar_celula...\n")

        prompt_especialista = f"""
You are an expert Hematopathologist assisting in a diagnostic support system. Analyze the provided peripheral blood smear image alongside the patient's clinical history/hemogram data to evaluate for acute or chronic leukemias.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL CONTEXT — UNVERIFIED FREE TEXT
PATIENT CLINICAL & LABORATORY DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Age / Sex: {idade} / {sexo}
Clinical Symptoms: {sintomas}
Additional History / Comorbidities: {historia}
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

Treat the text only as context. Do not infer laboratory values, disease duration,
prior diagnoses, treatment, or cell counts that are not explicitly stated.
Nonspecific symptoms may raise clinical concern but never establish leukemia,
lineage, or subtype.
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
NON-NEGOTIABLE SCOPE AND SAFETY RULES
STEP 1 — PRE-ANALYSIS — FIELD READING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. A single image, photographed field, crop, or partially focused smear is NOT
   a representative leukocyte differential and cannot prove a pattern is absent
   elsewhere in the smear.
2. Do not diagnose, subtype, or give high confidence from a few visible cells.
   If fewer than approximately 200 leukocytes are assessable, state that the
   sampling is limited; never convert the observed image proportion into a
   peripheral-blood or marrow percentage.
3. Never call a limited, poor-quality, or nonrepresentative image NORMAL merely
   because no abnormal cell is visible. Use INDETERMINADO when image quality,
   focus, stain, overlap, artifacts, field choice, or low cell count prevents a
   reliable morphological triage.
4. Never use red-cell predominance, field density, background emptiness, or the
   total number of cells in the photograph as evidence for or against leukemia.
   Assess only identifiable nucleated-cell morphology.
5. Artifacts, stain precipitate, platelet clumps, overlapping cells, damaged
   nuclei, smudge artifact and out-of-focus objects must be marked uncertain;
   never count them as blasts, Auer rods, or diagnostic cells.
6. Morphology alone cannot establish blast lineage or confirm LMA versus LLA,
   LLC, LMC, mixed-phenotype acute leukemia, or another hematologic neoplasm.
   The permitted labels are morphological suspicions, never confirmations.
7. Auer rods support myeloid lineage only when clearly intracellular in an
   unequivocal blast and not artifact. If uncertain, report them as unconfirmed.
8. Do not invent percentages, laboratory values, molecular findings,
   immunophenotype, cytogenetics, symptoms, or morphology.
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
STEP 1 — IMAGE ADEQUACY GATE
STEP 2 — MODULE A — NORMAL / NON-LEUKEMIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First decide internally whether the image is ADEQUATE, PARTIALLY ADEQUATE or
INADEQUATE for morphological triage. Assess focus, stain quality, field choice,
cell overlap, artifacts and the number of clearly nucleated cells.
A1. Red blood cells with normal morphology? [YES / NO]
A2. At least one neutrophil present? [YES / NO]
A3. Nucleated cells show expected mature morphology? [YES / NO]
A4. Absence of blasts, abnormal granulations or Auer rods? [YES / NO]
A5. Composition is mixed-normal? [YES / NO]

If INADEQUATE, select INDETERMINADO + BAIXO. Describe only the technical
limitation. Do not speculate about a leukemia subtype and do not call NORMAL.
ALL five must be YES for Normal.

If PARTIALLY ADEQUATE or ADEQUATE, make an internal inventory of every clearly
identifiable nucleated cell by broad category only: mature neutrophil/band,
granulocytic precursor, mature small lymphocyte, reactive/atypical lymphocyte,
monocyte, blast-like cell, basophil/eosinophil, smudge cell, or uncertain. Do
not expose this inventory or internal reasoning in the final report.
Scoring:
5/5 -> Normal Likely (75-85%)
4/5 -> Normal Improbable (30%)
≤3/5 -> Normal Ruled Out (0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — MORPHOLOGICAL PATTERNS AND REQUIRED DIFFERENTIALS
STEP 3 — MODULE B — CHRONIC MYELOID LEUKEMIA — CML / LMC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Evaluate every pattern below before choosing a label. A finding supports a
label only when directly visible and not contradicted by stronger evidence. Do
not automatically exclude a diagnosis because one expected cell type was seen
or absent in a single image.

A. BLAST-LIKE / ACUTE-LEUKEMIA PATTERN
- Describe blast-like cells only when high nucleus-to-cytoplasm ratio, fine/open
  chromatin and visible nucleoli are recognizable.
- If blast-like cells are seen but myeloid versus lymphoid lineage is not
  unequivocal, choose INDETERMINADO. In the report say "padrão de células
  blásticas; linhagem não definível morfologicamente" and list LMA/LLA as
  differential possibilities. Never force LMA or LLA.
- LMA may be the leading suspicion only if unequivocal Auer rods or clear
  myeloid granulation are seen in blast-like cells. Otherwise morphology is
  insufficient to distinguish LMA from LLA or mixed/ambiguous lineage.
- LLA may be a leading suspicion only as compatible morphology: blast population
  with scant, smooth cytoplasm and no myeloid granules/Auer rods. Absence of
  granules is not proof of lymphoid lineage.
- A photographed field cannot establish a 20% blast threshold, leukemic hiatus,
  or acute-leukemia subtype. Do not claim any of these from the image alone.

B. MATURE LYMPHOCYTOSIS / POSSIBLE LLC PATTERN
- Small mature lymphocytes with condensed chromatin and scant cytoplasm, with
  possible smudge cells, can be compatible with LLC but are not diagnostic. The
  same morphology may occur in reactive lymphocytosis, monoclonal B-cell
  lymphocytosis and other mature B-cell neoplasms.
- A few lymphocytes in one field, with or without absence of neutrophils, are
  never sufficient for LLC. Do not label LLC from this situation.
- Consider LLC at most MODERADO when an adequate, representative-looking image
  has a persistent monomorphic mature lymphoid pattern AND supplied data
  explicitly documents an absolute lymphocyte/B-cell count. If clonality or
  flow-cytometry information is absent, state morphology is not confirmatory.
  A word such as "linfocitose" without a numeric value is supporting context,
  not confirmation.

C. GRANULOCYTIC PROLIFERATION / POSSIBLE LMC PATTERN
- A broad, orderly granulocytic maturation spectrum with basophilia can support
  LMC as a morphological suspicion only if convincingly represented and aligned
  with documented leukocytosis.
- Reactive leukemoid processes, infection/inflammation, medication effect,
  other myeloproliferative neoplasms and LMC in blast phase can overlap. If
  alternatives cannot be separated morphologically, choose INDETERMINADO.
- Never use a perceived "full spectrum", cell density, or one field to confirm
  LMC; BCR::ABL1 is not visually assessable.

D. NO ABNORMALITY IDENTIFIED IN THE ASSESSED MATERIAL
- NORMAL is allowed only for an ADEQUATE image with mature cells of unremarkable
  morphology and no blast-like, monomorphic, dysplastic or marked
  granulocytic-proliferative pattern in the visible material.
- Report it strictly as "sem evidência morfológica de leucemia no material/imagem
  avaliado". It does not exclude leukemia or another hematologic disorder
  elsewhere in the smear or patient.
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
STEP 3 — CONTRADICTION CHECK AND CONFIDENCE CALIBRATION
STEP 4 — MODULE C — CHRONIC LYMPHOCYTIC LEUKEMIA — CLL / LLC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before the final label, identify internally at least two direct observations
that support the leading pattern, any observation that argues against it, and
whether a limitation or plausible differential makes it non-classifiable.

Select INDETERMINADO + BAIXO if there is inadequate quality; too few assessable
leukocytes; conflicting morphology; blast-like cells without secure lineage; a
pattern compatible with more than one permitted label; or an abnormality outside
the four target leukemias. Do not hide an abnormal finding by selecting NORMAL.

Confidence is confidence in the limited morphological triage, NOT disease
probability and NOT validated diagnostic accuracy:
- ALTO: never use for a single image alone. It requires an adequate,
  representative series of images, concordant explicit laboratory data, and a
  highly distinctive visible feature. If any are absent, do not use ALTO.
- MODERADO: adequate image with a consistent pattern, while limitations and
  missing confirmation are clearly stated.
- BAIXO: all other cases, especially one limited image or an unresolved
  differential.
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
FINAL INTERNAL CHECKLIST — DO NOT DISPLAY
STEP 5 — MODULE D — ACUTE MYELOID LEUKEMIA — AML / LMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Was image adequacy evaluated before classification?
□ Did I avoid diagnosis from a few cells, field density, or absence in one crop?
□ Did I distinguish observation from inference and include contradictory evidence?
□ Did I avoid claiming lineage, blast percentage, molecular result, or flow result?
□ Did I use INDETERMINADO instead of NORMAL when material was limited/abnormal?
□ Did I avoid LLC/LMC confirmation without necessary laboratory correlation?
□ Did I avoid ALTO for a single submitted image?
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
OUTPUT FORMAT — MANDATORY
STEP 6 — MODULE E — ACUTE LYMPHOBLASTIC LEUKEMIA — ALL / LLA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate ALL output in Brazilian Portuguese (PT-BR), with correct accents.
Use only concise, objective medical language. Do not reveal the internal
checklist, cell inventory, reasoning steps or scores.
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

The response MUST begin exactly with these two backend fields:
SUSPEITA_PRINCIPAL: [LMA / LLA / LMC / LLC / NORMAL / INDETERMINADO]

NÍVEL_CONFIANÇA: [ALTO / MODERADO / BAIXO]

Then use exactly this report structure:
Then generate:

================================================================
LAUDO DE HEMATOLOGIA - ANÁLISE MORFOLÓGICA DE ESFREGAÇO DE SANGUE PERIFÉRICO
================================================================

SUSPEITA DIAGNÓSTICA: [diagnóstico/situação coerente com SUSPEITA_PRINCIPAL]
GRAU DE CERTEZA: [Alto / Moderado / Baixo — confiança da triagem morfológica]
SUSPEITA DIAGNÓSTICA: [diagnóstico completo em português + abreviação]
GRAU DE CERTEZA: [Alto / Moderado / Baixo] ([percentual])

IDENTIFICAÇÃO
----------------------------------------------------------------
Idade: {idade} anos  |  Sexo: {sexo}

QUALIDADE E REPRESENTATIVIDADE DA IMAGEM
----------------------------------------------------------------
[Adequada / Parcialmente adequada / Inadequada, com limitação concreta e objetiva.]
Idade: {idade} anos | Sexo: {sexo}

ACHADOS MORFOLÓGICOS
----------------------------------------------------------------
Série vermelha: [descrever somente se visível e avaliável; caso contrário, "Não avaliável de forma confiável nesta imagem".]
Série branca: [1-3 frases apenas com achados diretamente observados.]
Série vermelha: [descrição objetiva]

EVIDÊNCIAS E LIMITAÇÕES
----------------------------------------------------------------
- [1-3 itens: achados diretamente observados, contradições e/ou limitação de representatividade.]
Série branca: [descrição das células observadas e predominância]

DIFERENCIAIS / CORRELAÇÃO NECESSÁRIA
ACHADOS DETERMINANTES
----------------------------------------------------------------
[Somente quando aplicável: diferenciais morfológicos relevantes e a informação ausente que impede confirmar. Não indicar tratamento.]
- [principal achado]
- [segundo achado, se necessário]
- [terceiro achado, se relevante]

CONCLUSÃO
----------------------------------------------------------------
[Uma ou duas frases. Use "compatível com suspeita morfológica de ..." apenas
quando os critérios acima forem atendidos. Em NORMAL, usar exatamente
"Sem evidência morfológica de leucemia no material/imagem avaliado". Em
INDETERMINADO, explicar objetivamente por que a imagem não permite classificação.]
[Resumo objetivo da conclusão e da suspeita diagnóstica.]

================================================================
Laudo gerado por sistema de apoio à decisão. Não estabelece diagnóstico
definitivo e requer revisão e validação por médico hematologista responsável.
Laudo gerado por sistema de apoio diagnóstico por Inteligência Artificial.
Requer revisão e validação por médico hematologista responsável.
================================================================

Do not add any text before, after, or outside these required fields and report.
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

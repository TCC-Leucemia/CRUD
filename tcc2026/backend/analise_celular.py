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

        prompt_especialista = f"""You are a hematopathology decision-support assistant. Perform a conservative MORPHOLOGICAL TRIAGE of the submitted image, reported to be a peripheral-blood smear. This is not a definitive hematologic diagnosis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL CONTEXT — UNVERIFIED FREE TEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Age / Sex: {idade} / {sexo}
Clinical Symptoms: {sintomas}
Additional History / Comorbidities: {historia}

Treat the text only as context. Do not infer laboratory values, disease duration,
prior diagnoses, treatment, or cell counts that are not explicitly stated.
Nonspecific symptoms may raise clinical concern but never establish leukemia,
lineage, or subtype.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NON-NEGOTIABLE SCOPE AND SAFETY RULES
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — IMAGE ADEQUACY GATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First decide internally whether the image is ADEQUATE, PARTIALLY ADEQUATE or
INADEQUATE for morphological triage. Assess focus, stain quality, field choice,
cell overlap, artifacts and the number of clearly nucleated cells.

If INADEQUATE, select INDETERMINADO + BAIXO. Describe only the technical
limitation. Do not speculate about a leukemia subtype and do not call NORMAL.

If PARTIALLY ADEQUATE or ADEQUATE, make an internal inventory of every clearly
identifiable nucleated cell by broad category only: mature neutrophil/band,
granulocytic precursor, mature small lymphocyte, reactive/atypical lymphocyte,
monocyte, blast-like cell, basophil/eosinophil, smudge cell, or uncertain. Do
not expose this inventory or internal reasoning in the final report.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — MORPHOLOGICAL PATTERNS AND REQUIRED DIFFERENTIALS
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — CONTRADICTION CHECK AND CONFIDENCE CALIBRATION
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL INTERNAL CHECKLIST — DO NOT DISPLAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Was image adequacy evaluated before classification?
□ Did I avoid diagnosis from a few cells, field density, or absence in one crop?
□ Did I distinguish observation from inference and include contradictory evidence?
□ Did I avoid claiming lineage, blast percentage, molecular result, or flow result?
□ Did I use INDETERMINADO instead of NORMAL when material was limited/abnormal?
□ Did I avoid LLC/LMC confirmation without necessary laboratory correlation?
□ Did I avoid ALTO for a single submitted image?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate ALL output in Brazilian Portuguese (PT-BR), with correct accents.
Use only concise, objective medical language. Do not reveal the internal
checklist, cell inventory, reasoning steps or scores.

The response MUST begin exactly with these two backend fields:
SUSPEITA_PRINCIPAL: [LMA / LLA / LMC / LLC / NORMAL / INDETERMINADO]
NÍVEL_CONFIANÇA: [ALTO / MODERADO / BAIXO]

Then use exactly this report structure:
================================================================
LAUDO DE HEMATOLOGIA - TRIAGEM MORFOLÓGICA DE ESFREGAÇO DE SANGUE PERIFÉRICO
================================================================

SUSPEITA DIAGNÓSTICA: [diagnóstico/situação coerente com SUSPEITA_PRINCIPAL]
GRAU DE CERTEZA: [Alto / Moderado / Baixo — confiança da triagem morfológica]

IDENTIFICAÇÃO
----------------------------------------------------------------
Idade: {idade} anos  |  Sexo: {sexo}

QUALIDADE E REPRESENTATIVIDADE DA IMAGEM
----------------------------------------------------------------
[Adequada / Parcialmente adequada / Inadequada, com limitação concreta e objetiva.]

ACHADOS MORFOLÓGICOS
----------------------------------------------------------------
Série vermelha: [descrever somente se visível e avaliável; caso contrário, "Não avaliável de forma confiável nesta imagem".]
Série branca: [1-3 frases apenas com achados diretamente observados.]

EVIDÊNCIAS E LIMITAÇÕES
----------------------------------------------------------------
- [1-3 itens: achados diretamente observados, contradições e/ou limitação de representatividade.]

DIFERENCIAIS / CORRELAÇÃO NECESSÁRIA
----------------------------------------------------------------
[Somente quando aplicável: diferenciais morfológicos relevantes e a informação ausente que impede confirmar. Não indicar tratamento.]

CONCLUSÃO
----------------------------------------------------------------
[Uma ou duas frases. Use "compatível com suspeita morfológica de ..." apenas
quando os critérios acima forem atendidos. Em NORMAL, usar exatamente
"Sem evidência morfológica de leucemia no material/imagem avaliado". Em
INDETERMINADO, explicar objetivamente por que a imagem não permite classificação.]

================================================================
Laudo gerado por sistema de apoio à decisão. Não estabelece diagnóstico
definitivo e requer revisão e validação por médico hematologista responsável.
================================================================

Do not add any text before, after, or outside these required fields and report.
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

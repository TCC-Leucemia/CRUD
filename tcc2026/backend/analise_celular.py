import os
import re
import sys
import io
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
os.environ['GRPC_VERBOSITY'] = 'ERROR'  

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import base64
from openai import OpenAI
import chromadb
from chromadb.utils import embedding_functions
import time
import hemoPDF as hemoPDF
from dotenv import load_dotenv
load_dotenv()
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

#pegando a key da api direto do .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("API key não encontrada. Verifique o .env (analise_celular)")

def extrair_relatorio_clinico(texto_completo):
    """
    Remove o bloco de compatibilidade (SUSPEITA_PRINCIPAL / NÍVEL_CONFIANÇA)
    que a IA gera no início da resposta apenas para o backend interpretar o
    diagnóstico. Esse bloco é redundante com "SUSPEITA DIAGNOSTICA" e
    "GRAU DE CERTEZA" já presentes dentro do laudo clínico e não deve
    aparecer para o médico nem no PDF.
    """
    separador = re.search(r"={10,}", texto_completo)
    if not separador:
        return texto_completo
    return texto_completo[separador.start():].strip()

#Hemogram / Lab Values (if available): {hemograma}
def analisar_celula(caminho_da_imagem, idade, sexo, sintomas, historia):
    try:
        sys.stderr.write("DEBUG: Iniciando função analisar_celula...\n")

        sys.stderr.write("DEBUG: Enviando para o OpenAI...\n")

        prompt_especialista = f"""You are an expert Hematopathologist assisting in a diagnostic support system. Analyze the provided peripheral blood smear image alongside the patient's clinical history/hemogram data to evaluate for acute or chronic leukemias.

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
KEY PHYSICAL FACT ABOUT BLOOD SMEAR IMAGES (governs the whole analysis)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Red blood cells outnumber white blood cells by roughly 700:1 in ANY blood
smear, healthy or leukemic. Every field — including real CLL, CML, or AML
fields — will look dominated by red cells, with only a handful of nucleated
(white) cells scattered among them. This is completely normal appearance and
tells you NOTHING about diagnosis by itself.

★ NEVER use "how many total cells are in the field" or "does the field look
dense or sparse" as a diagnostic criterion, anywhere in this analysis. It is
never informative and is a known source of misdiagnosis in this system —
avoid it explicitly. ★

What IS informative: of the white (nucleated) cells you DO see — even if
there are only 2, 3, or 4 — what TYPE are they, and what is their
proportion to each other? A normal field, even with very few white cells
visible, should show a MIX of types (mostly neutrophils, occasionally a
lymphocyte or monocyte). If EVERY nucleated cell you can find is the SAME
type — especially if all are small mature lymphocytes with no neutrophils
at all — that is the abnormal signal, regardless of total count.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — PRE-ANALYSIS — FIELD READING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
F1. TECHNICAL QUALITY: Staining and focus adequate? [YES / NO / PARTIAL]

F2. List EVERY nucleated (white) cell you can identify in the field, one by
    one, with its type if identifiable: neutrophil (segmented / band /
    metamyelocyte / myelocyte), small mature lymphocyte, monocyte, blast,
    smudge cell, or unclear. Do not skip any, even if there are only 2-4
    total — this list is the basis for everything that follows.

F3. Among the cells listed in F2, classify the overall composition:
    - MIXED-NORMAL: several different types present, neutrophils among them
    - MONOTONOUS-SMALL-LYMPHOCYTE: all/nearly all are small mature
      lymphocytes, no neutrophils seen (possible CLL — do not dismiss this
      just because total cell count in the field is low)
    - MONOTONOUS-BLASTIC: all/nearly all are blasts (open chromatin,
      visible nucleoli)
    - MONOTONOUS-GRANULOCYTIC-SPECTRUM: a range of granulocytic maturation
      stages together, few or no blasts (possible CML)

F4. RBC morphology: normal or altered (describe briefly)?

F5. LEUKEMIC HIATUS CHECK (only needed if F3 = Monotonous-blastic or
    Monotonous-granulocytic-spectrum, to separate acute from chronic):
    classify each nucleated cell into blasts / intermediate forms
    (promyelocyte, myelocyte, metamyelocyte, band) / mature forms
    (segmented neutrophil). Is there a GAP — blasts and mature forms present
    but intermediate forms absent or very rare (<10%)?
    - YES (hiatus present) -> ACUTE pattern (production stuck at blast
      stage, no step-wise maturation)
    - NO (full continuous spectrum, all stages represented) -> CHRONIC
      myeloid pattern (production active and continuous — classic CML,
      "factory running")
    [PRESENT / ABSENT / N/A]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — MODULE A — NORMAL / NON-LEUKEMIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A1. Red blood cells with normal morphology (matches F4)? [YES / NO]
A2. At least one neutrophil present among the cells listed in F2? (A field
    with ONLY lymphocytes, even if just 2-4 total cells, is NOT normal —
    fails this item.) [YES / NO]
A3. Nucleated cells show expected mature morphology, whatever their type? [YES / NO]
A4. Absence of blasts, abnormal granulations, or Auer rods? [YES / NO]
A5. F3 = MIXED-NORMAL (confirms no single type — especially not small
    lymphocytes alone — monopolizes the visible white cells)? [YES / NO]

Rule: ALL 5 must be YES for Normal. A2 and A5 failing (lymphocyte-only
field, however few cells) rules out Normal regardless of A1/A3/A4 — go
evaluate Module C.

Scoring: 5/5 -> Normal Likely (Confidence 75-85%) | 4/5 -> Normal
Improbable (30%) | ≤3/5 -> Normal Ruled Out (0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — MODULE B — CHRONIC MYELOID LEUKEMIA (CML / LMC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDAMENTAL RULE: LMC is a disease of MATURE and MATURING cells — full
granulocytic spectrum, "factory running", NO leukemic hiatus (F5 = ABSENT).
Mature cells (segmented, band) are the MAJORITY; blasts are a MINORITY (<10%).

B0. QUICK EXCLUSION: F5 = PRESENT (hiatus)? -> CML VERY UNLIKELY, score 5%,
    prioritize Module D. F5 = ABSENT or N/A -> continue B1-B5.

B1. Segmented neutrophils present in relevant quantity (2-5 lobes, thin
    filament connecting them)? [YES / NO / UNCERTAIN]
B2. Band forms present (U/horseshoe-shaped nucleus, no lobulation)? [YES / NO / UNCERTAIN]
B3. Metamyelocytes present (kidney/bean-shaped nucleus)? [YES / NO / UNCERTAIN]
B4. Myelocytes present (oval-round nucleus, chromatin in blocks, no
    prominent nucleolus)? [YES / NO / UNCERTAIN]
B5. Mature forms (segmented+band+metamyelocyte) outnumber immature forms
    (myelocyte+blast) in the field? [YES / NO]
B6. [Bonus] Increased basophils and/or eosinophils (dark coarse granules /
    orange-red refractile granules) in more than isolated numbers? [YES / NO]
B7. [Bonus, classic but optional] Bimodal distribution — two abundance
    peaks (segmented/band AND myelocyte) with relatively fewer
    metamyelocytes between them, rather than a smooth even progression? [YES / NO]

Scoring (only if B0 passed):
B1+B2+B3=YES + B5=YES -> CML Very Likely (90%), +B6 -> 95%
3/4 of B1-B4 + B5=YES -> CML Very Likely (85%)
3/4 of B1-B4 + B5=NO -> CML Likely (65%)
2/4 + B5=YES -> CML Possible (50%) | 2/4 + B5=NO -> CML Unlikely (25%)
≤1/4 -> CML Ruled Out (10%) | B0 failed -> CML Ruled Out (5%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — MODULE C — CHRONIC LYMPHOCYTIC LEUKEMIA (CLL / LLC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDAMENTAL RULE (this module works differently from the others — read
carefully): CLL lymphocytes typically look like NORMAL mature lymphocytes.
There is often no single dramatic visual feature. The clues are (a) EVERY or
nearly every white cell in the field being a small mature lymphocyte with NO
neutrophils mixed in, even if only a few cells total are visible, (b) smudge
cells, and (c) lab-confirmed lymphocytosis if mentioned in patient data.
NEVER require a "packed" or "dense-looking" field for CLL — see Key Physical
Fact above; that essentially never happens in any real smear photo.

C1. F3 = MONOTONOUS-SMALL-LYMPHOCYTE (all/nearly all identified nucleated
    cells are small mature lymphocytes, no neutrophils among them)? [YES / NO]
C2. Those lymphocytes are SMALL (≈ RBC size, up to 1.2x RBC)? [YES / NO]
C3. Chromatin is DENSE/CLUMPED ("soccer ball"/cracked-earth pattern), with
    NO visible nucleoli? (If nucleoli ARE visible with open/lacy chromatin,
    this is a lymphoblast, not CLL — go to Module E instead.) [YES / NO]
C4. Nuclei round, regular, scant agranular cytoplasm? [YES / NO]
C5. [Bonus] SMUDGE CELLS / GUMPRECHT SHADOWS present anywhere in the field?
    (near pathognomonic when present, but absence does NOT rule out CLL) [YES / NO]
C6. Does patient data mention elevated leukocyte/lymphocyte count,
    "leucocitose", or "linfocitose"? [YES / NO / Not mentioned]

Scoring:
C1+C2+C3 = YES -> CLL Very Likely (80%), even with only a few lymphocytes
  visible in this field
+ C5 present -> 90%+
+ C6 = YES -> 90-95% — this is the strongest single piece of evidence for
  CLL and must be weighted heavily, not capped at ±10% like other clinical data
C3 = NO (nucleoli visible/open chromatin) -> NOT CLL, evaluate as blast
  (Module D/E)
C1 = NO (neutrophils genuinely present among visible cells) -> CLL RULED
  OUT (0%) -> re-check Module A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — MODULE D — ACUTE MYELOID LEUKEMIA (AML / LMA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDAMENTAL RULE: LMA is a disease of BLASTS with a LEUKEMIC HIATUS (F5 =
PRESENT): blasts and mature neutrophils coexist, but intermediate forms
(myelocyte, metamyelocyte, band) are rare/absent. This gap, not just "many
blasts", is what separates LMA from LMC.

D0. QUICK EXCLUSION: F5 = ABSENT (continuous spectrum)? -> AML VERY
    UNLIKELY, score 5%. F5 = PRESENT or N/A -> continue D1-D6.

D1. Myeloid blasts dominate (>20%)? STRICT definition — ALL must be true:
    round/oval nucleus (never lobulated/banded), open/lacy chromatin,
    visible nucleoli (often prominent, 1-3), cytoplasm present. A large
    cell with a lobulated nucleus is a neutrophil/metamyelocyte, NOT a
    blast. [YES / NO]
D2. Intermediate forms (myelocyte+metamyelocyte+band) absent or very rare
    (<10%)? This is the same hiatus evaluated in F5 — it is the criterion
    that separates LMA from LMC. [YES / NO]
D3. Blast cytoplasm moderate-to-abundant, myeloid appearance (visible
    beyond the nucleus, not just a thin rim)? [YES / NO]
D4. Azurophilic granulations visible in blast cytoplasm? [YES / NO]
D5. AUER ROD present (needle/rod-shaped intracytoplasmic structure,
    red/purple)? Pathognomonic — if present, AML CONFIRMED. [YES / NO]
D6. Field moderate-to-dense in terms of variety/abnormal cells (not about
    total density, but about abnormal cells being clearly present, not
    just 1 isolated cell)? [YES / NO]

⚠️ CAVEAT (CML blast crisis): a CML in blastic transformation can show
>20% blasts and morphologically mimic AML. If F5 looks present but there is
also marked basophilia (B6) or history suggestive of a prior chronic
myeloid process, flag this in ALERTAS and recommend BCR-ABL testing before
closing as de novo AML — morphology alone cannot fully distinguish these.

Scoring:
D5 = YES -> AML CONFIRMED (95%)
D1+D2=YES + D6=YES -> AML Very Likely (85%)
D1+D2=YES + (D3 or D4=YES) -> AML Very Likely (80%)
D1+D2=YES -> AML Likely (65%)
D1=YES + D2=NO -> Possible CML in transformation (AML confidence 30%) —
  re-evaluate Module B with priority, flag BCR-ABL need
D0 failed -> AML Unlikely (10%) | D1=NO -> AML Ruled Out (5%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — MODULE E — ACUTE LYMPHOBLASTIC LEUKEMIA (ALL / LLA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDAMENTAL RULE: LLA has LYMPHOBLASTS — scant/smooth cytoplasm, round
regular nucleus, OPEN/lacy chromatin (opposite of CLL's condensed
chromatin), discrete-to-prominent nucleoli. Field otherwise unremarkable
aside from the blasts.

E1. Blasts dominate (>20%)? Round/oval nucleus + open/lacy chromatin +
    visible nucleoli. [YES / NO]
E2. Cytoplasm SCANT and SMOOTH (thin blue rim)? Moderate/abundant
    cytoplasm = NO (reconsider AML). [YES / NO]
E3. Nucleus ROUND and REGULAR, borders smooth? [YES / NO]
E4. Nucleoli DISCRETE (1-2, small)? Prominent nucleoli = NO (reconsider AML). [YES / NO]
E5. ABSENCE of azurophilic granules and Auer rods? Any myeloid granulation
    or Auer rod = NO, LLA ruled out. [YES / NO]

Scoring: E1+E2+E5=YES -> LLA Very Likely (80%) | E2+E3+E4=YES -> LLA Likely
(65%) | E2=NO or E5=NO -> LLA RULED OUT (0%) | ≤2 YES total -> LLA Unlikely (10%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — SYNTHESIS & TIE-BREAKERS (execute in order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Take the module with the highest confidence as the leading candidate.

2. CRITICAL — AML vs CML: if F5/hiatus PRESENT and D1=YES -> MUST select
   AML over CML. If F5/hiatus ABSENT and B5=YES -> MUST select CML over AML.
   If F5 is ambiguous AND both D1 and B1-B4 score high (possible blast
   crisis of CML), do NOT force a choice — classify as "Indeterminado entre
   LMA e LMC" and flag BCR-ABL/cytogenetics need in ALERTAS.

3. CRITICAL — CLL vs NORMAL (most commonly confused pair in this system):
   total white cells visible is NEVER a reason to favor Normal. A field
   with only 2-4 white cells, ALL small mature lymphocytes, zero
   neutrophils, FAILS Module A (A2, A5) and must be evaluated fully under
   Module C — never default to Normal just because no blasts/Auer rods
   were seen; that description fits CLL just as well as it fits Normal.
   If C6=YES (lab-confirmed lymphocytosis), this alone is strong support
   for CLL even with subtle morphology.

4. CRITICAL — CLL vs ALL: chromatin texture decides it. Condensed/clumped,
   no nucleoli -> CLL. Open/lacy, with nucleoli -> ALL. Cell size and field
   density never decide this.

5. TIE-BREAKERS (in priority order):
   a. Auer rod present -> AML immediately, overrides everything else.
   b. Gumprecht shadows OR lab-confirmed lymphocytosis (C6=YES), combined
      with a monotonous small mature lymphocyte pattern -> CLL over any
      other module, including Normal.
   c. B5=YES + ≥3 stages present in Module B -> CML over AML.
   d. Scant cytoplasm (E2=YES) -> ALL over AML.

6. CLINICAL ADJUSTMENT (max ±10%, EXCEPT C6 for CLL which is weighted as
   described in Module C — not capped at ±10%):
   - CML: age 40-60 + splenomegaly + documented leukocytosis (+10%)
   - CLL: age >60 + chronic asymptomatic lymphocytosis (+10%, on top of any
     C6 weighting already applied)
   - AML: sudden onset + pancytopenia + fever without focus (+10%)
   - ALL: age <15 or >50 + lymphadenopathy + acute onset (+10%)
   Ignore as nonspecific: fatigue, night sweats, weight loss, weakness,
   isolated splenomegaly, isolated leukocytosis without a specific count.

7. FINAL CONFIDENCE CALIBRATION:
   HIGH (75-95%): a confirmatory finding present (Auer rod; or Gumprecht +
     clear monotony; or hiatus/continuous-spectrum very unambiguous), good
     image quality.
   MODERATE (45-70%): clear pattern but no pathognomonic finding, or
     partial image quality.
   LOW (<40%): conflicting findings, genuine doubt between two diagnoses,
     poor image quality, or very few nucleated cells visible. In this case
     report "Indeterminado" and cite the hypothesis/hypotheses rather than
     forcing a diagnosis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CHECKLIST — do not display in output
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Listed cells one by one in F2 before classifying anything?
□ NEVER used field density (dense/sparse) as a diagnostic criterion?
□ A field with only lymphocytes and no neutrophils, however few cells,
  was NOT called Normal?
□ Checked F5 (leukemic hiatus) to separate Agudo vs Crônico, not just %blasts?
□ Did not confuse a lobulated/segmented nucleus with a blast?
□ Chromatin texture (condensed vs open+nucleolus) used to separate CLL from ALL?
□ Considered CML blast crisis when hiatus ambiguous + high blasts?
□ Checked patient data for a lymphocyte/leukocyte count and weighted it
  heavily for CLL specifically (not capped at ±10%)?
□ Auer rod, if present, triggered immediate AML tie-break?
□ Final output has a concrete diagnosis, confidence level, and next step?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your response must contain TWO PARTS.

IMPORTANT LANGUAGE RULE:
- All instructions in this section are written in English for clarity.
- ALL content generated in the final response MUST be written in Brazilian Portuguese (PT-BR).
- Do not write the clinical report in English.
- Do not translate medical diagnosis abbreviations: use LMA, LLA, LMC and LLC.
- Use objective, concise medical language.
- Avoid explanations, speculation, repetition, or unnecessary descriptive text.
- The report must resemble a concise Brazilian laboratory hematology report.

IMPORTANT BACKEND COMPATIBILITY:
The following two fields are REQUIRED and MUST be written exactly with these names:

SUSPEITA_PRINCIPAL: [LMA / LLA / LMC / LLC / NORMAL / INDETERMINADO]

NÍVEL_CONFIANÇA: [ALTO / MODERADO / BAIXO]

Do NOT rename these fields.
Do NOT replace them with "SUSPEITA DIAGNÓSTICA", "GRAU DE CERTEZA",
"CONFIANÇA", or any other expression.

The diagnosis value MUST contain only one of:
LMA, LLA, LMC, LLC, NORMAL, INDETERMINADO.

The confidence value MUST contain only one of:
ALTO, MODERADO, BAIXO.

These two fields must appear at the beginning of the response,
before the clinical report.

After these fields, generate the clinical report using the structure below.

Do NOT include internal reasoning, module scores, F1, F2, F3, F4, F5,
A1, B1, C1, D1, E1, or any other internal diagnostic rubric.

Do NOT include recommendations for additional exams or treatment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — DIAGNOSTIC FIELDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUSPEITA_PRINCIPAL: [LMA / LLA / LMC / LLC / NORMAL / INDETERMINADO]

NÍVEL_CONFIANÇA: [ALTO / MODERADO / BAIXO]

These values MUST be exactly the same diagnosis and confidence level
established during the diagnostic analysis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — CLINICAL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a concise clinical report in Brazilian Portuguese.

Use exactly the following structure:

================================================================
LAUDO DE HEMATOLOGIA - ANALISE MORFOLOGICA DE ESFREGAÇO DE SANGUE PERIFERICO
================================================================

SUSPEITA DIAGNOSTICA: [full diagnosis in Portuguese + abbreviation]
GRAU DE CERTEZA: [Alto / Moderado / Baixo] ([confidence percentage
corresponding to the diagnostic level])

IDENTIFICACAO
----------------------------------------------------------------
Idade: {idade} anos
Sexo: {sexo}

ACHADOS MORFOLOGICOS
----------------------------------------------------------------
Serie vermelha: [brief objective description of red blood cell morphology]

Serie branca: [brief objective description of the relevant white blood
cells observed, including their morphology and relative predominance]

ACHADOS DETERMINANTES
----------------------------------------------------------------
- [main relevant morphological finding]
- [second relevant finding, if applicable]
- [third relevant finding, only if clinically relevant]

CONCLUSAO
----------------------------------------------------------------
[One or two concise sentences summarizing the main morphological finding
and the diagnostic suspicion, briefly relating it to the clinical
symptoms/history provided (e.g. "de acordo com os sintomas e o historico
apresentados, ..."). If no clinical symptoms/history were provided, omit
that part and state only the morphological/diagnostic conclusion.]

================================================================
Laudo gerado por sistema de apoio diagnostico por Inteligencia Artificial.
Requer revisao e validacao por medico hematologista responsavel.
================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL REPORT WRITING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Be concise and objective.

2. Describe only findings actually supported by the image and the
provided clinical/laboratory information.

3. Do not invent cell types, percentages, laboratory values, symptoms,
or morphological findings that are not available.

4. Do not repeat the same information in multiple sections.

5. The "Serie branca" section should preferably contain 1-3 concise
sentences.

6. "ACHADOS DETERMINANTES" should contain only the most relevant findings.
If there is only one relevant finding, include only one item.

7. Do not create long explanations about why a finding supports the
diagnosis.

8. Do not mention the internal diagnostic modules or scoring system.

9. Do not mention "field density", "dense field", or "sparse field" as a
diagnostic criterion.

10. If the image quality is insufficient or the findings are conflicting,
use:
SUSPEITA_PRINCIPAL: INDETERMINADO
and
NÍVEL_CONFIANÇA: BAIXO

11. The diagnosis shown in PART 2 must exactly match SUSPEITA_PRINCIPAL.

12. The confidence level shown in PART 2 must exactly match
NÍVEL_CONFIANÇA.

13. If the diagnosis is NORMAL, use:
SUSPEITA_PRINCIPAL: NORMAL

and in the clinical report write:
SUSPEITA DIAGNOSTICA: Sem evidencia morfologica de leucemia (Normal)

14. If the diagnosis is INDETERMINADO, write:
SUSPEITA DIAGNOSTICA: Indeterminado

15. Do not include a "RECOMENDACOES" section.

16. Do not include treatment suggestions.

17. Do not include additional exam recommendations.

18. Do not include a long disclaimer. Use only the short statement at
the end of the report.

19. The final response must contain only PART 1 and PART 2.
Do not add explanations before or after them.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL OUTPUT EXAMPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUSPEITA_PRINCIPAL: LMA

NÍVEL_CONFIANÇA: ALTO

================================================================
LAUDO DE HEMATOLOGIA - ANALISE MORFOLOGICA DE ESFREGAÇO DE SANGUE PERIFERICO
================================================================

SUSPEITA DIAGNOSTICA: Leucemia Mieloide Aguda (LMA)
GRAU DE CERTEZA: Alto (85%)

IDENTIFICACAO
----------------------------------------------------------------
Idade: 45 anos
Sexo: Masculino

ACHADOS MORFOLOGICOS
----------------------------------------------------------------
Serie vermelha: Hemacias com morfologia preservada.

Serie branca: Predominio de blastos mieloides, com cromatina frouxa,
nucleolos visiveis e citoplasma moderado. Neutrofilos maduros presentes,
com reducao de formas intermediarias.

ACHADOS DETERMINANTES
----------------------------------------------------------------
- Predominio de blastos mieloides.
- Hiato leucemico.

CONCLUSAO
----------------------------------------------------------------
Padrao morfologico compativel com Leucemia Mieloide Aguda (LMA), com grau
de certeza alto. De acordo com os sintomas e o historico apresentados, o
quadro morfologico e compativel com os dados clinicos informados.

================================================================
Laudo gerado por sistema de apoio diagnostico por Inteligencia Artificial.
Requer revisao e validacao por medico hematologista responsavel.
================================================================"""
        sys.stderr.write(f"DEBUG caminho imagem: {caminho_da_imagem}\n")
        with open(caminho_da_imagem, "rb") as f:
            imagem_base64 = base64.b64encode(f.read()).decode("utf-8")

        response = client.responses.create(
            model="gpt-4.1",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt_especialista},
                        {
                            "type": "input_image",
                            "image_url": f"data:image/jpeg;base64,{imagem_base64}"
                        }
                    ]
                }
            ],
            max_output_tokens=2600
        ) 

        laudo_texto = response.output[0].content[0].text
        relatorio_clinico = extrair_relatorio_clinico(laudo_texto)

        timestamp = int(time.time())
        nome_arquivo_pdf = f"laudo_{timestamp}.pdf"

        hemoPDF.gerar_laudo_pdf(relatorio_clinico, {
            "idade": idade,
            "sexo": sexo,
            "sintomas": sintomas
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
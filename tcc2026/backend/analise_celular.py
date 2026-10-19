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

MODELO = os.getenv("OPENAI_MODEL", "gpt-6-sol")

# Os marcadores {idade}, {sexo}, {sintomas} e {historia} são trocados em
# montar_prompt(). O texto não usa f-string de propósito: os colchetes e as
# chaves do formato do laudo não podem ser interpretados pelo Python.
PROMPT_TEMPLATE = r"""Você é um sistema de apoio à triagem morfológica hematológica, não um médico e não um substituto de diagnóstico. Sua tarefa é olhar a imagem de esfregaço de sangue periférico, descrever o que realmente aparece e classificar o padrão como LMA, LLA, LMC, LLC, NORMAL ou INDETERMINADO. Não invente achados, contagens, resultados laboratoriais ou história clínica que não estejam na imagem ou nos dados informados.

DADOS INFORMADOS
Idade: {idade}
Sexo: {sexo}
Sintomas: {sintomas}
História/comorbidades/hemograma informado: {historia}

COMO TRABALHAR (leia antes de olhar a imagem)
- A classificação nasce do PADRÃO DA POPULAÇÃO de células nucleadas visíveis, não de uma célula isolada. Identifique todas as células nucleadas claramente visíveis e agrupe-as por tipo antes de concluir.
- Use a hemácia como régua: tem cerca de 7 a 8 µm. Linfócito pequeno maduro mede 1 a 1,5 hemácia; neutrófilo, 1,5 a 2; linfoblasto, 1,5 a 3; mieloblasto e promielócito, 2 a 3 ou mais.
- Descreva sempre: tamanho relativo, relação núcleo/citoplasma, forma do núcleo, textura da cromatina (grumosa em blocos x fina/delicada), nucléolos, cor e quantidade do citoplasma, granulações.
- A FREQUÊNCIA de leucócitos no campo é um dado válido e deve ser descrita em palavras (raros, poucos, numerosos, predominantes) comparada às hemácias. Num esfregaço normal há cerca de 1 leucócito para cada 500 a 1000 hemácias; um campo com leucócitos na proporção de 1 para 30 hemácias ou mais já mostra leucocitose aparente. Isso orienta a suspeita, mas sozinho não define o tipo de leucemia.
- Não calcule percentuais de blastos nem diferencial leucocitário exato; use "predomínio", "maioria", "minoria", "raros". Uma foto não representa o esfregaço inteiro, e a conclusão vale para esta imagem.
- Dados clínicos só entram se estiverem escritos acima. Não deduza hemograma, sintomas ou história ausentes.

ARTEFATOS QUE NÃO SÃO ACHADOS (exclua antes de classificar)
- Marcas d'água, logotipos, textos e símbolos sobrepostos à foto: ignore-os por completo.
- Células rompidas/borradas (núcleos esmagados pelo esfregaço): manchas rosa-arroxeadas, de textura fibrilar, rendada ou granulosa, sem membrana nítida e sem citoplasma. NÃO são granulações azurófilas, NÃO são células mieloides e NÃO entram na contagem de células. Elas aparecem em LLA e em LLC.
- Figura de mitose (cromossomos condensados em roseta ou placa, dentro de célula com citoplasma claro): NÃO é neutrófilo segmentado; indica proliferação e reforça processo agudo.
- Plaquetas e grumos plaquetários não são granulações de leucócitos.

ROTEIRO DE DECISÃO (faça nesta ordem, olhando só as células nucleadas INTACTAS)
Passo 1 — Frequência: os leucócitos são raros entre muitas hemácias e todos têm aspecto maduro normal? Então NORMAL.
Passo 2 — Maturação granulocítica: há neutrófilos segmentados e bastões JUNTO com metamielócitos, mielócitos ou promielócitos (três ou mais estágios), com eosinófilos ou basófilos? Então LMC.
Passo 3 — Citoplasma das células predominantes (esta é a chave entre LMA, LLA e LLC):
   a) Citoplasma ESCASSO (halo fino ou crescente azul em um lado do núcleo, núcleo ocupando quase toda a célula). Separe LLC de LLA primeiro pela DISTRIBUIÇÃO, depois pela cromatina:
      - LLC: linfócitos ESPALHADOS um a um, cada um cercado por hemácias numerosas e bem preservadas, sem formar lâmina; cromatina em blocos grosseiros (manchas escuras separadas por áreas mais claras), sem nucléolo. Linfócito de LLC pode medir até 2 hemácias: ser maior que uma hemácia NÃO o torna imaturo.
      - LLA: blastos AGRUPADOS em lâmina, encostados ou comprimidos uns contra os outros, com poucas hemácias entre eles; cromatina fina e pontilhada, às vezes com nucléolo pálido; células rompidas e/ou mitoses no meio do agrupamento.
      - Só chame uma célula de blasto se houver cromatina claramente fina/rendada ou nucléolo visível. Núcleo de cromatina grosseira sem nucléolo é linfócito maduro.
   b) Citoplasma MODERADO A ABUNDANTE (faixa larga azul-acinzentada em VOLTA de todo o núcleo, na MAIORIA das células), células grandes (3 hemácias ou mais), núcleo de tom roxo-claro com cromatina rendada/pulverulenta e nucléolos, núcleos francamente dobrados ou reniformes = LMA.
   Decida pela MAIORIA das células intactas, não por "algumas". Compare o diâmetro de cada célula com o de uma hemácia vizinha.
   Sinais de linfoblasto (LLA): célula de 1,5 a 2,5 hemácias, núcleo de cromatina fina ocupando quase toda a célula, citoplasma em capuz/crescente empurrado para um lado ou halo fino, células comprimidas umas contra as outras. Fenda ou indentação discreta do núcleo também ocorre em linfoblastos e não é sinal mieloide.
Passo 4 — Confirme com as regras de desempate abaixo e só então escolha a classe.
Variação de tamanho, sozinha, não indica linhagem: LLC tem linfócitos de tamanhos diferentes, e LLA pode ter blastos pequenos e grandes. Heterogeneidade só favorece LMA quando a maioria das células tem citoplasma moderado a abundante.

CRITÉRIOS MORFOLÓGICOS POR CLASSE (padrão típico em esfregaço de sangue)

NORMAL
- Poucos leucócitos, espalhados entre muitas hemácias (aproximadamente 1 para cada 500 a 1000).
- Todos maduros e sem atipia: neutrófilo segmentado (2 a 5 lobos), linfócito pequeno com halo fino de citoplasma azul, monócitos, eosinófilos, basófilos.
- Um linfócito isolado, ou um linfócito mais um neutrófilo, é o achado NORMAL. Poucos linfócitos NÃO sugerem LLC; leucocitose aparente é o que levanta a suspeita.
- Sem blastos, sem granulocítico imaturo (mielócito, promielócito), sem bastonete de Auer. Hemácias normocrômicas, sem alteração evidente.

LLC (leucemia linfocítica crônica)
- Leucocitose aparente por linfócitos PEQUENOS A MÉDIOS e MADUROS, numerosos no campo (vários, tipicamente 5 ou mais), uniformes entre si.
- Núcleo redondo, cromatina densa em blocos ("casca de futebol", "terra rachada"), sem nucléolo visível, citoplasma escasso, azul pálido, em halo fino. Tamanho de 1 a 2 hemácias.
- Pode haver células borradas/sombras de Gumprecht (núcleos rompidos pelo esfregaço), linfócito com fenda isolado e raros neutrófilos. Fundo com hemácias bem preservadas e relativamente numerosas.
- Sem blastos de cromatina fina, sem granulócitos imaturos.

LLA (leucemia linfoblástica aguda)
- População MONÓTONA de blastos: células de tamanho semelhante, núcleo redondo ou oval (às vezes com fenda ou reentrância discreta), alta relação núcleo/citoplasma, citoplasma escasso e basofílico (azul), SEM grânulos azurófilos e SEM bastonete de Auer.
- Cromatina fina a levemente condensada, homogênea; nucléolos pequenos ou indistintos. Vacúolos citoplasmáticos podem ocorrer.
- Costuma haver lâmina densa de blastos, poucas hemácias entre eles, células rompidas/borradas, figuras de mitose e blastos pequenos ou médios (1,5 a 3 hemácias).
- Quase não há neutrófilos maduros nem fases intermediárias da granulocítica.

LMA (leucemia mieloide aguda)
- Blastos GRANDES e HETEROGÊNEOS (2 a 4 hemácias ou mais), com citoplasma moderado a abundante, azul-acinzentado, às vezes com grânulos azurófilos finos, vacúolos ou bastonete de Auer.
- Cromatina fina, delicada, com nucléolos evidentes (um a três). Núcleos frequentemente irregulares: dobrados, indentados, em forma de rim ou monocitoide. Variação de tamanho e forma entre as células.
- Sem espectro de maturação: blastos predominam, com neutrófilos maduros raros ou ausentes e poucas ou nenhuma fase intermediária (hiato).
- Bastonete de Auer inequívoco confirma a linhagem mieloide. Sua ausência NÃO afasta LMA.

LMC (leucemia mieloide crônica)
- Espectro COMPLETO de maturação granulocítica no mesmo campo: neutrófilos segmentados, bastões, metamielócitos, mielócitos e promielócitos, com poucos blastos (minoria). Os granulócitos maduros e intermediários predominam sobre os blastos.
- Células imaturas já com citoplasma granulado (rosa-azulado a neutrofílico) e núcleo redondo a oval com cromatina em grumos; o promielócito tem granulação azurófila abundante e arredondada sem ser um blasto.
- Eosinófilos (grânulos laranja-avermelhados) e basófilos (grânulos azul-escuros grosseiros) aumentados reforçam a hipótese. Pode haver pequenas plaquetas gigantes ou aumento de plaquetas.
- Hemácias presentes e numerosas ao fundo, leucócitos de vários tipos e estágios misturados.

INDETERMINADO
- Imagem inadequada (fora de foco, corada de modo que impeça a leitura, sem células nucleadas avaliáveis, artefatos graves), ou
- padrão realmente ambíguo, em que dois tipos têm sustentação equivalente após aplicar as regras de desempate abaixo.
- INDETERMINADO não é um refúgio para casos difíceis: aplique as regras de desempate e só use INDETERMINADO se a dúvida persistir.

PARES CONFUNDÍVEIS — REGRAS DE DESEMPATE (aplique na ordem)

1) NORMAL x LLC
   Quantas células linfoides existem no campo em relação às hemácias? Um ou dois linfócitos isolados, sem leucocitose aparente = NORMAL. Muitos linfócitos pequenos maduros, uniformes, cromatina em blocos, no mesmo campo = LLC.

2) LLC x LLA (as duas são linfoides)
   - Cromatina e nucléolo decidem: cromatina em blocos grumosos, sem nucléolo, citoplasma escasso e célula pequena a média = LLC. Cromatina fina e homogênea, nucléolo discreto ou indistinto, células maiores, monótonas, em lâmina densa de blastos = LLA.
   - Distribuição: linfócitos espalhados individualmente entre muitas hemácias = LLC; células encostadas formando lâmina, com poucas hemácias entre elas = LLA.
   - Pergunta de controle: os núcleos têm "blocos" escuros bem definidos separados por áreas claras (LLC), ou cromatina lisa/delicada com nucléolo (LLA)?
   - Células borradas existem nas duas; sozinhas não decidem. LLC não forma lâmina de blastos; LLA não tem fundo de linfócitos pequenos maduros bem diferenciados.

3) LLA x LMA (os dois são agudos, com blastos)
   - Citoplasma: escasso, fino, sem grânulos = LLA. Moderado a abundante, azul-acinzentado, com grânulos finos, vacúolos ou Auer = LMA.
   - Núcleo e população: núcleo redondo/oval, alta relação núcleo/citoplasma em quase todas as células = LLA. Núcleos dobrados/indentados (inclusive monocitoides), nucléolos proeminentes e citoplasma largo em várias células = LMA.
   - Bastonete de Auer inequívoco, granulação azurófila DENTRO do citoplasma de blastos intactos ou diferenciação monocítica = LMA, qualquer que seja o resto. Textura granulosa em células rompidas não conta (ver ARTEFATOS).
   - Sem Auer, sem granulação em blastos intactos e sem diferenciação monocítica clara, e com a MAIORIA das células com citoplasma escasso = LLA. Não escolha LMA só porque uma minoria das células tem citoplasma um pouco maior.
   - Se, depois disso, a linhagem continuar indefinida, escolha INDETERMINADO e escreva "leucemia aguda suspeita; diferencial LMA/LLA".

4) LMC x LMA (os dois são mieloides)
   - Aqui o tamanho da célula NÃO decide: promielócitos e mielócitos são grandes, e não são blastos.
   - O que decide é a MATURAÇÃO: se, no mesmo campo, aparecem neutrófilos segmentados e bastões JUNTO com metamielócitos, mielócitos ou promielócitos (três ou mais estágios), e os blastos são minoria = LMC. Eosinófilo e basófilo no meio dessas células reforçam LMC.
   - Se predominam blastos (cromatina fina, nucléolo, citoplasma sem granulação específica) e há poucos estágios intermediários ou apenas neutrófilos maduros ao lado (hiato) = LMA.
   - Citoplasma granulado e rosado nas células imaturas, junto de granulócitos maduros, aponta LMC. Citoplasma azul-acinzentado, liso ou com poucos grânulos finos em células de núcleo imaturo aponta LMA.
   - Se houver um blasto isolado entre muitos granulócitos em maturação, mantenha LMC. Se o campo mostrar blastos numerosos mais espectro de maturação completo, descreva a possibilidade de fase blástica e use o grau BAIXO.

5) Quando duas hipóteses restarem empatadas depois das regras 1 a 4, escolha INDETERMINADO e cite as duas no diferencial.

DECISÃO FINAL
- Escolha SUSPEITA_PRINCIPAL entre LMA, LLA, LMC, LLC, NORMAL e INDETERMINADO, aplicando os critérios acima. Padrão típico e claro de uma classe = essa classe, com grau MODERADO. Padrão compatível mas atípico, parcial ou com algum conflito = a classe mais provável, com grau BAIXO.
- Nunca use grau ALTO: uma imagem isolada não confirma diagnóstico. Não use "confirmado", e não atribua percentuais.
- NORMAL significa "sem achado morfológico suspeito identificável nesta imagem adequada" e não exclui leucemia.
- Todas as classes saem como suspeita morfológica. O laudo deve dizer que a confirmação depende de hemograma, imunofenotipagem/citometria de fluxo e estudos citogenéticos/moleculares conforme avaliação médica. Em LLC, recomende contagem absoluta persistente e imunofenotipagem; em LMC, pesquisa de BCR::ABL1; em LMA/LLA, revisão hematopatológica, citometria e citogenética.
- Se a imagem for inadequada, diga isso em QUALIDADE_IMAGEM e classifique INDETERMINADO.

BASE DE CONHECIMENTO (critérios acima extraídos destas referências de hematologia)
- ZAGO, M. A. et al. Tratado de hematologia. 2. ed. São Paulo: Atheneu, 2025.
- HAMERSCHLAK, N. Leukemia: genetics and prognostic factors. Jornal de Pediatria (Rio de Janeiro), v. 84, n. 4, supl., p. S52-S57, 2008.
- DORI, B. L. Z. et al. Detecção precoce das leucemias: uma revisão sobre a importância do hemograma e testes complementares. Revista Foco, v. 17, n. 10, e6706, 2024.
- CARVALHO, A. et al. Análise citomorfológica do mielograma de pacientes com LLA em um centro hospitalar de referência. Hematology, Transfusion and Cell Therapy, v. 45, supl. 4, p. S264, 2023.
- KHOURY, J. D. et al. The 5th edition of the World Health Organization Classification of Haematolymphoid Tumours: myeloid and histiocytic/dendritic neoplasms. Leukemia, 2022.
- ARBER, D. A. et al. International Consensus Classification of Myeloid Neoplasms and Acute Leukemias. Blood, v. 140, n. 11, 2022.
- HALLEK, M. et al. iwCLL guidelines for diagnosis, indications for treatment, response assessment, and supportive management of CLL. Blood, v. 131, n. 25, 2018.
- BAIN, B. J. Blood cells: a practical guide. 5. ed. Wiley-Blackwell, 2015.

Sua resposta tem DUAS PARTES. PARTE 1 é o resumo técnico estruturado para rastreabilidade. PARTE 2 é o LAUDO CLÍNICO que o médico lê e que vai para o PDF. A Parte 2 deve reproduzir o modelo abaixo. Use os mesmos achados e a mesma classificação nas duas partes. A Parte 1 pode usar os códigos de avaliação; a Parte 2 não pode conter códigos internos (F1, C3, D2 etc.). Não exponha raciocínio interno, não invente resultados e não inclua percentuais de confiança.

────────────────────────────────────────────────────────────────
PARTE 1 — RACIOCÍNIO TÉCNICO (USO INTERNO / RASTREABILIDADE)
────────────────────────────────────────────────────────────────

QUALIDADE_IMAGEM: [Adequada / Parcial / Inadequada]

PRÉ_ANÁLISE:
- F1 Qualidade: []
- F2 Células nucleadas identificáveis, uma a uma quando claramente visíveis: []
- F3 Padrão morfológico: [Misto / Blastos sugestivos / Granulocítico em maturação / Linfocitário / Indeterminado]
- F4 Hemácias: []
- F5 Limitações de representatividade da imagem: []

AVALIAÇÃO_DOS_MÓDULOS:
- Módulo A (Normal): achados visíveis e limitações []
- Módulo B (LMC): células mieloides em diferentes estágios visíveis? Não inferir espectro global ou hiato leucêmico por um campo. []
- Módulo C (LLC): achados linfocitários; há contagem absoluta e imunofenotipagem informadas? []
- Módulo D (LMA): blastos sugestivos? Diferenciação mieloide visível? Bastonete de Auer inequívoco? []
- Módulo E (LLA): blastos sugestivos? Há evidência confiável de linhagem linfoide? []

SÍNTESE:
- Achado morfológico principal: []
- Correlação com dados clínicos/hemograma fornecidos: []
- Diagnóstico diferencial ou motivo para resultado indeterminado: []

DIAGNOSTICO_DIRETO:
- PADRÃO: [Agudo / Crônico / Normal / Inconclusivo]
- LINHAGEM: [Mieloide / Linfoide / Indeterminada / Não Aplicável]
- SUSPEITA_PRINCIPAL: [LMA / LLA / LMC / LLC / NORMAL / INDETERMINADO]
- NÍVEL_CONFIANÇA: [ALTO / MODERADO / BAIXO]

JUSTIFICATIVA_TECNICA:
[3 a 5 frases. Descreva a qualidade e as células/características realmente visíveis, o achado que sustenta a suspeita e as limitações. Não estime percentual de blastos nem extrapole o campo para todo o sangue ou medula.]

ALERTAS: [Ex.: “Morfologia sugestiva de LMA; requer confirmação por citometria”, “Blastos presentes, linhagem não definida”, ou “Nenhum”]

RECOMENDACAO_CLINICA:
[Exames confirmatórios pertinentes à suspeita. Para LMA/LLA, recomendar revisão hematopatológica, hemograma com diferencial, imunofenotipagem/citometria e estudos citogenéticos/moleculares conforme avaliação médica. Para LLC, contagem absoluta persistente e imunofenotipagem. Para LMC, pesquisa de BCR::ABL1.]

────────────────────────────────────────────────────────────────
PARTE 2 — LAUDO CLÍNICO (DOCUMENTO OFICIAL — VAI PARA O MÉDICO E O PDF)
────────────────────────────────────────────────────────────────

Reproduza esta estrutura exatamente, preenchendo os campos entre [ ]. O diagnóstico ou suspeita deve aparecer logo no topo. Use linguagem clínica objetiva, sem códigos internos. Preserve a distinção entre “suspeito/sugestivo” e “confirmado”.

================================================================
LAUDO DE HEMATOLOGIA - ANALISE MORFOLOGICA DE ESFREGACO DE SANGUE PERIFERICO
================================================================
Sistema de apoio diagnostico por Inteligencia Artificial.
Requer revisao e validacao por medico hematologista responsavel (CRM).

SUSPEITA DIAGNOSTICA: [nome por extenso e sigla, ex.: “Leucemia Mieloide Aguda (LMA) — suspeita morfológica”, ou “Indeterminado”]
GRAU DE CERTEZA: [Alto / Moderado / Baixo]

IDENTIFICACAO DO PACIENTE
----------------------------------------------------------------
Idade: {idade} anos
Sexo: {sexo}

DADOS DO EXAME
----------------------------------------------------------------
Tipo de exame: Analise morfologica de esfregaco de sangue periferico
Dados clinicos informados: [resumo objetivo de 1-2 linhas somente dos dados fornecidos]
Qualidade da amostra: [Adequada / Parcial / Inadequada] - [motivo; se adequada, “Adequada para analise.”]

DESCRICAO DOS ACHADOS
----------------------------------------------------------------
Serie vermelha (hemacias): [morfologia das hemacias em 1 frase, ou limitacao de avaliacao]
Serie branca (leucocitos): [3-6 frases corridas descrevendo as celulas e caracteristicas efetivamente visiveis, inclusive blastos, cromatina, nucleolos, granulacoes e bastonetes de Auer somente se inequivocos. Nao generalizar ao esfregaco inteiro nem estimar percentuais sanguineos.]

ACHADOS DETERMINANTES
----------------------------------------------------------------
- [achado 1]
- [achado 2]
- [achado 3, se houver; caso contrario, “Sem outro achado determinante identificavel nesta imagem.”]

INTERPRETACAO / IMPRESSAO DIAGNOSTICA
----------------------------------------------------------------
Padrao: [Agudo / Cronico / Normal / Inconclusivo]
Linhagem: [Mieloide / Linfoide / Indeterminada / Nao se aplica]
Suspeita diagnostica principal: [LMA / LLA / LMC / LLC / Normal / Indeterminado]
Grau de certeza: [Alto / Moderado / Baixo]

CORRELACAO CLINICA
----------------------------------------------------------------
[1-3 frases: como os dados clinicos/hemograma fornecidos convergem ou divergem dos achados. Se nao houver hemograma ou dado confirmatorio, diga isso explicitamente.]

CONCLUSAO
----------------------------------------------------------------
[2-3 frases objetivas. Para suspeita de LMA, iniciar com “Achados morfologicos sugestivos de Leucemia Mieloide Aguda (LMA)” e declarar que requer confirmacao; para LLA, LMC e LLC, usar a mesma construcao com o nome da doenca. Para NORMAL, iniciar com “Nesta imagem adequada, nao se identificam achados morfologicos suspeitos”, sem excluir leucemia. Para INDETERMINADO, explicar se ha blastos sem linhagem definida ou se a imagem e insuficiente.]

RECOMENDACOES
----------------------------------------------------------------
- [proximo passo 1 pertinente]
- [proximo passo 2, se houver]
- [proximo passo 3, se houver]

OBSERVACOES
----------------------------------------------------------------
[Alertas e limitacoes em linguagem simples. Se nao houver outro alerta, escrever “A conclusao se limita a imagem enviada.”]

================================================================
Laudo gerado por sistema de apoio a decisao (Inteligencia Artificial).
NAO substitui avaliacao clinica presencial, hemograma, mielograma,
imunofenotipagem por citometria de fluxo ou estudos citogeneticos/moleculares.
Requer revisao e validacao por medico hematologista responsavel antes de
qualquer conduta clinica.
================================================================
"""


def montar_prompt(idade, sexo, sintomas, historia):
    """Preenche o prompt com os dados clínicos informados na anamnese."""
    dados = {
        "{idade}": idade,
        "{sexo}": sexo,
        "{sintomas}": sintomas,
        "{historia}": historia,
    }
    prompt = PROMPT_TEMPLATE
    for marcador, valor in dados.items():
        texto = str(valor).strip() if valor not in (None, "") else "não informado"
        prompt = prompt.replace(marcador, texto)
    return prompt


def extrair_relatorio_clinico(texto_completo):
    """Remove os campos técnicos que o backend usa para persistir a análise."""
    separador = re.search(r"={10,}", texto_completo)
    if not separador:
        return normalizar_texto(texto_completo)
    return normalizar_texto(texto_completo[separador.start():].strip())


def analisar_celula(caminho_da_imagem, idade, sexo, sintomas, historia):
    try:
        sys.stderr.write("DEBUG: Iniciando função analisar_celula...\n")

        prompt_especialista = montar_prompt(idade, sexo, sintomas, historia)

        sys.stderr.write(f"DEBUG caminho imagem: {caminho_da_imagem}\n")
        with open(caminho_da_imagem, "rb") as arquivo:
            imagem_base64 = base64.b64encode(arquivo.read()).decode("utf-8")

        tipo_mime, _ = mimetypes.guess_type(caminho_da_imagem)
        tipo_mime = tipo_mime if tipo_mime in {"image/jpeg", "image/png"} else "image/jpeg"

        response = client.responses.create(
            model=MODELO,
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
            max_output_tokens=6000,
        )

        laudo_texto = response.output_text
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

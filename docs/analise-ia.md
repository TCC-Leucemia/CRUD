# Triagem morfológica por IA

## Finalidade

O módulo `tcc2026/backend/analise_celular.py` recebe uma imagem de esfregaço de sangue periférico e os dados clínicos registrados na anamnese. Ele envia esse conjunto ao modelo de visão e devolve um laudo de triagem morfológica, que a API armazena e também converte em PDF.

O resultado é apoio à decisão, não um diagnóstico definitivo. A classificação disponível continua limitada a LMA, LLA, LMC, LLC, normal ou indeterminado. O laudo informa a qualidade da imagem, os achados efetivamente visíveis, as limitações e os diferenciais relevantes para que o médico possa revisar a análise.

## Critérios de segurança diagnóstica

A IA avalia primeiro se a imagem permite triagem. Foco, coloração, artefatos graves ou ausência de células nucleadas avaliáveis levam a `INDETERMINADO`. Todas as classes saem como **suspeita morfológica**: o laudo sempre afirma que a confirmação depende de hemograma, imunofenotipagem/citometria e estudos citogenéticos/moleculares.

Uma imagem isolada não é diferencial leucocitário nem permite calcular percentual de blastos; o prompt proíbe percentuais e pede termos como "predomínio", "maioria" e "raros". A **frequência de leucócitos em relação às hemácias**, porém, é lida como achado descritivo: cerca de 1 leucócito para cada 500 a 1000 hemácias é o esperado, e 1 para 30 ou mais é leucocitose aparente. Essa frequência separa NORMAL de LLC (um ou dois linfócitos isolados são normais; vários linfócitos pequenos e uniformes no mesmo campo não) e orienta a suspeita, mas nunca define o tipo sozinha.

O prompt traz critérios contrastivos para os pares que o modelo confundia, aplicados em ordem:

- **LLC × LLA:** cromatina grumosa em blocos, sem nucléolo e célula pequena a média indicam LLC; cromatina fina e homogênea, nucléolo discreto e lâmina monótona de blastos indicam LLA.
- **LLA × LMA:** citoplasma escasso e liso com núcleo redondo e população monótona indicam LLA; citoplasma moderado a abundante, grânulos finos, núcleos dobrados e população heterogênea indicam LMA. Auer, granulação azurófila em blastos ou diferenciação monocítica decidem por LMA.
- **LMC × LMA:** o tamanho da célula não decide, porque promielócitos e mielócitos são grandes sem serem blastos. Decide a maturação: neutrófilos segmentados e bastões ao lado de metamielócitos, mielócitos ou promielócitos (três ou mais estágios), com blastos em minoria e eosinófilos/basófilos, indicam LMC; blastos predominantes com hiato de maturação indicam LMA.

`INDETERMINADO` fica para imagem inadequada ou para empate real entre duas hipóteses depois dessas regras, e não como saída padrão para casos difíceis. LLC e LMC continuam sem confirmação visual possível (clonalidade, contagem absoluta e BCR::ABL1 dependem de exames), o que o laudo registra nas recomendações.

Antes de classificar, o prompt manda excluir **artefatos** que o modelo confundia com achados: marcas d'água, células rompidas/borradas (que ele lia como "granulação azurófila" e transformavam LLA em LMA), figuras de mitose (lidas como neutrófilo) e plaquetas. Depois segue um **roteiro em passos**, olhando só células intactas: (1) leucócitos raros e maduros → NORMAL; (2) três ou mais estágios granulocíticos com eosinófilos/basófilos → LMC; (3) citoplasma das células predominantes — escasso com linfócitos espalhados entre hemácias e cromatina em blocos → LLC; escasso com blastos agrupados em lâmina e cromatina fina → LLA; moderado a abundante em volta do núcleo, células grandes e núcleos dobrados → LMA. A decisão é sempre pela maioria das células, não por "algumas".

O modelo usado na chamada vem da variável de ambiente `OPENAI_MODEL` (padrão `gpt-6-sol`, o modelo com que o prompt foi ajustado); a chamada permite até 6000 tokens de saída, porque o laudo em duas partes é longo. O texto é lido por `response.output_text`.

## Resultado da validação do prompt (2026-10-19)

Conjunto: as 6 imagens de `imagens TCC.zip` (LLA, LLC, LMA, LMC, normal, saudável), mais duas versões transformadas de cada uma (rotação/espelho/redução e variação de brilho, contraste e cor), com `gpt-6-sol`.

| Versão do prompt | Acertos |
| --- | --- |
| Primeira reescrita | 4/6 (LLA e LLC saíam LMA) |
| + artefatos e roteiro por citoplasma | 5/6, depois 6/6, depois 5/6 (LLC oscilava para LLA) |
| + distribuição e textura da cromatina para LLC × LLA (final) | 24/24 em 4 rodadas (originais ×2, transformadas, cor) |

O que o laudo final respondeu em cada imagem (rodada de confirmação):

| Imagem | Suspeita no laudo | Grau | Achado que o modelo apontou |
| --- | --- | --- | --- |
| LLA | Leucemia Linfoblástica Aguda (LLA) | Moderado | Células imaturas agrupadas, citoplasma escasso, cromatina fina |
| LLC | Leucemia Linfocítica Crônica (LLC) | Moderado | Linfoides numerosos, espalhados entre hemácias, cromatina condensada sem nucléolo |
| LMA | Leucemia Mieloide Aguda (LMA) | Moderado | Células grandes, citoplasma moderado a abundante, núcleos indentados/reniformes |
| LMC | Leucemia Mieloide Crônica (LMC) | Baixo/Moderado | Segmentados junto de formas granulocíticas imaturas granulares |
| normal | Normal | Moderado | Um linfócito maduro isolado entre muitas hemácias |
| saudável | Normal | Moderado | Linfócito e neutrófilo maduros, raros |

Todas as 24 Partes 2 trazem os campos do laudo, sem códigos internos, percentuais ou grau Alto. Uma rodada custa cerca de 42 mil tokens de entrada e 13 mil de saída para as 6 imagens.

Esse resultado mostra que o prompt classifica corretamente estas imagens e versões transformadas delas; **não** é medida de acurácia clínica. As 6 imagens vêm de atlas públicos e são casos típicos. Para o TCC vale o que está em "Confiança e validação": um conjunto separado, maior e rotulado por hematopatologista.

## Confiança e validação

Os níveis alto, moderado e baixo descrevem somente a confiança da triagem morfológica limitada ao material enviado. Eles não são probabilidade de doença, nem percentual de acurácia do sistema. Em especial, uma única imagem não deve receber nível alto.

Para medir acurácia real no TCC, é necessário um conjunto de teste separado, rotulado por hematopatologista e nunca usado para ajustar o prompt. A avaliação deve reportar, por classe e com intervalos de confiança, sensibilidade, especificidade, precisão, revocação, F1, matriz de confusão e taxa de casos `INDETERMINADO`. Casos indeterminados não podem ser removidos da análise: eles representam o comportamento de segurança em imagens insuficientes ou ambíguas.

## Apresentação na tela e no PDF

- O nível de confiança aparece só como categoria: Alto, Moderado ou Baixo. Nenhum percentual é gravado
  (`analise_ia.confianca` fica vazio nas análises novas) nem mostrado. Registros antigos com 85/60/0 são
  convertidos para a categoria pela API (`nivel_confianca`) e o número não sai mais da API.
- A coluna `analise_ia.suspeita_ia` guarda esse nível (Alta/Moderada/Baixa). A classificação sugerida
  (`classificacao_ia`) é LMA, LLA, LMC, LLC, "Sem evidência de leucemia" (NORMAL) ou "Indeterminado".
  INDETERMINADO nunca é mostrado como "sem suspeita".
- O prompt pede a linha `GRAU DE CERTEZA` só com a categoria; `backend/normalizar_laudo.py` (antes do PDF)
  e `api/utils/analiseIA.js` (ao gravar e ao ler) removem qualquer percentual dessa linha e deixam os
  separadores com largura fixa.
- A análise usa a anamnese já registrada na consulta; uma anamnese nova só é gravada se a consulta não
  tiver nenhuma.

## Integração

A API chama o executável `python` do PATH. Ele precisa das bibliotecas
`openai`, `python-dotenv` e `reportlab` (esta última usada por
`backend/hemoPDF.py`); sem elas a análise falha com "Falta uma biblioteca
Python". Instalação: `python -m pip install openai python-dotenv reportlab`.

O PDF do `hemoPDF.py` só existe logo após a análise, na tela Nova Análise. O PDF
baixado depois, pela lista de análises, é outro: montado no navegador a partir
do texto gravado (ver `docs/exportacao.md`, "Laudo clínico").

O prompt preserva no começo da resposta os campos `SUSPEITA_PRINCIPAL` e `NÍVEL_CONFIANÇA`, usados por `tcc2026/api/service/AnaliseIAService.js`. Esses campos não aparecem no PDF nem no texto clínico mostrado ao médico; o restante da resposta segue como laudo estruturado. O código identifica corretamente JPEG e PNG antes de enviar a imagem ao modelo.

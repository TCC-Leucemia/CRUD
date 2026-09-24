# Triagem morfológica por IA

## Finalidade

O módulo `tcc2026/backend/analise_celular.py` recebe uma imagem de esfregaço de sangue periférico e os dados clínicos registrados na anamnese. Ele envia esse conjunto ao modelo de visão e devolve um laudo de triagem morfológica, que a API armazena e também converte em PDF.

O resultado é apoio à decisão, não um diagnóstico definitivo. A classificação disponível continua limitada a LMA, LLA, LMC, LLC, normal ou indeterminado. O laudo informa a qualidade da imagem, os achados efetivamente visíveis, as limitações e os diferenciais relevantes para que o médico possa revisar a análise.

## Critérios de segurança diagnóstica

A IA avalia primeiro se a imagem permite triagem. Foco, coloração, artefatos, sobreposição de células, escolha do campo e quantidade de leucócitos avaliáveis podem impedir uma conclusão. Nesses casos, ou quando há achados conflitantes, a saída obrigatória é `INDETERMINADO`; ausência de uma alteração em uma única foto não autoriza resultado normal.

Uma imagem isolada não é diferencial leucocitário nem permite calcular percentual de blastos. Por isso, o sistema não deve transformar a proporção de células na fotografia em percentual sanguíneo ou medular, nem usar densidade aparente do campo, predominância de hemácias ou poucos linfócitos como critério diagnóstico.

LMA e LLA podem ter morfologia semelhante e a linhagem não é confirmada por uma fotografia. A IA só pode apontar LMA como principal hipótese na presença inequívoca de bastonetes de Auer ou granulação mieloide em células blásticas; se a linhagem permanecer incerta, o resultado deve ser indeterminado com os diferenciais no laudo.

LLC exige correlação com contagem absoluta de linfócitos/células B e demonstração de clonalidade por citometria de fluxo; linfócitos maduros ou células de Gumprecht em uma imagem podem ter outras explicações. LMC também não é confirmável pela imagem: processos leucemoides e outras neoplasias mieloproliferativas podem se sobrepor, e a alteração BCR::ABL1 não é visualmente detectável.

## Confiança e validação

Os níveis alto, moderado e baixo descrevem somente a confiança da triagem morfológica limitada ao material enviado. Eles não são probabilidade de doença, nem percentual de acurácia do sistema. Em especial, uma única imagem não deve receber nível alto.

Para medir acurácia real no TCC, é necessário um conjunto de teste separado, rotulado por hematopatologista e nunca usado para ajustar o prompt. A avaliação deve reportar, por classe e com intervalos de confiança, sensibilidade, especificidade, precisão, revocação, F1, matriz de confusão e taxa de casos `INDETERMINADO`. Casos indeterminados não podem ser removidos da análise: eles representam o comportamento de segurança em imagens insuficientes ou ambíguas.

## Integração

A API chama o executável `python` do PATH. Ele precisa das bibliotecas
`openai`, `python-dotenv` e `reportlab` (esta última usada por
`backend/hemoPDF.py`); sem elas a análise falha com "Falta uma biblioteca
Python". Instalação: `python -m pip install openai python-dotenv reportlab`.

O PDF do `hemoPDF.py` só existe logo após a análise, na tela Nova Análise. O PDF
baixado depois, pela lista de análises, é outro: montado no navegador a partir
do texto gravado (ver `docs/exportacao.md`, "Laudo clínico").

O prompt preserva no começo da resposta os campos `SUSPEITA_PRINCIPAL` e `NÍVEL_CONFIANÇA`, usados por `tcc2026/api/service/AnaliseIAService.js`. Esses campos não aparecem no PDF nem no texto clínico mostrado ao médico; o restante da resposta segue como laudo estruturado. O código identifica corretamente JPEG e PNG antes de enviar a imagem ao modelo.

# Triagem morfológica por IA

## Finalidade

O módulo `tcc2026/backend/analise_celular.py` recebe uma imagem de esfregaço de sangue periférico e os dados clínicos registrados na anamnese. Ele envia esse conjunto ao modelo de visão e devolve um laudo de triagem morfológica, que a API armazena e também converte em PDF.

O resultado é apoio à decisão, não um diagnóstico definitivo. A classificação disponível continua limitada a LMA, LLA, LMC, LLC, normal ou indeterminado. O laudo informa a qualidade da imagem, os achados efetivamente visíveis, as limitações e os diferenciais relevantes para que o médico possa revisar a análise.

## Critérios de segurança diagnóstica

A IA avalia primeiro se a imagem permite triagem. Foco, coloração, artefatos, sobreposição de células, escolha do campo e quantidade de leucócitos avaliáveis podem impedir uma conclusão. Nesses casos, ou quando há achados conflitantes, a saída obrigatória é `INDETERMINADO`; ausência de uma alteração em uma única foto não autoriza resultado normal.

Uma imagem isolada não é diferencial leucocitário nem permite calcular percentual de blastos. Por isso, o sistema não deve transformar a proporção de células na fotografia em percentual sanguíneo ou medular, nem usar densidade aparente do campo, predominância de hemácias ou poucos linfócitos como critério diagnóstico.

LMA e LLA podem ter morfologia semelhante e a linhagem não é confirmada por uma fotografia. A comparação considera cromatina, nucléolos, citoplasma, granulação e maturação em conjunto. Auer inequívoco favorece diferenciação mieloide, mas não confirma sozinho LMA; sua ausência não exclui LMA, e granulação isolada não prova essa linhagem. Se a linhagem permanecer incerta, o resultado deve ser indeterminado com os diferenciais no laudo. Hiato leucêmico não é critério obrigatório de separação LMA/LMC; há LMA com maturação e LMC em fase blástica.

LLC exige correlação com contagem absoluta de linfócitos/células B e demonstração de clonalidade por citometria de fluxo; linfócitos maduros ou células de Gumprecht em uma imagem podem ter outras explicações. LMC também não é confirmável pela imagem: processos leucemoides e outras neoplasias mieloproliferativas podem se sobrepor, e a alteração BCR::ABL1 não é visualmente detectável.

Na LLC, o critério usual é pelo menos 5 x 10^9/L de células B clonais persistentes por pelo menos três meses, com imunofenótipo apropriado; leucócitos totais ou linfócitos totais não substituem essa contagem. Presença de neutrófilos não exclui LLC, e poucos linfócitos sem neutrófilos não excluem normalidade. A definição formal e suas situações específicas pertencem à avaliação hematológica, não ao classificador de imagem.

O prompt prevê alerta de possível leucemia promielocítica aguda (subtipo de LMA), inclusive a variante hipogranular/bilobada: requer revisão hematológica urgente, investigação de PML::RARA e avaliação de coagulopatia, sem orientação automatizada de tratamento.

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

O prompt ativo está em [`tcc2026/backend/prompts/triagem_hematologica.md`](../tcc2026/backend/prompts/triagem_hematologica.md), carregado a cada análise por `backend/triagem_hematologica.py`. A aplicação mantém `gpt-4.1` na Responses API, com instruções separadas dos dados JSON de idade, sexo, sintomas e história, e imagem JPEG/PNG em `detail: high`. A história clínica, que antes era recebida mas não interpolada no prompt, agora é enviada. Não são enviados nomes de arquivo ou rótulos das amostras. Essa separação reduz a mistura de dados com instruções; não constitui garantia contra manipulação do modelo.

O leitor usa `response.output_text` e rejeita respostas incompletas, vazias ou com bloco de recusa antes de gerar o PDF. A API exige exatamente uma ocorrência de cada campo técnico com um único valor; listas como `LMA | LLA` e campos repetidos são recusados em vez de gravar o primeiro valor.

O PDF do `hemoPDF.py` só existe logo após a análise, na tela Nova Análise. O PDF
baixado depois, pela lista de análises, é outro: montado no navegador a partir
do texto gravado (ver `docs/exportacao.md`, "Laudo clínico").

O prompt preserva no começo da resposta os campos `SUSPEITA_PRINCIPAL` e `NÍVEL_CONFIANÇA`, usados por `tcc2026/api/service/AnaliseIAService.js`. Esses campos não aparecem no PDF nem no texto clínico mostrado ao médico; o restante da resposta segue como laudo estruturado. O código identifica corretamente JPEG e PNG antes de enviar a imagem ao modelo.

O laudo mantém os campos `SUSPEITA DIAGNÓSTICA` e `GRAU DE CERTEZA`, necessários à apresentação dos registros NORMAL/INDETERMINADO. O rótulo existente na listagem para NORMAL continua “Sem evidência de leucemia”; o laudo explicita que isso se limita às imagens e não exclui doença no paciente.

## Revisão e avaliação das amostras em 18/10/2026

O prompt foi revisado com referências ELN (LMA 2022, LLA 2024 e LMC 2025), iwCLL 2018 e exemplos morfológicos da ASH, citados no próprio arquivo. Incluir URLs não faz o modelo consultar artigos: os critérios resumidos estão nas instruções e não há navegação web na chamada da aplicação.

A pasta `tcc2026/amostras` contém 249 arquivos, mas apenas 8 conteúdos SHA-256 distintos, com recorte compartilhado entre duas imagens de LLC. Os nomes são rótulos provisórios, não confirmação clínica. A chamada real de referência ao modelo retornou HTTP 401; nenhuma classificação comparativa ou acurácia foi medida. O usuário autorizou deixar esse teste pendente. Inventário, achados por imagem, limites, fontes e procedimento de avaliação estão em [validacao-hematologia/README.md](validacao-hematologia/README.md). Pendência de validação independente: [P-001](PENDENCIAS.md).

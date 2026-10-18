# Revisão do prompt e das amostras hematológicas

## Resultado e limites

O prompt ativo está em [triagem_hematologica.md](../../tcc2026/backend/prompts/triagem_hematologica.md). Foi aplicado à integração em 18/10/2026, mantendo o modelo `gpt-4.1`, as cinco classes solicitadas e a possibilidade de `INDETERMINADO`. A sustentação científica foi revisada; melhora de acurácia ainda não foi demonstrada.

Uma tentativa real com a imagem `CLL.Jpeg`, sem anamnese disponível, falhou por `AuthenticationError`, HTTP 401. Antes dela, a rede restrita retornou `APIConnectionError`; a tentativa fora da restrição alcançou o serviço e recebeu 401. Não houve pré-laudo de referência, nem comparação antes/depois, nem medida de sensibilidade, especificidade ou acurácia. A chave não foi exibida ou gravada. O usuário escolheu continuar com testes locais e deixar a avaliação real pendente.

Meta próxima de 100% não é um resultado garantido por instrução. A melhora pretendida é retirar critérios incorretos, preservar informação clínica e explicitar sobreposição e falta de evidência. Maior frequência de respostas indeterminadas pode diminuir acertos de uma classificação forçada de cinco classes; isso deve ser medido, não ocultado. Uma amostra normal pouco representativa pode legitimamente resultar em INDETERMINADO.

## Inventário verificado

[inventario.json](inventario.json) registra nomes, SHA-256 e grupos completos de cópias. Não foi removida ou alterada nenhuma imagem original. O usuário confirmou que o sufixo `ALM` corresponde a LMA.

| Rótulo dos nomes | Conteúdos SHA-256 distintos | Arquivos |
| --- | ---: | ---: |
| LMA (`ALM`) | 1 | 56 |
| LLA (`ALL`) | 1 | 44 |
| LMC (`LMC`/`CML`) | 2 | 74 |
| LLC (`CLL`) | 2 | 62 |
| Normal (`normal`/`saudavel`) | 2 | 13 |
| Total | 8 | 249 |

Conteúdos diferentes não equivalem a pacientes ou esfregaços independentes. O painel direito de `1777907173332-CLL.Jpeg` aparenta reproduzir o campo de `CLL.Jpeg`; esse vínculo vem da inspeção visual e está marcado como inferido no grafo. Os seis arquivos desse grupo são cópias exatas entre si; o inventário escolhe `1777416560536-CLL.Jpeg` como representante por comprimento do nome. A origem clínica dos rótulos, a independência dos demais campos e as permissões de reutilização das imagens não estão documentadas. Nenhuma imagem foi redistribuída nesta tarefa.

## Inspeção visual dos oito conteúdos

São observações exploratórias feitas nesta sessão, não anotação de referência por hematopatologista e não resultados do classificador `gpt-4.1` da aplicação.

| Conteúdo examinado | O que é reconhecível | Limite para classificação |
| --- | --- | --- |
| `ALL.Jpeg` | Numerosas células mononucleares, muitas com relação núcleo/citoplasma elevada; contornos e citoplasma variáveis; seta e marca d'água. | Não estabelece linhagem só por nucléolos ou quantidade de citoplasma. |
| `ALM.Jpeg` | Células nucleadas redondas/ovais e outras indentadas ou curvas, com hemácias sobrepostas. | Escala insuficiente para Auer, nucléolos ou maturação consistente; não confirma LMA pelo nome. |
| `CML.Jpeg` | Granulócitos segmentados e possíveis precursores; possível basófilo sob a anotação 4. | Célula isolada não define basofilia; desvio reativo permanece diferencial. |
| `LMC.jpg` | Formas segmentadas/recurvadas com células maiores não segmentadas e granulação aparente. | Não chamar toda célula grande de blasto nem exigir todas as fases no mesmo campo. |
| `CLL.Jpeg` | Quatro células de aspecto linfoide maduro. | Não separa normalidade, população reativa e população clonal. |
| `1777907173332-CLL.Jpeg` | Montagem com campo panorâmico à esquerda e quatro células linfoides à direita; possíveis sombras à esquerda. | Recorte compartilhado; sombras não confirmam LLC. |
| `normal.jpg` | Um provável linfócito maduro e marca d'água Controllab. | Não ver neutrófilo neste campo não exclui normalidade nem confirma LLC. |
| `saudavel.jpg` | Provável linfócito e neutrófilo segmentado; contraste limitado. | Aspecto dessas células não exclui leucemia no paciente. |

## Critérios corrigidos

- Removidos escores e percentuais de confiança arbitrários, razão universal 700:1 e inferência de contagens sistêmicas pela foto.
- Retiradas exclusões por neutrófilos na LLC e por falta de neutrófilos na hipótese normal.
- Hiato leucêmico deixou de decidir obrigatoriamente LMA versus LMC; há LMA com maturação e LMC em fase blástica.
- Tamanho, citoplasma e nucléolos deixaram de desempatar sozinhos LMA/LLA; a linhagem pode permanecer indeterminada.
- Auer apoia diferenciação mieloide e exige correlação; Gumprecht não é específico; leucocitose não é sinônimo de linfocitose B clonal.
- Mantidos alertas de padrão blástico e possível LPA com avaliação urgente, sem indicação automatizada de tratamento.

## Fontes consultadas e o que sustentam

As consultas foram feitas em 18/10/2026. Algumas páginas completas de Blood retornaram 403 e as páginas PMC retornaram captcha nesta ferramenta; títulos, identificadores e trechos pertinentes estavam disponíveis nos resultados indexados, PDFs oficiais ou páginas da ASH. Não foi alegada leitura integral dos artigos bloqueados. As recomendações adultas não constituem validação pediátrica da aplicação.

- [Döhner et al., ELN para LMA, 2022](https://doi.org/10.1182/blood.2022016867): diagnóstico integrado e limiares dependentes da classificação; não converter uma foto em percentual de blastos do paciente.
- [Gökbuget et al., ELN para LLA, 2024](https://doi.org/10.1182/blood.2023020794): morfologia, imunofenotipagem e genética para estabelecer a classificação.
- [Apperley et al., ELN para LMC, 2025](https://doi.org/10.1038/s41375-025-02664-w): investigação de BCR::ABL1 e avaliação da fase da doença.
- [Hallek et al., iwCLL, 2018](https://doi.org/10.1182/blood-2017-09-806398): contagem de células B clonais, persistência e imunofenotipagem, com situações específicas interpretadas pelo médico.
- [ASH Image Bank, Acute leukemia and precursor neoplasms](https://imagebank.hematology.org/image/18664/acute-leukemia-and-precursor-neoplasms): exemplos variados e sobreposição morfológica.
- [ASH, caso de citopenias e alterações neurológicas](https://www.hematology.org/education/trainees/fellows/case-studies/male-neurologic-changes-cytopenias): LPA hipogranular/bilobada.
- [Maslak, Auer rod, 2005](https://doi.org/10.1182/blood.V106.5.1518.1518): Auer também pode ocorrer em síndromes mielodisplásicas.
- [Granular acute lymphoblastic leukemia in an adult patient, 2008](https://pubmed.ncbi.nlm.nih.gov/18417880/): granulação em LLA pode simular diferenciação mieloide.
- [OpenAI, imagens e visão](https://developers.openai.com/api/docs/guides/images-vision): entrada visual e detalhe alto; modelos de visão têm limitações de interpretação de imagens médicas e contagem. [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create): instruções, estados e saída textual.

## Como executar a avaliação exploratória

Na raiz do repositório, inventário offline, sem chamada ou cobrança de API:

```powershell
python tcc2026/backend/avaliar_amostras.py
```

Depois de corrigir a credencial local, para enviar uma chamada por conteúdo único (há cobrança da API), sem nome/rótulo no conteúdo enviado:

```powershell
python tcc2026/backend/avaliar_amostras.py --executar-api --saida docs/validacao-hematologia/resultados-exploratorios.json
```

Esse script usa o prompt e o construtor de requisição da aplicação, sem dados de anamnese inventados. Reutiliza também o parser Node real da API; exige Node no PATH e não contabiliza como classe válida uma resposta que a aplicação rejeitaria. Registra hash do prompt, modelo solicitado/retornado, consumo retornado pelo serviço, respostas, erros, casos não executados e matriz de concordância com os rótulos dos nomes. Indeterminados e erros não são excluídos do denominador dos casos executados. Falha de autenticação/rede interrompe o lote, explicita os casos restantes e retorna código de saída de erro. Nenhum resultado parcial deve ser descrito como avaliação completa. Sem anamnese correspondente, esse ensaio avalia apenas imagem e dados faltantes.

Para validar a meta do TCC: obter referência clínica por hematopatologista, separar desenvolvimento/teste por paciente e esfregaço antes de ajustar o prompt, manter duplicatas e recortes no mesmo grupo e testar em conjunto independente. Comparar antes/depois com o mesmo modelo, dados e parâmetros; registrar mudanças de configuração. Relatar matriz de confusão, sensibilidade, especificidade, precisão, F1 e intervalos de confiança por classe, taxa de indeterminados e cobertura. Informar desempenho global e entre casos respondidos, sem esconder abstinências ou falhas. Não usar esta coleção de desenvolvimento como teste independente.

## Graphify

[Grafo interativo](../../graphify-out/graph.html), [dados](../../graphify-out/graph.json) e [relatório](../../graphify-out/GRAPH_REPORT.md): 281 nós, 278 arestas e 10 comunidades. A extração por visão examinou oito conteúdos; 241 cópias receberam vínculos determinísticos por SHA-256. Interpretações morfológicas foram marcadas como inferidas ou ambíguas, não como diagnósticos confirmados.

A verificação estrutural não encontrou arestas com endpoints ausentes, colapsadas ou autorrelações. A baixa coesão de alguns grupos reflete estrelas de cópias idênticas, não qualidade do diagnóstico. Contagem de tokens dos subagentes não foi disponibilizada; custo real desconhecido, sem apresentar zeros como consumo medido.

## Validação local

Os testes Python cobrem transporte JPEG/PNG sem nomes, envio da história como dados, saída completa, recusa, truncamento, caminho ausente, integração das funções reais com API/PDF substituídos por doubles, deduplicação e contagem de indeterminados/erros. Os testes Node cobrem contrato e apresentação das seis classes, alternativas e campos conflitantes. Esses testes não validam acurácia médica. Resultados finais e passagens de revisão constam no [documento da tarefa](../tarefas/2026-10-18-prompt-hematologia.md).

# Revisão do prompt de apoio hematológico

## Skills e comandos invocados

- `graphify`, com a pasta `tcc2026/amostras`.
- `skills-aura:aura`: protocolo-tarefa-complexa, diagnosing-bugs e modo-loop-verificacao.
- Aplicada também `openai-docs`, para conferir a integração Responses/visão em fontes oficiais.

## Pedido, item por item

1. Revisar o prompt fornecido para o TCC de nível superior: aplicação web recebe anamnese e imagens de esfregaço sanguíneo e envia à API OpenAI para um pré-laudo.
2. Melhorar a precisão na diferenciação entre LLA, LMA, LMC, LLC e aspecto normal.
3. Ajustar os detalhes morfológicos que o modelo deve observar.
4. Indicar artigos científicos no prompt.
5. Buscar acurácia próxima de 100% por classe e verificar as imagens de `tcc2026/amostras`. Essa meta depende de avaliação empírica; não será apresentada como garantia.

## Objetivo

Entregar um prompt fundamentado, com critérios de insuficiência de evidência e classificação morfológica, e um registro verificável das amostras, referências e limitações de validação.

## Restrições

- Preservar o trabalho existente e as imagens originais.
- Não inferir diagnóstico confirmado a partir apenas de morfologia.
- Não inventar resultados, acurácia, conteúdo de artigos ou rótulos confirmados.
- Não versionar segredos nem dados clínicos identificáveis.
- Usuário confirmou: revisar e aplicar na aplicação; `ALM` nos nomes significa LMA.

## Checklist

- [x] Registrar o pedido antes da investigação do código.
- [x] Ler documentação existente e pendências.
- [x] Inventariar as amostras e usar graphify.
- [x] Examinar imagens e distinguir rótulo de pasta de referência diagnóstica confirmada.
- [x] Consultar fontes primárias hematológicas.
- [x] Revisar prompt e referências; aplicar à aplicação conforme escolha do usuário.
- [x] Revisar por papéis, validar artefatos e executar varredura das alterações.
- [x] Registrar desempenho efetivamente medido ou a impossibilidade de medi-lo.
- [x] Atualizar documentação e registro único de pendências.
- [ ] Demonstrar melhora e acurácia por classe em teste real e independente — P-001/P-002; não concluído e não garantido.

## Estado

- Documento inicial criado; Git em `main`, sem alterações locais prévias reportadas por `git status --short`.
- Skills aura e irmãs e checklist compartilhado lidos; README, documentação em docs/ e tcc2026/docs/ lidos. Não existia registro de pendências; criado docs/PENDENCIAS.md.
- Modelo atual confirmado no código: gpt-4.1. Chave local presente (valor não exibido). Histórico `historia` recebido pela função, mas ausente no prompt anterior.
- Inventário SHA-256 concluído: 249 arquivos, 8 conteúdos distintos. As duas imagens de LLC compartilham recorte; independência clínica não estabelecida. Fonte/validação dos rótulos ainda não fornecida. Todos os 249 hashes foram reconferidos ao final, sem alteração das imagens.
- Quatro subagentes examinaram os oito conteúdos e exerceram revisão morfológica, integração/UX, técnica e validação; implementação e consolidação pelo agente principal. Cópias ligadas por hash. Grafo final com 281 nós, 278 arestas e 10 comunidades; HTML/JSON/relatório gerados. Health check: zero endpoints ausentes, dangling edges, autorrelações ou arestas colapsadas. Tokens dos subagentes não disponibilizados, custo desconhecido registrado.
- Consultadas recomendações ELN LMA 2022, LLA 2024, LMC 2025, iwCLL 2018 e material morfológico ASH, com títulos e links no prompt e documento de validação. Algumas páginas completas tiveram bloqueio 403/captcha; não foi alegada leitura integral nem navegação pelo modelo da aplicação.
- Prompt aplicado em `backend/prompts/triagem_hematologica.md`, carregado por `backend/triagem_hematologica.py`; `analise_celular.py` usa esse construtor. Modelo e limite de saída preservados. Dados clínicos separados das instruções, história enviada, detalhe alto solicitado, texto completo do SDK usado e respostas incompletas/vazias/recusadas rejeitadas. Contrato HTTP/banco preservado.
- `api/utils/analiseIA.js` agora rejeita alternativas e campos técnicos duplicados. O avaliador exploratório usa o MESMO parser real da API, via Node e entrada padrão.
- `backend/avaliar_amostras.py` criado e executado em modo offline: 249 arquivos, 8 conteúdos distintos, sem chamada à API. Registra matriz incluindo indeterminados/erros quando houver avaliação real, com rótulos dos nomes explicitamente não validados.
- Chamada real de referência: primeiro `APIConnectionError` na rede restrita; repetição autorizada fora da restrição retornou `AuthenticationError`, HTTP 401. Nenhuma classificação obtida. Usuário escolheu continuar e deixar o teste da API pendente; nenhuma nova chamada foi feita depois. Não há medida antes/depois, acurácia ou confirmação de que o modelo classifica corretamente as oito imagens.

## Validações e ciclo de revisão

- `python -m unittest discover -s tcc2026/backend/tests -v`: **15 testes aprovados**. Transporte/entrada, história, ausência de nome/rótulo no payload, MIME, caminho ausente, texto completo, truncamento, recusa, fluxo real das funções com API/PDF substituídos por doubles, deduplicação, contagem de indeterminados/erros e uso do parser Node.
- `npm test` em `tcc2026`: **68 testes aprovados**, incluindo quatro novos testes de contrato e a suíte existente de API/apresentação/PDF.
- `python -m py_compile` nos três módulos Python alterados/novos: aprovado. `node --check tcc2026/api/utils/analiseIA.js`: aprovado. Não há script de build configurado em package.json; não foi inventado um comando de build.
- `git diff --check`: aprovado. Links locais, hash do prompt no inventário, 249 hashes das imagens, integridade do grafo e busca por padrão de chave nos artefatos novos: aprovados.
- Uma falha inicial dos testes Python foi permissão da pasta temporária do sandbox; temporários passaram a ser criados sob a pasta de testes, com remoção automática. A falha não era de classificação clínica.
- Três passagens da revisão do produto: primeira encontrou parser permissivo/recusa mista e documentação divergente; testes reproduziram as falhas antes das correções. Segunda encontrou o avaliador aceitando resposta que a aplicação rejeitaria; corrigido com parser compartilhado. Terceira revisão integrada, checklist de bugs e revisão final do subagente sem achados novos/bloqueantes no escopo.
- A skill diagnosing-bugs foi aplicada aos defeitos reproduzíveis de integração. Não foi possível construir um ciclo vermelho/verde da precisão diagnóstica: a tentativa real parou em 401. Revisão científica de critérios e testes de software não foram apresentados como prova de acurácia.

## Conferência final do pedido

| Item | Resultado |
| --- | --- |
| Revisar o prompt atual | Implementado e aplicado à integração; versão legível em arquivo próprio. |
| Melhorar precisão para quatro tipos e normal | Critérios incorretos corrigidos; melhora empírica ainda não demonstrada. |
| Detalhar o que observar | Núcleo/cromatina/nucléolos/citoplasma/granulação/maturação, qualidade, representatividade e sobreposição incluídos. |
| Indicar artigos | Oito referências no prompt; fonte e limitações de acesso documentadas. URL não equivale a estudo automático do artigo. |
| Identificar as amostras | Oito conteúdos inspecionados visualmente e inventariados; identificação pelo modelo da aplicação ainda não testada. |
| Acurácia próxima de 100% por classe | Pendente P-001/P-002. Não é garantia tecnicamente sustentada por prompt ou pelo corpus atual. |

## Entrega e pendências

README, documentação de análise, documento de validação, inventário, grafo, testes e pendências atualizados. Artefatos finais preservados; sidecars transitórios do graphify removidos e caches locais ignorados. Nenhuma dependência instalada, branch trocada, banco alterado, commit ou push realizado.

Pendências únicas em `docs/PENDENCIAS.md`: **P-001** (referência clínica/conjunto independente) e **P-002** (credencial e avaliação real). Próxima ação sugerida: corrigir a chave local e rodar o ensaio exploratório documentado, sem chamar isso de validação clínica.

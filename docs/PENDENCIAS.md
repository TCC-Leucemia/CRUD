# Pendências

## Abertas

- **P-001** · 2026-10-19 · `tcc2026/front/Med/crudanamnese.html` chama `verificarPerfil('Médico')` (linha ~863) mas a página não carrega `JS/auth.js`; a chamada deve lançar `ReferenceError` em tempo de execução. A tela também usa dados mockados e não chama a API. Encontrado na geração do grafo (graphify); não corrigido porque a tarefa era só gerar o grafo.
- **P-002** · 2026-10-19 · `tcc2026/front/Paciente/historicoPaciente.html` faz `console.log("TOKEN:", token)` (linha ~513), expondo o JWT no console do navegador. Remover o log.
- **P-003** · 2026-10-19 · `tcc2026/front/Paciente/configuracoes_paciente.html`: `validarCredenciais()` (linha ~593) não é chamada por nenhum evento e compara a senha atual com `usuarioLogado.senha` no navegador, o que contradiz a regra de a senha/hash nunca sair da API. Decidir: remover a função ou mover a validação para o backend.
- **P-004** · 2026-10-19 · `tcc2026/front/Med/medico.html` chama `HematoAI.initSidebar('anamnese')` (linha ~679) no painel do médico; o item ativo da sidebar provavelmente deveria ser o do painel. Confirmar a intenção.
- **P-005** · 2026-10-19 · `tcc2026/front/Senha/esqueci_senha.html` grava o CPF em `sessionStorage "cpf_recuperacao"` (linha ~410) além de `localStorage "cpfRecuperacao"`; nenhuma outra tela lê `cpf_recuperacao`. Remover a chave morta ou unificar.
- **P-006** · 2026-10-19 · Sessão lida de dois lugares no front do médico: `calendario.html`, `crudanaliseia.html`, `medico.html` e `nova_analise_ia.html` usam `hematoai_session`, enquanto as demais telas usam `localStorage "token"`; algumas criam uma sessão demo ("Dr. Usuário") quando ela não existe. Unificar a leitura da sessão via `auth.js`.
- **P-007** · 2026-10-19 · Grafo graphify incompleto: `api/database/banco.sql` não entrou (falta `graphifyy[sql]`), os 12 `.xlsx` de `exemplos-exportacao` não foram convertidos (falta `graphifyy[office]`) e `tcc2026/amostras` (249 imagens) foi excluída por decisão do usuário. A checagem de saúde registrou 39 arestas com extremidade solta. Para completar: instalar os extras e rodar `/graphify . --update`.

- **P-011** · 2026-10-19 · A validação do prompt usou só 6 imagens de atlas (e versões transformadas delas). Para medir acurácia real, montar um conjunto separado e maior de imagens rotuladas (várias por classe, de fontes diferentes), nunca usado para ajustar o prompt, e reportar matriz de confusão por classe (ver `docs/analise-ia.md`).
- **P-012** · 2026-10-19 · A chave da OpenAI usada nos testes foi colada no chat e está em `tcc2026/.env`. **Revogar essa chave** no painel da OpenAI e gerar outra.
- **P-010** · 2026-10-19 · Referências do prompt: a lista enviada tem itens que não são de hematologia (CSS, JS, PHP, design sprint); só as de hematologia foram embutidas. WHO 2022, ICC 2022, iwCLL 2018 e Bain foram acrescentadas de memória, sem DOI/páginas; conferir as citações.

## Resolvidas

- **P-009** · aberta em 2026-10-19 · resolvida em 2026-10-19 · Código duplicado no front (`cpfValido`, `buscarCEP`, máscaras, `formatarCPF`, `formatarData`, `rollbackCadastro`) → 34 cópias de 13 telas reunidas em `front/JS/formatacao.js` e `front/JS/etapas-cadastro.js`; `npm test` 71/71, `node --check` nos scripts inline das 14 telas; teste novo falha se alguma tela voltar a ter cópia própria.

- **P-008** · aberta em 2026-10-19 · resolvida em 2026-10-19 · Prompt novo do laudo sem validação na API real (chave de exemplo no `.env`) → usuário forneceu chave; prompt ajustado em 3 iterações (artefatos, roteiro por citoplasma, distribuição/cromatina LLC × LLA) e validado com `gpt-6-sol`: 24/24 em 4 rodadas (originais ×2, transformadas, variação de cor); 24 laudos conferidos sem código interno/percentual/grau Alto; análise de ponta a ponta gerou PDF; `npm test` 64/64. Padrão de `OPENAI_MODEL` passou a `gpt-6-sol`.

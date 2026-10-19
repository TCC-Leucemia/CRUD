# Tarefa (NA FILA) — remover código duplicado do front

Status: **na fila**. Só começa depois de concluir
`2026-10-19-prompt-laudo-leucemia.md` (regra de fila: uma tarefa por vez, na ordem
em que chegaram).

## Skills e comandos invocados

Nenhuma.

## O que foi pedido (palavras do usuário)

> "Quando é a partir do código duplicado que você falou que traz redundância ao
> projeto, eu quero que você retire isso, ok? Arrumando isso. Ou seja, deixando só as
> duas funções aí de CPF válido e buscar CEP, por favor. Óbvio que tem que ter no
> formatar CPF, formatar telefone, essas coisas, mas eu não quero que fique
> redundante o código"

Interpretação a confirmar antes de mexer: ficar com **uma única cópia** de
`cpfValido()` e `buscarCEP()` (e também de `formatarCPF`, `formatarTelefone` e
helpers equivalentes), num script compartilhado carregado pelas páginas, e apagar as
cópias inline.

## Contexto (do grafo graphify)

Cópias encontradas: `cpfValido()` e `buscarCEP()` (+ `debounceBuscarCEP`) em
`front/Adm/crudpaciente.html` e `crudmedico.html`; `formatarCPF()` em
`crudconsulta.html`, `crudpaciente.html` e outros; `rollbackCadastro()` repetido em
médico/paciente. Ver `graphify-out/GRAPH_REPORT.md`.

## Objetivo

Cada função utilitária existe em um só lugar; nenhuma tela perde comportamento.

## Restrições

- Preservar 100% do comportamento das telas.
- Não adicionar abstração além do necessário.

## Checklist

- [ ] Mapear todas as cópias (cpfValido, buscarCEP, formatarCPF, formatarTelefone, máscaras, rollback)
- [ ] Perguntar ao usuário onde fica o script compartilhado (ex.: `front/JS/utils.js`)
- [ ] Criar o script compartilhado e carregá-lo nas páginas
- [ ] Remover as cópias inline
- [ ] Conferir cada tela (carrega sem erro, CPF/CEP/telefone funcionam)
- [ ] Atualizar docs e `docs/PENDENCIAS.md`

## Estado

Em andamento (2026-10-19). Usuário escolheu arquivo novo `front/JS/formatacao.js`.

Feito:
- `front/JS/formatacao.js`: `maskCPF`, `maskTelefone`, `maskCEP`, `cpfValido`, `formatarData`,
  `buscarCEP(cep, prefixo, aoPreencher)`, `debounceBuscarCEP(...)` — globais no navegador,
  `module.exports` no Node. `formatarCPF` com `TODO(human)` (o usuário decide a regra única).
- `rollbackCadastro` movido para `front/JS/etapas-cadastro.js` (`HematoEtapas.rollbackCadastro`);
  ordem login/endereço é indiferente (sem FK entre as duas tabelas).
- 34 cópias inline removidas de 13 telas; `<script src="../JS/formatacao.js">` adicionado
  logo após `navbar.js` em 14 telas (inclui `administrador.html`, que usa `HematoAI.formatarCPF`).
- `navbar.js`: `HematoAI.formatarCPF` delega para o `formatarCPF` único.
- `formatarData` de `nova_analise_ia.html` era código morto (sem chamadas) — removida.
- `api/tests/formatacao.test.js`: 6 testes passando.

- `formatarCPF` com a regra que o usuário ditou: vazio/nulo/"—" → "—"; completa zeros à
  esquerda; mais de 11 dígitos não ocorre (máscara impede); usa `apenasDigitos`.
- Validação: `npm test` 71/71; `node --check` nos scripts inline das 14 telas e nos 3 JS
  compartilhados; ordem de carregamento conferida (formatacao.js antes do script da tela).
- Docs: README (histórico), `docs/PENDENCIAS.md` (P-009 resolvida).

**Concluído.** Não verificado: telas abertas no navegador (dependem da API e do MySQL locais).

# CRUD
Envio do CRUD

## Tratamento de erros no front

Todo erro mostrado ao usuário passa por um único componente:
`tcc2026/front/JS/erro-popup.js`, incluído no `<head>` de todas as páginas.

- `mostrarErro(erro, opcoes)` — traduz exceção, falha de rede ou resposta de
  erro da API em categoria + título + mensagem compreensíveis. O detalhe
  técnico vai só para o console.
- `mostrarAviso(mensagem, opcoes)` / `mostrarSucesso(...)` / `mostrarInfo(...)`
  — mesmas caixas, para validação, confirmação e informação.
- Opções aceitas: `categoria`, `titulo`, `mensagem`, `aoTentarNovamente`,
  `aoFechar`.

O pop-up é fixo no topo da tela, por cima do conteúdo (não empurra a página), e
usa os tokens de cor/tipografia já existentes (`navbar.css` nas telas internas e
o `:root` das telas públicas), inclusive no modo escuro.

`HematoAI.showToast(mensagem, 'error')` é redirecionado automaticamente para o
pop-up; `success`, `warning` e `info` continuam como toast.

## Histórico de Alterações

### 2026-09-14 — Triagem morfológica conservadora na análise por IA
- **Alteração:** reestruturado o prompt de `backend/analise_celular.py` para avaliar a qualidade e representatividade da imagem antes de classificar o caso; acrescentados diferenciais obrigatórios, regras para não forçar LMA/LLA/LLC/LMC e laudo com limitações explícitas. Corrigido também o tipo MIME enviado para imagens PNG.
- **Motivo:** uma foto isolada não representa o esfregaço completo e não permite confirmar subtipo de leucemia, percentual de blastos, clonalidade ou alteração molecular. A mudança reduz falsos positivos por artefatos, campos pouco representativos e semelhança entre doenças.
- **Arquivos/Módulos:** `backend/analise_celular.py`, `docs/analise-ia.md`.
- **Validação:** pendente de validação clínica em conjunto independente e rotulado por hematopatologista; a análise automática de sintaxe e de compatibilidade de saída deve ser executada antes do deploy.

### 2026-08-20 — Pop-up de erro padronizado e ajustes no laudo da IA
- **Alteração:** criado o componente único de pop-up de erro
  (`front/JS/erro-popup.js`) e aplicado às 24 páginas; removidos todos os
  `alert()` nativos; `showToast(..., 'error')` passa a usar o pop-up; no laudo
  gerado pela IA, "Idade" e "Sexo" ficaram na mesma linha e o texto passou a ser
  gerado com acentuação completa.
- **Motivo:** os erros apareciam de formas diferentes em cada tela (alert
  nativo, toast, texto inline) e alguns vazavam mensagem técnica; o laudo saía
  sem acentos, o que prejudica a leitura impressa pelo médico.
- **Arquivos/Módulos:** `front/JS/erro-popup.js`, `front/JS/navbar.js`,
  `front/JS/auth.js`, as 24 páginas de `front/`, `backend/analise_celular.py`,
  `backend/hemoPDF.py`.
- **Validação:** sintaxe verificada nos arquivos JS/Python e nos scripts inline
  das 24 páginas; pop-up testado no navegador (login, tela interna, tela de
  senha) em tema claro e escuro, desktop e mobile; tradução de erro verificada
  para banco fora do ar, falha de rede, erro técnico cru, 401/403/404/500;
  PDF do laudo gerado e conferido com os acentos preservados.
- **Status:** concluído.

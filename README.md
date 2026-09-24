# CRUD
Envio do CRUD

## Banco de dados

A API se conecta ao MySQL local via `mysql2`, configurado por variáveis de
ambiente em `tcc2026/.env` (copiar de `tcc2026/.env.example`). Detalhes,
como resolver erro de conexão e como conceder acesso ao usuário da aplicação:
[docs/banco-de-dados.md](docs/banco-de-dados.md).

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

Na API, todo erro passa por `tcc2026/api/utils/tratamentoErros.js`: a tela
recebe o que aconteceu (sem SQL, caminhos, variáveis ou senhas) e o terminal
recebe como resolver. Detalhes e tabela de códigos:
[docs/tratamento-de-erros.md](docs/tratamento-de-erros.md). Regras de segurança
da recuperação de senha: [docs/recuperacao-de-senha.md](docs/recuperacao-de-senha.md).
Testes de regressão: `npm test` na pasta `tcc2026`.

## Exportação de listagens (PDF e Excel)

Todas as listagens (Administrador, Médico e Paciente) têm os botões **PDF**
(vermelho) e **Excel** (verde), que exportam o que está na tela com os filtros
aplicados. O módulo único é `tcc2026/front/JS/exportar.js`; cada página só
descreve título, colunas e de onde vêm as linhas. Detalhes, aparência dos
arquivos e como adicionar a uma nova listagem: [docs/exportacao.md](docs/exportacao.md).

## Histórico de Alterações

### 2026-09-24 — Login falhando por coluna `statusu` ausente e senha de exemplo errada
- **Alteração:** adicionada a coluna `login.statusu` (`ENUM('Ativo','Desativado')
  NOT NULL DEFAULT 'Ativo'`) em `api/database/banco.sql`, que faltava desde
  sempre apesar de `LoginDAO`, `MedicosDAO`, `LoginService` e `JwtMiddleware`
  dependerem dela; a senha de exemplo do admin (`admin@hematoai.com`) no
  mesmo arquivo estava em texto puro (`'123456'`) em vez do hash MD5 que o
  login compara, diferente de todos os outros usuários de exemplo — corrigida
  para o mesmo hash. As duas correções também foram aplicadas ao banco local
  já em uso (`ALTER TABLE` aditivo + `UPDATE` da senha, sem apagar dados).
  Aproveitando, trocado "Tente novamente; se continuar" por "Tente novamente.
  Se continuar" nas 4 mensagens de erro que usavam ponto e vírgula
  (`api/utils/tratamentoErros.js`, `api/service/AnaliseIAService.js`).
- **Motivo:** usuário relatou não conseguir logar (nem admin nem médico) com
  usuário/senha corretos; a causa era estrutura de banco desatualizada, não
  erro de configuração do `.env`.
- **Arquivos/Módulos:** `api/database/banco.sql`, `api/utils/tratamentoErros.js`,
  `api/service/AnaliseIAService.js`, `docs/banco-de-dados.md`.
- **Validação:** `npm test` (22/22); login de admin e do primeiro médico
  testado de ponta a ponta com `LoginService.login()` real contra o banco
  local, ambos retornando sessão válida.
- **Status:** concluído.

### 2026-09-24 — Tratamento de erros preciso e correção da recuperação de senha
- **Alteração:** criado `api/utils/tratamentoErros.js`, que substitui o
  handler de erro do `app.js`. Ele separa "MySQL desligado", "acesso ao banco
  recusado" e "banco inexistente" e traduz erros de restrição do MySQL
  (duplicidade 409, registro em uso 409, referência inexistente 400, campo
  grande demais 400, valor inválido 400), JSON malformado (400), corpo grande
  demais (413) e rota inexistente (404 em JSON). A orientação técnica vai só
  para o terminal. `req.body` passa a ser `{}` quando a requisição não tem
  corpo. Sessão vencida e sessão inválida têm mensagens próprias. A Análise IA
  deixou de mostrar caminhos, variáveis do `.env` e saída do Python na tela.
  Removidos `console.log` que imprimiam hash de senha, CPF e corpo de
  cadastro. No front, `erro-popup.js` deixou de trocar erros de banco por um
  texto fixo sobre o XAMPP.
- **Correção de segurança:** `POST /auth/alterar-senha-recuperacao` trocava a
  senha só com o CPF, sem conferir o código enviado por e-mail. Agora a troca
  exige um token de uso único entregue por `/auth/validar-codigo`, o código
  aceita no máximo 5 tentativas e é gerado com `crypto.randomInt`, e nenhuma
  resposta revela se o CPF tem conta. As telas `confirmar_codigo.html` e
  `nova_senha.html` passaram a guardar e enviar o token.
- **Motivo:** o login mostrava "Inicie o MySQL no XAMPP" com o MySQL ligado (a
  causa real era a senha de exemplo em `tcc2026/.env`); pedido de revisar o
  tratamento de erros do código inteiro sem expor informação sensível.
- **Arquivos/Módulos:** `api/app.js`, `api/utils/tratamentoErros.js` (novo),
  `api/http/MeuTokenJWT.js`, `api/middleware/JwtMiddleware.js`,
  `api/service/LoginService.js`, `api/control/LoginControl.js`,
  `api/control/EnderecosControl.js`, `api/service/AnaliseIAService.js`,
  `api/dao/LoginDAO.js`, `api/middleware/PacientesMiddleware.js`,
  `api/service/ConsultasService.js`, `api/service/ExamesService.js`,
  `api/control/ConsultasControl.js`, `front/JS/erro-popup.js`,
  `front/Senha/*.html`, `package.json` (script `test`), `api/tests/` (novo),
  `docs/tratamento-de-erros.md` e `docs/recuperacao-de-senha.md` (novos),
  `docs/banco-de-dados.md`.
- **Validação:** `npm test` com 22 testes passando; os 6 de recuperação de
  senha falham no código anterior (o ataque "trocar senha só com o CPF"
  respondia 200). API real contra o MySQL local: senha errada no `.env` →
  "acesso ao banco recusado", porta sem MySQL → "MySQL não está respondendo",
  JSON malformado → 400 em português, rota inexistente → 404 JSON. Tela de
  login conferida no navegador. O fluxo completo de recuperação com e-mail
  real não foi testado (depende do banco e de `EMAIL_USER`/`EMAIL_PASS`).
- **Status:** concluído.

### 2026-09-23 — Migração de `mysql` para `mysql2` (login parava de funcionar)
- **Alteração:** trocado o driver `mysql` (2.18.1) por `mysql2` em
  `tcc2026/api/app.js` e `package.json`; host, porta, usuário, senha e banco
  saíram do código (antes hardcoded como `root`/senha vazia) e passaram a vir
  de variáveis de ambiente (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
  `DB_NAME`), lidas de `tcc2026/.env`. Criado `tcc2026/.env.example` com
  placeholders. A API agora para na inicialização com mensagem clara se
  `DB_USER` não estiver definido.
- **Motivo:** o MySQL Server 8.4 local usa `caching_sha2_password` (padrão
  desde o MySQL 8), que o pacote `mysql` não suporta — toda tentativa de login
  falhava no handshake da conexão, antes de qualquer consulta rodar, com
  `ER_NOT_SUPPORTED_AUTH_MODE`. O usuário pediu explicitamente para modernizar
  o driver em vez de rebaixar a autenticação do MySQL, e para não usar `root`
  na aplicação.
- **Arquivos/Módulos:** `tcc2026/package.json`, `tcc2026/api/app.js`,
  `tcc2026/.env.example` (novo), `docs/banco-de-dados.md` (novo).
- **Validação:** nenhum DAO/service precisou mudar — todos usam
  `pool.query`/`getConnection`/`beginTransaction`/`commit`/`rollback`, API
  idêntica em `mysql2`; confirmado com `node --check` em todos. `npm install`
  removeu `mysql` e instalou `mysql2` (`package.json`/lockfile conferidos). A
  API sobe sem erro; uma consulta direta contra o MySQL 8.4 local com o
  usuário `Todeschini` completou o handshake `caching_sha2_password` sem
  `ER_NOT_SUPPORTED_AUTH_MODE` — parou em `ER_ACCESS_DENIED_ERROR` (senha
  placeholder em `.env`), tratado corretamente como 503 "Banco de dados
  indisponível" pelo middleware de erro. Teste de login real (admin/médico)
  não pôde ser concluído: falta a senha real do usuário `Todeschini` em
  `tcc2026/.env`, que só o usuário pode preencher.
- **Status:** correção da conexão concluída; login end-to-end pendente da
  senha do banco.

### 2026-09-23 — PDF da Análise IA no formato de laudo clínico
- **Alteração:** o "Baixar relatório" de `Med/crudanaliseia.html` deixou de
  usar o visual das fichas (faixas vermelhas, caixas bege) e passou a gerar um
  laudo clínico em preto e branco, só com a marca em cor: "Página X de Y",
  título centralizado, identificação do paciente em duas colunas, seções do
  texto da IA, assinatura do médico e aviso de apoio à decisão. Nova função
  `HematoExport.exportarLaudoPDF` em `front/JS/exportar.js`; o logo virou
  `desenharLogo`, compartilhado com as fichas. A listagem de análises
  (`AnaliseIADAO.findByCrm`) passou a trazer nascimento, sexo, data do exame,
  CRM e nome do médico.
- **Motivo:** o PDF da análise precisava ter a aparência de um laudo real, sem
  as cores do site.
- **Arquivos/Módulos:** `front/JS/exportar.js`, `front/Med/crudanaliseia.html`,
  `api/dao/AnaliseIADAO.js`, `docs/exportacao.md`.
- **Validação:** sintaxe verificada; PDF renderizado e conferido com laudo
  estruturado, laudo longo (duas páginas, com continuação), análise antiga com
  texto corrido e análise sem texto; ficha de exame conferida sem mudança.
  Não houve teste com o banco MySQL real.
- **Status:** concluído.

### 2026-09-23 — Exportação de listagens em PDF e Excel
- **Alteração:** criado `front/JS/exportar.js` e os botões PDF/Excel nas 11
  listagens (Médicos, Pacientes e Consultas do administrador; Consultas,
  Exames, Resultados, Anamneses, Análises IA e Calendário do médico; Histórico e
  Resultados do paciente). Os botões de PDF de registro que não funcionavam
  ("Baixar relatório" da Análise IA, que chamava uma rota inexistente, e os
  "Exportar PDF" simulados do paciente) passaram a gerar a ficha no navegador.
  Novos tokens `--pdf`/`--excel` em `navbar.css`, com tom levemente mais claro
  no modo escuro.
- **Motivo:** os botões de PDF existentes não geravam arquivo e nenhuma
  listagem permitia exportar os dados.
- **Arquivos/Módulos:** `front/JS/exportar.js`, `front/CSS/navbar.css`, as 12
  páginas listadas em `docs/exportacao.md`, `docs/exportacao.md`.
- **Validação:** sintaxe de `exportar.js` e dos scripts inline verificada;
  cada listagem testada no navegador com dados simulados (PDF e Excel gerados e
  conferidos: acentos, filtros no cabeçalho, tabela continuando em várias
  páginas com cabeçalho repetido, "Página X de Y", planilha com cabeçalho
  congelado e filtro); fichas de Análise IA, consulta, exame e resultado
  conferidas, inclusive laudo longo quebrando em 3 páginas; lista vazia, falha
  do CDN com nova tentativa, modo escuro e layout mobile verificados. Não houve
  teste com o banco MySQL real (não estava rodando).
- **Status:** concluído.

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

# Graph Report - CRUD  (2026-10-19)

## Corpus Check
- Large corpus: 392 files · ~2,336,661 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1046 nodes · 1734 edges · 78 communities (57 shown, 21 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.85)
- Token cost: 499,040 input · 0 output

## Community Hubs (Navigation)
- Triagem IA e Exportação (docs)
- Backend Python de Laudo
- Autenticação e Recuperação (front)
- Endereços CRUD
- Dependências npm da API
- Relatórios PDF Adm
- Endpoints Clínicos do Médico
- Configurações do Admin
- Sessão e auth.js
- Resultados de Exame DAO
- Tela Gerenciar Pacientes
- App Express e Banco
- Serviço de Análise IA
- Serviço de Login
- Testes de Auditoria Final
- Exames e Resultados Middleware
- Tela Gerenciar Médicos
- Controle e Utils de Análise IA
- Rotas de Análise IA
- Tela Gerenciar Consultas
- Testes de Separador e Etapas
- Testes de Permissão e PDF
- package.json Dependências
- Imagens de Exame Serviço
- Validação CPF e CRM
- Painel e Histórico do Paciente
- Tratamento de Erros
- Login DAO e Modelo
- Testes de Recuperação de Senha
- Anamnese Rotas e Controle
- Pacientes Rotas e Controle
- Anamnese Serviço e DAO
- Login Rotas e Permissões
- Docs Banco e Recuperação
- Imagens de Exame Rotas
- Serviço de Médicos
- Testes de Tratamento de Erros
- Médicos Rotas e Controle
- Token JWT
- Consultas Rotas e Controle
- Exames Rotas e Controle
- Resultados Rotas e Controle
- Serviço de Pacientes
- Painel do Administrador
- Decisões de Segurança
- Envio de E-mail
- Serviço de Consultas
- Hash de Senha
- Cadastro em Etapas com Rollback
- Cliente api.js
- Esquema e Códigos de Erro
- Auditoria e CORS
- Controle de Login
- Middleware JWT
- Busca de CEP
- Conexão MySQL
- Pacientes DAO
- Formatação de Texto IA
- Credenciais do Paciente
- Listas do Histórico
- Calendário de Consultas
- Badge de Suspeita
- Seleção de Tema
- Força da Senha
- Seleção de Consulta Anamnese
- Tema nas Configurações

## God Nodes (most connected - your core abstractions)
1. `crudpaciente.html (Gerenciar Pacientes)` - 35 edges
2. `crudmedico.html (Gerenciar Médicos)` - 30 edges
3. `crudconsulta.html (Gerenciar Consultas)` - 23 edges
4. `administrador.html (Painel do Administrador)` - 19 edges
5. `configuracoes.html (Configurações do Admin)` - 14 edges
6. `login.html (Acesso médico e paciente)` - 14 edges
7. `verificarPerfil()` - 13 edges
8. `selecionar_perfil.html (Escolha de perfil)` - 13 edges
9. `HematoAI PDF List Export Layout` - 13 edges
10. `Consulta (entity)` - 13 edges

## Surprising Connections (you probably didn't know these)
- `validarCredenciais() (não ligada a nenhum evento)` --conceptually_related_to--> `Auditoria final 2026-10-11 (bugs e segurança)`  [AMBIGUOUS]
  tcc2026/front/Paciente/configuracoes_paciente.html → README.md
- `crudanamnese.html (Gerenciar Anamnese, dados mockados)` --references--> `verificarPerfil()`  [AMBIGUOUS]
  tcc2026/front/Med/crudanamnese.html → tcc2026/front/JS/auth.js
- `Tarefa: gerar grafo de conhecimento com graphify` --conceptually_related_to--> `README.md (CRUD / HematoAI)`  [INFERRED]
  docs/tarefas/2026-10-19-graphify.md → README.md
- `configuracoes_med.html (Configurações do Médico)` --references--> `verificarPerfil()`  [EXTRACTED]
  tcc2026/front/Med/configuracoes_med.html → tcc2026/front/JS/auth.js
- `crudexame.html (Gerenciar Exames)` --references--> `verificarPerfil()`  [EXTRACTED]
  tcc2026/front/Med/crudexame.html → tcc2026/front/JS/auth.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Fluxo seguro de recuperação de senha** — docs_recuperacao_de_senha_fluxo_tres_telas, docs_recuperacao_de_senha_token_uso_unico, docs_recuperacao_de_senha_nao_revelar_cpf, docs_recuperacao_de_senha_limite_tentativas, docs_recuperacao_de_senha_loginservice [EXTRACTED 1.00]
- **Páginas do paciente que exportam via HematoExport** — tcc2026_front_paciente_historicopaciente, tcc2026_front_paciente_resultadosexame, docs_exportacao_criarbotoes, docs_exportacao_exportarfichapdf, tcc2026_front_js_exportar [EXTRACTED 1.00]
- **Pipeline do laudo da análise IA (geração, normalização, PDF)** — tcc2026_backend_analise_celular, docs_analise_ia_analiseiaservice, docs_analise_ia_normalizar_laudo, docs_analise_ia_hemopdf, docs_exportacao_exportarlaudopdf, docs_analise_ia_tabela_analise_ia [INFERRED 0.85]
- **Fluxo de recuperação de senha (CPF -> código -> nova senha)** — tcc2026_front_senha_esqueci_senha, tcc2026_front_senha_confirmar_codigo, tcc2026_front_senha_nova_senha, tcc2026_front_endpoint_esqueci_senha, tcc2026_front_endpoint_validar_codigo, tcc2026_front_endpoint_alterar_senha_recuperacao [EXTRACTED 1.00]
- **Login com seleção de perfil (Médico/Paciente)** — tcc2026_front_login_autenticar, tcc2026_front_storage_perfil_pendente, tcc2026_front_selecionar_perfil_selecionarperfil, tcc2026_front_endpoint_auth, tcc2026_front_endpoint_auth_perfil [EXTRACTED 1.00]
- **Páginas do administrador (api.js + auth.js + navbar.js)** — tcc2026_front_adm_administrador, tcc2026_front_adm_crudconsulta, tcc2026_front_adm_crudmedico, tcc2026_front_adm_crudpaciente, tcc2026_front_adm_configuracoes [INFERRED 0.85]
- **Painel do Médico aggregates consultas, exames e resultados** — tcc2026_front_med_medico_carregardadosdashboard, hematoai_api_consultas, hematoai_api_exames, hematoai_api_resultados_exame [EXTRACTED 1.00]
- **AI report flow: exame -> anamnese -> /analise-ia/gerar -> HTML laudo** — tcc2026_front_med_nova_analise_ia_selecionarexame, tcc2026_front_med_nova_analise_ia_carregaranamnesedoexame, tcc2026_front_med_nova_analise_ia_gerarlaudo, hematoai_api_analise_ia, tcc2026_front_js_texto_ia_parahtml [INFERRED 0.85]
- **Pages guarded by verificarPerfil('Médico')** — tcc2026_front_med_calendario, tcc2026_front_med_configuracoes_med, tcc2026_front_med_crudanaliseia, tcc2026_front_med_crudconsulta_med, tcc2026_front_med_crudexame, tcc2026_front_med_crudresultado, tcc2026_front_med_medico, tcc2026_front_med_nova_analise_ia, tcc2026_front_js_auth_verificarperfil [EXTRACTED 1.00]
- **Relatorios exportados pelo perfil Administrador** — tcc2026_exemplos_exportacao_01_adm_hematoai_medicos_lista_de_medicos, tcc2026_exemplos_exportacao_02_adm_hematoai_pacientes_lista_de_pacientes, tcc2026_exemplos_exportacao_03_adm_hematoai_consultas_lista_de_consultas, tcc2026_exemplos_exportacao_01_adm_hematoai_medicos_perfil_administrador [EXTRACTED 1.00]
- **Exportacoes do historico do paciente** — tcc2026_exemplos_exportacao_10_pac_historico_hematoai_consulta_2_ficha_da_consulta, tcc2026_exemplos_exportacao_10_pac_historico_hematoai_minhas_consultas_minhas_consultas_paciente, tcc2026_exemplos_exportacao_11_pac_historico_hematoai_exame_2_ficha_do_exame, tcc2026_exemplos_exportacao_11_pac_historico_hematoai_meus_exames_meus_exames, tcc2026_exemplos_exportacao_12_pac_hematoai_resultado_exame_22_resultado_de_exame_detalhe, tcc2026_exemplos_exportacao_12_pac_hematoai_resultados_exames_resultados_de_exames_paciente, tcc2026_exemplos_exportacao_10_pac_historico_hematoai_minhas_consultas_perfil_paciente [EXTRACTED 1.00]
- **Fluxo de diagnostico assistido por IA: anamnese, exame, analise IA, laudo** — tcc2026_exemplos_exportacao_07_med_hematoai_anamneses_entidade_anamnese, tcc2026_exemplos_exportacao_05_med_hematoai_exames_entidade_exame, tcc2026_exemplos_exportacao_08_med_hematoai_analises_ia_entidade_analise_ia, tcc2026_exemplos_exportacao_08_med_hematoai_laudo_analise_ia_1_entidade_laudo, tcc2026_exemplos_exportacao_08_med_hematoai_laudo_analise_ia_1_laudo_analise_ia, tcc2026_exemplos_exportacao_13_nova_analise_ia_laudo_backend_laudo_backend_nova_analise_ia [INFERRED 0.85]

## Communities (78 total, 21 thin omitted)

### Community 0 - "Triagem IA e Exportação (docs)"
Cohesion: 0.08
Nodes (56): Triagem morfológica por IA (doc), Classificação LMA/LLA/LMC/LLC/Normal/Indeterminado, Saída INDETERMINADO, Validação com conjunto rotulado por hematopatologista, Exportação de listagens e fichas (doc), HematoExport.criarBotoes, HematoExport.exportarFichaPDF, Limitação: fonte Helvetica Windows-1252 no PDF (+48 more)

### Community 1 - "Backend Python de Laudo"
Cohesion: 0.06
Nodes (15): AnaliseIAService.js (lê SUSPEITA_PRINCIPAL/NÍVEL_CONFIANÇA), Dependências Python (openai, python-dotenv, reportlab), hemoPDF.py (PDF do laudo via reportlab), normalizar_laudo.py / analiseIA.js (remoção de percentual), Tabela analise_ia (suspeita_ia, classificacao_ia, confianca), AnaliseIADAO.findByCrm (GET /analise-ia), Dois PDFs de laudo da IA (hemoPDF.py vs exportarLaudoPDF), HematoExport.exportarLaudoPDF (laudo clínico) (+7 more)

### Community 2 - "Autenticação e Recuperação (front)"
Cohesion: 0.08
Nodes (45): HematoAI.showToast (erro redirecionado ao pop-up), POST /auth/alterar-senha-recuperacao, POST /auth (login), POST /auth/perfil (escolha de perfil), POST /auth/esqueci-senha, POST /auth/validar-codigo, abrir(), ajustarCabecalho() (+37 more)

### Community 3 - "Endereços CRUD"
Cohesion: 0.06
Nodes (28): express, Enderecos, EnderecosService, { response, request }, create(), delete(), Enderecos, findAll() (+20 more)

### Community 4 - "Dependências npm da API"
Cohesion: 0.08
Nodes (38): bcrypt, cors, csv-parse, dotenv, fast-xml-parser, md5, multer, mysql2 (+30 more)

### Community 5 - "Relatórios PDF Adm"
Cohesion: 0.19
Nodes (39): Medico (entity), Status do medico: Ativo / Desativado, Filtros aplicados / Ordenacao header, HematoAI PDF List Export Layout, Lista de Medicos (PDF adm), Perfil Administrador (adm), Paciente (entity), Lista de Pacientes (PDF adm) (+31 more)

### Community 6 - "Endpoints Clínicos do Médico"
Cohesion: 0.06
Nodes (33): API /analise-ia (GET, DELETE /:id, POST /gerar), API /anamnese (GET, POST, PUT /:id, GET /consulta/:id), API /consultas (GET, PUT /:id), API /exames (GET, POST, PUT, DELETE), API /imagens-exame (exame/:id, :id/arquivo), API /resultados-exame (GET, POST, PUT, DELETE), carregarConsultas() [calendario], carregar() [crudanaliseia] (+25 more)

### Community 7 - "Configurações do Admin"
Cohesion: 0.09
Nodes (24): configuracoes.html (Configurações do Admin), aplicarTemaConfig(), atualizarBotoesTema(), cancelarAlteracao(), carregarUsuario(), salvarCredenciais(), validarCredenciais(), PUT /login/alterar-credenciais (+16 more)

### Community 8 - "Sessão e auth.js"
Cohesion: 0.13
Nodes (23): API /medicos/meus-dados (GET, PUT), apiFetch(), getToken(), getUsuario(), limparSessao(), logout(), verificarLogin(), verificarPerfil() (+15 more)

### Community 9 - "Resultados de Exame DAO"
Cohesion: 0.09
Nodes (5): constructor(), ErrorResponse, ExamesDAO, ResultadosExame, ResultadosExameDAO

### Community 10 - "Tela Gerenciar Pacientes"
Cohesion: 0.15
Nodes (20): carregarPacientes(), crudpaciente.html (Gerenciar Pacientes), applyFilter(), atualizarEndereco(), atualizarLogin(), atualizarPaciente(), atualizarPacienteCompleto(), cadastrarEndereco() (+12 more)

### Community 11 - "App Express e Banco"
Cohesion: 0.10
Nodes (20): app, banco, cors, express, { middlewareErros, middlewareRotaInexistente }, mysql, origensPermitidas, path (+12 more)

### Community 12 - "Serviço de Análise IA"
Cohesion: 0.13
Nodes (18): AnaliseIA, AnaliseIADAO, Anamnese, AnamneseDAO, caminhoRelativoSeguro(), constructor(), ErrorResponse, ExamesDAO (+10 more)

### Community 13 - "Serviço de Login"
Cohesion: 0.15
Nodes (19): buscarEmailPorCpf(), codigosRecuperacao, compararSeguro(), constructor(), criarSelecaoPerfil(), crypto, EmailService, ErrorResponse (+11 more)

### Community 14 - "Testes de Auditoria Final"
Cohesion: 0.10
Nodes (13): assert, ConsultasMiddleware, { crmValidoParaCadastro, crmValidoParaVinculo, normalizarCrm }, crypto, ExamesMiddleware, ExamesService, {
    extrairDiagnostico,
    apresentarAnalise,
    normalizarTextoIA
}, { gerarHash, verificarSenha, ehHashLegado } (+5 more)

### Community 15 - "Exames e Resultados Middleware"
Cohesion: 0.18
Nodes (13): ErrorResponse, { parseDataLocal }, ErrorResponse, { parseDataLocal }, constructor(), ConsultasDAO, ErrorResponse, Exames (+5 more)

### Community 16 - "Tela Gerenciar Médicos"
Cohesion: 0.17
Nodes (12): carregarMedicos(), crudmedico.html (Gerenciar Médicos), applyFilter(), carregarMedicos(), cpfValido(), nextStep(), prevStep(), renderTable() (+4 more)

### Community 17 - "Controle e Utils de Análise IA"
Cohesion: 0.20
Nodes (14): AnaliseIAService, { apresentarAnalise }, constructor(), extrairRelatorioClinico(), apresentarAnalise(), classificacaoIA(), COLUNA_PARA_NIVEL, ErrorResponse (+6 more)

### Community 18 - "Rotas de Análise IA"
Cohesion: 0.14
Nodes (14): ErrorResponse, AnaliseIAControl, AnaliseIAMiddleware, crypto, ErrorResponse, extensoesPermitidas, fs, JwtMiddleware (+6 more)

### Community 19 - "Tela Gerenciar Consultas"
Cohesion: 0.19
Nodes (13): verConsultas(), crudconsulta.html (Gerenciar Consultas), abrirCalendario(), abrirDetalhes(), aplicarFiltros(), carregarConsultas(), confirmarExclusao(), formatarCPF() (+5 more)

### Community 20 - "Testes de Separador e Etapas"
Cohesion: 0.14
Nodes (11): assert, completo, { enderecoCompleto }, FRONT, fs, { paraHtml }, path, { test } (+3 more)

### Community 21 - "Testes de Permissão e PDF"
Cohesion: 0.14
Nodes (9): assert, BACKEND, FRONT, fs, path, { spawnSync }, { test }, { tratarErro, ErroDoNavegador } (+1 more)

### Community 22 - "package.json Dependências"
Cohesion: 0.14
Nodes (14): dependencies, bcrypt, cors, csv-parse, dotenv, express, fast-xml-parser, jsonwebtoken (+6 more)

### Community 23 - "Imagens de Exame Serviço"
Cohesion: 0.18
Nodes (9): constructor(), ErrorResponse, ExamesDAO, fs, ImagensExame, ImagensExameDAO, pastaUploads, path (+1 more)

### Community 24 - "Validação CPF e CRM"
Cohesion: 0.24
Nodes (7): ErrorResponse, { normalizarCrm, crmValidoParaVinculo, MSG_CRM_INVALIDO }, ErrorResponse, {
    normalizarCrm,
    crmValidoParaCadastro,
    MSG_CRM_INVALIDO
}, crmValidoParaCadastro(), crmValidoParaVinculo(), normalizarCrm()

### Community 25 - "Painel e Histórico do Paciente"
Cohesion: 0.19
Nodes (8): carregarConsultas() (histórico), carregarExames() (histórico), carregarConsultas() (painel), carregarDashboard(), carregarExames() (painel), carregarExames() (resultados), GET http://localhost:3000/consultas, GET http://localhost:3000/exames

### Community 26 - "Tratamento de Erros"
Cohesion: 0.20
Nodes (10): ErrorResponse(status, mensagem) e next(erro), BANCO_ACESSO_NEGADO, BANCO_ESTRUTURA, BANCO_FORA_DO_AR, ErrorResponse, middlewareErros(), middlewareRotaInexistente(), resposta() (+2 more)

### Community 28 - "Testes de Recuperação de Senha"
Cohesion: 0.20
Nodes (6): assert, codigosEnviados, criarCenario(), EmailService, LoginControl, { test }

### Community 29 - "Anamnese Rotas e Controle"
Cohesion: 0.18
Nodes (6): AnamneseService, ErrorResponse, AnamneseControl, AnamneseMiddleware, JwtMiddleware, RoleMiddleware

### Community 30 - "Pacientes Rotas e Controle"
Cohesion: 0.20
Nodes (7): constructor(), PacientesService, ErrorResponse, JwtMiddleware, PacientesControl, PacientesMiddleware, RoleMiddleware

### Community 31 - "Anamnese Serviço e DAO"
Cohesion: 0.25
Nodes (7): Anamnese, AnamneseDAO, constructor(), ConsultasDAO, ErrorResponse, MedicosDAO, PacientesDAO

### Community 33 - "Login Rotas e Permissões"
Cohesion: 0.20
Nodes (6): ErrorResponse, ErrorResponse, JwtMiddleware, LoginControl, LoginMiddleware, RoleMiddleware

### Community 34 - "Docs Banco e Recuperação"
Cohesion: 0.24
Nodes (7): Conexão com o banco de dados (doc), Recuperação de senha (doc), Fluxo esqueci-senha → validar-codigo → alterar-senha-recuperacao, LoginService.js / RotasLogin.js, Tarefa: gerar grafo de conhecimento com graphify, Tratamento de erros (doc), README.md (CRUD / HematoAI)

### Community 35 - "Imagens de Exame Rotas"
Cohesion: 0.20
Nodes (6): ImagensExameService, ErrorResponse, ImagensExameControl, ImagensExameMiddleware, JwtMiddleware, RoleMiddleware

### Community 40 - "Serviço de Médicos"
Cohesion: 0.29
Nodes (9): constructor(), EnderecosDAO, ErrorResponse, executarMetodo(), executarTransacao(), { gerarHash, verificarSenha }, LoginDAO, Medicos (+1 more)

### Community 41 - "Testes de Tratamento de Erros"
Cohesion: 0.20
Nodes (7): assert, casos, env, ErrorResponse, PROIBIDO_NA_RESPOSTA, { test }, { traduzirErro }

### Community 42 - "Médicos Rotas e Controle"
Cohesion: 0.25
Nodes (7): constructor(), MedicosService, MeuTokenJWT, JwtMiddleware, MedicosControl, MedicosMiddleware, RoleMiddleware

### Community 44 - "Token JWT"
Cohesion: 0.25
Nodes (3): jsonwebtoken, crypto, jwt

### Community 45 - "Consultas Rotas e Controle"
Cohesion: 0.25
Nodes (5): ConsultasService, ConsultasControl, ConsultasMiddleware, JwtMiddleware, RoleMiddleware

### Community 46 - "Exames Rotas e Controle"
Cohesion: 0.29
Nodes (6): constructor(), ExamesService, ExamesControl, ExamesMiddleware, JwtMiddleware, RoleMiddleware

### Community 47 - "Resultados Rotas e Controle"
Cohesion: 0.29
Nodes (6): constructor(), ResultadosExameService, JwtMiddleware, ResultadosExameControl, ResultadosExameMiddleware, RoleMiddleware

### Community 51 - "Serviço de Pacientes"
Cohesion: 0.36
Nodes (7): constructor(), EnderecosDAO, ErrorResponse, { gerarHash, verificarSenha }, LoginDAO, Pacientes, PacientesDAO

### Community 52 - "Painel do Administrador"
Cohesion: 0.39
Nodes (8): administrador.html (Painel do Administrador), atualizarIndicadores(), atualizarStatusConsultas(), carregarDadosDashboard(), gerenciarMedicos(), gerenciarPacientes(), preencherMedicosRecentes(), preencherPacientesRecentes()

### Community 53 - "Decisões de Segurança"
Cohesion: 0.29
Nodes (4): Códigos e tokens em memória no processo da API, JwtMiddleware (sessão expirada x inválida, MeuTokenJWT.motivoFalha), Importação de cadastros pelo administrador (doc), POST /admin/importar/medicos e /admin/importar/pacientes

### Community 54 - "Envio de E-mail"
Cohesion: 0.29
Nodes (3): nodemailer, nodemailer, path

### Community 57 - "Serviço de Consultas"
Cohesion: 0.43
Nodes (6): constructor(), Consultas, ConsultasDAO, ErrorResponse, MedicosDAO, PacientesDAO

### Community 58 - "Hash de Senha"
Cohesion: 0.48
Nodes (6): crypto, derivar(), ehHashLegado(), gerarHash(), md5(), verificarSenha()

### Community 59 - "Cadastro em Etapas com Rollback"
Cohesion: 0.52
Nodes (6): finalizeCadastro(), montarBodyEndereco(), rollbackCadastro(), rollbackCadastro(), /enderecos (REST), /login (REST, credenciais de usuário)

### Community 60 - "Cliente api.js"
Cohesion: 0.48
Nodes (5): del(), get(), getHeaders(), post(), put()

### Community 61 - "Esquema e Códigos de Erro"
Cohesion: 0.40
Nodes (5): api/database/banco.sql (esquema tccof), CASOS_CONHECIDOS em erro-popup.js, Códigos estáveis (BANCO_INDISPONIVEL, BANCO_ACESSO_NEGADO, REGISTRO_DUPLICADO…), Coluna login.statusu (Ativo/Desativado), Histórico de Alterações

### Community 63 - "Controle de Login"
Cohesion: 0.60
Nodes (4): constructor(), criarSessao(), LoginService, MeuTokenJWT

### Community 64 - "Middleware JWT"
Cohesion: 0.50
Nodes (4): constructor(), ErrorResponse, LoginDAO, MeuTokenJWT

### Community 65 - "Busca de CEP"
Cohesion: 0.50
Nodes (5): buscarCEP(), debounceBuscarCEP(), buscarCEP(), debounceBuscarCEP(), ViaCEP API (viacep.com.br)

### Community 66 - "Conexão MySQL"
Cohesion: 0.83
Nodes (4): caching_sha2_password (MySQL 8), Pool MySQL único (mysql2) em app.js, Variáveis DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME (.env), Migração do driver mysql para mysql2

### Community 68 - "Formatação de Texto IA"
Cohesion: 0.67
Nodes (3): escapar(), paraHtml(), abrirDetalhes(id) [crudanaliseia]

### Community 69 - "Credenciais do Paciente"
Cohesion: 0.67
Nodes (4): carregarDadosPaciente(), GET/PUT /pacientes/meus-dados, salvarCredenciais(), validarCredenciais() (não ligada a nenhum evento)

### Community 70 - "Listas do Histórico"
Cohesion: 0.50
Nodes (3): renderLista(), setView() (aba consultas/exames), renderizarLista()

## Ambiguous Edges - Review These
- `verificarPerfil()` → `crudanamnese.html (Gerenciar Anamnese, dados mockados)`  [AMBIGUOUS]
  tcc2026/front/Med/crudanamnese.html · relation: references
- `navbar.js` → `medico.html (Painel do Médico)`  [AMBIGUOUS]
  tcc2026/front/Med/medico.html · relation: references
- `Auditoria final 2026-10-11 (bugs e segurança)` → `validarCredenciais() (não ligada a nenhum evento)`  [AMBIGUOUS]
  tcc2026/front/Paciente/configuracoes_paciente.html · relation: conceptually_related_to
- `localStorage 'cpfRecuperacao'` → `sessionStorage 'cpf_recuperacao'`  [AMBIGUOUS]
  tcc2026/front/Senha/esqueci_senha.html · relation: conceptually_related_to

## Knowledge Gaps
- **50 isolated node(s):** `bcrypt`, `dotenv`, `md5`, `HematoAI.showToast (erro redirecionado ao pop-up)`, `Validação com conjunto rotulado por hematopatologista` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 483 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `README.md (CRUD / HematoAI)` connect `Docs Banco e Recuperação` to `Triagem IA e Exportação (docs)`, `Tratamento de Erros`, `Autenticação e Recuperação (front)`, `Esquema e Códigos de Erro`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **What connects `bcrypt`, `dotenv`, `md5` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Triagem IA e Exportação (docs)` be split into smaller, more focused modules?**
  _Cohesion score 0.07595628415300547 - nodes in this community are weakly interconnected._
- **Why does `crudpaciente.html (Gerenciar Pacientes)` connect `Tela Gerenciar Pacientes` to `Triagem IA e Exportação (docs)`, `Busca de CEP`, `Autenticação e Recuperação (front)`, `Configurações do Admin`, `Sessão e auth.js`, `Tela Gerenciar Médicos`, `Tela Gerenciar Consultas`, `Painel do Administrador`, `Testes de Separador e Etapas`, `Cadastro em Etapas com Rollback`, `Cliente api.js`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `Backend Python de Laudo` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `verificarPerfil()` and `crudanamnese.html (Gerenciar Anamnese, dados mockados)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `navbar.js` and `medico.html (Painel do Médico)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
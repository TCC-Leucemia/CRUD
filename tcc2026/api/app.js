const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const raizProjeto = path.join(__dirname, "..");
require("dotenv").config({ path: path.join(raizProjeto, ".env") });

const cors = require('cors');
const { middlewareErros, middlewareRotaInexistente } = require('./utils/tratamentoErros');

const rotas_enderecos = require("./routes/RotasEnderecos")
const rotas_login = require("./routes/RotasLogin");
const rotas_pacientes = require("./routes/RotasPacientes")
const rotas_medicos = require("./routes/RotasMedicos")
const rotas_consultas = require("./routes/RotasConsultas")
const rotas_exames = require("./routes/RotasExames");
const rotas_resultados_exame = require("./routes/RotasResultadosExame");
const rotas_analise_ia = require("./routes/RotasAnaliseIA");
const rotasImagensExame = require("./routes/RotasImagensExame")
const rotasAnamnese = require("./routes/RotasAnamnese");
const rotasImportacaoAdmin = require("./routes/RotasImportacaoAdmin");

const app = express();

// CORS: o front é servido por este mesmo servidor (mesma origem). Só as
// origens locais do projeto, ou as listadas em CORS_ORIGINS (separadas por
// vírgula), podem chamar a API de outro endereço.
const origensPermitidas = (process.env.CORS_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origem, cb) => cb(null, !origem || origensPermitidas.includes(origem))
}));

app.use(express.json());

// No Express 5, requisição sem corpo JSON chega com req.body undefined, e
// qualquer `req.body.campo` viraria erro 500. Com um objeto vazio, a
// validação de cada rota responde "campo obrigatório" (400) normalmente.
app.use((req, _res, next) => {
    if (req.body === undefined) req.body = {};
    next();
});

app.use(express.static(path.join(raizProjeto, 'front'), {
    extensions: ['html']
}));

app.get('/', (request, response) => {
    response.sendFile(path.join(raizProjeto, 'front', 'telaInicial.html'));
});


const porta = 3000;

const host = "http://localhost:" + porta;

// Configuração via variáveis de ambiente (tcc2026/.env, ver .env.example):
// evita usuário/senha hardcoded e permite trocar de host/usuário sem mexer
// no código. DB_NAME cai para o banco atual do projeto se não for definido.
if (!process.env.DB_USER) {
    console.error(
        "DB_USER não definido. Crie tcc2026/.env a partir de tcc2026/.env.example " +
        "e preencha DB_USER/DB_PASSWORD com o usuário do MySQL local."
    );
    process.exit(1);
}

const banco = mysql.createPool({
    connectionLimit: 128,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'tccof'
})

rotas_login(app, banco);
rotas_enderecos(app, banco);
rotas_pacientes(app, banco);
rotas_medicos(app, banco);
rotas_consultas(app, banco);
rotas_exames(app, banco);
rotas_resultados_exame(app, banco);
rotas_analise_ia(app, banco);
rotasImagensExame(app, banco);
rotasAnamnese(app, banco);
rotasImportacaoAdmin(app, banco);

// Qualquer caminho que nenhuma rota nem arquivo estático atendeu.
app.use(middlewareRotaInexistente);

// Tradução de erros (banco, corpo da requisição, upload, regras de negócio):
// mensagem precisa para o usuário, detalhe técnico só no terminal.
// Ver api/utils/tratamentoErros.js.
app.use(middlewareErros);


app.listen(porta, () => {

    console.log("Servidor rodando: " + porta);
    console.log(">> " + host);

    setInterval(() => {
        console.log("Servidor vivo...");
    }, 10000);

});

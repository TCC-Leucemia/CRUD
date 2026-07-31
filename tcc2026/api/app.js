const express = require('express');
const mysql = require('mysql');
const path = require('path');
const raizProjeto = path.join(__dirname, "..");
require("dotenv").config({ path: path.join(raizProjeto, ".env") });

const cors = require('cors');

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

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(raizProjeto, 'front'), {
    extensions: ['html']
}));

app.get('/', (request, response) => {
    response.sendFile(path.join(raizProjeto, 'front', 'telaInicial.html'));
});


const porta = 3000;

const host = "http://localhost:" + porta;

const banco = mysql.createPool({
    connectionLimit: 128,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tccof'

})

rotas_login(app, banco);
rotas_enderecos(app, banco);
rotas_pacientes(app, banco);
rotas_medicos(app, banco);
console.log("ROTAS MÉDICOS REGISTRADAS");
rotas_consultas(app, banco);
rotas_exames(app, banco);
rotas_resultados_exame(app, banco);
rotas_analise_ia(app, banco);
rotasImagensExame(app, banco);
rotasAnamnese(app, banco);

app.use((error, request, response, next) => {
    console.error("ERRO GLOBAL:", error);

    const status = error.statusCode || error.httpCode;

    if (status) {
        return response.status(status).send({
            status: false,
            msg: error.message,
            detalhes: error.details || error.error || {}
        });
    }

    return response.status(500).send({
        status: false,
        msg: "Erro interno do servidor",
        detalhes: {}
    });
});


app.listen(porta, () => {

    console.log("Servidor rodando: " + porta);
    console.log(">> " + host);

    setInterval(() => {
        console.log("Servidor vivo...");
    }, 10000);

});

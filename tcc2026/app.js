const express = require('express');
const mysql = require('mysql');

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
const rotasAdministradores = require("./routes/RotasAdministradores");

const app = express();

app.use(express.json());

app.use(express.static('js'));

app.use('/', express.static(__dirname + '/view'));


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
rotas_consultas(app, banco);
rotas_exames(app, banco);
rotas_resultados_exame(app, banco);
rotas_analise_ia(app, banco);
rotasImagensExame(app, banco);
rotasAnamnese(app, banco);
rotasAdministradores(app, banco);

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


app.listen(porta, function () {

    console.log("Servidor rodando: " + porta);
    console.log(">> " + host);
})
// Regressão do tratamento global de erros (setembro/2026): senha errada do
// banco aparecia como "MySQL desligado, abra o XAMPP"; JSON malformado
// devolvia a mensagem crua do Node; erros de restrição do MySQL viravam 500.
// Rodar com: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");

const { traduzirErro } = require("../utils/tratamentoErros");
const ErrorResponse = require("../utils/ErrorResponse");

const env = { DB_HOST: "127.0.0.1", DB_PORT: "3306", DB_USER: "usuarioApp", DB_PASSWORD: "senhaSecreta!9", DB_NAME: "tccof" };
const erroMysql = (code, sqlMessage = `detalhe técnico de ${code} na tabela login`) =>
    Object.assign(new Error(sqlMessage), { code, sqlMessage });

// Nada disto pode chegar à tela do usuário.
const PROIBIDO_NA_RESPOSTA = [
    env.DB_PASSWORD, env.DB_USER, "DB_PASSWORD", "DB_USER", ".env", "XAMPP",
    "tabela login", "sqlMessage", "SELECT", "C:\\", "at "
];

function assertSemVazamento(resultado) {
    const texto = JSON.stringify(resultado.corpo);
    for (const proibido of PROIBIDO_NA_RESPOSTA) {
        assert.ok(!texto.includes(proibido), `a resposta vazou "${proibido}": ${texto}`);
    }
    // A senha do banco também não pode ir para o terminal.
    assert.ok(!String(resultado.log || "").includes(env.DB_PASSWORD), "o log vazou a senha do banco");
}

const casos = [
    ["MySQL desligado", erroMysql("ECONNREFUSED"), 503, "BANCO_INDISPONIVEL", /não está respondendo/],
    ["MySQL fora do tempo", erroMysql("ETIMEDOUT"), 503, "BANCO_INDISPONIVEL", /não está respondendo/],
    ["usuário/senha do banco recusados", erroMysql("ER_ACCESS_DENIED_ERROR"), 503, "BANCO_ACESSO_NEGADO", /acesso foi recusado/],
    ["banco inexistente", erroMysql("ER_BAD_DB_ERROR"), 503, "BANCO_INEXISTENTE", /não foi encontrado/],
    ["tabela inexistente", erroMysql("ER_NO_SUCH_TABLE"), 500, "BANCO_ESTRUTURA", /Erro interno ao consultar/],
    ["duplicidade", erroMysql("ER_DUP_ENTRY"), 409, "REGISTRO_DUPLICADO", /Já existe um registro/],
    ["exclusão de registro em uso", erroMysql("ER_ROW_IS_REFERENCED_2"), 409, "REGISTRO_EM_USO", /vinculado a outros registros/],
    ["referência inexistente", erroMysql("ER_NO_REFERENCED_ROW_2"), 400, "REFERENCIA_INEXISTENTE", /não existe mais/],
    ["texto longo demais", erroMysql("ER_DATA_TOO_LONG"), 400, "CAMPO_GRANDE_DEMAIS", /excede o tamanho/],
    ["campo obrigatório nulo", erroMysql("ER_BAD_NULL_ERROR"), 400, "VALOR_INVALIDO", /vazios ou com valor inválido/],
    ["JSON malformado", Object.assign(new SyntaxError("Unexpected token } in JSON at position 12"), { type: "entity.parse.failed", status: 400, statusCode: 400 }), 400, "CORPO_INVALIDO", /formato inválido/],
    ["corpo grande demais", Object.assign(new Error("request entity too large"), { type: "entity.too.large", status: 413, statusCode: 413, limit: 102400 }), 413, "CORPO_GRANDE_DEMAIS", /excedem o tamanho/],
    ["erro 4xx de outra biblioteca", Object.assign(new Error("Bad things at C:\\x"), { statusCode: 400 }), 400, "REQUISICAO_INVALIDA", /Revise os dados/],
    ["erro desconhecido", new TypeError("Cannot read properties of undefined (reading 'cpf')"), 500, "ERRO_INTERNO", /Erro interno do servidor/]
];

for (const [nome, erro, status, codigo, mensagem] of casos) {
    test(`${nome} -> ${status} ${codigo}`, () => {
        const r = traduzirErro(erro, { env });

        assert.equal(r.status, status);
        assert.equal(r.corpo.status, false);
        assert.equal(r.corpo.detalhes.codigo, codigo);
        assert.match(r.corpo.msg, mensagem);
        assertSemVazamento(r);
    });
}

test("senha do banco errada e MySQL desligado têm mensagens diferentes", () => {
    const negado = traduzirErro(erroMysql("ER_ACCESS_DENIED_ERROR"), { env });
    const desligado = traduzirErro(erroMysql("ECONNREFUSED"), { env });

    assert.notEqual(negado.corpo.msg, desligado.corpo.msg);
    // Quem roda o servidor recebe a orientação exata, sem o valor da senha.
    assert.match(negado.log, /DB_USER e DB_PASSWORD/);
    assert.match(desligado.log, /127\.0\.0\.1:3306/);
});

test("erro de regra de negócio (ErrorResponse) mantém status e mensagem escritos para o usuário", () => {
    const r = traduzirErro(new ErrorResponse(404, "Paciente não encontrado.", { campo: "cpf" }), { env });

    assert.equal(r.status, 404);
    assert.equal(r.corpo.msg, "Paciente não encontrado.");
    assert.deepEqual(r.corpo.detalhes, { campo: "cpf" });
    assert.equal(r.log, null);
});

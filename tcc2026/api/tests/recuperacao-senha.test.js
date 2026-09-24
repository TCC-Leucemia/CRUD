// Regressão da recuperação de senha (setembro/2026): a troca de senha era
// aceita só com o CPF, sem código; CPF inexistente era revelado; e não havia
// limite de tentativas no código de 6 dígitos.
//
// Exercita o LoginControl real com o mesmo corpo de requisição que o front
// envia, sobre um banco falso em memória e com o envio de e-mail interceptado.
// Rodar com: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");

const EmailService = require("../service/EmailService");
const codigosEnviados = {};
EmailService.prototype.enviarCodigo = async (email, codigo) => {
    codigosEnviados[email] = codigo;
};

const LoginControl = require("../control/LoginControl");

// Cada teste usa um CPF próprio: o estado da recuperação vive no módulo.
function criarCenario(cpf) {
    const conta = {
        id_usuario: Number(cpf.slice(-3)),
        email: `conta-${cpf}@hematoai.test`,
        senha: "hash-antigo-0000000000000000000",
        tipo: "Administrador",
        statusu: "Ativo"
    };

    const banco = {
        query(sql, params, cb) {
            if (/FROM login l/.test(sql)) {
                return cb(null, params[0] === cpf ? [{ id_usuario: conta.id_usuario, email: conta.email, tipo: conta.tipo }] : []);
            }
            if (/SELECT \* FROM login WHERE id_usuario/.test(sql)) {
                return cb(null, [{ ...conta }]);
            }
            if (/^\s*UPDATE login/i.test(sql)) {
                conta.senha = params[1];
                return cb(null, { affectedRows: 1 });
            }
            return cb(null, []);
        }
    };

    return { conta, control: new LoginControl(banco), codigo: () => codigosEnviados[conta.email] };
}

// Executa um handler como o Express faria.
const chamar = (handler, body) => new Promise((resolve) => {
    const res = {
        statusCode: 200,
        status(codigo) { this.statusCode = codigo; return this; },
        send(corpo) { resolve({ status: this.statusCode, corpo }); }
    };
    handler({ body }, res, (erro) => resolve({ status: erro.statusCode || 500, corpo: { msg: erro.message } }));
});

test("troca de senha só com o CPF, sem código, é recusada", async () => {
    const { conta, control } = criarCenario("10000000001");
    const senhaAntes = conta.senha;

    const r = await chamar(control.alterarSenhaRecuperacao, { cpf: "10000000001", novaSenha: "senhaDoInvasor1" });

    assert.equal(r.status, 400);
    assert.equal(conta.senha, senhaAntes);
});

test("esqueci-senha responde igual para CPF cadastrado e não cadastrado", async () => {
    const { control } = criarCenario("10000000002");

    const cadastrado = await chamar(control.buscarCpf, { cpf: "10000000002" });
    const inexistente = await chamar(control.buscarCpf, { cpf: "99999999999" });

    assert.equal(cadastrado.status, 200);
    assert.deepEqual(inexistente, cadastrado);
});

test("código errado, vencido ou nunca pedido tem a mesma mensagem", async () => {
    const { control } = criarCenario("10000000003");
    await chamar(control.buscarCpf, { cpf: "10000000003" });

    const errado = await chamar(control.validarCodigo, { cpf: "10000000003", codigo: "000000" });
    const nuncaPedido = await chamar(control.validarCodigo, { cpf: "88888888888", codigo: "000000" });

    assert.equal(errado.status, 400);
    assert.deepEqual(nuncaPedido, errado);
});

test("após 5 códigos errados, nem o código certo vale mais", async () => {
    const { control, codigo } = criarCenario("10000000004");
    await chamar(control.buscarCpf, { cpf: "10000000004" });
    const certo = codigo();
    const errado = certo === "000000" ? "111111" : "000000";

    for (let i = 0; i < 5; i++) {
        await chamar(control.validarCodigo, { cpf: "10000000004", codigo: errado });
    }
    const r = await chamar(control.validarCodigo, { cpf: "10000000004", codigo: certo });

    assert.equal(r.status, 400);
});

test("código válido gera token de uso único que permite trocar a senha uma vez", async () => {
    const { conta, control, codigo } = criarCenario("10000000005");
    const senhaAntes = conta.senha;
    await chamar(control.buscarCpf, { cpf: "10000000005" });

    const validado = await chamar(control.validarCodigo, { cpf: "10000000005", codigo: codigo() });
    assert.equal(validado.status, 200);
    assert.match(validado.corpo.token, /^[0-9a-f]{64}$/);

    // O código não vale uma segunda vez.
    const codigoDeNovo = await chamar(control.validarCodigo, { cpf: "10000000005", codigo: codigo() });
    assert.equal(codigoDeNovo.status, 400);

    // Senha fora da regra não consome o token.
    const curta = await chamar(control.alterarSenhaRecuperacao, { cpf: "10000000005", token: validado.corpo.token, novaSenha: "123" });
    assert.equal(curta.status, 400);
    assert.equal(conta.senha, senhaAntes);

    const trocada = await chamar(control.alterarSenhaRecuperacao, { cpf: "10000000005", token: validado.corpo.token, novaSenha: "senhaNova123" });
    assert.equal(trocada.status, 200);
    assert.notEqual(conta.senha, senhaAntes);

    const reuso = await chamar(control.alterarSenhaRecuperacao, { cpf: "10000000005", token: validado.corpo.token, novaSenha: "outraSenha456" });
    assert.equal(reuso.status, 400);
});

test("token de outro CPF não troca a senha", async () => {
    const vitima = criarCenario("10000000006");
    const atacante = criarCenario("10000000007");
    await chamar(atacante.control.buscarCpf, { cpf: "10000000007" });
    const { corpo } = await chamar(atacante.control.validarCodigo, { cpf: "10000000007", codigo: atacante.codigo() });
    const senhaAntes = vitima.conta.senha;

    const r = await chamar(vitima.control.alterarSenhaRecuperacao, { cpf: "10000000006", token: corpo.token, novaSenha: "senhaDoInvasor1" });

    assert.equal(r.status, 400);
    assert.equal(vitima.conta.senha, senhaAntes);
});

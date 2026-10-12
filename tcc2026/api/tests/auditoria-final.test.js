// Regressão da auditoria final (outubro/2026). Cada bloco cobre um problema
// confirmado no código e corrigido. Bancos falsos em memória; nenhuma chamada
// à OpenAI. Rodar com: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

const { gerarHash, verificarSenha, ehHashLegado } = require("../utils/senha");
const { crmValidoParaCadastro, crmValidoParaVinculo, normalizarCrm } = require("../utils/crm");
const {
    extrairDiagnostico,
    apresentarAnalise,
    normalizarTextoIA
} = require("../utils/analiseIA");
const { parseDataLocal } = require("../utils/datas");

const md5 = (v) => crypto.createHash("md5").update(v).digest("hex");

// ---------------------------------------------------------------- senhas
test("senha nova usa scrypt com salt: dois hashes da mesma senha são diferentes", async () => {
    const a = await gerarHash("SenhaFicticia1");
    const b = await gerarHash("SenhaFicticia1");
    assert.match(a, /^scrypt\$/);
    assert.notEqual(a, b);
    assert.equal((await verificarSenha("SenhaFicticia1", a)).valida, true);
    assert.equal((await verificarSenha("OutraSenha123", a)).valida, false);
});

test("hash MD5 antigo continua entrando e pede atualização", async () => {
    const antigo = md5("123456");
    assert.equal(ehHashLegado(antigo), true);
    assert.deepEqual(await verificarSenha("123456", antigo), { valida: true, precisaAtualizar: true });
    assert.equal((await verificarSenha("errada", antigo)).valida, false);
    assert.equal((await verificarSenha("123456", "lixo$sem$formato")).valida, false);
});

// ------------------------------------------------- login: hash e acesso
const LoginControl = require("../control/LoginControl");

function bancoLogin(contas) {
    const atualizacoes = [];
    return {
        atualizacoes,
        query(sql, params, cb) {
            if (/WHERE l\.email = \?\s+AND l\.tipo = 'Administrador'/.test(sql)) {
                return cb(null, contas.filter(c => c.email === params[0] && c.tipo === "Administrador"));
            }
            if (/INNER JOIN medicos m\s+ON m\.id_usuario = l\.id_usuario\s+WHERE l\.email/.test(sql)) {
                return cb(null, contas.filter(c => c.email === params[0] && c.tipo === "Médico"));
            }
            if (/INNER JOIN pacientes p\s+ON p\.id_usuario = l\.id_usuario\s+WHERE l\.email/.test(sql)) {
                return cb(null, contas.filter(c => c.email === params[0] && c.tipo === "Paciente"));
            }
            if (/SELECT \* FROM login WHERE id_usuario/.test(sql)) {
                return cb(null, contas.filter(c => String(c.id_usuario) === String(params[0])));
            }
            if (/WHERE l\.id_usuario = \?/.test(sql)) {
                return cb(null, contas.filter(c => String(c.id_usuario) === String(params[0])));
            }
            if (/UPDATE login SET senha = \? WHERE id_usuario = \?/.test(sql)) {
                atualizacoes.push({ id: params[1], senha: params[0] });
                const conta = contas.find(c => c.id_usuario === params[1]);
                if (conta) conta.senha = params[0];
                return cb(null, { affectedRows: 1 });
            }
            return cb(null, []);
        }
    };
}

const chamar = (handler, req) => new Promise((resolve) => {
    const res = {
        statusCode: 200,
        status(codigo) { this.statusCode = codigo; return this; },
        send(corpo) { resolve({ status: this.statusCode, corpo }); }
    };
    handler(req, res, (erro) => resolve({ status: erro.statusCode || 500, corpo: { msg: erro.message } }));
});

test("login com senha em MD5 funciona e regrava a senha em scrypt", async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo-ficticio-de-teste";
    const contas = [{ id_usuario: 7, email: "adm@hematoai.test", senha: md5("SenhaFicticia1"), tipo: "Administrador", statusu: "Ativo" }];
    const banco = bancoLogin(contas);
    const control = new LoginControl(banco);

    const r = await chamar(control.login, { body: { email: "adm@hematoai.test", senha: "SenhaFicticia1" } });

    assert.equal(r.status, 200);
    assert.ok(r.corpo.token);
    assert.equal(banco.atualizacoes.length, 1);
    assert.match(banco.atualizacoes[0].senha, /^scrypt\$/);

    // Depois da migração, a mesma senha continua entrando.
    const r2 = await chamar(control.login, { body: { email: "adm@hematoai.test", senha: "SenhaFicticia1" } });
    assert.equal(r2.status, 200);
});

test("as rotas de login não devolvem o hash da senha", async () => {
    const contas = [{ id_usuario: 3, email: "adm@hematoai.test", senha: md5("x"), tipo: "Administrador", statusu: "Ativo" }];
    const control = new LoginControl(bancoLogin(contas));

    const r = await chamar(control.show, { params: { id: 3 }, user: { id_usuario: 3, role: "Administrador" } });

    assert.equal(r.status, 200);
    assert.equal("senha" in r.corpo.dados, false);
});

test("paciente não consegue ler o login de outro usuário (GET /login/:id)", async () => {
    const contas = [
        { id_usuario: 3, email: "adm@hematoai.test", senha: md5("x"), tipo: "Administrador", statusu: "Ativo" },
        { id_usuario: 9, email: "pac@hematoai.test", senha: md5("y"), tipo: "Paciente", statusu: "Ativo" }
    ];
    const control = new LoginControl(bancoLogin(contas));

    const r = await chamar(control.show, { params: { id: 3 }, user: { id_usuario: 9, role: "Paciente" } });

    assert.equal(r.status, 403);
});

// -------------------------------------------------------------------- CRM
test("CRM: uma regra só para cadastro, consultas e configurações", () => {
    assert.equal(crmValidoParaCadastro("12345-SP"), true);
    assert.equal(crmValidoParaCadastro("123456-sp"), true);
    assert.equal(normalizarCrm(" 123456-sp "), "123456-SP");
    assert.equal(crmValidoParaCadastro("123456789-SP"), false, "não cabe na coluna de 11 caracteres");
    assert.equal(crmValidoParaCadastro("123456"), false);
    assert.equal(crmValidoParaVinculo("123456-SP"), true);
    assert.equal(crmValidoParaVinculo("123456"), true, "CRMs antigos só com dígitos");
    assert.equal(crmValidoParaVinculo("12-SP"), false);
});

const ConsultasMiddleware = require("../middleware/ConsultasMiddleware");
const MedicosMiddleware = require("../middleware/MedicosMiddleware");

const executarMiddleware = (fn, body) => {
    const req = { body: { ...body } };
    try {
        let chamado = false;
        fn(req, {}, () => { chamado = true; });
        return { ok: chamado, req };
    } catch (erro) {
        return { ok: false, erro };
    }
};

test("nova consulta aceita médico com CRM no formato 12345-SP", () => {
    const amanha = new Date(Date.now() + 24 * 3600 * 1000);
    const data = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, "0")}-${String(amanha.getDate()).padStart(2, "0")}T10:00`;
    const r = executarMiddleware(new ConsultasMiddleware().validateBody, {
        cpf: "52998224725", crm: "123456-SP", data_consulta: data, statusc: "Pendente"
    });
    assert.equal(r.ok, true, r.erro && r.erro.message);
});

test("configurações do médico não recusam mais o CRM 12345-SP e ignoram campos somente leitura", () => {
    const r = executarMiddleware(new MedicosMiddleware().validateSelfUpdate, {
        nome: "Medica Ficticia", crm: "12345-SP", especialidade: "Hematologia",
        email: "MEDICA@HEMATOAI.TEST", telefone: "(12) 99999-0000", senha: "", senhaAtual: ""
    });
    assert.equal(r.ok, true, r.erro && r.erro.message);
    assert.deepEqual(r.req.body, { email: "medica@hematoai.test", senha: "", senhaAtual: "" });
});

// ------------------------------------------------------------------ IA
const laudo = (principal, nivel, extra = "") => `SUSPEITA_PRINCIPAL: ${principal}
NÍVEL_CONFIANÇA: ${nivel}

======================================================================
SUSPEITA DIAGNÓSTICA: ${extra}
GRAU DE CERTEZA: Alto (85-95%)
----------------------------------------------------------------------`;

test("nível de confiança é só categoria: nada de 85/60/0", () => {
    const d = extrairDiagnostico(laudo("LMA", "ALTO", "Leucemia Mieloide Aguda (LMA)"));
    assert.equal(d.suspeita_ia, "Alta");
    assert.equal(d.tipo_leucemia_ia, "LMA");
    assert.equal(d.confianca, null);
});

test("INDETERMINADO não vira 'Sem suspeita' e mantém o nível", () => {
    const texto = laudo("INDETERMINADO", "BAIXO", "Indeterminado");
    const d = extrairDiagnostico(texto);
    assert.equal(d.suspeita_ia, "Baixa");
    const vista = apresentarAnalise({ ...d, resultado_ia: texto });
    assert.equal(vista.nivel_confianca, "Baixo");
    assert.equal(vista.classificacao_ia, "Indeterminado");
});

test("NORMAL aparece como 'Sem evidência de leucemia'", () => {
    const texto = laudo("NORMAL", "MODERADO", "Sem evidência morfológica de leucemia (Normal)");
    const vista = apresentarAnalise({ ...extrairDiagnostico(texto), resultado_ia: texto });
    assert.equal(vista.classificacao_ia, "Sem evidência de leucemia");
    assert.equal(vista.nivel_confianca, "Moderado");
});

test("registro antigo ('Sem suspeita' + 85) é mostrado como categoria, sem percentual", () => {
    const vista = apresentarAnalise({
        suspeita_ia: "Sem suspeita", tipo_leucemia_ia: "Não identificado", confianca: 85,
        resultado_ia: "SUSPEITA DIAGNÓSTICA: Indeterminado"
    });
    assert.equal(vista.nivel_confianca, "Alto");
    assert.equal(vista.classificacao_ia, "Indeterminado");
    assert.equal("confianca" in vista, false);
});

test("texto da IA: sem percentual no grau de certeza e separadores com largura fixa", () => {
    const t = normalizarTextoIA("=".repeat(70) + "\nGRAU DE CERTEZA: Alto (85-95%)\n" + "-".repeat(66) + "\nCélulas <5% do campo");
    const linhas = t.split("\n");
    assert.equal(linhas[0], "=".repeat(48));
    assert.equal(linhas[1], "GRAU DE CERTEZA: Alto");
    assert.equal(linhas[2], "-".repeat(48));
    assert.equal(linhas[3], "Células <5% do campo", "fora da linha do grau, o texto não muda");
});

// ---------------------------------------------------------------- datas
const ResultadosExameMiddleware = require("../middleware/ResultadosExameMiddleware");

const dataISO = (deslocDias) => {
    const d = new Date();
    d.setDate(d.getDate() + deslocDias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test("data 'AAAA-MM-DD' é lida no fuso local", () => {
    const d = parseDataLocal("2026-10-12");
    assert.equal(d.getDate(), 12);
    assert.equal(d.getHours(), 0);
});

test("resultado com data de amanhã é recusado; hoje é aceito", () => {
    const mw = new ResultadosExameMiddleware();
    const corpo = (data) => ({
        id_exame: 1, resultado_texto: "Texto fictício do resultado.", suspeita_leucemia: "Baixa",
        tipo_leucemia: "LLA", data_resultado: data
    });
    assert.equal(executarMiddleware(mw.validateBody, corpo(dataISO(1))).ok, false);
    assert.equal(executarMiddleware(mw.validateBody, corpo(dataISO(0))).ok, true);
});

const ExamesMiddleware = require("../middleware/ExamesMiddleware");
const ExamesService = require("../service/ExamesService");

test("editar exame antigo sem mudar a data não é recusado; data nova no passado é", async () => {
    const dataAntiga = new Date(2026, 0, 10, 9, 30);
    const atualizados = [];
    const banco = {
        query(sql, params, cb) {
            if (/SELECT \* FROM exames WHERE id_exame/.test(sql)) {
                return cb(null, [{ id_exame: 5, id_consulta: 2, tipo_exame: "Hemograma", data_exame: dataAntiga, statusc: "Pendente" }]);
            }
            if (/FROM consultas c/.test(sql)) {
                return cb(null, [{ id_consulta: 2, crm: "123456-SP", cpf: "52998224725" }]);
            }
            if (/UPDATE exames/.test(sql)) {
                atualizados.push(params);
                return cb(null, { changedRows: 1 });
            }
            return cb(null, []);
        }
    };

    const corpo = { id_consulta: 2, tipo_exame: "Hemograma", data_exame: "2026-01-10T09:30", statusc: "Finalizado" };
    const mw = executarMiddleware(new ExamesMiddleware().validateBodyEdicao, corpo);
    assert.equal(mw.ok, true, mw.erro && mw.erro.message);

    const service = new ExamesService(banco);
    const medico = { role: "Médico", crm: "123456-SP" };
    await service.update(5, mw.req.body, medico);
    assert.equal(atualizados.length, 1);

    await assert.rejects(
        service.update(5, { ...mw.req.body, data_exame: "2026-01-11T09:30" }, medico),
        /passado/
    );
});

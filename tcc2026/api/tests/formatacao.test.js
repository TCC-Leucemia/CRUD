// Funções que antes eram copiadas em cada tela e agora ficam só em
// front/JS/formatacao.js e front/JS/etapas-cadastro.js (outubro/2026).
// Também garante que nenhuma tela voltou a ter cópia própria delas.
// Rodar com: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const f = require("../../front/JS/formatacao");
const { rollbackCadastro } = require("../../front/JS/etapas-cadastro");

const FRONT = path.join(__dirname, "..", "..", "front");

// Versão que existia em crudpaciente.html antes da unificação, para conferir
// que a reescrita de cpfValido dá o mesmo resultado.
function cpfValidoOriginal(cpf) {
    const numeros = String(cpf).replace(/\D/g, "");
    if (numeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numeros)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(numeros[i]) * (10 - i);
    let digito1 = (soma * 10) % 11;
    if (digito1 === 10) digito1 = 0;
    if (digito1 !== Number(numeros[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(numeros[i]) * (11 - i);
    let digito2 = (soma * 10) % 11;
    if (digito2 === 10) digito2 = 0;
    return digito2 === Number(numeros[10]);
}

test("cpfValido aceita CPF válido com e sem máscara e recusa inválidos", () => {
    assert.equal(f.cpfValido("529.982.247-25"), true);
    assert.equal(f.cpfValido("52998224725"), true);
    assert.equal(f.cpfValido("529.982.247-24"), false);
    assert.equal(f.cpfValido("111.111.111-11"), false);
    assert.equal(f.cpfValido("123"), false);
    assert.equal(f.cpfValido(""), false);
    assert.equal(f.cpfValido(null), false);
    assert.equal(f.cpfValido(52998224725), true);
});

test("cpfValido dá o mesmo resultado da versão antiga em 20 mil CPFs", () => {
    let semente = 7;
    const aleatorio = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let n = 0; n < 20000; n++) {
        const cpf = Array.from({ length: 11 }, () => Math.floor(aleatorio() * 10)).join("");
        assert.equal(f.cpfValido(cpf), cpfValidoOriginal(cpf), cpf);
    }
});

test("máscaras de digitação", () => {
    assert.equal(f.maskCPF("52998224725"), "529.982.247-25");
    assert.equal(f.maskCPF("5299"), "529.9");
    assert.equal(f.maskTelefone("11987654321"), "(11) 98765-4321");
    assert.equal(f.maskTelefone("119"), "(11) 9");
    assert.equal(f.maskCEP("01310100"), "01310-100");
    assert.equal(f.maskCEP("abc0131"), "0131");
});

test("formatarCPF mostra a máscara e traço para vazio", () => {
    assert.equal(f.formatarCPF("52998224725"), "529.982.247-25");
    assert.equal(f.formatarCPF("529.982.247-25"), "529.982.247-25");
    assert.equal(f.formatarCPF(1234567890), "012.345.678-90"); // zero inicial perdido
    assert.equal(f.formatarCPF(null), "—");
    assert.equal(f.formatarCPF(undefined), "—");
    assert.equal(f.formatarCPF(""), "—");
    assert.equal(f.formatarCPF("—"), "—");
});

test("formatarData mostra dd/mm/aaaa e traço para vazio ou inválido", () => {
    assert.equal(f.formatarData("2026-10-19T12:00:00"), "19/10/2026");
    assert.equal(f.formatarData(null), "—");
    assert.equal(f.formatarData(""), "—");
    assert.equal(f.formatarData("não é data"), "—");
});

test("rollbackCadastro apaga só o que foi criado e não propaga erro", async () => {
    const chamadas = [];
    globalThis.del = async (url) => { chamadas.push(url); };
    await rollbackCadastro(7, 9);
    await rollbackCadastro(null, 3);
    await rollbackCadastro(null, null);
    assert.deepEqual(chamadas, ["/login/7", "/enderecos/9", "/enderecos/3"]);

    globalThis.del = async () => { throw new Error("rede"); };
    const erroOriginal = console.error;
    console.error = () => {};
    try {
        await rollbackCadastro(1, 2); // não deve lançar
    } finally {
        console.error = erroOriginal;
        delete globalThis.del;
    }
});

test("nenhuma tela tem cópia própria das funções compartilhadas", () => {
    const nomes = "cpfValido|buscarCEP|debounceBuscarCEP|maskCPF|maskTelefone|maskCEP|formatarCPF|formatarData|rollbackCadastro";
    const definicao = new RegExp(`function\\s+(${nomes})\\s*\\(`);
    const telas = [];
    const varrer = (dir) => {
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
            const caminho = path.join(dir, item.name);
            if (item.isDirectory()) varrer(caminho);
            else if (item.name.endsWith(".html")) telas.push(caminho);
        }
    };
    varrer(FRONT);
    for (const tela of telas) {
        const html = fs.readFileSync(tela, "utf8");
        const achado = html.match(definicao);
        assert.equal(achado, null, `${path.relative(FRONT, tela)} redefine ${achado && achado[1]}`);
        if (/\b(formatarCPF|formatarData|maskCPF|cpfValido|debounceBuscarCEP)\(/.test(html)) {
            assert.match(html, /<script src="\.\.\/JS\/formatacao\.js"><\/script>/,
                `${path.relative(FRONT, tela)} usa funções de formatacao.js sem carregá-lo`);
        }
    }
});

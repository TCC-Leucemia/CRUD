// Regressão de dois problemas vistos nas figuras do manual (outubro/2026):
// 1) linhas "=====" do texto da IA quebravam na tela, deixando "=" sozinho;
// 2) a etapa Endereço do cadastro de médico aparecia com ✓ sem estar preenchida.
// Sem OpenAI: só texto fictício. Rodar com: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const { paraHtml } = require("../../front/JS/texto-ia");
const { enderecoCompleto } = require("../../front/JS/etapas-cadastro");

const FRONT = path.join(__dirname, "..", "..", "front");
const ler = (rel) => fs.readFileSync(path.join(FRONT, rel), "utf8");

// ------------------------------------------------------------- separador IA
const textoNovo = [
    "================================================",
    "LAUDO DE HEMATOLOGIA - ANÁLISE MORFOLÓGICA",
    "================================================",
    "",
    "SUSPEITA DIAGNÓSTICA: Indeterminado",
    "GRAU DE CERTEZA: Baixo",
    "",
    "CONCLUSÃO",
    "------------------------------------------------",
    "Relação blastos/linfócitos = 2 <limite>.",
    "================================================",
    "Análise preliminar gerada por IA. Não é diagnóstico definitivo.",
    "================================================",
].join("\n");

test("separadores viram traço (hr): nenhum '=' ou '-' decorativo sobra como texto", () => {
    const html = paraHtml(textoNovo);
    assert.equal((html.match(/<hr class="ia-separador"/g) || []).length, 5);
    assert.doesNotMatch(html, /={2,}/, "nenhuma sequência de '=' como texto");
    assert.doesNotMatch(html, /-{4,}/, "nenhuma sequência de '-' como texto");
});

test("o texto clínico é preservado e escapado", () => {
    const html = paraHtml(textoNovo);
    for (const trecho of ["SUSPEITA DIAGNÓSTICA: Indeterminado", "GRAU DE CERTEZA: Baixo", "CONCLUSÃO",
        "Análise preliminar gerada por IA. Não é diagnóstico definitivo."]) {
        assert.ok(html.includes(trecho), trecho);
    }
    // "=" dentro do conteúdo não é separador; HTML é escapado.
    assert.ok(html.includes("Relação blastos/linfócitos = 2 &lt;limite&gt;."));
});

test("análise antiga (separadores de 64 e 70 caracteres) também é tratada", () => {
    const antigo = "=".repeat(70) + "\nTEXTO\n" + "-".repeat(64) + "\nMAIS\n" + "━".repeat(30);
    const html = paraHtml(antigo);
    assert.equal((html.match(/<hr /g) || []).length, 3);
    assert.ok(html.includes("TEXTO") && html.includes("MAIS"));
    assert.doesNotMatch(html, /[=━-]{4,}/);
});

test("o traço não deixa linha em branco extra nem quebra a ordem das linhas", () => {
    const html = paraHtml("A\n=====\nB");
    assert.equal(html, 'A<hr class="ia-separador" style="border:0;border-top:1px solid currentColor;opacity:.25;margin:.35em 0">B');
    assert.equal(paraHtml(null), "");
});

test("as duas telas que mostram o texto da IA usam a mesma apresentação", () => {
    const historico = ler("Med/crudanaliseia.html");
    const nova = ler("Med/nova_analise_ia.html");
    for (const pagina of [historico, nova]) {
        assert.match(pagina, /<script src="\.\.\/JS\/texto-ia\.js"><\/script>/);
        assert.match(pagina, /HematoTextoIA\.paraHtml\(/);
    }
    assert.doesNotMatch(nova, /laudoEl\.textContent = data\.laudo/);
});

// ------------------------------------------------------ etapa Endereço ✓
const vazio = { cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "" };
const completo = { cep: "12245-020", rua: "Avenida Paraibuna", numero: "75", bairro: "Centro", cidade: "São José dos Campos", estado: "SP" };

test("endereço vazio não é etapa concluída", () => {
    assert.equal(enderecoCompleto(vazio), false);
    assert.equal(enderecoCompleto(undefined), false);
});

test("endereço parcial não é etapa concluída", () => {
    assert.equal(enderecoCompleto({ ...vazio, cep: "12245-020", rua: "Avenida Paraibuna" }), false);
    assert.equal(enderecoCompleto({ ...completo, numero: "" }), false);
    assert.equal(enderecoCompleto({ ...completo, bairro: "   " }), false, "só espaços não conta");
    assert.equal(enderecoCompleto({ ...completo, cep: "12245" }), false, "CEP incompleto");
});

test("endereço completo é etapa concluída", () => {
    assert.equal(enderecoCompleto(completo), true);
});

test("edição: endereço vindo do banco (CEP sem máscara, número numérico) é concluído", () => {
    assert.equal(enderecoCompleto({ ...completo, cep: "12245020", numero: 75 }), true);
});

test("cadastro de médico: a etapa Endereço não é mais concluída sempre", () => {
    const html = ler("Adm/crudmedico.html");
    const funcao = html.slice(html.indexOf("function isStepCompleted"), html.indexOf("function saveCurrentStepData"));
    assert.doesNotMatch(funcao, /step === 2\)\s*\{\s*return true;/);
    assert.match(funcao, /HematoEtapas\.enderecoCompleto\(wizardData\.endereco\)/);
    assert.match(html, /<script src="\.\.\/JS\/etapas-cadastro\.js"><\/script>/);
});

test("cadastro de médico e de paciente: a etapa atual mostra o número, não o ✓", () => {
    for (const pagina of ["Adm/crudmedico.html", "Adm/crudpaciente.html"]) {
        const html = ler(pagina);
        const ramo = html.slice(html.indexOf("if (i === currentStep) {"), html.indexOf("} else if (isStepCompleted(i)) {"));
        assert.match(ramo, /stepCheck\.style\.display = 'none'/, pagina);
        assert.match(ramo, /stepNumber\.style\.display = 'flex'/, pagina);
    }
});

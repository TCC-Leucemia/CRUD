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
    assert.equal(enderecoCompleto({ ...vazio, cep: "12245-020" }), false, "só o CEP não basta");
});

test("endereço completo é etapa concluída", () => {
    assert.equal(enderecoCompleto(completo), true);
});

test("CEP é opcional (c9f912f): sem CEP o endereço completo conta como concluído", () => {
    assert.equal(enderecoCompleto({ ...completo, cep: "" }), true);
    assert.equal(enderecoCompleto({ ...completo, cep: null }), true, "endereço do banco sem CEP");
    assert.equal(enderecoCompleto({ ...completo, cep: "   " }), true);
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

test("cadastro de paciente: a etapa Endereço não é concluída sempre", () => {
    const html = ler("Adm/crudpaciente.html");
    const funcao = html.slice(html.indexOf("function isStepCompleted"), html.indexOf("function saveCurrentStepData"));
    assert.doesNotMatch(funcao, /step === 1\)\s*\{\s*return true;/);
    assert.match(funcao, /HematoEtapas\.enderecoCompleto\(wizardData\.endereco\)/);
    assert.match(html, /<script src="\.\.\/JS\/etapas-cadastro\.js"><\/script>/);
});

test("edição de paciente: CEP nulo do banco vira texto vazio (evita cep.replace em null)", () => {
    const html = ler("Adm/crudpaciente.html");
    const funcao = html.slice(html.indexOf("window.editarPaciente"), html.indexOf("wizardData.login.email = p.email"));
    assert.match(funcao, /cep: p\.endereco\.cep \|\| ""/);
});

test("cadastro de médico e de paciente: a etapa atual mostra o número, não o ✓", () => {
    for (const pagina of ["Adm/crudmedico.html", "Adm/crudpaciente.html"]) {
        const html = ler(pagina);
        const ramo = html.slice(html.indexOf("if (i === currentStep) {"), html.indexOf("} else if (isStepCompleted(i)) {"));
        assert.match(ramo, /stepCheck\.style\.display = 'none'/, pagina);
        assert.match(ramo, /stepNumber\.style\.display = 'flex'/, pagina);
    }
});

// ------------------------------------------- paciente: nome e endereço
test("paciente: nome com a mesma regra da API (8 a 100) e mensagem correspondente", () => {
    const html = ler("Adm/crudpaciente.html");
    const api = fs.readFileSync(path.join(__dirname, "..", "middleware", "PacientesMiddleware.js"), "utf8");
    assert.match(api, /nome\.length < 8/);
    assert.match(api, /nome\.length > 100/);
    assert.match(html, /nome\.length < 8\)\s*\{ HematoAI\.showToast\('O nome deve ter no mínimo 8 caracteres\.'/);
    assert.match(html, /nome\.length > 100\)\s*\{ HematoAI\.showToast\('O nome deve ter no máximo 100 caracteres\.'/);
    assert.doesNotMatch(html, /ao menos 7 caracteres/);
});

test("paciente: só o CEP é opcional no endereço (etapa e conferência antes do envio)", () => {
    const html = ler("Adm/crudpaciente.html");
    const etapa = html.slice(html.indexOf("} else if (currentStep === 1) {", html.indexOf("function validateCurrentStep")), html.indexOf("} else if (currentStep === 2) {", html.indexOf("function validateCurrentStep")));
    assert.doesNotMatch(etapa, /algumCampoPreenchido/, "endereço vazio não pode passar");
    assert.match(etapa, /if \(!rua \|\| !numero \|\| !bairro \|\| !cidade \|\| !estado\)/);
    assert.match(etapa, /if \(cep && cep\.replace\(\/\\D\/g, ''\)\.length !== 8\)/);
    const conferencia = html.slice(html.indexOf("function validarWizard"), html.indexOf("Complete as credenciais"));
    assert.match(conferencia, /HematoEtapas\.enderecoCompleto\(wizardData\.endereco\)/);
    for (const campo of ["Rua", "Número", "Bairro", "Cidade", "Estado"]) assert.match(html, new RegExp(`<label>${campo} \\*</label>`), campo);
    assert.match(html, /<label>CEP<\/label>/);
});

test("médico: CRM da tela segue exatamente a regra de cadastro da API", () => {
    const tela = require("../../front/JS/crm");
    const apiCrm = require("../utils/crm");
    const casos = ["12345", "12345-SP", "12345-sp", " 12345 - sp ", "1234-RJ", "12345678-SP", "123456789-SP", "123-SP",
        "ABCDE-SP", "12345-S", "12345-SPX", "12345SP", "<b>12345-SP</b>", "12345-SP<script>", "", null, undefined];
    for (const crm of casos) {
        assert.equal(tela.crmValidoParaCadastro(crm), apiCrm.crmValidoParaCadastro(crm), `CRM ${JSON.stringify(crm)}`);
        assert.equal(tela.normalizarCrm(crm), apiCrm.normalizarCrm(crm), `normalização ${JSON.stringify(crm)}`);
    }
    assert.equal(tela.MSG_CRM_INVALIDO, apiCrm.MSG_CRM_INVALIDO);
    assert.equal(tela.crmValidoParaCadastro("12345"), false, "só dígitos não é CRM novo");
    assert.equal(tela.normalizarCrm("12345-sp"), "12345-SP");

    const html = ler("Adm/crudmedico.html");
    assert.match(html, /<script src="\.\.\/JS\/crm\.js"><\/script>/);
    assert.doesNotMatch(html, /crm\.length < 5/, "regra antiga de 5 caracteres");
    const etapa = html.slice(html.indexOf("} else if (currentStep === 1) {", html.indexOf("function validateCurrentStep")));
    assert.match(etapa, /if \(!editingCrm\) \{\s*if \(!HematoCrm\.crmValidoParaCadastro\(crm\)\)/, "edição (CRM travado) não revalida");
    const finalizar = html.slice(html.indexOf("async function finalizeCadastro"));
    const guarda = finalizar.indexOf("HematoCrm.crmValidoParaCadastro(wizardData.medico.crm)");
    assert.ok(guarda > -1 && guarda < finalizar.indexOf("await "), "Finalizar confere o CRM antes de qualquer requisição");
});

test("médico: endereço vazio não passa e Finalizar valida antes de enviar", () => {
    const html = ler("Adm/crudmedico.html");
    const validar = html.slice(html.indexOf("function validateCurrentStep"), html.indexOf("function nextStep"));
    const etapa = validar.slice(validar.indexOf("} else if (currentStep === 2) {"));
    assert.doesNotMatch(etapa, /algumCampoPreenchido/, "endereço vazio não pode passar");
    assert.match(etapa, /if \(!rua \|\| !numero \|\| !bairro \|\| !cidade \|\| !estado\)/);
    assert.match(etapa, /if \(cep && cep\.replace\(\/\\D\/g, ''\)\.length !== 8\)/);
    // Endereço é a última etapa: sem esta chamada o Finalizar enviava sem validar nada.
    const finalizar = html.slice(html.indexOf("async function finalizeCadastro"));
    assert.ok(finalizar.indexOf("if (!validateCurrentStep()) return;") > -1, "Finalizar precisa validar");
    assert.ok(finalizar.indexOf("if (!validateCurrentStep()) return;") < finalizar.indexOf("await "), "validação antes de qualquer requisição");
    for (const campo of ["Rua", "Número", "Bairro", "Cidade", "Estado"]) assert.match(html, new RegExp(`<label>${campo} \\*</label>`), campo);
    assert.match(html, /<label>CEP<\/label>/);
});

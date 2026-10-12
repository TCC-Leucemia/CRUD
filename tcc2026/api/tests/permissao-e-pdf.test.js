// Regressão (outubro/2026):
// 1) recusa de permissão aparecia com o título genérico "Não foi possível concluir";
// 2) o título longo do PDF da análise passava da margem do cabeçalho.
// Rodar com: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const FRONT = path.join(__dirname, "..", "..", "front");
const BACKEND = path.join(__dirname, "..", "..", "backend");

// erro-popup.js é um script de navegador: roda num contexto com window/document mínimos.
function carregarTradutor() {
    const nada = () => {};
    const contexto = {
        window: { addEventListener: nada },
        document: { addEventListener: nada, getElementById: () => null, createElement: () => ({ style: {} }), head: { appendChild: nada }, body: { appendChild: nada } },
        console
    };
    contexto.window.window = contexto.window;
    vm.createContext(contexto);
    vm.runInContext(fs.readFileSync(path.join(FRONT, "JS", "erro-popup.js"), "utf8"), contexto);
    // Erros criados no mesmo "navegador" (instanceof Error funciona lá dentro).
    const ErroDoNavegador = vm.runInContext("Error", contexto);
    return { tratarErro: contexto.window.tratarErro, ErroDoNavegador };
}
const { tratarErro, ErroDoNavegador } = carregarTradutor();
const Erro = (m) => new ErroDoNavegador(m);

test("permissão negada (só a mensagem da API) vira 'Permissão insuficiente'", () => {
    for (const erro of [Erro("Acesso negado"), "Acesso negado.", { msg: "Acesso negado" }]) {
        const r = tratarErro(erro);
        assert.equal(r.titulo, "Permissão insuficiente");
        assert.equal(r.categoria, "Acesso negado");
        assert.match(r.mensagem, /Permissão insuficiente/);
    }
});

test("403 com status também vira 'Permissão insuficiente'", () => {
    assert.equal(tratarErro({ status: 403, msg: "Acesso negado" }).titulo, "Permissão insuficiente");
    // Mensagem própria de regra de negócio (403) continua sendo mostrada.
    const r = tratarErro({ status: 403, msg: "Você não pode alterar o tipo do usuário" });
    assert.equal(r.titulo, "Permissão insuficiente");
    assert.equal(r.mensagem, "Você não pode alterar o tipo do usuário");
});

test("sem sessão (401) vira 'Sessão não reconhecida'", () => {
    assert.equal(tratarErro(Erro("Usuário não autenticado")).titulo, "Sessão não reconhecida");
});

test("falhas de rede e de servidor NÃO viram 'Permissão insuficiente'", () => {
    assert.equal(tratarErro(Erro("Failed to fetch")).titulo, "Servidor indisponível");
    assert.notEqual(tratarErro({ status: 500, msg: "Erro interno" }).titulo, "Permissão insuficiente");
    assert.notEqual(tratarErro(Erro("Erro no servidor (500)")).titulo, "Permissão insuficiente");
    assert.notEqual(tratarErro(Erro("Acesso negado ao arquivo temporário do sistema operacional")).titulo, "Permissão insuficiente");
});

test("PDF da análise: títulos e corpo quebram pela largura real (Python/reportlab)", (t) => {
    const codigo = `
import sys
sys.path.insert(0, ${JSON.stringify(BACKEND)})
import hemoPDF
from reportlab.pdfbase.pdfmetrics import stringWidth
largura = 595.2755905511812 - 140
titulo = 'LAUDO DE HEMATOLOGIA - ANÁLISE MORFOLÓGICA DE ESFREGAÇO DE SANGUE PERIFÉRICO'
for texto, fonte, tam in [(titulo, 'Helvetica-Bold', 10), ('TEXTO ' + 'MMMMMMMMMM ' * 30, 'Helvetica', 9)]:
    linhas = hemoPDF.quebrar_linhas(texto, fonte, tam, largura)
    assert all(stringWidth(l, fonte, tam) <= largura for l in linhas), (fonte, linhas)
    assert ' '.join(linhas) == texto.strip(), 'texto alterado'
assert len(hemoPDF.quebrar_linhas(titulo, 'Helvetica-Bold', 10, largura)) == 2
print('ok')
`;
    const r = spawnSync("python", ["-c", codigo], { encoding: "utf8" });
    if (r.error || /No module named 'reportlab'/.test(r.stderr || "")) {
        t.skip("Python com reportlab indisponível neste ambiente");
        return;
    }
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /ok/);
});

test("relatório no navegador: título principal e de seção quebram pela largura", () => {
    const js = fs.readFileSync(path.join(FRONT, "JS", "exportar.js"), "utf8");
    assert.match(js, /const linhasTitulo = doc\.splitTextToSize\(textoPDF\(principal\.toUpperCase\(\)\), util\)/);
    assert.match(js, /const linhasSecao = doc\.splitTextToSize\(textoPDF\(secao\.titulo\.toUpperCase\(\)\), util\)/);
    assert.doesNotMatch(js, /doc\.text\(textoPDF\(principal\.toUpperCase\(\)\), largura \/ 2, y/);
});

test("Histórico IA verifica login e perfil antes de carregar (como as outras telas do médico)", () => {
    const html = fs.readFileSync(path.join(FRONT, "Med", "crudanaliseia.html"), "utf8");
    assert.match(html, /<script src="\.\.\/JS\/auth\.js"><\/script>/);
    assert.match(html, /if \(verificarPerfil\("Médico"\)\) carregar\(\);/);
});

test("Consultas, Exames e Resultados do médico verificam o perfil antes de carregar", () => {
    const telas = {
        "crudconsulta_med.html": /if \(verificarPerfil\("Médico"\)\) \(async \(\) => \{\s*await carregarConsultas\(\);/,
        "crudexame.html": /if \(verificarPerfil\("Médico"\)\) carregarExames\(\);/,
        "crudresultado.html": /if \(verificarPerfil\("Médico"\)\) \{\s*carregarResultados\(\);\s*carregarExames\(\);\s*\}/
    };
    for (const [arquivo, carga] of Object.entries(telas)) {
        const html = fs.readFileSync(path.join(FRONT, "Med", arquivo), "utf8");
        assert.match(html, /<script src="\.\.\/JS\/auth\.js"><\/script>/, arquivo);
        assert.match(html, carga, arquivo);
    }
});

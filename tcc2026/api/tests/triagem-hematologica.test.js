const test = require("node:test");
const assert = require("node:assert/strict");
const { extrairDiagnostico, apresentarAnalise } = require("../utils/analiseIA");

test("triagem rejeita uma lista de alternativas como diagnóstico", () => {
    assert.throws(() => extrairDiagnostico(
        "SUSPEITA_PRINCIPAL: LMA | LLA | LMC | LLC | NORMAL | INDETERMINADO\nNÍVEL_CONFIANÇA: ALTO"
    ), { statusCode: 502 });
});

test("triagem rejeita categoria de confiança com alternativas", () => {
    assert.throws(() => extrairDiagnostico(
        "SUSPEITA_PRINCIPAL: LMA\nNÍVEL_CONFIANÇA: ALTO | MODERADO | BAIXO"
    ));
});

test("triagem rejeita campos técnicos repetidos ou conflitantes", () => {
    for (const extra of ["SUSPEITA_PRINCIPAL: LLA", "NÍVEL_CONFIANÇA: BAIXO"]) {
        assert.throws(() => extrairDiagnostico(
            `SUSPEITA_PRINCIPAL: LMA\nNÍVEL_CONFIANÇA: ALTO\n${extra}`
        ));
    }
});

test("as seis classes mantêm o contrato de apresentação do pré-laudo", () => {
    for (const classe of ["LMA", "LLA", "LMC", "LLC", "NORMAL", "INDETERMINADO"]) {
        const clinico = classe === "NORMAL" ? "Normal — limitado às imagens"
            : classe === "INDETERMINADO" ? "Indeterminado" : classe;
        const texto = `SUSPEITA_PRINCIPAL: ${classe}\nNÍVEL_CONFIANÇA: MODERADO\n` +
            `SUSPEITA DIAGNÓSTICA: ${clinico}\nGRAU DE CERTEZA: Moderado`;
        const vista = apresentarAnalise({ ...extrairDiagnostico(texto), resultado_ia: texto });
        assert.equal(vista.nivel_confianca, "Moderado");
        assert.notEqual(vista.classificacao_ia, "Não identificado");
        assert.equal("confianca" in vista, false);
    }
});

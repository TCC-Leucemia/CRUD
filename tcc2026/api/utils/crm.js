// Regra única de CRM para toda a API.
//
// Formato oficial (cadastro de médico): número + UF, ex.: 12345-SP. A coluna
// medicos.crm tem 11 caracteres, então o número vai de 4 a 8 dígitos.
// Registros antigos só com dígitos continuam válidos para busca e para
// vincular consultas (formato legado), mas não são aceitos em cadastro novo.
const FORMATO_OFICIAL = /^\d{4,8}-[A-Z]{2}$/;
const FORMATO_LEGADO = /^\d{4,11}$/;

const normalizarCrm = (crm) =>
    String(crm ?? "").trim().toUpperCase().replace(/\s+/g, "");

const crmValidoParaCadastro = (crm) => FORMATO_OFICIAL.test(normalizarCrm(crm));

const crmValidoParaVinculo = (crm) => {
    const valor = normalizarCrm(crm);
    return FORMATO_OFICIAL.test(valor) || FORMATO_LEGADO.test(valor);
};

const MSG_CRM_INVALIDO = "CRM inválido. Use o formato 12345-SP.";

module.exports = {
    normalizarCrm,
    crmValidoParaCadastro,
    crmValidoParaVinculo,
    MSG_CRM_INVALIDO
};

// Regra de CRM do cadastro de médico no navegador.
//
// Espelho de api/utils/crm.js (a regra da API é a fonte de verdade; o teste
// api/tests/separador-e-etapas.test.js compara as duas). Antes, a tela só
// exigia 5 caracteres: "12345" passava e a API recusava depois.
// Novo cadastro: número de 4 a 8 dígitos + UF, ex.: 12345-SP. Maiúsculas e
// espaços são normalizados, como na API ("12345-sp" vira "12345-SP").
(function (raiz) {
  const FORMATO_OFICIAL = /^\d{4,8}-[A-Z]{2}$/;

  const normalizarCrm = (crm) =>
    String(crm ?? '').trim().toUpperCase().replace(/\s+/g, '');

  const crmValidoParaCadastro = (crm) => FORMATO_OFICIAL.test(normalizarCrm(crm));

  const MSG_CRM_INVALIDO = 'CRM inválido. Use o formato 12345-SP.';

  const api = { normalizarCrm, crmValidoParaCadastro, MSG_CRM_INVALIDO };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.HematoCrm = api;
})(typeof window !== 'undefined' ? window : globalThis);

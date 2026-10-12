// Regras de "etapa concluída" do cadastro por etapas (indicador com ✓).
//
// A etapa Endereço do cadastro de médico era considerada concluída sempre
// (isStepCompleted(2) devolvia true), e aparecia com ✓ antes de ser
// preenchida. Aqui a etapa só conta como concluída com as mesmas regras que
// o botão "Finalizar Cadastro" exige: todos os campos preenchidos e CEP com
// 8 dígitos.
(function (raiz) {
  const preenchido = (valor) => String(valor ?? '').trim() !== '';

  function enderecoCompleto(endereco) {
    if (!endereco) return false;
    const { cep, rua, numero, bairro, cidade, estado } = endereco;
    return [cep, rua, numero, bairro, cidade, estado].every(preenchido) &&
      String(cep).replace(/\D/g, '').length === 8;
  }

  const api = { enderecoCompleto };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.HematoEtapas = api;
})(typeof window !== 'undefined' ? window : globalThis);

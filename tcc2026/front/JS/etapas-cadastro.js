// Regras de "etapa concluída" do cadastro por etapas (indicador com ✓).
//
// A etapa Endereço dos cadastros de médico e de paciente era considerada concluída sempre
// (isStepCompleted devolvia true), e aparecia com ✓ antes de ser
// preenchida. Aqui a etapa só conta como concluída com as mesmas regras que
// o botão "Finalizar Cadastro" exige: rua, número, bairro, cidade e estado
// preenchidos. O CEP é opcional (c9f912f), mas, se informado, precisa ter
// 8 dígitos.
(function (raiz) {
  const preenchido = (valor) => String(valor ?? '').trim() !== '';

  function enderecoCompleto(endereco) {
    if (!endereco) return false;
    const { cep, rua, numero, bairro, cidade, estado } = endereco;
    const cepDigitos = String(cep ?? '').replace(/\D/g, '');
    return [rua, numero, bairro, cidade, estado].every(preenchido) &&
      (!preenchido(cep) || cepDigitos.length === 8);
  }

  const api = { enderecoCompleto };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.HematoEtapas = api;
})(typeof window !== 'undefined' ? window : globalThis);

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

  // Desfaz um cadastro em etapas que falhou no meio: apaga o login e/ou o
  // endereço que já tinham sido criados, para não deixar registros órfãos.
  // login e enderecos não têm chave estrangeira entre si, então a ordem não
  // importa. Usa o del() de api.js, carregado antes nas telas de cadastro.
  async function rollbackCadastro(id_usuario, id_endereco) {
    try {
      if (id_usuario !== null) await raiz.del('/login/' + id_usuario);
      if (id_endereco !== null) await raiz.del('/enderecos/' + id_endereco);
    } catch (erro) {
      console.error('Erro no rollback:', erro);
    }
  }

  const api = { enderecoCompleto, rollbackCadastro };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.HematoEtapas = api;
})(typeof window !== 'undefined' ? window : globalThis);

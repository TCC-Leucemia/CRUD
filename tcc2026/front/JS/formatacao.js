// Máscaras, validação e formatação usadas por várias telas.
//
// Antes cada tela tinha a sua cópia destas funções (e as cópias já tinham
// divergido entre si). Agora existe uma só: no navegador elas viram globais com
// o mesmo nome de antes, então as telas continuam chamando maskCPF(...),
// formatarCPF(...) etc. sem mudança; no Node são exportadas para os testes
// (api/tests/formatacao.test.js).
(function (raiz) {
  const apenasDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

  /* ---------- Máscaras de digitação ---------- */
  function maskCPF(cpf) {
    return apenasDigitos(cpf)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function maskTelefone(tel) {
    return apenasDigitos(tel)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function maskCEP(cep) {
    return apenasDigitos(cep).replace(/(\d{5})(\d)/, '$1-$2');
  }

  /* ---------- Validação ---------- */
  function cpfValido(cpf) {
    const numeros = apenasDigitos(cpf);
    if (numeros.length !== 11) return false;
    // Rejeita CPFs com todos os dígitos iguais
    if (/^(\d)\1{10}$/.test(numeros)) return false;

    const digito = (tamanho) => {
      let soma = 0;
      for (let i = 0; i < tamanho; i++) soma += Number(numeros[i]) * (tamanho + 1 - i);
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };
    return digito(9) === Number(numeros[9]) && digito(10) === Number(numeros[10]);
  }

  /* ---------- Exibição ---------- */
  // CPF vindo da API para mostrar em tabelas, fichas e exportações.
  // Vazio, nulo ou já "—" mostra só o traço. CPF guardado como número perde o
  // zero inicial, por isso completa com zeros à esquerda. Mais de 11 dígitos
  // não acontece: a máscara de digitação não deixa passar.
  function formatarCPF(cpf) {
    const digitos = apenasDigitos(cpf);
    if (!digitos) return '—';
    return digitos.padStart(11, '0').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Data vinda da API (ISO ou Date) no formato dd/mm/aaaa.
  function formatarData(valor) {
    if (!valor) return '—';
    const data = new Date(valor);
    if (isNaN(data.getTime())) return '—';
    return data.toLocaleDateString('pt-BR');
  }

  /* ---------- CEP (ViaCEP) ---------- */
  // prefixo: letra inicial dos ids dos campos ('f' -> fCep, fRua...; 'p' -> pCep...).
  // aoPreencher: recebe { rua, bairro, cidade, estado, cep } para a tela guardar
  // o endereço no seu próprio estado.
  async function buscarCEP(cep, prefixo, aoPreencher) {
    cep = apenasDigitos(cep);
    if (cep.length !== 8) return;

    const campo = (nome) => document.getElementById(prefixo + nome);
    const cepField = campo('Cep');
    const originalPlaceholder = cepField.placeholder;
    const camposEndereco = ['Rua', 'Bairro', 'Cidade', 'Estado'];

    cepField.classList.add('cep-loading');
    cepField.placeholder = 'Buscando...';

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        const endereco = {
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
          cep: cepField.value,
        };
        campo('Rua').value = endereco.rua;
        campo('Bairro').value = endereco.bairro;
        campo('Cidade').value = endereco.cidade;
        campo('Estado').value = endereco.estado;
        if (typeof aoPreencher === 'function') aoPreencher(endereco);

        HematoAI.showToast('Endereço preenchido automaticamente!', 'success');

        camposEndereco.forEach((nome) => {
          const c = campo(nome);
          if (c && c.value) {
            c.style.transition = 'all 0.3s ease';
            c.style.backgroundColor = 'rgba(21, 128, 61, 0.1)';
            setTimeout(() => { c.style.backgroundColor = ''; }, 1000);
          }
        });
      } else {
        HematoAI.showToast('CEP não encontrado. Verifique o número digitado.', 'error');
        camposEndereco.forEach((nome) => { campo(nome).value = ''; });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      HematoAI.showToast('Erro ao buscar CEP. Tente novamente.', 'error');
    } finally {
      cepField.classList.remove('cep-loading');
      cepField.placeholder = originalPlaceholder;
    }
  }

  let debounceTimeout;
  function debounceBuscarCEP(cep, prefixo, aoPreencher) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => { buscarCEP(cep, prefixo, aoPreencher); }, 800);
  }

  const api = {
    maskCPF, maskTelefone, maskCEP, cpfValido, formatarCPF, formatarData,
    buscarCEP, debounceBuscarCEP,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(raiz, api);
})(typeof window !== 'undefined' ? window : globalThis);

// Apresentação do texto da análise preliminar por IA na tela.
//
// O texto devolvido pela IA usa linhas só de "=" ou "-" como decoração
// (separar blocos e sublinhar títulos). Como texto, a largura dessas linhas
// depende da fonte e da largura da caixa: elas transbordavam ou quebravam,
// deixando um "=" sozinho na linha seguinte. Aqui elas viram um traço
// horizontal (<hr>), que sempre ocupa a largura disponível. O restante do
// texto é mantido como está, com escape de HTML.
//
// Mesma regra dos PDFs (exportar.js e backend/hemoPDF.py), que já descartam
// essas linhas. Vale para análises antigas e novas, sem mexer no banco.
(function (raiz) {
  const SEPARADOR = /^\s*[=\-_━─]{4,}\s*$/;
  const ESTILO_TRACO = 'border:0;border-top:1px solid currentColor;opacity:.25;margin:.35em 0';

  function escapar(valor) {
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Para uso em elemento com white-space: pre-wrap.
  function paraHtml(texto) {
    const partes = [];
    String(texto ?? '').split(/\r?\n/).forEach((linha) => {
      if (SEPARADOR.test(linha)) {
        // O traço já é um bloco: tira a quebra de linha anterior para não
        // sobrar uma linha em branco extra.
        if (partes.length && partes[partes.length - 1] === '\n') partes.pop();
        partes.push(`<hr class="ia-separador" style="${ESTILO_TRACO}">`);
      } else {
        partes.push(escapar(linha), '\n');
      }
    });
    if (partes[partes.length - 1] === '\n') partes.pop();
    return partes.join('');
  }

  const api = { paraHtml, SEPARADOR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.HematoTextoIA = api;
})(typeof window !== 'undefined' ? window : globalThis);

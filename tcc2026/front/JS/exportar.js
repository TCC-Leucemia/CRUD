/* ============================================================
   HematoAI — Exportação de listagens e fichas (PDF e Excel)
   exportar.js · Incluir nas páginas que têm listagem, depois
   de navbar.js e erro-popup.js.

   Cada página só descreve O QUE exportar (título, colunas e de
   onde vêm as linhas); o COMO fica todo aqui. As bibliotecas são
   carregadas no primeiro clique, então a página não fica mais
   pesada para quem não exporta nada.
   ============================================================ */
(function () {
  'use strict';

  const BIBLIOTECAS = {
    jspdf:     'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    autotable: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js',
    exceljs:   'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js'
  };

  // Paleta do documento. Mesmos tons de navbar.css (--red, --red-dark,
  // --text-*) mais o bege do papel. O arquivo exportado não tem modo
  // escuro: sai sempre claro, pronto para imprimir.
  const COR = {
    vermelho:       [185, 28, 28],   // #b91c1c
    vermelhoEscuro: [153, 27, 27],   // #991b1b
    bege:           [250, 245, 238], // #faf5ee — linhas alternadas
    begeFundo:      [253, 250, 245], // #fdfaf5 — caixas de destaque
    begeBorda:      [234, 223, 208], // #eadfd0 — divisórias
    texto:          [15, 23, 42],    // #0f172a
    textoSuave:     [71, 85, 105],   // #475569
    textoFraco:     [148, 163, 184]  // #94a3b8
  };

  const ARGB = {
    vermelho:       'FFB91C1C',
    vermelhoEscuro: 'FF991B1B',
    bege:           'FFFAF5EE',
    begeFundo:      'FFFDFAF5',
    begeBorda:      'FFEADFD0',
    branco:         'FFFFFFFF',
    texto:          'FF0F172A',
    textoSuave:     'FF475569',
    // Cores de destaque por valor (coluna.cor), mesmos tons de --blue/--green
    // do navbar.css. Expostas em HematoExport.cores para as páginas usarem.
    azul:           'FF1D4ED8',
    verde:          'FF15803D'
  };

  const MARGEM = 14;           // mm
  const TOPO_CONTINUACAO = 28; // espaço reservado à faixa da marca nas páginas seguintes
  const RODAPE = 17;
  const VAZIO = '—';

  const ICONE_PDF = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
  const ICONE_EXCEL = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/></svg>';

  /* ---------- Carregamento das bibliotecas ---------- */

  const scriptsEmCarga = {};

  function carregarScript(url) {
    if (!scriptsEmCarga[url]) {
      scriptsEmCarga[url] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => {
          // Esquece a tentativa para que o próximo clique tente de novo.
          delete scriptsEmCarga[url];
          script.remove();
          const erro = new Error('Falha ao carregar ' + url);
          erro.codigo = 'BIBLIOTECA';
          reject(erro);
        };
        document.head.appendChild(script);
      });
    }
    return scriptsEmCarga[url];
  }

  async function carregarPDF() {
    // O plugin de tabela se registra no jsPDF ao carregar: a ordem importa.
    await carregarScript(BIBLIOTECAS.jspdf);
    await carregarScript(BIBLIOTECAS.autotable);
    return window.jspdf.jsPDF;
  }

  async function carregarExcel() {
    await carregarScript(BIBLIOTECAS.exceljs);
    return window.ExcelJS;
  }

  /* ---------- Texto ---------- */

  function resolver(valor) {
    return typeof valor === 'function' ? valor() : valor;
  }

  function paraTexto(valor) {
    if (valor === null || valor === undefined) return VAZIO;
    const texto = String(valor).trim();
    return texto === '' ? VAZIO : texto;
  }

  // A fonte padrão do PDF (Helvetica) só desenha o alfabeto latino do
  // Windows-1252. Acentos do português passam; símbolos fora dele viriam
  // como caracteres quebrados, então são trocados ou descartados.
  const SUBSTITUICOES = {
    '≥': '>=', '≤': '<=', '→': '->', '←': '<-', '✓': 'OK', '✔': 'OK',
    '\u00a0': ' ', '\t': ' ', '\u200b': '', '\r': ''
  };
  const EXTRAS_CP1252 = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

  function textoPDF(valor) {
    // Um emoji removido pode deixar espaço sobrando ou o campo vazio.
    const limpo = filtrarCP1252(paraTexto(valor)).trim();
    return limpo === '' ? VAZIO : limpo;
  }

  // Só troca/descarta os caracteres; mantém os espaços das pontas, que
  // separam trechos em negrito e normal na mesma linha.
  function filtrarCP1252(texto) {
    let saida = '';
    for (const caractere of String(texto)) {
      if (SUBSTITUICOES[caractere] !== undefined) {
        saida += SUBSTITUICOES[caractere];
        continue;
      }
      const codigo = caractere.codePointAt(0);
      if (codigo === 10 || (codigo >= 32 && codigo <= 126) ||
          (codigo >= 160 && codigo <= 255) || EXTRAS_CP1252.includes(caractere)) {
        saida += caractere;
      }
    }
    return saida;
  }

  function slug(texto) {
    return String(texto || 'lista')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'lista';
  }

  function formatarDataCampo(valor) {
    const partes = String(valor).split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valor;
  }

  /* ---------- Contexto da exportação ---------- */

  function dadosEmissao() {
    const agora = new Date();
    let sessao = {};
    let usuario = {};
    try { sessao = JSON.parse(localStorage.getItem('hematoai_session')) || {}; } catch (_) { /* sem sessão */ }
    try { usuario = JSON.parse(localStorage.getItem('usuario')) || {}; } catch (_) { /* sem usuário */ }

    const pad = (n) => String(n).padStart(2, '0');

    return {
      data: agora.toLocaleDateString('pt-BR'),
      hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      iso: `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`,
      nome: sessao.nome || usuario.nome || usuario.email || '',
      perfil: sessao.tipo || usuario.role || ''
    };
  }

  // Cada filtro é { rotulo, id } (lido do campo da tela) ou
  // { rotulo, texto: () => string } quando o valor não vem de um campo.
  function descreverFiltros(filtros) {
    return (filtros || []).map((filtro) => {
      if (typeof filtro.texto === 'function') {
        const texto = filtro.texto();
        return texto ? `${filtro.rotulo}: ${texto}` : null;
      }

      const campo = document.getElementById(filtro.id);
      if (!campo) return null;

      if (campo.tagName === 'SELECT') {
        if (!campo.value) return null;
        const opcao = campo.options[campo.selectedIndex];
        const texto = (opcao ? opcao.text : campo.value).replace(/^Ordenar por:\s*/i, '');
        return `${filtro.rotulo}: ${texto}`;
      }

      const valor = campo.value.trim();
      if (!valor) return null;
      return campo.type === 'date'
        ? `${filtro.rotulo}: ${formatarDataCampo(valor)}`
        : `${filtro.rotulo}: "${valor}"`;
    }).filter(Boolean);
  }

  function prepararLista(config) {
    const colunas = resolver(config.colunas) || [];
    const registros = (typeof config.obterLinhas === 'function' ? config.obterLinhas() : []) || [];
    const titulo = resolver(config.titulo) || 'Lista';

    return {
      titulo,
      subtitulo: resolver(config.subtitulo) || '',
      colunas,
      linhas: registros.map((registro) => colunas.map((coluna) => paraTexto(coluna.valor(registro)))),
      filtros: descreverFiltros(config.filtros),
      arquivo: slug(resolver(config.arquivo) || titulo),
      emissao: dadosEmissao()
    };
  }

  function contagem(n) {
    return n === 1 ? '1 registro' : `${n} registros`;
  }

  /* ---------- Desenho do PDF ---------- */

  // Selo "H" + "HematoAI", igual ao da tela inicial. (x, y) é o canto
  // superior esquerdo do selo.
  function desenharLogo(doc, x, y) {
    doc.setFillColor(...COR.vermelho);
    doc.roundedRect(x, y, 9.5, 9.5, 2.2, 2.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('H', x + 4.75, y + 6.7, { align: 'center' });

    doc.setFontSize(13.5);
    doc.setTextColor(...COR.texto);
    doc.text('Hemato', x + 12.5, y + 5.1);
    doc.setTextColor(...COR.vermelho);
    doc.text('AI', x + 12.5 + doc.getTextWidth('Hemato'), y + 5.1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COR.textoFraco);
    doc.text('Diagnóstico assistido por IA', x + 12.5, y + 9.3);
  }

  function desenharMarca(doc, emissao, tituloContinuacao) {
    const largura = doc.internal.pageSize.getWidth();

    doc.setFillColor(...COR.vermelho);
    doc.rect(0, 0, largura, 3.2, 'F');

    desenharLogo(doc, MARGEM, 8.5);

    const direita = largura - MARGEM;
    if (tituloContinuacao) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COR.texto);
      doc.text(`${tituloContinuacao} (continuação)`, direita, 13, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COR.textoSuave);
      doc.text(`Emitido em ${emissao.data} às ${emissao.hora}`, direita, 17.2, { align: 'right' });
    } else {
      doc.setFontSize(8);
      doc.setTextColor(...COR.textoSuave);
      doc.text(`Emitido em ${emissao.data} às ${emissao.hora}`, direita, 12.8, { align: 'right' });
      if (emissao.nome) {
        const autor = emissao.perfil ? `${emissao.nome} · ${emissao.perfil}` : emissao.nome;
        doc.text(textoPDF(`por ${autor}`), direita, 17, { align: 'right' });
      }
    }

    doc.setDrawColor(...COR.begeBorda);
    doc.setLineWidth(0.4);
    doc.line(MARGEM, 22, direita, 22);
  }

  // Caixa bege com barra vermelha: título do documento e linhas de contexto.
  // Devolve a altura em que o conteúdo seguinte pode começar.
  function desenharResumo(doc, titulo, linhasInfo) {
    const largura = doc.internal.pageSize.getWidth() - MARGEM * 2;
    const topo = 27;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const info = linhasInfo.reduce(
      (acc, linha) => acc.concat(doc.splitTextToSize(textoPDF(linha), largura - 12)),
      []
    );

    const altura = 12 + info.length * 4.4 + 2;

    doc.setFillColor(...COR.begeFundo);
    doc.setDrawColor(...COR.begeBorda);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGEM, topo, largura, altura, 2, 2, 'FD');
    doc.setFillColor(...COR.vermelho);
    doc.rect(MARGEM, topo, 1.6, altura, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...COR.texto);
    doc.text(textoPDF(titulo), MARGEM + 6, topo + 8.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COR.textoSuave);
    info.forEach((linha, i) => doc.text(linha, MARGEM + 6, topo + 13.8 + i * 4.4));

    return topo + altura;
  }

  // Faixa da marca nas páginas 2+ e rodapé em todas. Desenhado depois da
  // tabela, quando o total de páginas já é conhecido.
  function decorarPaginas(doc, emissao, titulo) {
    const total = doc.internal.getNumberOfPages();
    const largura = doc.internal.pageSize.getWidth();
    const altura = doc.internal.pageSize.getHeight();

    for (let pagina = 1; pagina <= total; pagina++) {
      doc.setPage(pagina);

      if (pagina > 1) desenharMarca(doc, emissao, textoPDF(titulo));

      doc.setDrawColor(...COR.begeBorda);
      doc.setLineWidth(0.3);
      doc.line(MARGEM, altura - 12, largura - MARGEM, altura - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COR.textoFraco);
      doc.text('HematoAI · Documento gerado automaticamente pelo sistema', MARGEM, altura - 7.5);
      doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - 7.5, { align: 'right' });
    }
  }

  function estiloTabela() {
    return {
      theme: 'plain',
      showHead: 'everyPage',
      margin: { top: TOPO_CONTINUACAO, right: MARGEM, bottom: RODAPE, left: MARGEM },
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: COR.texto,
        cellPadding: { top: 2.6, right: 3, bottom: 2.6, left: 3 },
        lineColor: COR.begeBorda,
        lineWidth: { bottom: 0.2 },
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: COR.vermelho,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        lineWidth: 0,
        cellPadding: { top: 3.2, right: 3, bottom: 3.2, left: 3 }
      },
      bodyStyles: { fillColor: [255, 255, 255] }
    };
  }

  // Sem largura mínima, uma coluna de texto longo (resultado, sintomas)
  // espreme as outras até quebrar nomes e datas palavra por palavra.
  // Coluna de valores curtos: cabe o maior valor numa linha só.
  // Coluna de texto longo: cabe ao menos o cabeçalho; ela quebra em linhas.
  function larguraMinimaColunas(doc, colunas, corpo) {
    const LIMITE_CURTO = 45;   // mm; acima disso o valor é tratado como texto longo
    const PREENCHIMENTO = 6.5; // padding lateral da célula + folga

    const minimos = colunas.map((coluna, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const cabecalho = doc.getTextWidth(textoPDF(coluna.titulo).toUpperCase()) + PREENCHIMENTO;

      doc.setFont('helvetica', coluna.destaque ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      const maiorValor = corpo.reduce((max, linha) => Math.max(
        max, ...String(linha[i]).split('\n').map((parte) => doc.getTextWidth(parte))
      ), 0) + PREENCHIMENTO;

      return Math.max(cabecalho, Math.min(maiorValor, LIMITE_CURTO));
    });

    // Se a soma não cabe na página, reduz todas na mesma proporção.
    const disponivel = doc.internal.pageSize.getWidth() - MARGEM * 2;
    const total = minimos.reduce((soma, largura) => soma + largura, 0);
    return total > disponivel ? minimos.map((largura) => largura * disponivel / total) : minimos;
  }

  async function montarPDFLista(dados) {
    const JsPDF = await carregarPDF();
    const orientacao = dados.colunas.length > 5 ? 'landscape' : 'portrait';
    const doc = new JsPDF({ orientation: orientacao, unit: 'mm', format: 'a4', compress: true });

    doc.setProperties({ title: `HematoAI — ${dados.titulo}`, creator: 'HematoAI' });

    desenharMarca(doc, dados.emissao);

    const info = [contagem(dados.linhas.length) + (dados.subtitulo ? ` · ${dados.subtitulo}` : '')];
    info.push(dados.filtros.length
      ? `Filtros aplicados: ${dados.filtros.join('  ·  ')}`
      : 'Sem filtros aplicados: lista completa.');

    const inicio = desenharResumo(doc, dados.titulo, info);

    const corpo = dados.linhas.map((linha) => linha.map(textoPDF));
    const minimos = larguraMinimaColunas(doc, dados.colunas, corpo);

    const colunasPDF = {};
    dados.colunas.forEach((coluna, i) => {
      colunasPDF[i] = { minCellWidth: minimos[i] };
      if (coluna.largura) colunasPDF[i].cellWidth = coluna.largura;
      if (coluna.alinhar) colunasPDF[i].halign = coluna.alinhar;
      if (coluna.destaque) colunasPDF[i].fontStyle = 'bold';
    });

    doc.autoTable({
      ...estiloTabela(),
      startY: inicio + 5,
      head: [dados.colunas.map((coluna) => textoPDF(coluna.titulo).toUpperCase())],
      body: corpo,
      alternateRowStyles: { fillColor: COR.bege },
      columnStyles: colunasPDF
    });

    decorarPaginas(doc, dados.emissao, dados.titulo);
    return doc;
  }

  // Ficha de um registro: seções campo/valor e blocos de texto livre
  // (laudo, resultado). Texto longo continua na página seguinte.
  async function montarPDFFicha(ficha) {
    const JsPDF = await carregarPDF();
    const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const emissao = dadosEmissao();
    const titulo = ficha.titulo || 'Ficha';

    doc.setProperties({ title: `HematoAI — ${titulo}`, creator: 'HematoAI' });
    desenharMarca(doc, emissao);

    let y = desenharResumo(doc, titulo, [].concat(ficha.subtitulo || [])) + 6;

    (ficha.secoes || []).forEach((secao) => {
      doc.autoTable({
        ...estiloTabela(),
        startY: y,
        head: [[{ content: textoPDF(secao.titulo).toUpperCase(), colSpan: 2 }]],
        body: secao.campos.map(([rotulo, valor]) => [textoPDF(rotulo), textoPDF(valor)]),
        columnStyles: {
          0: { cellWidth: 52, fontStyle: 'bold', textColor: COR.textoSuave, fillColor: COR.bege },
          1: { textColor: COR.texto }
        }
      });
      y = doc.lastAutoTable.finalY + 6;
    });

    (ficha.textos || []).forEach((bloco) => {
      doc.autoTable({
        ...estiloTabela(),
        startY: y,
        rowPageBreak: 'auto',
        head: [[textoPDF(bloco.titulo).toUpperCase()]],
        body: [[textoPDF(bloco.conteudo)]],
        bodyStyles: { fillColor: COR.begeFundo, fontSize: 9.5, cellPadding: 4.5, lineWidth: 0 }
      });
      y = doc.lastAutoTable.finalY + 6;
    });

    decorarPaginas(doc, emissao, titulo);
    return doc;
  }

  /* ---------- Laudo clínico ---------- */

  // Laudo no formato de documento clínico impresso: preto e branco, só a
  // marca em cor, bloco de identificação no topo e as seções do texto.
  const LAUDO = {
    margem: 18,
    topoContinuacao: 32,  // onde o texto recomeça nas páginas 2+
    limiteInferior: 24,   // mm reservados ao rodapé
    entrelinha: 4.6,
    corpo: 9.5,           // tamanho da fonte do texto
    preto: [20, 20, 20],
    cinza: [95, 95, 95],
    linha: [60, 60, 60]
  };

  // Separadores que a IA usa para marcar blocos ("=====") e sublinhar
  // títulos ("-----"). Não aparecem no PDF.
  const SEPARADOR_BLOCO = /^\s*[=━]{4,}\s*$/;
  const SEPARADOR_LINHA = /^\s*[-_*#─]{4,}\s*$/;
  // Campos que o backend lê para gravar a análise; nunca vão para o laudo.
  const CAMPO_TECNICO = /^\s*[-•]?\s*(SUSPEITA_PRINCIPAL|N[IÍ]VEL_CONFIAN[CÇ]A)\s*:/i;
  const NOTA_PADRAO = 'Laudo gerado por sistema de apoio à decisão. Não estabelece diagnóstico ' +
    'definitivo e requer revisão e validação por médico hematologista responsável.';

  function limparMarkdown(linha) {
    return String(linha).replace(/\*\*|__|`/g, '').replace(/^#+\s*/, '').trim();
  }

  function normalizar(texto) {
    return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
  }

  // Título é a linha inteira em caixa alta, sem "rótulo: valor"
  // ("ACHADOS MORFOLÓGICOS"). "SUSPEITA DIAGNÓSTICA: LLC" é conteúdo.
  function ehTitulo(linha, limite = 80) {
    const texto = linha.replace(/:$/, '');
    return !texto.includes(':') && texto.length <= limite &&
      /\p{L}/u.test(texto) && texto === texto.toUpperCase();
  }

  // Divide o texto da IA em: título do documento (bloco entre os
  // primeiros "====="), seções, e a nota final (último bloco).
  function interpretarLaudo(texto) {
    const blocos = [[]];
    String(texto || '').replace(/\r/g, '').split('\n').forEach((linha) => {
      if (SEPARADOR_BLOCO.test(linha)) blocos.push([]);
      else if (!CAMPO_TECNICO.test(linha)) blocos[blocos.length - 1].push(linha);
    });
    const preenchidos = blocos.filter((bloco) => bloco.some((linha) => linha.trim()));

    let titulo = '';
    const primeiro = preenchidos.length > 1 ? preenchidos[0].map(limparMarkdown).filter(Boolean) : [];
    if (primeiro.length && primeiro.length <= 2 && primeiro.every((linha) => ehTitulo(linha, 160))) {
      titulo = primeiro.join(' ');
      preenchidos.shift();
    }

    let nota = '';
    if (preenchidos.length > 1) {
      const ultimo = preenchidos[preenchidos.length - 1].map(limparMarkdown).filter(Boolean);
      if (!ultimo.some((linha) => ehTitulo(linha))) {
        nota = ultimo.join(' ');
        preenchidos.pop();
      }
    }

    const secoes = [];
    let atual = null;
    preenchidos.flat().forEach((bruta) => {
      if (SEPARADOR_LINHA.test(bruta)) return;
      const linha = limparMarkdown(bruta);
      if (!linha) {
        if (atual && atual.linhas.length) atual.linhas.push('');
        return;
      }
      if (ehTitulo(linha)) {
        atual = { titulo: linha.replace(/:$/, ''), linhas: [] };
        secoes.push(atual);
        return;
      }
      if (!atual) {
        atual = { titulo: '', linhas: [] };
        secoes.push(atual);
      }
      atual.linhas.push(linha);
    });

    secoes.forEach((secao) => {
      while (secao.linhas.length && secao.linhas[secao.linhas.length - 1] === '') secao.linhas.pop();
    });

    return { titulo, nota, secoes: secoes.filter((secao) => secao.linhas.length) };
  }

  // Quebra um parágrafo em linhas que cabem em `largura`, aceitando trechos
  // em negrito e normal na mesma linha ("Série branca:" + descrição).
  function quebrarLinhas(doc, pedacos, largura, tamanho) {
    doc.setFontSize(tamanho);
    const medir = (texto, negrito) => {
      doc.setFont('helvetica', negrito ? 'bold' : 'normal');
      return doc.getTextWidth(texto);
    };

    const linhas = [[]];
    let ocupado = 0;
    const novaLinha = () => { linhas.push([]); ocupado = 0; };

    pedacos.forEach(({ texto, negrito }) => {
      filtrarCP1252(texto).split(/(\s+)/).forEach((token) => {
        if (!token) return;
        if (/^\s+$/.test(token)) {
          if (ocupado > 0) {
            const espaco = medir(' ', negrito);
            linhas[linhas.length - 1].push({ texto: ' ', negrito, largura: espaco });
            ocupado += espaco;
          }
          return;
        }

        let palavra = token;
        let tamanhoPalavra = medir(palavra, negrito);
        if (ocupado > 0 && ocupado + tamanhoPalavra > largura) {
          // Não deixa espaço pendurado no fim da linha anterior.
          const anterior = linhas[linhas.length - 1];
          if (anterior.length && anterior[anterior.length - 1].texto === ' ') anterior.pop();
          novaLinha();
        }
        // Palavra maior que a linha inteira (ex.: um código longo): corta.
        while (tamanhoPalavra > largura) {
          let corte = palavra.length - 1;
          while (corte > 1 && medir(palavra.slice(0, corte), negrito) > largura) corte--;
          linhas[linhas.length - 1].push({ texto: palavra.slice(0, corte), negrito, largura: medir(palavra.slice(0, corte), negrito) });
          novaLinha();
          palavra = palavra.slice(corte);
          tamanhoPalavra = medir(palavra, negrito);
        }
        linhas[linhas.length - 1].push({ texto: palavra, negrito, largura: tamanhoPalavra });
        ocupado += tamanhoPalavra;
      });
    });

    return linhas.filter((linha) => linha.length);
  }

  function desenharLinhaTexto(doc, linha, x, y) {
    let cursor = x;
    linha.forEach((trecho) => {
      doc.setFont('helvetica', trecho.negrito ? 'bold' : 'normal');
      doc.text(trecho.texto, cursor, y);
      cursor += trecho.largura;
    });
  }

  function idadeEm(nascimento, referencia) {
    const nasc = new Date(nascimento);
    const ref = referencia ? new Date(referencia) : new Date();
    if (!nascimento || isNaN(nasc) || isNaN(ref) || nasc > ref) return '';
    let anos = ref.getFullYear() - nasc.getFullYear();
    const mes = ref.getMonth() - nasc.getMonth();
    if (mes < 0 || (mes === 0 && ref.getDate() < nasc.getDate())) anos--;
    return anos === 1 ? '1 ano' : `${anos} anos`;
  }

  // Cabeçalho e rodapé de todas as páginas: logo, "Página: X de Y",
  // nome do paciente nas páginas seguintes e linha de emissão.
  function decorarLaudo(doc, emissao, paciente) {
    const total = doc.internal.getNumberOfPages();
    const largura = doc.internal.pageSize.getWidth();
    const altura = doc.internal.pageSize.getHeight();
    const esquerda = LAUDO.margem;
    const direita = largura - LAUDO.margem;
    const autor = emissao.nome ? ` por ${emissao.nome}` : '';

    for (let pagina = 1; pagina <= total; pagina++) {
      doc.setPage(pagina);
      desenharLogo(doc, esquerda, 10);

      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(8.5);
      doc.setTextColor(...LAUDO.preto);
      doc.text(`Página: ${pagina} de ${total}`, direita, 14.5, { align: 'right' });

      if (pagina > 1 && paciente) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...LAUDO.cinza);
        doc.text(textoPDF(`Paciente: ${paciente}`), direita, 19, { align: 'right' });
      }

      doc.setDrawColor(...LAUDO.linha);
      doc.setLineWidth(0.3);
      doc.line(esquerda, altura - 16, direita, altura - 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...LAUDO.cinza);
      doc.text(textoPDF(`HematoAI · Laudo emitido em ${emissao.data} às ${emissao.hora}${autor}`),
        largura / 2, altura - 11, { align: 'center' });
    }
  }

  // laudo = { titulo, arquivo, paciente, texto,
  //           campos: [[rotulo, valor]]            — identificação, 2 por linha
  //           impressao?: [[rotulo, valor]]         — abertura, se o texto não tiver
  //           tituloAbertura?, omitirSecoes?: [titulos], medico?: { nome, crm } }
  async function montarLaudoPDF(laudo) {
    const JsPDF = await carregarPDF();
    const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const emissao = dadosEmissao();
    const conteudo = interpretarLaudo(laudo.texto);

    const largura = doc.internal.pageSize.getWidth();
    const esquerda = LAUDO.margem;
    const util = largura - LAUDO.margem * 2;
    const limite = doc.internal.pageSize.getHeight() - LAUDO.limiteInferior;
    const garantir = (altura) => {
      if (y + altura > limite) {
        doc.addPage();
        y = LAUDO.topoContinuacao;
      }
    };

    const tituloCompleto = conteudo.titulo || laudo.titulo || 'Laudo';
    const [principal, ...complemento] = tituloCompleto.split(/\s+[-–—]\s+/);
    doc.setProperties({ title: `HematoAI — ${tituloCompleto}`, creator: 'HematoAI' });
    doc.setTextColor(...LAUDO.preto);

    // Título centralizado
    let y = 36;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(textoPDF(principal.toUpperCase()), largura / 2, y, { align: 'center' });
    if (complemento.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const linhas = doc.splitTextToSize(textoPDF(complemento.join(' - ').toUpperCase()), util);
      doc.text(linhas, largura / 2, y + 5.5, { align: 'center' });
      y += 5.5 + (linhas.length - 1) * 4;
    }
    y += 11;

    // Identificação: rótulo em negrito, dois campos por linha
    const coluna = (util - 8) / 2;
    const campos = laudo.campos || [];
    doc.setTextColor(...LAUDO.preto);
    for (let i = 0; i < campos.length; i += 2) {
      const par = [campos[i], campos[i + 1]].filter(Boolean).map(([rotulo, valor]) =>
        quebrarLinhas(doc, [{ texto: `${rotulo}: `, negrito: true }, { texto: paraTexto(valor) }], coluna, 9.5));
      par.forEach((linhas, lado) => linhas.forEach((linha, n) =>
        desenharLinhaTexto(doc, linha, esquerda + lado * (coluna + 8), y + n * LAUDO.entrelinha)));
      y += Math.max(...par.map((linhas) => linhas.length)) * LAUDO.entrelinha + 0.6;
    }
    doc.setDrawColor(...LAUDO.linha);
    doc.setLineWidth(0.35);
    doc.line(esquerda, y - 1.5, esquerda + util, y - 1.5);
    y += 9;

    // Seções do texto
    const omitir = (laudo.omitirSecoes || []).map(normalizar);
    let secoes = conteudo.secoes.filter((secao) => !omitir.includes(normalizar(secao.titulo)));
    if (!secoes.length) secoes = [{ titulo: 'RESULTADO', linhas: ['Texto do laudo não disponível.'] }];
    // Texto estruturado abre com "SUSPEITA DIAGNÓSTICA / GRAU DE CERTEZA"
    // sem título: vira a impressão diagnóstica. Sem essa abertura (texto
    // antigo ou livre), a impressão vem dos campos gravados da análise.
    const abertura = secoes.length > 0 && !secoes[0].titulo;
    if (abertura && secoes.length > 1) {
      secoes[0] = { ...secoes[0], titulo: laudo.tituloAbertura || '' };
    } else if (laudo.impressao && laudo.impressao.length) {
      if (abertura) secoes[0] = { ...secoes[0], titulo: 'RESULTADO' };
      secoes = [{
        titulo: laudo.tituloAbertura || '',
        linhas: laudo.impressao.map(([rotulo, valor]) => `${rotulo}: ${paraTexto(valor)}`)
      }].concat(secoes);
    }

    secoes.forEach((secao) => {
      if (secao.titulo) {
        garantir(6 + LAUDO.entrelinha * 2); // título nunca fica sozinho no pé da página
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(...LAUDO.preto);
        doc.text(textoPDF(secao.titulo.toUpperCase()), esquerda, y);
        y += 5.6;
      }

      secao.linhas.forEach((linha) => {
        if (linha === '') {
          y += 2;
          return;
        }
        const marcador = linha.match(/^[-•*]\s+(.*)$/);
        const texto = marcador ? marcador[1] : linha;
        const recuo = marcador ? 4 : 0;
        const rotulo = texto.match(/^([^:.]{2,40}):\s+(.+)$/);
        const pedacos = rotulo
          ? [{ texto: `${rotulo[1]}: `, negrito: true }, { texto: rotulo[2] }]
          : [{ texto }];

        quebrarLinhas(doc, pedacos, util - recuo, LAUDO.corpo).forEach((partes, n) => {
          garantir(LAUDO.entrelinha);
          doc.setTextColor(...LAUDO.preto);
          if (marcador && n === 0) {
            doc.setFont('helvetica', 'normal');
            doc.text('•', esquerda + 0.8, y);
          }
          desenharLinhaTexto(doc, partes, esquerda + recuo, y);
          y += LAUDO.entrelinha;
        });
      });
      y += 5;
    });

    // Assinatura do médico responsável e nota final, sempre juntas
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    // Texto antigo, sem o aviso final da IA, recebe o mesmo aviso.
    const nota = doc.splitTextToSize(textoPDF(conteudo.nota || NOTA_PADRAO), util - 20);
    garantir(34 + nota.length * 3.5);
    y += 16;
    doc.setDrawColor(...LAUDO.linha);
    doc.setLineWidth(0.3);
    doc.line(largura / 2 - 35, y, largura / 2 + 35, y);
    const medico = laudo.medico || {};
    doc.setTextColor(...LAUDO.preto);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(textoPDF(medico.nome || 'Médico responsável'), largura / 2, y + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(textoPDF(medico.crm ? `CRM ${medico.crm}` : 'Assinatura e carimbo'), largura / 2, y + 8.8, { align: 'center' });
    y += 17;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...LAUDO.cinza);
    doc.text(nota, largura / 2, y, { align: 'center' });

    decorarLaudo(doc, emissao, laudo.paciente);
    return doc;
  }

  /* ---------- Planilha Excel ---------- */

  function nomeAba(titulo) {
    return String(titulo).replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 31) || 'Lista';
  }

  async function montarExcel(dados) {
    const ExcelJS = await carregarExcel();
    const livro = new ExcelJS.Workbook();
    livro.creator = 'HematoAI';
    livro.created = new Date();

    const total = dados.colunas.length;
    const aba = livro.addWorksheet(nomeAba(dados.titulo), {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
      pageSetup: {
        paperSize: 9,
        orientation: total > 5 ? 'landscape' : 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: '4:4'
      },
      headerFooter: { oddFooter: '&LHematoAI&RPágina &P de &N' }
    });

    const borda = { style: 'thin', color: { argb: ARGB.begeBorda } };

    const faixa = (numero, texto, estilo) => {
      aba.mergeCells(numero, 1, numero, total);
      const celula = aba.getCell(numero, 1);
      celula.value = texto;
      celula.font = estilo.font;
      celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estilo.fundo } };
      celula.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
      aba.getRow(numero).height = estilo.altura;
      // Linha de baixo do bloco de identificação (só a "Filtros aplicados"):
      // separa visualmente o cabeçalho informativo da tabela.
      if (estilo.bordaInferior) celula.border = { bottom: borda };
    };

    const emissao = dados.emissao;
    const autor = emissao.nome ? ` por ${emissao.nome}` : '';

    faixa(1, `HematoAI · ${dados.titulo}`, {
      font: { name: 'Calibri', size: 14, bold: true, color: { argb: ARGB.branco } },
      fundo: ARGB.vermelho,
      altura: 28
    });
    faixa(2, `Emitido em ${emissao.data} às ${emissao.hora}${autor} · ${contagem(dados.linhas.length)}`, {
      font: { name: 'Calibri', size: 9, color: { argb: ARGB.textoSuave } },
      fundo: ARGB.begeFundo,
      altura: 18
    });
    faixa(3, dados.filtros.length ? `Filtros aplicados: ${dados.filtros.join('  ·  ')}` : 'Sem filtros aplicados: lista completa.', {
      font: { name: 'Calibri', size: 9, italic: true, color: { argb: ARGB.textoSuave } },
      fundo: ARGB.begeFundo,
      altura: 18,
      bordaInferior: true
    });

    const cabecalho = aba.getRow(4);
    dados.colunas.forEach((coluna, i) => {
      const celula = cabecalho.getCell(i + 1);
      celula.value = coluna.titulo;
      celula.font = { name: 'Calibri', size: 10, bold: true, color: { argb: ARGB.branco } };
      celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.vermelhoEscuro } };
      celula.alignment = { vertical: 'middle', horizontal: coluna.alinhar || 'left', wrapText: true };
      celula.border = { top: borda, bottom: borda, left: borda, right: borda };
    });
    cabecalho.height = 20;

    dados.linhas.forEach((linha, indice) => {
      const fundo = indice % 2 === 1 ? ARGB.bege : ARGB.branco;
      const linhaPlanilha = aba.getRow(5 + indice);
      linha.forEach((valor, i) => {
        const coluna = dados.colunas[i];
        // coluna.cor(valor) devolve um ARGB (ex.: HematoExport.cores.verde)
        // para destacar o texto pelo próprio conteúdo — "Ativo" em verde,
        // "Desativado" em vermelho. Sem `cor`, usa o texto padrão.
        const corValor = typeof coluna.cor === 'function' ? coluna.cor(valor) : null;
        const celula = linhaPlanilha.getCell(i + 1);
        celula.value = valor;
        celula.font = { name: 'Calibri', size: 10, bold: !!coluna.destaque, color: { argb: corValor || ARGB.texto } };
        celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fundo } };
        celula.alignment = { vertical: 'middle', horizontal: coluna.alinhar || 'left', wrapText: true };
        celula.border = { top: borda, bottom: borda, left: borda, right: borda };
      });
    });

    aba.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: total } };

    dados.colunas.forEach((coluna, i) => {
      const maior = dados.linhas.reduce(
        (max, linha) => Math.max(max, ...String(linha[i]).split('\n').map((parte) => parte.length)),
        String(coluna.titulo).length
      );
      aba.getColumn(i + 1).width = Math.min(Math.max(maior + 3, 12), 60);
    });

    const buffer = await livro.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  /* ---------- Ações públicas ---------- */

  function baixarBlob(blob, nome) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function avisarSucesso(mensagem) {
    if (window.HematoAI && typeof window.HematoAI.showToast === 'function') {
      window.HematoAI.showToast(mensagem, 'success');
    }
  }

  function tratarFalha(erro) {
    console.error('[HematoAI] Falha na exportação:', erro);
    const semBiblioteca = erro && erro.codigo === 'BIBLIOTECA';
    const opcoes = {
      categoria: 'Exportação',
      titulo: 'Não foi possível gerar o arquivo',
      mensagem: semBiblioteca
        ? 'O gerador de arquivos não pôde ser carregado. Verifique sua conexão com a internet e tente novamente.'
        : 'Ocorreu um problema ao montar o arquivo. Tente novamente em instantes.'
    };
    if (typeof window.mostrarErro === 'function') {
      window.mostrarErro(erro, opcoes);
    }
  }

  function listaVazia() {
    if (typeof window.mostrarAviso === 'function') {
      window.mostrarAviso('Não há registros na listagem para exportar. Ajuste os filtros e tente novamente.', {
        categoria: 'Exportação',
        titulo: 'Lista vazia'
      });
    }
  }

  // Trava o botão enquanto o arquivo é montado: evita downloads duplicados
  // com cliques repetidos e mostra que algo está acontecendo.
  async function executar(botao, tarefa) {
    if (botao && botao.disabled) return;
    const conteudoOriginal = botao ? botao.innerHTML : '';

    if (botao) {
      botao.disabled = true;
      botao.setAttribute('aria-busy', 'true');
      botao.textContent = 'Gerando…';
    }

    try {
      await tarefa();
    } catch (erro) {
      tratarFalha(erro);
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.removeAttribute('aria-busy');
        botao.innerHTML = conteudoOriginal;
      }
    }
  }

  function exportarPDF(config, botao) {
    return executar(botao, async () => {
      const dados = prepararLista(config);
      if (!dados.linhas.length) return listaVazia();

      const doc = await montarPDFLista(dados);
      const nome = `hematoai-${dados.arquivo}-${dados.emissao.iso}.pdf`;
      doc.save(nome);
      avisarSucesso('PDF gerado com sucesso.');
    });
  }

  function exportarExcel(config, botao) {
    return executar(botao, async () => {
      const dados = prepararLista(config);
      if (!dados.linhas.length) return listaVazia();

      const blob = await montarExcel(dados);
      baixarBlob(blob, `hematoai-${dados.arquivo}-${dados.emissao.iso}.xlsx`);
      avisarSucesso('Planilha Excel gerada com sucesso.');
    });
  }

  // ficha = { titulo, subtitulo, arquivo, secoes: [{ titulo, campos: [[rotulo, valor]] }],
  //           textos: [{ titulo, conteudo }] }
  function exportarFichaPDF(ficha, botao) {
    return executar(botao, async () => {
      const doc = await montarPDFFicha(ficha);
      doc.save(`hematoai-${slug(ficha.arquivo || ficha.titulo)}-${dadosEmissao().iso}.pdf`);
      avisarSucesso('PDF gerado com sucesso.');
    });
  }

  // laudo: ver montarLaudoPDF.
  function exportarLaudoPDF(laudo, botao) {
    return executar(botao, async () => {
      const doc = await montarLaudoPDF(laudo);
      doc.save(`hematoai-${slug(laudo.arquivo || laudo.titulo)}-${dadosEmissao().iso}.pdf`);
      avisarSucesso('Laudo em PDF gerado com sucesso.');
    });
  }

  // config = { titulo, subtitulo?, arquivo?, colunas: [{ titulo, valor(registro),
  //            largura?, alinhar?, destaque?, cor?(valorTexto) }] | () => colunas,
  //            obterLinhas: () => registros, filtros?: [{ rotulo, id } | { rotulo, texto() }] }
  // `cor` só vale para o Excel: recebe o valor já formatado da célula e
  // devolve um ARGB (ex.: HematoExport.cores.verde) para colorir o texto,
  // ou nada para manter a cor padrão. O PDF não usa essa opção.
  function criarBotoes(alvo, config) {
    const destino = typeof alvo === 'string' ? document.getElementById(alvo) : alvo;
    if (!destino) {
      console.warn('[HematoAI] Local dos botões de exportação não encontrado:', alvo);
      return null;
    }

    const grupo = document.createElement('div');
    grupo.className = 'export-group';
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-label', 'Exportar listagem');
    grupo.innerHTML = `
      <button type="button" class="btn btn-sm btn-export btn-export-pdf" title="Exportar a lista em PDF">${ICONE_PDF}<span>PDF</span></button>
      <button type="button" class="btn btn-sm btn-export btn-export-excel" title="Exportar a lista em planilha Excel">${ICONE_EXCEL}<span>Excel</span></button>
    `;

    const [botaoPDF, botaoExcel] = grupo.querySelectorAll('button');
    botaoPDF.addEventListener('click', () => exportarPDF(config, botaoPDF));
    botaoExcel.addEventListener('click', () => exportarExcel(config, botaoExcel));

    destino.appendChild(grupo);
    return grupo;
  }

  window.HematoExport = {
    criarBotoes,
    exportarPDF,
    exportarExcel,
    exportarFichaPDF,
    exportarLaudoPDF,
    idadeEm,
    // Paleta para `coluna.cor(valor)` no Excel (ver criarBotoes).
    cores: { azul: ARGB.azul, verde: ARGB.verde, vermelho: ARGB.vermelho },
    // Expostos para inspeção/testes: montam o arquivo sem baixar.
    montarPDFLista: (config) => montarPDFLista(prepararLista(config)),
    montarPDFFicha,
    montarLaudoPDF,
    montarExcel: (config) => montarExcel(prepararLista(config))
  };
})();

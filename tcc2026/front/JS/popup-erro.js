/* ============================================================
   HematoAI — Pop-up de erro padronizado
   popup-erro.js · Incluir em todas as páginas (depois de navbar.js)

   Componente único usado para exibir QUALQUER erro tratado do
   sistema. Nunca usar alert nativo, stack trace ou código cru.

   Uso:
     mostrarErro("Mensagem já tratada.");
     mostrarErro(msg, { titulo: "Título curto" });
     mostrarErro(msg, { aoTentarNovamente: () => carregar() });
     mostrarErro(msg, { aoFechar: () => logout() });

   O cartão é compacto: nasce baixo e cresce só para baixo,
   conforme o tamanho do texto. Funciona no modo claro e escuro.
   ============================================================ */
(function () {
  'use strict';

  var TITULO_PADRAO = 'Não foi possível concluir';
  var MENSAGEM_PADRAO = 'Não foi possível concluir a operação. Tente novamente em instantes e, ' +
    'se o problema continuar, entre em contato com o suporte.';

  var CSS = [
    '.hai-erro-overlay{',
    '  position:fixed;inset:0;z-index:10000;',
    '  display:flex;align-items:flex-start;justify-content:center;',
    '  padding:20px 16px;',
    '  background:rgba(15,23,42,0.45);',
    '  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);',
    '  opacity:0;pointer-events:none;transition:opacity .18s ease;',
    '  overflow-y:auto;',
    '}',
    '.hai-erro-overlay.aberto{opacity:1;pointer-events:auto;}',

    '.hai-erro-card{',
    '  --hai-surface:#ffffff;',
    '  --hai-text-1:#0f172a;',
    '  --hai-text-2:#475569;',
    '  --hai-border:#e2e8f0;',
    '  --hai-accent:#b91c1c;',
    '  --hai-accent-hover:#991b1b;',
    '  --hai-accent-soft:#fee2e2;',
    '  --hai-shadow:0 12px 32px rgba(15,23,42,0.18),0 3px 10px rgba(15,23,42,0.10);',
    '  position:relative;box-sizing:border-box;',
    '  width:100%;max-width:620px;',
    '  background:var(--hai-surface);',
    '  border:1px solid var(--hai-border);',
    '  border-radius:16px;',
    '  box-shadow:var(--hai-shadow);',
    '  padding:14px 16px;',
    '  font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
    '  transform:translateY(-10px) scale(.98);',
    '  transition:transform .18s ease;',
    '  outline:none;',
    '}',
    '.hai-erro-overlay.aberto .hai-erro-card{transform:translateY(0) scale(1);}',

    '.hai-erro-topo{display:flex;align-items:flex-start;gap:10px;}',

    '.hai-erro-icone{',
    '  flex:0 0 auto;width:30px;height:30px;border-radius:50%;',
    '  display:flex;align-items:center;justify-content:center;',
    '  background:var(--hai-accent-soft);color:var(--hai-accent);',
    '}',
    '.hai-erro-icone svg{width:16px;height:16px;display:block;}',

    '.hai-erro-texto{flex:1 1 auto;min-width:0;padding-top:1px;}',

    '.hai-erro-titulo{',
    '  margin:0;font-size:.9rem;font-weight:700;line-height:1.3;',
    '  color:var(--hai-text-1);',
    '}',
    '.hai-erro-mensagem{',
    '  margin:3px 0 0;font-size:.8rem;font-weight:400;line-height:1.45;',
    '  color:var(--hai-text-2);',
    '  overflow-wrap:anywhere;',
    '}',

    '.hai-erro-fechar{',
    '  flex:0 0 auto;width:24px;height:24px;margin:-2px -4px 0 0;',
    '  display:flex;align-items:center;justify-content:center;',
    '  border:0;border-radius:6px;background:transparent;',
    '  color:var(--hai-text-2);cursor:pointer;line-height:0;',
    '  transition:background .15s ease,color .15s ease;',
    '}',
    '.hai-erro-fechar svg{width:14px;height:14px;display:block;}',
    '.hai-erro-fechar:hover{background:var(--hai-accent-soft);color:var(--hai-accent);}',
    '.hai-erro-fechar:focus-visible{outline:2px solid var(--hai-accent);outline-offset:2px;}',

    '.hai-erro-acao{',
    '  display:block;width:100%;margin-top:10px;',
    '  padding:8px 14px;border:0;border-radius:9px;',
    '  background:var(--hai-accent);color:#fff;',
    '  font-family:inherit;font-size:.82rem;font-weight:700;line-height:1.2;',
    '  cursor:pointer;transition:background .15s ease;',
    '}',
    '.hai-erro-acao:hover{background:var(--hai-accent-hover);}',
    '.hai-erro-acao:focus-visible{outline:2px solid var(--hai-accent);outline-offset:2px;}',
    '.hai-erro-acao[hidden]{display:none;}',

    /* Modo escuro: segue a classe/atributo já usados pelo tema do sistema. */
    '.dark-mode .hai-erro-card,',
    'body.dark-mode .hai-erro-card,',
    '[data-theme="dark"] .hai-erro-card{',
    '  --hai-surface:#1e293b;',
    '  --hai-text-1:#f1f5f9;',
    '  --hai-text-2:#cbd5e1;',
    '  --hai-border:#334155;',
    '  --hai-accent:#ef4444;',
    '  --hai-accent-hover:#dc2626;',
    '  --hai-accent-soft:rgba(239,68,68,0.18);',
    '  --hai-shadow:0 12px 32px rgba(0,0,0,0.55),0 3px 10px rgba(0,0,0,0.35);',
    '}',

    '@media (max-width:560px){',
    '  .hai-erro-overlay{padding:12px;}',
    '  .hai-erro-card{padding:12px 14px;border-radius:14px;}',
    '  .hai-erro-titulo{font-size:.86rem;}',
    '  .hai-erro-mensagem{font-size:.78rem;}',
    '}',

    '@media (prefers-reduced-motion:reduce){',
    '  .hai-erro-overlay,.hai-erro-card{transition:none;}',
    '}'
  ].join('\n');

  var ICONE_ALERTA =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"></circle>' +
    '<line x1="12" y1="8" x2="12" y2="12"></line>' +
    '<line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

  var ICONE_FECHAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"></line>' +
    '<line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  var overlay = null;
  var elTitulo = null;
  var elMensagem = null;
  var elAcao = null;
  var aoTentarNovamente = null;
  var aoFechar = null;
  var overflowAnterior = '';
  var elementoComFoco = null;

  function injetarEstilo() {
    if (document.getElementById('haiErroEstilo')) return;

    var estilo = document.createElement('style');
    estilo.id = 'haiErroEstilo';
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
  }

  function construir() {
    if (overlay) return overlay;

    injetarEstilo();

    overlay = document.createElement('div');
    overlay.id = 'haiErroOverlay';
    overlay.className = 'hai-erro-overlay';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'haiErroTitulo');
    overlay.setAttribute('aria-describedby', 'haiErroMensagem');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML =
      '<div class="hai-erro-card" tabindex="-1">' +
        '<div class="hai-erro-topo">' +
          '<span class="hai-erro-icone">' + ICONE_ALERTA + '</span>' +
          '<div class="hai-erro-texto">' +
            '<p class="hai-erro-titulo" id="haiErroTitulo"></p>' +
            '<p class="hai-erro-mensagem" id="haiErroMensagem"></p>' +
          '</div>' +
          '<button type="button" class="hai-erro-fechar" id="haiErroFechar" ' +
            'aria-label="Fechar aviso de erro">' + ICONE_FECHAR + '</button>' +
        '</div>' +
        '<button type="button" class="hai-erro-acao" id="haiErroAcao" hidden></button>' +
      '</div>';

    document.body.appendChild(overlay);

    elTitulo = overlay.querySelector('#haiErroTitulo');
    elMensagem = overlay.querySelector('#haiErroMensagem');
    elAcao = overlay.querySelector('#haiErroAcao');

    overlay.querySelector('#haiErroFechar').addEventListener('click', fecharErro);

    elAcao.addEventListener('click', function () {
      var acao = aoTentarNovamente;
      fecharErro();
      if (typeof acao === 'function') acao();
    });

    overlay.addEventListener('click', function (evento) {
      if (evento.target === overlay) fecharErro();
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && overlay.classList.contains('aberto')) {
        fecharErro();
      }
    });

    return overlay;
  }

  // Mensagens vindas da API chegam como texto puro: nada de innerHTML aqui,
  // senão um "msg" com HTML viraria injeção na tela.
  function textoTratado(valor, padrao) {
    var texto = (valor === null || valor === undefined) ? '' : String(valor).trim();
    return texto === '' || texto === 'undefined' || texto === 'null' ? padrao : texto;
  }

  function mostrarErro(mensagem, opcoes) {
    var config = opcoes || {};

    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function () {
        mostrarErro(mensagem, config);
      }, { once: true });
      return;
    }

    construir();

    elTitulo.textContent = textoTratado(config.titulo, TITULO_PADRAO);
    elMensagem.textContent = textoTratado(mensagem, MENSAGEM_PADRAO);

    aoTentarNovamente = typeof config.aoTentarNovamente === 'function'
      ? config.aoTentarNovamente
      : null;

    aoFechar = typeof config.aoFechar === 'function' ? config.aoFechar : null;

    if (aoTentarNovamente) {
      elAcao.textContent = textoTratado(config.rotuloAcao, 'Tentar novamente');
      elAcao.hidden = false;
    } else {
      elAcao.hidden = true;
    }

    if (!overlay.classList.contains('aberto')) {
      elementoComFoco = document.activeElement;
      overflowAnterior = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('aberto');

    // Foca o cartão (e não um botão) para o leitor de tela anunciar o aviso
    // sem acender o anel de foco em cima do botão logo na abertura.
    var cartao = overlay.querySelector('.hai-erro-card');
    if (cartao) cartao.focus({ preventScroll: true });
  }

  function fecharErro() {
    if (!overlay || !overlay.classList.contains('aberto')) return;

    overlay.classList.remove('aberto');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = overflowAnterior;

    var encerrar = aoFechar;
    aoTentarNovamente = null;
    aoFechar = null;

    if (elementoComFoco && typeof elementoComFoco.focus === 'function') {
      elementoComFoco.focus({ preventScroll: true });
    }
    elementoComFoco = null;

    if (typeof encerrar === 'function') encerrar();
  }

  window.mostrarErro = mostrarErro;
  window.fecharErro = fecharErro;

  // Mantém o mesmo namespace do restante do sistema sem apagar o que
  // navbar.js já tiver publicado.
  window.HematoAI = window.HematoAI || {};
  window.HematoAI.mostrarErro = mostrarErro;
  window.HematoAI.fecharErro = fecharErro;
})();

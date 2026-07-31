(function () {
  'use strict';

  const THEME_KEY = 'hematoai_theme';
  const DARK_THEME = 'dark';
  const root = document.documentElement;

  // Enquanto a página carrega as transições ficam suspensas, senão a troca de
  // tema é animada e produz o "flash" claro antes do escuro.
  root.classList.add('theme-loading');

  function syncRootTheme(theme) {
    const isDark = theme === DARK_THEME;
    root.classList.toggle('dark-mode', isDark);

    if (isDark) {
      root.setAttribute('data-theme', DARK_THEME);
    } else {
      root.removeAttribute('data-theme');
    }

    aplicarNoBody(isDark);
  }

  // As regras do modo escuro dependem da classe no <body>, que só existe depois
  // do <head>. Aplicamos assim que o elemento aparece, antes do primeiro desenho.
  function aplicarNoBody(isDark) {
    if (document.body) {
      document.body.classList.toggle('dark-mode', isDark);
      return;
    }

    new MutationObserver(function (_mutacoes, observador) {
      if (!document.body) return;
      document.body.classList.toggle('dark-mode', isDark);
      observador.disconnect();
    }).observe(root, { childList: true });
  }

  let savedTheme = 'light';

  try {
    savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  } catch (_) {
    // Mantém o tema claro quando o armazenamento não estiver disponível.
  }

  syncRootTheme(savedTheme);

  new MutationObserver(function () {
    const isDark = root.getAttribute('data-theme') === DARK_THEME;
    root.classList.toggle('dark-mode', isDark);
    aplicarNoBody(isDark);
  }).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  function liberarTransicoes() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.remove('theme-loading');
      });
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    liberarTransicoes();
  } else {
    document.addEventListener('DOMContentLoaded', liberarTransicoes, { once: true });
  }
})();

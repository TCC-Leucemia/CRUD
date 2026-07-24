

(function () {
  'use strict';
  const THEME_KEY = 'hematoai_theme';

  function aplicarTemaImediato() {
    const temaSalvo = localStorage.getItem(THEME_KEY) || 'light';
    const htmlRoot = document.getElementById('htmlRoot') || document.documentElement;

    if (temaSalvo === 'dark') {
      document.body.classList.add('dark-mode');
      htmlRoot.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      htmlRoot.removeAttribute('data-theme');
    }
  }

  aplicarTemaImediato();


  function aplicarTema(tema) {
    const htmlRoot = document.getElementById('htmlRoot') || document.documentElement;

    if (tema === 'dark') {
      document.body.classList.add('dark-mode');
      htmlRoot.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      htmlRoot.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_KEY, tema);
  }

  function carregarTema() {
    const temaSalvo = localStorage.getItem(THEME_KEY) || 'light';
    aplicarTema(temaSalvo);
    return temaSalvo;
  }

  function toggleTema(tema) {
    aplicarTema(tema);
    window.dispatchEvent(new CustomEvent('temaAlterado', { detail: { tema } }));
  }
  const NAV_CONFIG = {
    Médico: [
      { icon: '🏥', label: 'Dashboard', href: 'medico.html', id: 'dashboard' },
      { icon: '📋', label: 'Consultas', href: 'crudconsulta_med.html', id: 'consultas' },
      { icon: '🔬', label: 'Exames', href: 'crudexame.html', id: 'exames-crud' },
      { icon: '📊', label: 'Resultados', href: 'crudresultado.html', id: 'resultados' },
      { icon: '🤖', label: 'Análises IA', href: 'crudanaliseia.html', id: 'analises-ia' },
    ],
    Administrador: [
      { icon: '🏥', label: 'Dashboard', href: 'administrador.html', id: 'dashboard' },
      { icon: '🧑‍⚕️', label: 'Médicos', href: 'crudmedico.html', id: 'medicos' },
      { icon: '👥', label: 'Pacientes', href: 'crudpaciente.html', id: 'pacientes' },
      { icon: '📋', label: 'Consultas', href: 'crudconsulta.html', id: 'consultas' },
    ],
    Paciente: [
      { icon: '🏠', label: 'Meu Painel', href: 'paciente.html', id: 'paciente' },
      { icon: '📋', label: 'Meu Histórico', href: 'historicoPaciente.html', id: 'historico' },
      {icon: '🧬', label: "Resultados", href: "resultadosExame.html"},
    ],
  };

  const BOTTOM_NAV = {
    Administrador: [
      {
        icon: '⚙️',
        label: 'Configurações',
        href: 'configuracoes.html',
        id: 'config'
      },
      {
        icon: '🚪',
        label: 'Sair',
        href: '#',
        id: 'sair',
        cls: 'logout'
      }
    ],

    Médico: [
      {
        icon: '⚙️',
        label: 'Configurações',
        href: 'configuracoes_med.html',
        id: 'config'
      },
      {
        icon: '🚪',
        label: 'Sair',
        href: '#',
        id: 'sair',
        cls: 'logout'
      }
    ],

    Paciente: [
      {
        icon: '⚙️',
        label: 'Configurações',
        href: 'configuracoes_paciente.html',
        id: 'config'
      },
      {
        icon: '🚪',
        label: 'Sair',
        href: '#',
        id: 'sair',
        cls: 'logout'
      }
    ]
  };

  function getSession() {
    try { return JSON.parse(localStorage.getItem('hematoai_session')) || {}; }
    catch { return {}; }
  }
  function setSession(data) {
    localStorage.setItem('hematoai_session', JSON.stringify(data));
  }
  function clearSession() {
    localStorage.removeItem('hematoai_session');
  }

  function initSidebar(activePage) {
    const session = getSession();
    console.log("Sessão carregada:", session);
    const role = session.tipo || 'Administrador';
    const name = session.nome || 'Administrador';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    sidebarEl.innerHTML = `
      <div class="sidebar-user">
        <div class="sidebar-avatar">${initials}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${name}</div>
          <div class="sidebar-user-role">${role}</div>
        </div>
      </div>
      <div class="nav-section-label">Navegação</div>
      <nav id="navMain"></nav>
      <div class="sidebar-footer">
        <div class="sidebar-divider"></div>
        <div class="nav-section-label">Conta</div>
        <nav id="navBottom"></nav>
      </div>
    `;

    const mainNav = document.getElementById('navMain');
    const items = NAV_CONFIG[role] || NAV_CONFIG['Administrador'];
    items.forEach(item => {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'nav-item' + (activePage === item.id ? ' active' : '');
      a.innerHTML = `<span class="nav-icon">${item.icon}</span>${item.label}`;
      mainNav.appendChild(a);
    });

    const bottomNav = document.getElementById('navBottom');
    const bottomItems = BOTTOM_NAV[role] || BOTTOM_NAV["Administrador"];

    bottomItems.forEach(item => {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'nav-item' + (item.cls ? ` ${item.cls}` : '') + (activePage === item.id ? ' active' : '');
      a.id = `nav-${item.id}`;
      a.innerHTML = `<span class="nav-icon">${item.icon}</span>${item.label}`;
      bottomNav.appendChild(a);
    });

    const sairBtn = document.getElementById('nav-sair');
    if (sairBtn) {
      sairBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openLogoutModal();
      });
    }

    initMobileToggle();
    carregarTema();
  }

  /* ---------- Mobile Toggle ---------- */
  function initMobileToggle() {
    const btn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;

    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  /* ---------- Modal de Logout ---------- */
  function openLogoutModal() {
    let overlay = document.getElementById('logoutModal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'logoutModal';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <h2>Sair da conta</h2>
            <button class="btn-close-modal" id="closeLogout">✕</button>
          </div>
          <div class="modal-body" style="text-align:center;padding:36px 26px 20px">
            <div style="font-size:3rem;margin-bottom:14px">🚪</div>
            <p style="font-size:1rem;font-weight:700;color:var(--text-1);margin-bottom:8px">
              Deseja realmente sair?
            </p>
            <p style="font-size:0.85rem;color:var(--text-2);line-height:1.6">
              Sua sessão será encerrada com segurança.<br>
              Você precisará fazer login novamente para acessar o sistema.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="cancelLogout">Cancelar</button>
            <button class="btn btn-danger" id="confirmLogout">Confirmar saída</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      document.getElementById('closeLogout').addEventListener('click', () => closeModal(overlay));
      document.getElementById('cancelLogout').addEventListener('click', () => closeModal(overlay));
      document.getElementById('confirmLogout').addEventListener('click', () => {
        clearSession();
        showToast('Sessão encerrada com segurança.', 'success');
        setTimeout(() => { window.location.href = '../login.html'; }, 900);
      });
      overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
    }
    openModal(overlay);
  }

  /* ---------- Toast ---------- */
  function showToast(message, type = '') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span>${message}`;
    requestAnimationFrame(() => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3200);
    });
  }

  /* ---------- Modal helpers ---------- */
  function openModal(overlayEl) {
    overlayEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(overlayEl) {
    overlayEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---------- Confirm Dialog ---------- */
  function confirmDialog(message, onConfirm) {
    let overlay = document.getElementById('confirmDialog');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'confirmDialog';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-header">
          <h2>Confirmar ação</h2>
          <button class="btn-close-modal" id="closeConfirm">✕</button>
        </div>
        <div class="modal-body" style="text-align:center;padding:30px 26px 16px">
          <div style="font-size:2.5rem;margin-bottom:12px">⚠️</div>
          <p style="font-size:0.9rem;color:var(--text-1);line-height:1.6">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost"  id="cancelConfirm">Cancelar</button>
          <button class="btn btn-danger" id="okConfirm">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    openModal(overlay);

    const close = () => { closeModal(overlay); setTimeout(() => overlay.remove(), 300); };
    document.getElementById('closeConfirm').addEventListener('click', close);
    document.getElementById('cancelConfirm').addEventListener('click', close);
    document.getElementById('okConfirm').addEventListener('click', () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  /* ---------- Expose ---------- */
  window.HematoAI = {
    initSidebar,
    getSession,
    setSession,
    clearSession,
    showToast,
    openModal,
    closeModal,
    confirmDialog,
    openLogoutModal,
    carregarTema,
    aplicarTema,
    toggleTema,
    THEME_KEY,
  };
})();
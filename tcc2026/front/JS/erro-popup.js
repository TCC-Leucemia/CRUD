/* ============================================================
   HematoAI — Pop-up padronizado de erro
   erro-popup.js · Incluir em todas as páginas (públicas e internas)

   Componente único usado para qualquer erro mostrado ao usuário.
   Fica fixo no topo da tela, por cima do conteúdo (nunca empurra a
   página), e traduz erros técnicos em mensagens compreensíveis.

   Uso:
     mostrarErro("Não foi possível salvar a consulta.");
     mostrarErro(erro, { aoTentarNovamente: () => salvar() });
     mostrarAviso("Informe um CPF válido.");
     mostrarSucesso("Senha alterada com sucesso!");
   ============================================================ */
(function () {
  'use strict';

  const ID_POPUP = 'hematoaiPopupErro';
  const ID_ESTILO = 'hematoaiPopupErroEstilo';

  /* ---------- Estilo ---------- */
  // Usa os tokens já existentes do projeto (navbar.css nas telas internas,
  // :root inline nas telas públicas) com fallback, para o pop-up herdar
  // automaticamente a identidade visual e o modo escuro de cada página.
  const ESTILO = `
    #${ID_POPUP},
    #${ID_POPUP} * {
      box-sizing: border-box;
    }

    #${ID_POPUP} {
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(-16px);
      z-index: 10000;
      /* O pop-up acompanha o próprio conteúdo: mensagem curta gera caixa
         pequena, mensagem longa cresce até o limite e só então quebra linha. */
      width: max-content;
      min-width: min(340px, calc(100vw - 32px));
      max-width: min(600px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      text-align: center;
      background: var(--surface, #ffffff);
      color: var(--text-1, #111827);
      border: 1px solid var(--border, var(--gray-200, #e5e7eb));
      border-radius: var(--radius-xl, 18px);
      box-shadow: var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06));
      font-family: var(--font, 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
      padding: 12px 16px 14px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }

    #${ID_POPUP}.aberto {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }

    #${ID_POPUP} .popup-erro-fechar {
      position: absolute;
      top: 14px;
      right: 16px;
      background: transparent;
      border: none;
      font-size: 1.15rem;
      line-height: 1;
      padding: 6px;
      border-radius: var(--radius-sm, 6px);
      color: var(--text-3, var(--gray-300, #94a3b8));
      cursor: pointer;
      transition: var(--transition, all 0.2s ease);
    }

    #${ID_POPUP} .popup-erro-fechar:hover {
      color: var(--text-1, #111827);
      background: var(--bg, var(--gray-100, #f3f4f6));
    }

    #${ID_POPUP} .popup-erro-topo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    /* Ícone e badge lado a lado, no topo — "o que aconteceu" primeiro,
       bem colado no alto do pop-up. Título e mensagem vêm abaixo.
       O recuo lateral é a faixa reservada para o "x" de fechar: o badge
       quebra a linha ao chegar nela em vez de passar por baixo do botão. */
    #${ID_POPUP} .popup-erro-cabecalho {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      max-width: 100%;
      padding: 0 38px;
    }

    #${ID_POPUP} .popup-erro-icone {
      flex: 0 0 auto;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--red-light, var(--medical-red-light, #fee2e2));
      color: var(--red, var(--medical-red, #b91c1c));
    }

    #${ID_POPUP} .popup-erro-icone svg {
      width: 16px;
      height: 16px;
    }

    /* Badge em mais de uma linha: o ícone dobra para acompanhar a altura. */
    #${ID_POPUP} .popup-erro-cabecalho.multilinha .popup-erro-icone {
      width: 60px;
      height: 60px;
    }

    #${ID_POPUP} .popup-erro-cabecalho.multilinha .popup-erro-icone svg {
      width: 32px;
      height: 32px;
    }

    #${ID_POPUP} .popup-erro-badge {
      display: inline-block;
      background: var(--red-light, var(--medical-red-light, #fee2e2));
      color: var(--red, var(--medical-red, #b91c1c));
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      padding: 3px 10px;
      border-radius: 40px;
    }

    #${ID_POPUP} .popup-erro-titulo {
      font-size: 1.28rem;
      font-weight: 700;
      line-height: 1.25;
      color: var(--text-1, var(--gray-900, #111827));
    }

    #${ID_POPUP} .popup-erro-mensagem {
      margin: 14px 0 0;
      font-size: 0.92rem;
      line-height: 1.6;
      color: var(--text-2, var(--gray-700, #374151));
      overflow-wrap: break-word;
    }

    #${ID_POPUP} .popup-erro-acoes {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 22px;
    }

    #${ID_POPUP} .popup-erro-btn {
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 10px 26px;
      border-radius: 40px;
      cursor: pointer;
      transition: var(--transition, all 0.2s ease);
    }

    #${ID_POPUP} .popup-erro-btn-primario {
      background: var(--red, var(--medical-red, #b91c1c));
      border: 1.5px solid var(--red, var(--medical-red, #b91c1c));
      color: #ffffff;
    }

    #${ID_POPUP} .popup-erro-btn-primario:hover {
      background: var(--red-dark, var(--medical-red-dark, #991b1b));
      border-color: var(--red-dark, var(--medical-red-dark, #991b1b));
    }

    /* Variantes: aviso e sucesso reaproveitam a mesma estrutura */
    #${ID_POPUP}.tipo-aviso .popup-erro-icone,
    #${ID_POPUP}.tipo-aviso .popup-erro-badge {
      background: var(--yellow-light, #fffbeb);
      color: var(--yellow, #b45309);
    }

    #${ID_POPUP}.tipo-aviso .popup-erro-btn-primario {
      background: var(--yellow, #b45309);
      border-color: var(--yellow, #b45309);
    }

    #${ID_POPUP}.tipo-sucesso .popup-erro-icone,
    #${ID_POPUP}.tipo-sucesso .popup-erro-badge {
      background: var(--green-light, #f0fdf4);
      color: var(--green, #15803d);
    }

    #${ID_POPUP}.tipo-sucesso .popup-erro-btn-primario {
      background: var(--green, #15803d);
      border-color: var(--green, #15803d);
    }

    #${ID_POPUP}.tipo-info .popup-erro-icone,
    #${ID_POPUP}.tipo-info .popup-erro-badge {
      background: var(--blue-light, #eff6ff);
      color: var(--blue, #1d4ed8);
    }

    #${ID_POPUP}.tipo-info .popup-erro-btn-primario {
      background: var(--blue, #1d4ed8);
      border-color: var(--blue, #1d4ed8);
    }

    @media (max-width: 640px) {
      #${ID_POPUP} {
        top: 12px;
        min-width: min(280px, calc(100vw - 20px));
        max-width: calc(100vw - 20px);
        padding: 12px 14px 14px;
      }

      #${ID_POPUP} .popup-erro-cabecalho {
        padding: 0 36px;
      }

      #${ID_POPUP} .popup-erro-acoes .popup-erro-btn {
        flex: 1 1 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #${ID_POPUP} { transition: opacity 0.15s linear; }
    }
  `;

  const ICONES = {
    erro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.5"/></svg>',
    aviso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>',
    sucesso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16 9.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="7.5" x2="12" y2="7.5"/></svg>'
  };

  /* ---------- Tratamento do erro ---------- */
  // Qualquer entrada (Error, Response, texto técnico, objeto da API) vira uma
  // mensagem que o usuário consegue entender. O detalhe técnico fica no console.
  const PADROES_TECNICOS = [
    /failed to fetch/i,
    /networkerror/i,
    /load failed/i,
    /err_connection/i,
    /typeerror/i,
    /referenceerror/i,
    /syntaxerror/i,
    /unexpected token/i,
    /is not a function/i,
    /is not defined/i,
    /cannot read propert/i,
    /undefined|\[object object\]/i,
    /\bat\s.+:\d+:\d+/
  ];

  const MENSAGEM_GENERICA = 'Não foi possível concluir a operação. Tente novamente em instantes e, se o problema continuar, entre em contato com o suporte.';

  // Situações que merecem título próprio em vez do título genérico do status.
  // Sem `mensagem`, o texto exibido é o que a API mandou (ela já diz a causa
  // exata); a entrada só define categoria e título.
  const CASOS_CONHECIDOS = [
    {
      // MySQL desligado ou inalcançável (api/utils/tratamentoErros.js)
      padrao: /mysql n[aã]o est[aá] respondendo/i,
      categoria: 'Erro de conexão',
      titulo: 'Banco de dados indisponível'
    },
    {
      // MySQL de pé, mas recusou o usuário/senha configurados na API
      padrao: /acesso ao banco de dados|acesso foi recusado pelo mysql/i,
      categoria: 'Configuração do servidor',
      titulo: 'Acesso ao banco de dados recusado'
    },
    {
      padrao: /banco de dados do sistema n[aã]o foi encontrado/i,
      categoria: 'Configuração do servidor',
      titulo: 'Banco de dados não encontrado'
    },
    {
      padrao: /sess[aã]o expirada/i,
      categoria: 'Sessão',
      titulo: 'Sessão expirada'
    },
    {
      padrao: /sess[aã]o (inv[aá]lida|n[aã]o iniciada)/i,
      categoria: 'Sessão',
      titulo: 'Sessão não reconhecida'
    }
  ];

  function ehTexto(valor) {
    return typeof valor === 'string' && valor.trim() !== '';
  }

  function pareceTecnico(texto) {
    return PADROES_TECNICOS.some((padrao) => padrao.test(texto));
  }

  function buscarCasoConhecido(texto) {
    const caso = CASOS_CONHECIDOS.find((item) => item.padrao.test(texto));

    return caso
      ? { categoria: caso.categoria, titulo: caso.titulo, mensagem: caso.mensagem || texto }
      : null;
  }

  function traduzirStatus(status) {
    if (status === 0 || status === 503 || status === 502 || status === 504) {
      return {
        categoria: 'Erro de conexão',
        titulo: 'Servidor indisponível',
        mensagem: 'Não foi possível conectar ao servidor no momento. Verifique se o serviço está ativo e tente novamente.'
      };
    }

    if (status === 401) {
      return {
        categoria: 'Acesso não autorizado',
        titulo: 'Não foi possível autenticar',
        mensagem: 'Verifique suas credenciais e entre novamente.'
      };
    }

    if (status === 403) {
      return {
        categoria: 'Acesso negado',
        titulo: 'Permissão insuficiente',
        mensagem: 'Você não tem permissão para realizar esta ação com o perfil atual.'
      };
    }

    if (status === 404) {
      return {
        categoria: 'Não encontrado',
        titulo: 'Registro não encontrado',
        mensagem: 'O registro solicitado não foi encontrado. Ele pode ter sido removido ou alterado por outro usuário.'
      };
    }

    if (status === 409) {
      return {
        categoria: 'Conflito de dados',
        titulo: 'Registro já existente',
        mensagem: 'Já existe um registro com estas informações. Revise os dados e tente novamente.'
      };
    }

    if (status === 413) {
      return {
        categoria: 'Arquivo grande demais',
        titulo: 'Envio não concluído',
        mensagem: 'O arquivo enviado excede o tamanho permitido. Reduza o tamanho e tente novamente.'
      };
    }

    if (status >= 400 && status < 500) {
      return {
        categoria: 'Dados inválidos',
        titulo: 'Não foi possível continuar',
        mensagem: 'Revise as informações preenchidas e tente novamente.'
      };
    }

    if (status >= 500) {
      return {
        categoria: 'Erro no servidor',
        titulo: 'Falha ao processar a solicitação',
        mensagem: 'O servidor não conseguiu concluir a operação. Tente novamente em instantes.'
      };
    }

    return null;
  }

  function tratarErro(erro) {
    const padrao = {
      categoria: 'Erro',
      titulo: 'Não foi possível concluir',
      mensagem: MENSAGEM_GENERICA
    };

    if (erro === null || erro === undefined) {
      return padrao;
    }

    // Response do fetch ou objeto de resposta da API ({ status, msg })
    const status = typeof erro.status === 'number' ? erro.status : null;
    const mensagemApi = ehTexto(erro.msg) ? erro.msg.trim()
      : ehTexto(erro.mensagem) ? erro.mensagem.trim()
      : null;

    if (mensagemApi) {
      const conhecido = buscarCasoConhecido(mensagemApi);
      if (conhecido) return conhecido;
    }

    if (status !== null) {
      const porStatus = traduzirStatus(status) || padrao;

      // A API já devolve mensagens tratadas (ex.: "Perfil já cadastrado").
      return mensagemApi && !pareceTecnico(mensagemApi)
        ? { ...porStatus, mensagem: mensagemApi }
        : porStatus;
    }

    if (mensagemApi) {
      return pareceTecnico(mensagemApi) ? padrao : { ...padrao, mensagem: mensagemApi };
    }

    const texto = ehTexto(erro) ? erro.trim()
      : (erro instanceof Error && ehTexto(erro.message)) ? erro.message.trim()
      : null;

    if (!texto) {
      return padrao;
    }

    const conhecido = buscarCasoConhecido(texto);

    if (conhecido) {
      return conhecido;
    }

    // Falha de rede: o navegador só informa "Failed to fetch".
    if (/failed to fetch|networkerror|load failed|err_connection/i.test(texto)) {
      return {
        categoria: 'Erro de conexão',
        titulo: 'Servidor indisponível',
        mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão e se o serviço está ativo, depois tente novamente.'
      };
    }

    // Mensagens como "Erro no servidor (500)" carregam o código cru: usa o
    // texto tratado do status em vez de mostrar o número para o usuário.
    const codigo = texto.match(/\b(4\d{2}|5\d{2})\b/);

    if (codigo) {
      return traduzirStatus(Number(codigo[1])) || padrao;
    }

    return pareceTecnico(texto) ? padrao : { ...padrao, mensagem: texto };
  }

  /* ---------- Renderização ---------- */
  function garantirEstilo() {
    if (document.getElementById(ID_ESTILO)) return;

    const estilo = document.createElement('style');
    estilo.id = ID_ESTILO;
    estilo.textContent = ESTILO;
    document.head.appendChild(estilo);
  }

  function garantirPopup() {
    let popup = document.getElementById(ID_POPUP);

    if (!popup) {
      popup = document.createElement('div');
      popup.id = ID_POPUP;
      popup.setAttribute('role', 'alertdialog');
      popup.setAttribute('aria-live', 'assertive');
      popup.setAttribute('aria-atomic', 'true');
      document.body.appendChild(popup);
    }

    return popup;
  }

  // Executado quando o usuário fecha o pop-up (ex.: voltar para o login).
  let aoFecharAtual = null;

  function fecharPopup() {
    const popup = document.getElementById(ID_POPUP);
    if (popup) popup.classList.remove('aberto');

    const callback = aoFecharAtual;
    aoFecharAtual = null;

    if (typeof callback === 'function') callback();
  }

  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  // O badge só quebra em duas linhas quando a categoria é longa (o recuo
  // lateral do cabeçalho reserva a faixa do "x"). Quando isso acontece, o
  // ícone dobra de tamanho para acompanhar a altura do texto.
  function ajustarCabecalho(popup) {
    const cabecalho = popup.querySelector('.popup-erro-cabecalho');
    const badge = popup.querySelector('.popup-erro-badge');

    if (!cabecalho || !badge) return;

    cabecalho.classList.remove('multilinha');

    // Um retângulo por linha de texto: mais de um significa que quebrou.
    const intervalo = document.createRange();
    intervalo.selectNodeContents(badge);

    if (intervalo.getClientRects().length > 1) {
      cabecalho.classList.add('multilinha');
    }
  }

  function abrir(dados, opcoes) {
    const configuracao = opcoes || {};
    const tipo = configuracao.tipo || 'erro';

    garantirEstilo();

    const popup = garantirPopup();
    const podeTentarNovamente = typeof configuracao.aoTentarNovamente === 'function'
      || (tipo === 'erro' && dados.categoria === 'Erro de conexão');

    aoFecharAtual = typeof configuracao.aoFechar === 'function' ? configuracao.aoFechar : null;

    popup.className = `tipo-${tipo}`;
    popup.innerHTML = `
      <button class="popup-erro-fechar" type="button" aria-label="Fechar">✕</button>
      <div class="popup-erro-topo">
        <div class="popup-erro-cabecalho">
          <div class="popup-erro-icone" aria-hidden="true">${ICONES[tipo] || ICONES.erro}</div>
          <span class="popup-erro-badge">${escapar(dados.categoria)}</span>
        </div>
        <div class="popup-erro-titulo">${escapar(dados.titulo)}</div>
      </div>
      <p class="popup-erro-mensagem">${escapar(dados.mensagem)}</p>
      ${podeTentarNovamente ? `
      <div class="popup-erro-acoes">
        <button class="popup-erro-btn popup-erro-btn-primario" type="button" data-acao="repetir">Tentar novamente</button>
      </div>` : ''}
    `;

    // Fechar é só pelo "x" do canto (ou pela tecla Esc): sem botão no rodapé.
    popup.querySelector('.popup-erro-fechar').addEventListener('click', fecharPopup);

    const botaoRepetir = popup.querySelector('[data-acao="repetir"]');

    if (botaoRepetir) {
      botaoRepetir.addEventListener('click', () => {
        // Repetir não é "fechar": não dispara o callback de fechamento.
        aoFecharAtual = null;
        fecharPopup();

        if (typeof configuracao.aoTentarNovamente === 'function') {
          configuracao.aoTentarNovamente();
        } else {
          window.location.reload();
        }
      });
    }

    ajustarCabecalho(popup);

    // Reflow síncrono em vez de requestAnimationFrame: a animação continua
    // igual, mas o pop-up também aparece quando a aba está em segundo plano
    // (onde os quadros de animação ficam suspensos).
    void popup.offsetHeight;
    popup.classList.add('aberto');
  }

  function mostrarErro(erro, opcoes) {
    const configuracao = opcoes || {};

    // O detalhe técnico continua disponível para quem desenvolve.
    if (erro instanceof Error) {
      console.error('[HematoAI] Erro tratado:', erro);
    }

    const dados = tratarErro(erro);

    abrir(
      {
        categoria: configuracao.categoria || dados.categoria,
        titulo: configuracao.titulo || dados.titulo,
        mensagem: configuracao.mensagem || dados.mensagem
      },
      { ...configuracao, tipo: 'erro' }
    );
  }

  function mostrarAviso(mensagem, opcoes) {
    const configuracao = opcoes || {};

    abrir(
      {
        categoria: configuracao.categoria || 'Atenção',
        titulo: configuracao.titulo || 'Revise as informações',
        mensagem: ehTexto(mensagem) ? mensagem : MENSAGEM_GENERICA
      },
      { ...configuracao, tipo: 'aviso' }
    );
  }

  function mostrarSucesso(mensagem, opcoes) {
    const configuracao = opcoes || {};

    abrir(
      {
        categoria: configuracao.categoria || 'Tudo certo',
        titulo: configuracao.titulo || 'Operação concluída',
        mensagem: ehTexto(mensagem) ? mensagem : 'Operação concluída com sucesso.'
      },
      { ...configuracao, tipo: 'sucesso' }
    );
  }

  function mostrarInfo(mensagem, opcoes) {
    const configuracao = opcoes || {};

    abrir(
      {
        categoria: configuracao.categoria || 'Informação',
        titulo: configuracao.titulo || 'Aviso do sistema',
        mensagem: ehTexto(mensagem) ? mensagem : ''
      },
      { ...configuracao, tipo: 'info' }
    );
  }

  /* ---------- Rede de segurança ---------- */
  // Erro que escapa de um try/catch continuaria invisível para o usuário e
  // deixaria a tela travada sem explicação: aqui ele vira o pop-up padrão.
  let ultimoErroGlobal = '';

  function tratarErroGlobal(origem) {
    const assinatura = String(origem && origem.message ? origem.message : origem);

    // Evita empilhar o mesmo erro repetido (ex.: dentro de um loop de render).
    if (assinatura === ultimoErroGlobal) return;

    ultimoErroGlobal = assinatura;
    setTimeout(() => { ultimoErroGlobal = ''; }, 4000);

    abrir(tratarErro(origem), { tipo: 'erro' });
  }

  window.addEventListener('error', (evento) => {
    console.error('[HematoAI] Erro não tratado:', evento.error || evento.message);
    tratarErroGlobal(evento.error || evento.message);
  });

  window.addEventListener('unhandledrejection', (evento) => {
    console.error('[HematoAI] Promessa rejeitada sem tratamento:', evento.reason);
    tratarErroGlobal(evento.reason);
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') fecharPopup();
  });

  /* ---------- Expor ---------- */
  window.mostrarErro = mostrarErro;
  window.mostrarAviso = mostrarAviso;
  window.mostrarSucesso = mostrarSucesso;
  window.mostrarInfo = mostrarInfo;
  window.fecharPopupErro = fecharPopup;
  window.tratarErro = tratarErro;

  window.HematoAIErro = {
    mostrarErro,
    mostrarAviso,
    mostrarSucesso,
    mostrarInfo,
    fecharPopup,
    tratarErro
  };
})();

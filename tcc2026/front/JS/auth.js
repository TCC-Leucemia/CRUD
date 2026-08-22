window.API_URL = "http://localhost:3000";

function getToken() {
    return localStorage.getItem("token");
}

function getUsuario() {
    return JSON.parse(
        localStorage.getItem("usuario")
    );
}

function limparSessao() {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("hematoai_session");
}

function logout() {

    limparSessao();

    window.location.href = "../login.html";
}

function verificarLogin() {

    const token = getToken();

    if (!token) {

        // O redirecionamento espera o usuário fechar o pop-up, senão a
        // navegação apaga a mensagem antes de ela ser lida.
        mostrarErro(
            "É necessário entrar no sistema para acessar esta página.",
            {
                categoria: "Sessão",
                titulo: "Você não está conectado",
                aoFechar: () => { window.location.href = "../login.html"; }
            }
        );

        return false;
    }

    return true;
}

function verificarPerfil(...perfisPermitidos) {

    if (!verificarLogin()) {
        return false;
    }

    const usuario = getUsuario();

    if (
        !usuario ||
        !perfisPermitidos.includes(
            usuario.role
        )
    ) {

        // A sessão cai na hora (o token deixa de valer para a API); só o
        // redirecionamento espera a leitura da mensagem.
        limparSessao();

        mostrarErro(
            "Você não tem permissão para acessar esta página com o perfil atual.",
            {
                categoria: "Acesso negado",
                titulo: "Permissão insuficiente",
                aoFechar: () => { window.location.href = "../login.html"; }
            }
        );

        return false;
    }

    return true;
}

async function apiFetch(url, options = {}) {

    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
    };

    const resposta = await fetch(
        API_URL + url,
        {
            ...options,
            headers
        }
    );

    return resposta;
}

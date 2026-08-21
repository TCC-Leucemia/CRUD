window.API_URL = "http://localhost:3000";

function getToken() {
    return localStorage.getItem("token");
}

function getUsuario() {

    try {

        return JSON.parse(
            localStorage.getItem("usuario")
        );

    } catch (erro) {

        // Sessão gravada pela metade ou corrompida: trata como "sem usuário"
        // em vez de derrubar a página com um erro de parse.
        console.error("Sessão inválida no armazenamento local:", erro);

        return null;
    }
}

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("hematoai_session");

    window.location.href = "../login.html";
}

function verificarLogin() {

    const token = getToken();

    if (!token) {

        mostrarErro(
            "Faça login para continuar. Sua sessão não foi encontrada.",
            {
                titulo: "Sessão não encontrada",
                aoFechar: () => {
                    window.location.href = "../login.html";
                }
            }
        );

        return false;
    }

    return true;
}

function verificarPerfil(...perfisPermitidos) {

    // Sem sessão o aviso de login já foi exibido: não empilha um segundo
    // pop-up por cima dele.
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

        mostrarErro(
            "Você não tem permissão para acessar esta página.",
            {
                titulo: "Acesso não permitido",
                aoFechar: logout
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

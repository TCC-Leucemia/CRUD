const API_URL = "http://localhost:3000";

function getToken() {
    return localStorage.getItem("token");
}

function getUsuario() {
    return JSON.parse(
        localStorage.getItem("usuario")
    );
}

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    window.location.href = "../login.html";
}

function verificarLogin() {

    const token = getToken();

    if (!token) {

        alert("Faça login primeiro.");

        window.location.href = "../login.html";
    }
}

function verificarPerfil(...perfisPermitidos) {

    verificarLogin();

    const usuario = getUsuario();

    if (
        !usuario ||
        !perfisPermitidos.includes(
            usuario.role
        )
    ) {

        alert(
            "Você não tem permissão para acessar esta página."
        );

        logout();
    }
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
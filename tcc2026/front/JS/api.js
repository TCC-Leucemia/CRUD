function getHeaders() {

    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function get(url) {

    const resposta = await fetch(
        API_URL + url,
        {
            headers: getHeaders()
        }
    );

    return resposta;
}

async function post(url, dados) {

    const resposta = await fetch(
        API_URL + url,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(dados)
        }
    );

    return resposta;
}

async function put(url, dados) {

    const resposta = await fetch(
        API_URL + url,
        {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(dados)
        }
    );

    return resposta;
}

async function del(url) {

    const resposta = await fetch(
        API_URL + url,
        {
            method: "DELETE",
            headers: getHeaders()
        }
    );

    return resposta;
}

async function login(email, senha) {

    const resposta = await fetch(
        `${API_URL}/auth`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                senha
            })
        }
    );

    return await resposta.json();
}

window.get = get;
window.post = post;
window.put = put;
window.del = del;
window.login = login;
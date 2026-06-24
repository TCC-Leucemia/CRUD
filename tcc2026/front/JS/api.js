const API_URL = "http://localhost:3000";

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
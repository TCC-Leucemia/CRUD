const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class LoginMiddleware {

    validateBody = (req, res, next) => {

        let { email, senha, tipo } = req.body;

        if (!email || email.trim() === "") {
            throw new ErrorResponse(400, "Email obrigatório");
        }

        email = email.trim().toLowerCase();

        if (/[<>]/.test(email)) {
            throw new ErrorResponse(400, "Email inválido");
        }

        if (email.length > 100) {
            throw new ErrorResponse(400, "Email muito grande");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new ErrorResponse(400, "Email inválido");
        }


        if (senha && senha.trim() !== "") {
            senha = senha.trim();

            if (senha.length < 6) {
                throw new ErrorResponse(400, "Senha deve possuir ao menos 6 caracteres");
            }

            if (senha.length > 255) {
                throw new ErrorResponse(400, "Senha muito grande");
            }

            req.body.senha = senha;

        } else {

            delete req.body.senha;

        }

        if (!tipo || tipo.trim() === "") {
            throw new ErrorResponse(400, "Tipo obrigatório");
        }

        const tiposPermitidos = [
            "Médico",
            "Paciente",
            "Administrador"
        ];

        if (!tiposPermitidos.includes(tipo)) {
            throw new ErrorResponse(400, "Tipo inválido");
        }

        req.body.email = email;
        req.body.senha = senha;
        req.body.tipo = tipo.trim();

        next();
    }

    validateAlterarCredenciais = (req, res, next) => {

        let {
            senhaAtual,
            novoEmail,
            novaSenha
        } = req.body;

        if (!senhaAtual || senhaAtual.trim() === "") {
            throw new ErrorResponse(
                400,
                "Senha atual obrigatória"
            );
        }

        senhaAtual = senhaAtual.trim();

        if (!novoEmail && !novaSenha) {
            throw new ErrorResponse(
                400,
                "Informe um novo e-mail ou uma nova senha"
            );
        }

        if (novoEmail) {

            novoEmail = novoEmail.trim().toLowerCase();

            const regex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!regex.test(novoEmail)) {

                throw new ErrorResponse(
                    400,
                    "Email inválido"
                );
            }

            req.body.novoEmail = novoEmail;
        }

        if (novaSenha) {

            novaSenha = novaSenha.trim();

            if (novaSenha.length < 8) {

                throw new ErrorResponse(
                    400,
                    "Senha deve possuir no mínimo 8 caracteres"
                );
            }

            req.body.novaSenha = novaSenha;
        }

        req.body.senhaAtual = senhaAtual;

        next();
    }

    validateLogin = (req, res, next) => {

        req.body = req.body && typeof req.body === "object" ? req.body : {};
        let { email, senha, tipo } = req.body;

        if (!email || email.trim() === "") {
            throw new ErrorResponse(400, "Email obrigatório");
        }

        email = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new ErrorResponse(400, "Email inválido");
        }

        if (!senha || senha.trim() === "") {
            throw new ErrorResponse(400, "Senha obrigatória");
        }

        senha = senha.trim();

        if (tipo !== undefined) {
            if (
                typeof tipo !== "string" ||
                !["Médico", "Paciente", "Administrador"].includes(tipo.trim())
            ) {
                throw new ErrorResponse(400, "Tipo inválido");
            }
            req.body.tipo = tipo.trim();
        }

        req.body.email = email;
        req.body.senha = senha;

        next();
    }

    validateSelecaoPerfil = (req, res, next) => {

        req.body = req.body && typeof req.body === "object" ? req.body : {};
        let { tokenPerfil, tipo } = req.body;

        if (
            typeof tokenPerfil !== "string" ||
            !/^[a-f0-9]{64}$/.test(tokenPerfil.trim())
        ) {
            throw new ErrorResponse(
                401,
                "Seleção de perfil inválida ou expirada"
            );
        }

        if (
            typeof tipo !== "string" ||
            !["Médico", "Paciente"].includes(tipo.trim())
        ) {
            throw new ErrorResponse(400, "Tipo de perfil inválido");
        }

        req.body.tokenPerfil = tokenPerfil.trim();
        req.body.tipo = tipo.trim();

        next();
    }
}

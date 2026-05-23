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


        if (!senha || senha.trim() === "") {
            throw new ErrorResponse(400, "Senha obrigatória");
        }

        senha = senha.trim();

        if (senha.length < 6) {
            throw new ErrorResponse(400, "Senha deve possuir ao menos 6 caracteres");
        }

        if (senha.length > 255) {
            throw new ErrorResponse(400, "Senha muito grande");
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

    validateLogin = (req, res, next) => {

        let { email, senha } = req.body;

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

        req.body.email = email;
        req.body.senha = senha;

        next();
    }
}
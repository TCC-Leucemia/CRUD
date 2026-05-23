const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class AdministradoresMiddleware {

    validateBody = (req, res, next) => {

        const {
            cpf,
            nome,
            email,
            telefone,
            id_usuario
        } = req.body;

        if (
            !cpf ||
            !nome ||
            !email ||
            !telefone ||
            !id_usuario
        ) {
            throw new ErrorResponse(400, "Preencha todos os campos");
        }

        // CPF
        if (!this.validarCPF(cpf)) {
            throw new ErrorResponse(400, "CPF inválido");
        }

        // EMAIL
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new ErrorResponse(400, "Email inválido");
        }

        // TELEFONE
        const telefoneRegex =
            /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

        if (!telefoneRegex.test(telefone)) {
            throw new ErrorResponse(400, "Telefone inválido");
        }

        next();
    }

    validarCPF(cpf) {

        cpf = cpf.replace(/\D/g, '');

        if (cpf.length !== 11) return false;

        if (/^(\d)\1+$/.test(cpf)) return false;

        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }

        resto = (soma * 10) % 11;

        if (resto === 10 || resto === 11) {
            resto = 0;
        }

        if (resto !== parseInt(cpf.substring(9, 10))) {
            return false;
        }

        soma = 0;

        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        resto = (soma * 10) % 11;

        if (resto === 10 || resto === 11) {
            resto = 0;
        }

        if (resto !== parseInt(cpf.substring(10, 11))) {
            return false;
        }

        return true;
    }
}
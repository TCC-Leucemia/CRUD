const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class AdministradoresMiddleware {

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

    validateBody = (req, res, next) => {

        let {
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
            throw new ErrorResponse(
                400,
                "Preencha todos os campos"
            );
        }

        cpf = cpf.toString().trim();
        nome = nome.toString().trim();
        email = email.toString().trim().toLowerCase();
        telefone = telefone.toString().trim();

        const xssRegex = /[<>]/;

        if (
            xssRegex.test(nome) ||
            xssRegex.test(email) ||
            xssRegex.test(telefone)
        ) {
            throw new ErrorResponse(
                400,
                "Dados inválidos"
            );
        }

        if (!this.validarCPF(cpf)) {
            throw new ErrorResponse(
                400,
                "CPF inválido"
            );
        }

        const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;

        if (!nomeRegex.test(nome)) {
            throw new ErrorResponse(
                400,
                "Nome inválido"
            );
        }

        if (nome.length < 3 || nome.length > 150) {
            throw new ErrorResponse(
                400,
                "Nome inválido"
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new ErrorResponse(
                400,
                "Email inválido"
            );
        }

        if (email.length < 5 || email.length > 150) {
            throw new ErrorResponse(
                400,
                "Email inválido"
            );
        }

        const telefoneRegex =
            /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

        if (!telefoneRegex.test(telefone)) {
            throw new ErrorResponse(
                400,
                "Telefone inválido"
            );
        }

        if (isNaN(id_usuario)) {
            throw new ErrorResponse(
                400,
                "ID do usuário inválido"
            );
        }

        id_usuario = Number(id_usuario);

        if (!Number.isInteger(id_usuario)) {
            throw new ErrorResponse(
                400,
                "ID do usuário inválido"
            );
        }

        if (id_usuario <= 0) {
            throw new ErrorResponse(
                400,
                "ID do usuário inválido"
            );
        }

        next();
    }

    validateUpdate = (req, res, next) => {

        let {
            nome,
            email,
            telefone
        } = req.body;

        if (
            !nome &&
            !email &&
            !telefone
        ) {
            throw new ErrorResponse(
                400,
                "Envie ao menos um campo"
            );
        }

        const xssRegex = /[<>]/;

        if (nome !== undefined) {

            nome = nome.toString().trim();

            const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;

            if (
                xssRegex.test(nome) ||
                !nomeRegex.test(nome)
            ) {
                throw new ErrorResponse(
                    400,
                    "Nome inválido"
                );
            }

            if (nome.length < 3 || nome.length > 150) {
                throw new ErrorResponse(
                    400,
                    "Nome inválido"
                );
            }
        }

        if (email !== undefined) {

            email = email.toString().trim().toLowerCase();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                xssRegex.test(email) ||
                !emailRegex.test(email)
            ) {
                throw new ErrorResponse(
                    400,
                    "Email inválido"
                );
            }

            if (email.length < 5 || email.length > 150) {
                throw new ErrorResponse(
                    400,
                    "Email inválido"
                );
            }
        }

        if (telefone !== undefined) {

            telefone = telefone.toString().trim();

            const telefoneRegex =
                /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

            if (
                xssRegex.test(telefone) ||
                !telefoneRegex.test(telefone)
            ) {
                throw new ErrorResponse(
                    400,
                    "Telefone inválido"
                );
            }
        }

        next();
    }

    validateId = (req, res, next) => {

        const { id_administrador } = req.params;

        if (!id_administrador || isNaN(id_administrador)) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        if (Number(id_administrador) <= 0) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        next();
    }
}
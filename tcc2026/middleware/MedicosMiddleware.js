const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class MedicosMiddleware {

    validateBody = (req, res, next) => {

        console.log("🔷 MedicosMiddleware.validateBody()");

        let {
            crm,
            nome,
            email,
            cpf,
            telefone,
            especialidade,
            id_usuario,
            id_endereco
        } = req.body;


        if (
            !crm ||
            !nome ||
            !email ||
            !cpf ||
            !especialidade ||
            !id_usuario ||
            !id_endereco
        ) {
            throw new ErrorResponse(400, "Campos obrigatórios não preenchidos");
        }


        crm = crm.toString().trim();
        nome = nome.trim();
        email = email.trim().toLowerCase();
        cpf = cpf.replace(/\D/g, '');
        especialidade = especialidade.trim();


        const xssRegex = /[<>]/;

        if (
            xssRegex.test(nome) ||
            xssRegex.test(email) ||
            xssRegex.test(especialidade)
        ) {
            throw new ErrorResponse(400, "Caracteres inválidos detectados");
        }


        const crmRegex = /^\d{4,11}$/;

        if (!crmRegex.test(crm)) {
            throw new ErrorResponse(400, "CRM inválido");
        }


        if (nome.length < 3) {
            throw new ErrorResponse(400, "Nome muito curto");
        }

        if (nome.length > 200) {
            throw new ErrorResponse(400, "Nome muito grande");
        }

        const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;

        if (!nomeRegex.test(nome)) {
            throw new ErrorResponse(400, "Nome inválido");
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new ErrorResponse(400, "Email inválido");
        }

        if (email.length > 200) {
            throw new ErrorResponse(400, "Email muito grande");
        }


        if (telefone) {

            telefone = telefone.trim();

            const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

            if (!telefoneRegex.test(telefone)) {
                throw new ErrorResponse(400, "Telefone inválido");
            }
        }


        if (!this.validarCPF(cpf)) {
            throw new ErrorResponse(400, "CPF inválido");
        }


        if (especialidade.length < 3) {
            throw new ErrorResponse(400, "Especialidade inválida");
        }

        if (especialidade.length > 50) {
            throw new ErrorResponse(400, "Especialidade muito grande");
        }


        if (
            isNaN(id_usuario) ||
            id_usuario <= 0
        ) {
            throw new ErrorResponse(400, "ID usuário inválido");
        }

        if (
            isNaN(id_endereco) ||
            id_endereco <= 0
        ) {
            throw new ErrorResponse(400, "ID endereço inválido");
        }

        next();
    }

    validateUpdate = (req, res, next) => {

        console.log("🔷 MedicosMiddleware.validateUpdate()");

        let {
            nome,
            email,
            cpf,
            telefone,
            especialidade
        } = req.body;

        if (
            !nome &&
            !email &&
            !cpf &&
            !telefone &&
            !especialidade
        ) {
            throw new ErrorResponse(400, "Envie ao menos um campo");
        }

        const xssRegex = /[<>]/;


        if (nome) {

            nome = nome.trim();

            if (xssRegex.test(nome)) {
                throw new ErrorResponse(400, "Nome inválido");
            }

            const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;

            if (!nomeRegex.test(nome)) {
                throw new ErrorResponse(400, "Nome inválido");
            }
        }
        if (email) {

            email = email.trim().toLowerCase();

            if (xssRegex.test(email)) {
                throw new ErrorResponse(400, "Email inválido");
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                throw new ErrorResponse(400, "Email inválido");
            }
        }

        if (cpf) {

            cpf = cpf.replace(/\D/g, '');

            if (!this.validarCPF(cpf)) {
                throw new ErrorResponse(400, "CPF inválido");
            }
        }

        if (telefone) {

            telefone = telefone.trim();

            const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

            if (!telefoneRegex.test(telefone)) {
                throw new ErrorResponse(400, "Telefone inválido");
            }
        }


        if (especialidade) {

            especialidade = especialidade.trim();

            if (xssRegex.test(especialidade)) {
                throw new ErrorResponse(400, "Especialidade inválida");
            }

            if (especialidade.length > 50) {
                throw new ErrorResponse(400, "Especialidade muito grande");
            }
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

        if (resto === 10 || resto === 11) resto = 0;

        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;

        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        resto = (soma * 10) % 11;

        if (resto === 10 || resto === 11) resto = 0;

        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }
}
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class PacientesMiddleware {

    validateBody = (req, res, next) => {
        console.log("🔷 PacientesMiddleware.validateBody()");

        let {
            cpf,
            nome,
            data_nasc,
            sexo,
            email,
            telefone,
            id_usuario,
            id_endereco
        } = req.body;

        if (
            !cpf ||
            !nome ||
            !sexo ||
            !email ||
            !id_usuario ||
            !id_endereco
        ) {
            throw new ErrorResponse(400, "Campos obrigatórios não preenchidos");
        }

        cpf = cpf.toString().replace(/\D/g, '');
        nome = nome.trim();
        email = email.trim().toLowerCase();


        const xssRegex = /[<>]/;

        if (
            xssRegex.test(nome) ||
            xssRegex.test(email)
        ) {
            throw new ErrorResponse(400, "Caracteres inválidos detectados");
        }

        if (!this.validarCPF(cpf)) {
            throw new ErrorResponse(400, "CPF inválido");
        }

        if (nome.length < 8) {
            throw new ErrorResponse(400, "Nome muito curto");
        }

        if (nome.length > 100) {
            throw new ErrorResponse(400, "Nome muito grande");
        }

        const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;

        if (!nomeRegex.test(nome)) {
            throw new ErrorResponse(400, "Nome inválido");
        }

        const sexosValidos = ["Masculino", "Feminino"];

        if (!sexosValidos.includes(sexo)) {
            throw new ErrorResponse(400, "Sexo inválido");
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

        if (data_nasc) {

            const dataTexto = String(data_nasc).split("T")[0];
            const partes = dataTexto.split("-");

            if (partes.length !== 3) {
                throw new ErrorResponse(400, "Data de nascimento inválida");
            }

            const ano = Number(partes[0]);
            const mes = Number(partes[1]);
            const dia = Number(partes[2]);

            const data = new Date(ano, mes - 1, dia);

            if (
                isNaN(data.getTime()) ||
                data.getFullYear() !== ano ||
                data.getMonth() !== mes - 1 ||
                data.getDate() !== dia
            ) {
                throw new ErrorResponse(400, "Data de nascimento inválida");
            }

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            data.setHours(0, 0, 0, 0);

            if (data > hoje) {
                throw new ErrorResponse(
                    400,
                    "A data de nascimento não pode ser futura"
                );
            }
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
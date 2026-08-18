const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ConsultasMiddleware {

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

        if (resto >= 10) resto = 0;

        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;

        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        resto = (soma * 10) % 11;

        if (resto >= 10) resto = 0;

        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    validateBody = (req, res, next) => {

        let {
            cpf,
            crm,
            data_consulta,
            tipo_consulta,
            statusc
        } = req.body;

        if (
            !cpf ||
            !crm ||
            !data_consulta ||
            !statusc
        ) {
            throw new ErrorResponse(400, "Campos obrigatórios não preenchidos");
        }

        cpf = cpf.replace(/\D/g, '');
        crm = crm.toString().trim();

        if (tipo_consulta) {
            tipo_consulta = tipo_consulta.trim();
        }

        statusc = statusc.trim();

        const xssRegex = /[<>]/;

        if (
            xssRegex.test(crm) ||
            xssRegex.test(statusc) ||
            (tipo_consulta && xssRegex.test(tipo_consulta))
        ) {
            throw new ErrorResponse(400, "Caracteres inválidos detectados");
        }

        if (!this.validarCPF(cpf)) {
            throw new ErrorResponse(400, "CPF inválido");
        }

        const crmRegex = /^\d{4,11}$/;
        console.log("CRM recebido:", JSON.stringify(crm), "tipo:", typeof crm);
        if (!crmRegex.test(crm)) {
            throw new ErrorResponse(400, "CRM inválido");
        }

        const data = new Date(data_consulta);

        if (isNaN(data.getTime())) {
            throw new ErrorResponse(400, "Data inválida");
        }

        const agora = new Date();

        if (data < agora) {
            throw new ErrorResponse(400, "Não é permitido cadastrar consultas no passado");
        }

        const statusValidos = [
            "Pendente",
            "Em andamento",
            "Finalizado"
        ];

        if (!statusValidos.includes(statusc)) {
            throw new ErrorResponse(400, "Status inválido");
        }

        if (tipo_consulta) {

            if (tipo_consulta.length < 3) {
                throw new ErrorResponse(400, "Tipo de consulta inválido");
            }

            if (tipo_consulta.length > 50) {
                throw new ErrorResponse(400, "Tipo de consulta muito grande");
            }
        }

        next();
    }

    validateUpdate = (req, res, next) => {

        let {
            cpf,
            crm,
            data_consulta,
            tipo_consulta,
            statusc
        } = req.body;

        if (
            !cpf &&
            !crm &&
            !data_consulta &&
            !tipo_consulta &&
            !statusc
        ) {
            throw new ErrorResponse(400, "Envie ao menos um campo");
        }

        const xssRegex = /[<>]/;

        if (cpf) {

            cpf = cpf.replace(/\D/g, '');

            if (!this.validarCPF(cpf)) {
                throw new ErrorResponse(400, "CPF inválido");
            }
        }

        if (crm) {

            crm = crm.toString().trim();

            if (xssRegex.test(crm)) {
                throw new ErrorResponse(400, "CRM inválido");
            }

            const crmRegex = /^\d{4,11}$/;

            if (!crmRegex.test(crm)) {
                throw new ErrorResponse(400, "CRM inválido");
            }
        }

        if (data_consulta) {

            const data = new Date(data_consulta);

            if (isNaN(data.getTime())) {
                throw new ErrorResponse(400, "Data inválida");
            }
        }

        if (tipo_consulta) {

            tipo_consulta = tipo_consulta.trim();

            if (xssRegex.test(tipo_consulta)) {
                throw new ErrorResponse(400, "Tipo de consulta inválido");
            }

            if (tipo_consulta.length > 50) {
                throw new ErrorResponse(400, "Tipo de consulta muito grande");
            }
        }

        if (statusc) {

            statusc = statusc.trim();

            const statusValidos = [
                "Pendente",
                "Em andamento",
                "Finalizado"
            ];

            if (!statusValidos.includes(statusc)) {
                throw new ErrorResponse(400, "Status inválido");
            }
        }

        next();
    }
}
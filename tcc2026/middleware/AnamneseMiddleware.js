const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class AnamneseMiddleware {

    validarCPF(cpf) {

        cpf = cpf.replace(/\D/g, "");

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
            crm,
            id_consulta,
            sintomas,
            comorbidades
        } = req.body;

        if (!cpf || !crm || !id_consulta) {
            throw new ErrorResponse(
                400,
                "CPF, CRM e ID da consulta são obrigatórios"
            );
        }

        cpf = cpf.trim();
        crm = crm.trim();

        if (isNaN(id_consulta)) {
            throw new ErrorResponse(
                400,
                "ID da consulta inválido"
            );
        }

        if (Number(id_consulta) <= 0) {
            throw new ErrorResponse(
                400,
                "ID da consulta inválido"
            );
        }

        if (!this.validarCPF(cpf)) {
            throw new ErrorResponse(
                400,
                "CPF inválido"
            );
        }

        const crmRegex = /^[A-Za-z0-9]+$/;

        if (!crmRegex.test(crm)) {
            throw new ErrorResponse(
                400,
                "CRM inválido"
            );
        }

        if (crm.length < 4 || crm.length > 15) {
            throw new ErrorResponse(
                400,
                "CRM inválido"
            );
        }

        const xssRegex = /[<>]/;

        if (sintomas) {

            sintomas = sintomas.trim();

            if (xssRegex.test(sintomas)) {
                throw new ErrorResponse(
                    400,
                    "Sintomas inválidos"
                );
            }

            if (sintomas.length < 5) {
                throw new ErrorResponse(
                    400,
                    "Texto de sintomas muito curto"
                );
            }

            if (sintomas.length > 5000) {
                throw new ErrorResponse(
                    400,
                    "Texto de sintomas muito grande"
                );
            }
        }

        if (comorbidades) {

            comorbidades = comorbidades.trim();

            if (xssRegex.test(comorbidades)) {
                throw new ErrorResponse(
                    400,
                    "Comorbidades inválidas"
                );
            }

            if (comorbidades.length < 3) {
                throw new ErrorResponse(
                    400,
                    "Texto de comorbidades muito curto"
                );
            }

            if (comorbidades.length > 5000) {
                throw new ErrorResponse(
                    400,
                    "Texto de comorbidades muito grande"
                );
            }
        }

        next();
    }

    validateUpdate = (req, res, next) => {

        let {
            sintomas,
            comorbidades
        } = req.body;

        if (!sintomas && !comorbidades) {
            throw new ErrorResponse(
                400,
                "Envie ao menos um campo"
            );
        }

        const xssRegex = /[<>]/;

        if (sintomas) {

            sintomas = sintomas.trim();

            if (xssRegex.test(sintomas)) {
                throw new ErrorResponse(
                    400,
                    "Sintomas inválidos"
                );
            }

            if (sintomas.length < 5) {
                throw new ErrorResponse(
                    400,
                    "Texto de sintomas muito curto"
                );
            }

            if (sintomas.length > 5000) {
                throw new ErrorResponse(
                    400,
                    "Texto de sintomas muito grande"
                );
            }
        }

        if (comorbidades) {

            comorbidades = comorbidades.trim();

            if (xssRegex.test(comorbidades)) {
                throw new ErrorResponse(
                    400,
                    "Comorbidades inválidas"
                );
            }

            if (comorbidades.length < 3) {
                throw new ErrorResponse(
                    400,
                    "Texto de comorbidades muito curto"
                );
            }

            if (comorbidades.length > 5000) {
                throw new ErrorResponse(
                    400,
                    "Texto de comorbidades muito grande"
                );
            }
        }

        next();
    }

    validateId = (req, res, next) => {

        const { id_anamnese } = req.params;

        if (!id_anamnese || isNaN(id_anamnese)) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        if (Number(id_anamnese) <= 0) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        next();
    }
}
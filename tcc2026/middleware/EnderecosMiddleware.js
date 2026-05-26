const ErrorResponse = require('../utils/ErrorResponse');

module.exports = class EnderecosMiddleware {

    validateBody = (request, response, next) => {

        let {
            rua,
            numero,
            bairro,
            cidade,
            estado,
            cep
        } = request.body;

        if (
            !rua ||
            !numero ||
            !bairro ||
            !cidade ||
            !estado ||
            !cep
        ) {
            throw new ErrorResponse(
                400,
                "Campos obrigatórios não informados"
            );
        }

        rua = rua.toString().trim();
        bairro = bairro.toString().trim();
        cidade = cidade.toString().trim();
        estado = estado.toString().trim().toUpperCase();
        cep = cep.toString().trim();

        const xssRegex = /[<>]/;

        if (xssRegex.test(rua)) {
            throw new ErrorResponse(
                400,
                "Rua inválida"
            );
        }

        if (xssRegex.test(bairro)) {
            throw new ErrorResponse(
                400,
                "Bairro inválido"
            );
        }

        if (xssRegex.test(cidade)) {
            throw new ErrorResponse(
                400,
                "Cidade inválida"
            );
        }

        if (xssRegex.test(estado)) {
            throw new ErrorResponse(
                400,
                "Estado inválido"
            );
        }

        const textoRegex = /^[A-Za-zÀ-ÿ0-9\s.,\-ºª]+$/;

        if (!textoRegex.test(rua)) {
            throw new ErrorResponse(
                400,
                "Rua inválida"
            );
        }

        if (!textoRegex.test(bairro)) {
            throw new ErrorResponse(
                400,
                "Bairro inválido"
            );
        }

        if (!textoRegex.test(cidade)) {
            throw new ErrorResponse(
                400,
                "Cidade inválida"
            );
        }

        if (rua.length < 3 || rua.length > 255) {
            throw new ErrorResponse(
                400,
                "Rua inválida"
            );
        }

        if (bairro.length < 2 || bairro.length > 100) {
            throw new ErrorResponse(
                400,
                "Bairro inválido"
            );
        }

        if (cidade.length < 2 || cidade.length > 100) {
            throw new ErrorResponse(
                400,
                "Cidade inválida"
            );
        }

        if (isNaN(numero)) {
            throw new ErrorResponse(
                400,
                "Número inválido"
            );
        }

        numero = Number(numero);

        if (!Number.isInteger(numero)) {
            throw new ErrorResponse(
                400,
                "Número inválido"
            );
        }

        if (numero <= 0 || numero > 999999) {
            throw new ErrorResponse(
                400,
                "Número inválido"
            );
        }

        cep = cep.replace(/\D/g, "");

        if (!/^\d{8}$/.test(cep)) {
            throw new ErrorResponse(
                400,
                "CEP inválido"
            );
        }

        const estadosValidos = [
            "AC", "AL", "AP", "AM", "BA", "CE",
            "DF", "ES", "GO", "MA", "MT", "MS",
            "MG", "PA", "PB", "PR", "PE", "PI",
            "RJ", "RN", "RS", "RO", "RR", "SC",
            "SP", "SE", "TO"
        ];

        if (!estadosValidos.includes(estado)) {
            throw new ErrorResponse(
                400,
                "Estado inválido"
            );
        }

        next();
    }

    validateUpdate = (request, response, next) => {

        let {
            rua,
            numero,
            bairro,
            cidade,
            estado,
            cep
        } = request.body;

        if (
            !rua &&
            !numero &&
            !bairro &&
            !cidade &&
            !estado &&
            !cep
        ) {
            throw new ErrorResponse(
                400,
                "Envie ao menos um campo para atualização"
            );
        }

        const xssRegex = /[<>]/;
        const textoRegex = /^[A-Za-zÀ-ÿ0-9\s.,\-ºª]+$/;

        if (rua !== undefined) {

            rua = rua.toString().trim();

            if (xssRegex.test(rua) || !textoRegex.test(rua)) {
                throw new ErrorResponse(
                    400,
                    "Rua inválida"
                );
            }

            if (rua.length < 3 || rua.length > 255) {
                throw new ErrorResponse(
                    400,
                    "Rua inválida"
                );
            }
        }

        if (bairro !== undefined) {

            bairro = bairro.toString().trim();

            if (xssRegex.test(bairro) || !textoRegex.test(bairro)) {
                throw new ErrorResponse(
                    400,
                    "Bairro inválido"
                );
            }

            if (bairro.length < 2 || bairro.length > 100) {
                throw new ErrorResponse(
                    400,
                    "Bairro inválido"
                );
            }
        }

        if (cidade !== undefined) {

            cidade = cidade.toString().trim();

            if (xssRegex.test(cidade) || !textoRegex.test(cidade)) {
                throw new ErrorResponse(
                    400,
                    "Cidade inválida"
                );
            }

            if (cidade.length < 2 || cidade.length > 100) {
                throw new ErrorResponse(
                    400,
                    "Cidade inválida"
                );
            }
        }

        if (estado !== undefined) {

            estado = estado.toString().trim().toUpperCase();

            const estadosValidos = [
                "AC", "AL", "AP", "AM", "BA", "CE",
                "DF", "ES", "GO", "MA", "MT", "MS",
                "MG", "PA", "PB", "PR", "PE", "PI",
                "RJ", "RN", "RS", "RO", "RR", "SC",
                "SP", "SE", "TO"
            ];

            if (!estadosValidos.includes(estado)) {
                throw new ErrorResponse(
                    400,
                    "Estado inválido"
                );
            }
        }

        if (numero !== undefined) {

            if (isNaN(numero)) {
                throw new ErrorResponse(
                    400,
                    "Número inválido"
                );
            }

            numero = Number(numero);

            if (!Number.isInteger(numero)) {
                throw new ErrorResponse(
                    400,
                    "Número inválido"
                );
            }

            if (numero <= 0 || numero > 999999) {
                throw new ErrorResponse(
                    400,
                    "Número inválido"
                );
            }
        }

        if (cep !== undefined) {

            cep = cep.toString().trim().replace(/\D/g, "");

            if (!/^\d{8}$/.test(cep)) {
                throw new ErrorResponse(
                    400,
                    "CEP inválido"
                );
            }
        }

        next();
    }

    validateIdParam = (request, response, next) => {

        const { id_endereco } = request.params;

        if (!id_endereco || isNaN(id_endereco)) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        if (Number(id_endereco) <= 0) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        next();
    }
}
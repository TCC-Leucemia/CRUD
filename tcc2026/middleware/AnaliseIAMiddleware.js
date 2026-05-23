const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class AnaliseIAMiddleware {

    validateBody = (req, res, next) => {

        console.log("🔷 AnaliseIAMiddleware.validateBody()");

        let {
            id_exame,
            resultado_ia,
            confianca,
            data_analise,
            statusc
        } = req.body;

        if (
            !id_exame ||
            !resultado_ia ||
            confianca === undefined ||
            !data_analise ||
            !statusc
        ) {
            throw new ErrorResponse(
                400,
                "Campos obrigatórios não preenchidos"
            );
        }

        if (isNaN(id_exame)) {
            throw new ErrorResponse(
                400,
                "ID do exame inválido"
            );
        }

        if (Number(id_exame) <= 0) {
            throw new ErrorResponse(
                400,
                "ID do exame inválido"
            );
        }

        const xssRegex = /[<>]/;

        resultado_ia = resultado_ia.trim();

        if (xssRegex.test(resultado_ia)) {
            throw new ErrorResponse(
                400,
                "Resultado da IA inválido"
            );
        }

        if (resultado_ia.length < 10) {
            throw new ErrorResponse(
                400,
                "Resultado da IA muito curto"
            );
        }

        if (resultado_ia.length > 5000) {
            throw new ErrorResponse(
                400,
                "Resultado da IA muito grande"
            );
        }

        if (isNaN(confianca)) {
            throw new ErrorResponse(
                400,
                "Confiança inválida"
            );
        }

        confianca = Number(confianca);

        if (confianca < 0 || confianca > 100) {
            throw new ErrorResponse(
                400,
                "Confiança deve estar entre 0 e 100"
            );
        }

        const data = new Date(data_analise);

        if (isNaN(data.getTime())) {
            throw new ErrorResponse(
                400,
                "Data inválida"
            );
        }

        const hoje = new Date();

        hoje.setHours(0, 0, 0, 0);
        data.setHours(0, 0, 0, 0);

        if (data > hoje) {
            throw new ErrorResponse(
                400,
                "Não é permitido cadastrar análises futuras"
            );
        }

        const statusValidos = [
            "Pendente",
            "Em andamento",
            "Finalizado"
        ];

        statusc = statusc.trim();

        if (xssRegex.test(statusc)) {
            throw new ErrorResponse(
                400,
                "Status inválido"
            );
        }

        if (!statusValidos.includes(statusc)) {
            throw new ErrorResponse(
                400,
                "Status inválido"
            );
        }

        next();
    }

    validateUpdate = (req, res, next) => {

        let {
            resultado_ia,
            confianca,
            data_analise,
            statusc
        } = req.body;

        if (
            !resultado_ia &&
            confianca === undefined &&
            !data_analise &&
            !statusc
        ) {
            throw new ErrorResponse(
                400,
                "Envie ao menos um campo"
            );
        }

        const xssRegex = /[<>]/;

        if (resultado_ia) {

            resultado_ia = resultado_ia.trim();

            if (xssRegex.test(resultado_ia)) {
                throw new ErrorResponse(
                    400,
                    "Resultado da IA inválido"
                );
            }

            if (resultado_ia.length < 10) {
                throw new ErrorResponse(
                    400,
                    "Resultado da IA muito curto"
                );
            }

            if (resultado_ia.length > 5000) {
                throw new ErrorResponse(
                    400,
                    "Resultado da IA muito grande"
                );
            }
        }

        if (confianca !== undefined) {

            if (isNaN(confianca)) {
                throw new ErrorResponse(
                    400,
                    "Confiança inválida"
                );
            }

            confianca = Number(confianca);

            if (confianca < 0 || confianca > 100) {
                throw new ErrorResponse(
                    400,
                    "Confiança deve estar entre 0 e 100"
                );
            }
        }

        if (data_analise) {

            const data = new Date(data_analise);

            if (isNaN(data.getTime())) {
                throw new ErrorResponse(
                    400,
                    "Data inválida"
                );
            }

            const hoje = new Date();

            hoje.setHours(0, 0, 0, 0);
            data.setHours(0, 0, 0, 0);

            if (data > hoje) {
                throw new ErrorResponse(
                    400,
                    "Não é permitido cadastrar análises futuras"
                );
            }
        }

        if (statusc) {

            statusc = statusc.trim();

            const statusValidos = [
                "Pendente",
                "Em andamento",
                "Finalizado"
            ];

            if (xssRegex.test(statusc)) {
                throw new ErrorResponse(
                    400,
                    "Status inválido"
                );
            }

            if (!statusValidos.includes(statusc)) {
                throw new ErrorResponse(
                    400,
                    "Status inválido"
                );
            }
        }

        next();
    }

    validateId = (req, res, next) => {

        const id = req.params.id_analise;

        if (!id || isNaN(id)) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        if (Number(id) <= 0) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        next();
    }
}
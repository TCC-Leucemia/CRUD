const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ResultadosExameMiddleware {

    validateBody = (req, res, next) => {

        console.log("🔷 ResultadosExameMiddleware.validateBody()");

        let {
            id_exame,
            resultado_texto,
            suspeita_leucemia,
            tipo_leucemia,
            data_resultado
        } = req.body;

        if (
            !id_exame ||
            !resultado_texto ||
            !data_resultado
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

        resultado_texto = resultado_texto.trim();

        if (xssRegex.test(resultado_texto)) {
            throw new ErrorResponse(
                400,
                "Resultado inválido"
            );
        }

        if (resultado_texto.length < 10) {
            throw new ErrorResponse(
                400,
                "Resultado muito curto"
            );
        }

        if (resultado_texto.length > 5000) {
            throw new ErrorResponse(
                400,
                "Resultado muito grande"
            );
        }

        const tiposValidos = [
            "LLA",
            "LMA",
            "LLC",
            "LMC",
            "Não identificado"
        ];

        if (tipo_leucemia) {

            tipo_leucemia = tipo_leucemia.trim();

            if (xssRegex.test(tipo_leucemia)) {
                throw new ErrorResponse(
                    400,
                    "Tipo de leucemia inválido"
                );
            }

            if (!tiposValidos.includes(tipo_leucemia)) {
                throw new ErrorResponse(
                    400,
                    "Tipo de leucemia inválido"
                );
            }
        }

        const suspeitasValidas = [
            "Baixa",
            "Moderada",
            "Alta",
            "Sem suspeita"
        ];

        if (suspeita_leucemia) {

            suspeita_leucemia = suspeita_leucemia.trim();

            if (xssRegex.test(suspeita_leucemia)) {
                throw new ErrorResponse(
                    400,
                    "Nível de suspeita inválido"
                );
            }

            if (
                !suspeitasValidas.includes(suspeita_leucemia)
            ) {
                throw new ErrorResponse(
                    400,
                    "Nível de suspeita inválido"
                );
            }
        }

        const data = new Date(data_resultado);

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
                "Não é permitido cadastrar resultados futuros"
            );
        }

        next();
    }

    validateUpdate = (req, res, next) => {

        let {
            resultado_texto,
            suspeita_leucemia,
            tipo_leucemia,
            data_resultado
        } = req.body;

        if (
            !resultado_texto &&
            !suspeita_leucemia &&
            !tipo_leucemia &&
            !data_resultado
        ) {
            throw new ErrorResponse(
                400,
                "Envie ao menos um campo"
            );
        }

        const xssRegex = /[<>]/;

        if (resultado_texto) {

            resultado_texto = resultado_texto.trim();

            if (xssRegex.test(resultado_texto)) {
                throw new ErrorResponse(
                    400,
                    "Resultado inválido"
                );
            }

            if (resultado_texto.length < 10) {
                throw new ErrorResponse(
                    400,
                    "Resultado muito curto"
                );
            }

            if (resultado_texto.length > 5000) {
                throw new ErrorResponse(
                    400,
                    "Resultado muito grande"
                );
            }
        }

        if (tipo_leucemia) {

            tipo_leucemia = tipo_leucemia.trim();

            const tiposValidos = [
                "LLA",
                "LMA",
                "LLC",
                "LMC",
                "Não identificado"
            ];

            if (xssRegex.test(tipo_leucemia)) {
                throw new ErrorResponse(
                    400,
                    "Tipo de leucemia inválido"
                );
            }

            if (!tiposValidos.includes(tipo_leucemia)) {
                throw new ErrorResponse(
                    400,
                    "Tipo de leucemia inválido"
                );
            }
        }

        if (suspeita_leucemia) {

            suspeita_leucemia = suspeita_leucemia.trim();

            const suspeitasValidas = [
                "Baixa",
                "Moderada",
                "Alta",
                "Sem suspeita"
            ];

            if (xssRegex.test(suspeita_leucemia)) {
                throw new ErrorResponse(
                    400,
                    "Nível de suspeita inválido"
                );
            }

            if (
                !suspeitasValidas.includes(suspeita_leucemia)
            ) {
                throw new ErrorResponse(
                    400,
                    "Nível de suspeita inválido"
                );
            }
        }

        if (data_resultado) {

            const data = new Date(data_resultado);

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
                    "Não é permitido cadastrar resultados futuros"
                );
            }
        }

        next();
    }

    validateId = (req, res, next) => {

        const id = req.params.id_resultado;

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
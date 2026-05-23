const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ExamesMiddleware {

    validateBody = (req, res, next) => {

        let {
            id_consulta,
            tipo_exame,
            data_exame,
            statusc
        } = req.body;

        if (!id_consulta) {
            throw new ErrorResponse(400, "id_consulta é obrigatório");
        }

        if (isNaN(id_consulta)) {
            throw new ErrorResponse(400, "id_consulta deve ser numérico");
        }

        if (Number(id_consulta) <= 0) {
            throw new ErrorResponse(400, "id_consulta inválido");
        }

        const xssRegex = /[<>]/;

        if (tipo_exame) {

            tipo_exame = tipo_exame.trim();

            if (xssRegex.test(tipo_exame)) {
                throw new ErrorResponse(400, "Tipo de exame inválido");
            }

            if (tipo_exame.length > 50) {
                throw new ErrorResponse(400, "tipo_exame muito grande");
            }
        }

        const tiposPermitidos = [
            "Hemograma",
            "Mielograma"
        ];

        if (
            !tipo_exame ||
            !tiposPermitidos.includes(tipo_exame)
        ) {
            throw new ErrorResponse(
                400,
                "Tipo de exame inválido",
                {
                    tipos_permitidos: tiposPermitidos
                }
            );
        }

        if (data_exame) {

            const data = new Date(data_exame);

            if (isNaN(data.getTime())) {
                throw new ErrorResponse(400, "data_exame inválida");
            }

            const agora = new Date();

            if (data < agora) {
                throw new ErrorResponse(
                    400,
                    "Não é permitido cadastrar exames no passado"
                );
            }
        }

        const statusValidos = [
            "Pendente",
            "Em andamento",
            "Finalizado"
        ];

        if (statusc) {

            statusc = statusc.trim();

            if (xssRegex.test(statusc)) {
                throw new ErrorResponse(400, "status inválido");
            }

            if (!statusValidos.includes(statusc)) {
                throw new ErrorResponse(400, "status inválido");
            }
        }

        next();
    }

    validateUpdate = (req, res, next) => {

        let {
            tipo_exame,
            data_exame,
            statusc
        } = req.body;

        if (
            !tipo_exame &&
            !data_exame &&
            !statusc
        ) {
            throw new ErrorResponse(400, "Envie ao menos um campo");
        }

        const xssRegex = /[<>]/;

        if (tipo_exame) {

            tipo_exame = tipo_exame.trim();

            const tiposPermitidos = [
                "Hemograma",
                "Mielograma"
            ];

            if (xssRegex.test(tipo_exame)) {
                throw new ErrorResponse(400, "Tipo de exame inválido");
            }

            if (!tiposPermitidos.includes(tipo_exame)) {
                throw new ErrorResponse(
                    400,
                    "Tipo de exame inválido",
                    {
                        tipos_permitidos: tiposPermitidos
                    }
                );
            }
        }

        if (data_exame) {

            const data = new Date(data_exame);

            if (isNaN(data.getTime())) {
                throw new ErrorResponse(400, "data_exame inválida");
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
                throw new ErrorResponse(400, "status inválido");
            }

            if (!statusValidos.includes(statusc)) {
                throw new ErrorResponse(400, "status inválido");
            }
        }

        next();
    }

    validateId = (req, res, next) => {

        const { id } = req.params;

        if (!id || isNaN(id)) {
            throw new ErrorResponse(400, "ID inválido");
        }

        if (Number(id) <= 0) {
            throw new ErrorResponse(400, "ID inválido");
        }

        next();
    }
}
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ImagensExameMiddleware {

    validateBody = (req, res, next) => {

        let {
            id_exame,
            caminho_arquivo,
            descricao,
            data_upload
        } = req.body;

        if (!id_exame || !caminho_arquivo || !descricao || !data_upload) {
            throw new ErrorResponse(
                400,
                "Preencha todos os campos obrigatórios"
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

        caminho_arquivo = caminho_arquivo.trim();
        descricao = descricao.trim();

        const xssRegex = /[<>]/;

        if (
            xssRegex.test(caminho_arquivo) ||
            xssRegex.test(descricao)
        ) {
            throw new ErrorResponse(
                400,
                "Conteúdo inválido"
            );
        }

        if (
            caminho_arquivo.includes("../") ||
            caminho_arquivo.includes("..\\")
        ) {
            throw new ErrorResponse(
                400,
                "Caminho do arquivo inválido"
            );
        }

        if (descricao.length < 3) {
            throw new ErrorResponse(
                400,
                "Descrição muito curta"
            );
        }

        if (descricao.length > 255) {
            throw new ErrorResponse(
                400,
                "Descrição muito grande"
            );
        }

        if (caminho_arquivo.length > 255) {
            throw new ErrorResponse(
                400,
                "Caminho do arquivo muito grande"
            );
        }

        const extensoesPermitidas = [
            ".jpg",
            ".jpeg",
            ".png"
        ];

        const caminhoLower = caminho_arquivo.toLowerCase();

        const extensaoValida = extensoesPermitidas.some(ext =>
            caminhoLower.endsWith(ext)
        );

        if (!extensaoValida) {
            throw new ErrorResponse(
                400,
                "Extensão de arquivo inválida"
            );
        }

        const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (!dataRegex.test(data_upload)) {
            throw new ErrorResponse(
                400,
                "Data inválida"
            );
        }

        const data = new Date(data_upload);

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
                "Não é permitido cadastrar uploads futuros"
            );
        }

        next();
    }

    validateUpdate = (req, res, next) => {

        let {
            caminho_arquivo,
            descricao,
            data_upload
        } = req.body;

        if (
            !caminho_arquivo &&
            !descricao &&
            !data_upload
        ) {
            throw new ErrorResponse(
                400,
                "Envie ao menos um campo"
            );
        }

        const xssRegex = /[<>]/;

        if (descricao) {

            descricao = descricao.trim();

            if (xssRegex.test(descricao)) {
                throw new ErrorResponse(
                    400,
                    "Descrição inválida"
                );
            }

            if (descricao.length < 3) {
                throw new ErrorResponse(
                    400,
                    "Descrição muito curta"
                );
            }

            if (descricao.length > 255) {
                throw new ErrorResponse(
                    400,
                    "Descrição muito grande"
                );
            }
        }

        if (caminho_arquivo) {

            caminho_arquivo = caminho_arquivo.trim();

            if (xssRegex.test(caminho_arquivo)) {
                throw new ErrorResponse(
                    400,
                    "Caminho inválido"
                );
            }

            if (
                caminho_arquivo.includes("../") ||
                caminho_arquivo.includes("..\\")
            ) {
                throw new ErrorResponse(
                    400,
                    "Caminho do arquivo inválido"
                );
            }

            if (caminho_arquivo.length > 255) {
                throw new ErrorResponse(
                    400,
                    "Caminho do arquivo muito grande"
                );
            }

            const extensoesPermitidas = [
                ".jpg",
                ".jpeg",
                ".png"
            ];

            const caminhoLower = caminho_arquivo.toLowerCase();

            const extensaoValida = extensoesPermitidas.some(ext =>
                caminhoLower.endsWith(ext)
            );

            if (!extensaoValida) {
                throw new ErrorResponse(
                    400,
                    "Extensão de arquivo inválida"
                );
            }
        }

        if (data_upload) {

            const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

            if (!dataRegex.test(data_upload)) {
                throw new ErrorResponse(
                    400,
                    "Data inválida"
                );
            }

            const data = new Date(data_upload);

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
                    "Não é permitido cadastrar uploads futuros"
                );
            }
        }

        next();
    }

    validateId = (req, res, next) => {

        const { id_imagem } = req.params;

        if (!id_imagem || isNaN(id_imagem)) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        if (Number(id_imagem) <= 0) {
            throw new ErrorResponse(
                400,
                "ID inválido"
            );
        }

        next();
    }
}
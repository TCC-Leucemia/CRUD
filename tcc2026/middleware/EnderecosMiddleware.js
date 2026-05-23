const ErrorResponse = require('../utils/ErrorResponse');

module.exports = class EnderecosMiddleware {

    validateBody = (request, response, next) => {
        console.log("🔷 EnderecosMiddleware.validateBody()");

        const { rua, numero, bairro, cidade, estado, cep } = request.body;

        if (!rua || rua.trim() === "") {
            throw new ErrorResponse(400, "Erro de validação", { message: "O campo 'rua' é obrigatório!" });
        }

        if (!numero) {
            throw new ErrorResponse(400, "Erro de validação", { message: "O campo 'numero' é obrigatório!" });
        }

        if (!bairro || bairro.trim() === "") {
            throw new ErrorResponse(400, "Erro de validação", { message: "O campo 'bairro' é obrigatório!" });
        }

        if (!cidade || cidade.trim() === "") {
            throw new ErrorResponse(400, "Erro de validação", { message: "O campo 'cidade' é obrigatório!" });
        }

        if (!estado || estado.trim() === "") {
            throw new ErrorResponse(400, "Erro de validação", { message: "O campo 'estado' é obrigatório!" });
        }

        next();
    }

    validateIdParam = (request, response, next) => {
        console.log("🔷 EnderecosMiddleware.validateIdParam()");

        const { id_endereco } = request.params;

        if (!id_endereco) {
            throw new ErrorResponse(400, "Erro de validação", { message: "O parâmetro 'id_endereco' é obrigatório!" });
        }

        next();
    }
}
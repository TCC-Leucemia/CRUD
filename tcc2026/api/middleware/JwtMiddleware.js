const MeuTokenJWT = require("../http/MeuTokenJWT");
const LoginDAO = require("../dao/LoginDAO");
const ErrorResponse = require("../utils/ErrorResponse");

console.log("JWT MIDDLEWARE CARREGADO");

module.exports = class JwtMiddleware {

    #loginDAO;

    constructor(banco) {
        this.#loginDAO = new LoginDAO(banco);
    }

    validateToken = async (req, res, next) => {

        try {

            console.log("JWT EXECUTADO");
            console.log(req.method, req.originalUrl);

            const authorization = req.headers.authorization;

            if (!authorization) {
                throw new ErrorResponse(
                    401,
                    "Token não informado"
                );
            }

            const jwt = new MeuTokenJWT();

            const autorizado =
                jwt.validarToken(authorization);

            if (!autorizado) {
                throw new ErrorResponse(
                    401,
                    "Token inválido"
                );
            }

            const payload = jwt.payload;

            if (!payload?.id_usuario) {
                throw new ErrorResponse(
                    401,
                    "Token inválido"
                );
            }
            const login =
                await this.#loginDAO.findById(
                    payload.id_usuario
                );

            if (!login) {
                throw new ErrorResponse(
                    401,
                    "Usuário não encontrado"
                );
            }

            if (login.statusu !== "Ativo") {
                throw new ErrorResponse(
                    403,
                    "Usuário desativado."
                );
            }

            req.user = {
                ...payload,
                statusu: login.statusu
            };

            next();

        } catch (erro) {

            next(erro);

        }
    }
}
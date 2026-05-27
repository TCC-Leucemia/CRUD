const MeuTokenJWT = require("../http/MeuTokenJWT");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class JwtMiddleware {

    validateToken = (req, res, next) => {

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

        req.user = jwt.payload;

        next();
    }
}
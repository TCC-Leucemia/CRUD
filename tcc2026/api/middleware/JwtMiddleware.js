const MeuTokenJWT = require("../http/MeuTokenJWT");
const ErrorResponse = require("../utils/ErrorResponse");

console.log("JWT MIDDLEWARE CARREGADO");
module.exports = class JwtMiddleware {
    validateToken = (req, res, next) => {
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

        req.user = jwt.payload;

        next();
    }
}
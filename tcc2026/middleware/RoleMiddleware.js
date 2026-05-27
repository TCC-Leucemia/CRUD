const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class RoleMiddleware {

    authorize = (...rolesPermitidos) => {

        return (req, res, next) => {

            if (!req.user) {

                throw new ErrorResponse(
                    401,
                    "Usuário não autenticado"
                );
            }

            const role = req.user.role;

            if (!rolesPermitidos.includes(role)) {

                throw new ErrorResponse(
                    403,
                    "Acesso negado"
                );
            }

            next();
        }
    }
}
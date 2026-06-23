const AnaliseIAControl = require("../control/AnaliseIAControl");
const AnaliseIAMiddleware = require("../middleware/AnaliseIAMiddleware");

const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new AnaliseIAControl(banco);
    const middleware = new AnaliseIAMiddleware();

    const jwt = new JwtMiddleware();
    const role = new RoleMiddleware();

    app.get(
        "/analise-ia",
        jwt.validateToken,
        role.authorize("Médico"),
        control.index
    );

    app.get(
        "/analise-ia/:id_analise",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.show
    );

    app.delete(
        "/analise-ia/:id_analise",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.destroy
    );
}
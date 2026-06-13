const AnaliseIAControl = require("../control/AnaliseIAControl");
const AnaliseIAMiddleware = require("../middleware/AnaliseIAMiddleware");

const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new AnaliseIAControl(banco);
    const middleware = new AnaliseIAMiddleware();

    const jwt = new JwtMiddleware();
    const role = new RoleMiddleware();

    app.post(
        "/analise-ia",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateBody,
        control.store
    );

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

    app.put(
        "/analise-ia/:id_analise",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/analise-ia/:id_analise",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.destroy
    );
}
const ExamesControl = require("../control/ExamesControl");
const ExamesMiddleware = require("../middleware/ExamesMiddleware");

const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new ExamesControl(banco);
    const middleware = new ExamesMiddleware();

    const jwt = new JwtMiddleware();
    const role = new RoleMiddleware();

    app.post(
        "/exames",
        jwt.validateToken,
        role.authorize("Administrador", "Médico"),
        middleware.validateBody,
        control.store
    );

    app.get(
        "/exames",
        jwt.validateToken,
        role.authorize(
            "Administrador",
            "Médico",
            "Paciente"
        ),
        control.index
    );

    app.get(
        "/exames/:id",
        jwt.validateToken,
        role.authorize(
            "Administrador",
            "Médico",
            "Paciente"
        ),
        middleware.validateId,
        control.show
    );

    app.put(
        "/exames/:id",
        jwt.validateToken,
        role.authorize(
            "Administrador",
            "Médico"
        ),
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/exames/:id",
        jwt.validateToken,
        role.authorize(
            "Administrador",
            "Médico"
        ),
        middleware.validateId,
        control.destroy
    );
}
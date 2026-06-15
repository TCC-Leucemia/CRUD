const ConsultasControl = require("../control/ConsultasControl");
const ConsultasMiddleware = require("../middleware/ConsultasMiddleware");
const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new ConsultasControl(banco);
    const middleware = new ConsultasMiddleware();
    const jwtMiddleware = new JwtMiddleware();
    const roleMiddleware = new RoleMiddleware();

    app.post(
        "/consultas",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize(
            "Administrador"
        ),
        middleware.validateBody,
        control.store
    );

    app.get(
        "/consultas",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize(
            "Administrador",
            "Médico",
            "Paciente"
        ),
        control.index
    );

    app.get(
        "/consultas/:id",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize(
            "Administrador",
            "Médico",
            "Paciente"
        ),
        control.show
    );

    app.put(
        "/consultas/:id",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize(
            "Administrador",
            "Médico"
        ),
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/consultas/:id",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize(
            "Administrador"
        ),
        control.destroy
    );
}
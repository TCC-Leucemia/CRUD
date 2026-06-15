const PacientesControl = require("../control/PacientesControl");
const PacientesMiddleware = require("../middleware/PacientesMiddleware");
const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new PacientesControl(banco);

    const middleware = new PacientesMiddleware();

    const jwtMiddleware = new JwtMiddleware();

    const roleMiddleware = new RoleMiddleware();

    app.post(
        "/pacientes",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        middleware.validateBody,
        control.store
    );

    app.get(
        "/pacientes/meus-dados",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Paciente"),
        control.meusDados
    );
    
    app.get(
        "/pacientes",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador", "Médico"),
        control.index
    );

    app.get(
        "/pacientes/:cpf",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador", "Médico"),
        control.show
    );

    app.put(
        "/pacientes/:cpf",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/pacientes/:cpf",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        control.destroy
    );
}
const ResultadosExameControl = require("../control/ResultadosExameControl");
const ResultadosExameMiddleware = require("../middleware/ResultadosExameMiddleware");

const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new ResultadosExameControl(banco);
    const middleware = new ResultadosExameMiddleware();
    const jwt = new JwtMiddleware(banco);
    const role = new RoleMiddleware();

    app.post(
        "/resultados-exame",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateBody,
        control.store
    );

    app.get(
        "/resultados-exame",
        jwt.validateToken,
        role.authorize("Médico", "Paciente"),
        control.index
    );
    app.get(
        "/resultados-exame/exame/:id_exame",
        jwt.validateToken,
        role.authorize("Médico", "Paciente"),
        control.showByExame
    );

    app.get(
        "/resultados-exame/:id_resultado",
        jwt.validateToken,
        role.authorize("Médico", "Paciente"),
        middleware.validateId,
        control.show
    );

    app.put(
        "/resultados-exame/:id_resultado",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/resultados-exame/:id_resultado",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.destroy
    );
}
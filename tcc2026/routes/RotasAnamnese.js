const AnamneseControl = require("../control/AnamneseControl");
const AnamneseMiddleware = require("../middleware/AnamneseMiddleware");

const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new AnamneseControl(banco);
    const middleware = new AnamneseMiddleware();

    const jwt = new JwtMiddleware();
    const role = new RoleMiddleware();

    app.post(
        "/anamnese",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateBody,
        control.store
    );

    app.get(
        "/anamnese",
        jwt.validateToken,
        role.authorize("Médico"),
        control.index
    );

    app.get(
        "/anamnese/:id_anamnese",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.show
    );

    app.put(
        "/anamnese/:id_anamnese",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/anamnese/:id_anamnese",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.destroy
    );
}
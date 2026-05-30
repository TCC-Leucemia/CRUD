const MedicosControl = require("../control/MedicosControl");
const MedicosMiddleware = require("../middleware/MedicosMiddleware");
const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");
console.log("ROTAS MÉDICOS CARREGADAS");
module.exports = (app, banco) => {

    const control = new MedicosControl(banco);

    const middleware = new MedicosMiddleware();

    const jwtMiddleware = new JwtMiddleware();

    const roleMiddleware = new RoleMiddleware();

    app.get("/teste123456", (req, res) => {
        res.send("FUNCIONOU");
    });
    app.post(
        "/medicos",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        middleware.validateBody,
        control.store
    );

    app.get(
        "/medicos",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        control.index
    );

    app.get(
        "/medicos/:crm",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        control.show
    );

    app.put(
        "/medicos/:crm",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        middleware.validateUpdate,
        control.update
    );

    app.delete(
        "/medicos/:crm",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        control.destroy
    );
}
const PacientesControl = require("../control/PacientesControl");
const PacientesMiddleware = require("../middleware/PacientesMiddleware");

module.exports = (app, banco) => {

    const control = new PacientesControl(banco);
    const middleware = new PacientesMiddleware();


    app.post("/pacientes", middleware.validateBody, control.store);
    app.get("/pacientes", control.index);
    app.get("/pacientes/:cpf", control.show);
    app.put("/pacientes/:cpf", middleware.validateBody, control.update);
    app.delete("/pacientes/:cpf", control.destroy);
}
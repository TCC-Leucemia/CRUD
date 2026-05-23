const MedicosControl = require("../control/MedicosControl");
const MedicosMiddleware = require("../middleware/MedicosMiddleware");

module.exports = (app, banco) => {

    const control = new MedicosControl(banco);
    const middleware = new MedicosMiddleware();

    app.post("/medicos", middleware.validateBody, control.store);
    app.get("/medicos", control.index);
    app.get("/medicos/:crm", control.show);
    app.put("/medicos/:crm", middleware.validateUpdate, control.update);
    app.delete("/medicos/:crm", control.destroy);
}
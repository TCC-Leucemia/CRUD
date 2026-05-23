const ConsultasControl = require("../control/ConsultasControl");
const ConsultasMiddleware = require("../middleware/ConsultasMiddleware");

module.exports = (app, banco) => {

    const control = new ConsultasControl(banco);
    const middleware = new ConsultasMiddleware();

    app.post("/consultas", middleware.validateBody, control.store);
    app.get("/consultas", control.index);
    app.get("/consultas/:id", control.show);
    app.put("/consultas/:id", middleware.validateBody, control.update);
    app.delete("/consultas/:id", control.destroy);
}
const ExamesControl = require("../control/ExamesControl");
const ExamesMiddleware = require("../middleware/ExamesMiddleware");

module.exports = (app, banco) => {

    const control = new ExamesControl(banco);
    const middleware = new ExamesMiddleware();

    app.post("/exames", middleware.validateBody, control.store);
    app.get("/exames", control.index);
    app.get("/exames/:id", middleware.validateId, control.show);
    app.put("/exames/:id", middleware.validateId, middleware.validateBody, control.update);
    app.delete("/exames/:id", middleware.validateId, control.destroy);
}
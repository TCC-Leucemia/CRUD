const LoginControl = require("../control/LoginControl");
const LoginMiddleware = require("../middleware/LoginMiddleware");

module.exports = (app, banco) => {

    const control = new LoginControl(banco);
    const middleware = new LoginMiddleware();

    app.post("/login", middleware.validateBody, control.login);
    app.get("/login", control.index);
    app.get("/login/:id", control.show);
    app.put("/login/:id", middleware.validateBody, control.update);
    app.delete("/login/:id", control.destroy);

    app.post("/auth", middleware.validateLogin, control.login);
}
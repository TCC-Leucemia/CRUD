const AdministradoresControl =
require("../control/AdministradoresControl");

const AdministradoresMiddleware = require("../middleware/AdministradoresMiddleware");

module.exports = (app, banco) => {

    const control = new AdministradoresControl(banco);

    const middleware = new AdministradoresMiddleware();

    app.post(
        "/administradores",
        middleware.validateBody,
        control.store
    );

    app.get(
        "/administradores",
        control.index
    );

    app.get(
        "/administradores/:cpf",
        control.show
    );

    app.put(
        "/administradores/:cpf",
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/administradores/:cpf",
        control.destroy
    );
}
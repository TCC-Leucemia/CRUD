const AnaliseIAControl = require("../control/AnaliseIAControl");
const AnaliseIAMiddleware = require("../middleware/AnaliseIAMiddleware");

module.exports = (app, banco) => {

    const control = new AnaliseIAControl(banco);
    const middleware = new AnaliseIAMiddleware();

    app.post(
        "/analise-ia",
        middleware.validateBody,
        control.store
    );

    app.get(
        "/analise-ia",
        control.index
    );

    app.get(
        "/analise-ia/:id_analise",
        middleware.validateId,
        control.show
    );

    app.put(
        "/analise-ia/:id_analise",
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/analise-ia/:id_analise",
        middleware.validateId,
        control.destroy
    );
}
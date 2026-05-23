const ResultadosExameControl = require("../control/ResultadosExameControl");
const ResultadosExameMiddleware = require("../middleware/ResultadosExameMiddleware");

module.exports = (app, banco) => {

    const control = new ResultadosExameControl(banco);
    const middleware = new ResultadosExameMiddleware();

    app.post(
        "/resultados-exame",
        middleware.validateBody,
        control.store
    );

    app.get(
        "/resultados-exame",
        control.index
    );

    app.get(
        "/resultados-exame/:id_resultado",
        middleware.validateId,
        control.show
    );

    app.put(
        "/resultados-exame/:id_resultado",
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/resultados-exame/:id_resultado",
        middleware.validateId,
        control.destroy
    );
}
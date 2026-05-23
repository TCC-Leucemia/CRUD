const AnamneseControl = require("../control/AnamneseControl");
const AnamneseMiddleware = require("../middleware/AnamneseMiddleware");

module.exports = (app, banco) => {

    const control = new AnamneseControl(banco);
    const middleware = new AnamneseMiddleware();

    app.post(
        "/anamnese",
        middleware.validateBody,
        control.store
    );

    app.get(
        "/anamnese",
        control.index
    );

    app.get(
        "/anamnese/:id_anamnese",
        middleware.validateId,
        control.show
    );

    app.put(
        "/anamnese/:id_anamnese",
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/anamnese/:id_anamnese",
        middleware.validateId,
        control.destroy
    );
}
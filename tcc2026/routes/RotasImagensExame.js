const ImagensExameControl = require("../control/ImagensExameControl");
const ImagensExameMiddleware = require("../middleware/ImagensExameMiddleware");

module.exports = (app, banco) => {

    const control = new ImagensExameControl(banco);
    const middleware = new ImagensExameMiddleware();

    app.post(
        "/imagens-exame",
        middleware.validateBody,
        control.store
    );

    app.get(
        "/imagens-exame",
        control.index
    );

    app.get(
        "/imagens-exame/:id_imagem",
        middleware.validateId,
        control.show
    );

    app.put(
        "/imagens-exame/:id_imagem",
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/imagens-exame/:id_imagem",
        middleware.validateId,
        control.destroy
    );
}
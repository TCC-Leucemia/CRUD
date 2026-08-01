const ImagensExameControl = require("../control/ImagensExameControl");
const ImagensExameMiddleware = require("../middleware/ImagensExameMiddleware");
const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new ImagensExameControl(banco);
    const middleware = new ImagensExameMiddleware();

    const jwt = new JwtMiddleware();
    const role = new RoleMiddleware();

    app.post(
        "/imagens-exame",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateBody,
        control.store
    );

    app.get(
        "/imagens-exame",
        jwt.validateToken,
        role.authorize(
            "Médico",
            "Paciente"
        ),
        control.index
    );

    // Precisa vir antes de "/imagens-exame/:id_imagem", senão "exame" seria
    // interpretado como id da imagem.
    app.get(
        "/imagens-exame/exame/:id_exame",
        jwt.validateToken,
        role.authorize(
            "Médico",
            "Paciente"
        ),
        middleware.validateExameId,
        control.indexByExame
    );

    app.get(
        "/imagens-exame/:id_imagem/arquivo",
        jwt.validateToken,
        role.authorize(
            "Médico",
            "Paciente"
        ),
        middleware.validateId,
        control.arquivo
    );

    app.get(
        "/imagens-exame/:id_imagem",
        jwt.validateToken,
        role.authorize(
            "Médico",
            "Paciente"
        ),
        middleware.validateId,
        control.show
    );

    app.put(
        "/imagens-exame/:id_imagem",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        middleware.validateBody,
        control.update
    );

    app.delete(
        "/imagens-exame/:id_imagem",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.destroy
    );
}
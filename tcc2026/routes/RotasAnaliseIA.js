const AnaliseIAControl = require("../control/AnaliseIAControl");
const AnaliseIAMiddleware = require("../middleware/AnaliseIAMiddleware");

const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "uploads/exames");
    },

    filename: (req, file, cb) => {

        const nome =
            Date.now() +
            path.extname(file.originalname);

        cb(null, nome);

    }

});

const upload = multer({
    storage
});

module.exports = (app, banco) => {

    const control = new AnaliseIAControl(banco);
    const middleware = new AnaliseIAMiddleware();

    const jwt = new JwtMiddleware();
    const role = new RoleMiddleware();
    
    app.post(
        "/analise-ia/gerar",
        jwt.validateToken,
        role.authorize("Médico"),
        upload.single("imagem"),
        control.gerarLaudo
    );

    app.get(
        "/analise-ia",
        jwt.validateToken,
        role.authorize("Médico"),
        control.index
    );

    app.get(
        "/analise-ia/:id_analise",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.show
    );

    app.delete(
        "/analise-ia/:id_analise",
        jwt.validateToken,
        role.authorize("Médico"),
        middleware.validateId,
        control.destroy
    );
}
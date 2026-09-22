const AnaliseIAControl = require("../control/AnaliseIAControl");
const AnaliseIAMiddleware = require("../middleware/AnaliseIAMiddleware");

const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const ErrorResponse = require("../utils/ErrorResponse");

const extensoesPermitidas = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png"
};

const storage = multer.diskStorage({

    destination: (_req, _file, cb) => {
        const destino = path.join(__dirname, "..", "..", "uploads", "exames", ".tmp");
        fs.mkdir(destino, { recursive: true }, (erro) => cb(erro, destino));
    },

    filename: (_req, file, cb) => {
        cb(null, `${crypto.randomUUID()}${extensoesPermitidas[file.mimetype]}`);
    }

});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (!extensoesPermitidas[file.mimetype]) {
            return cb(new ErrorResponse(400, "Envie uma imagem JPG ou PNG."));
        }
        cb(null, true);
    }
});

const receberImagem = (req, res, next) => {
    upload.single("imagem")(req, res, async (erro) => {
        if (!erro) return next();
        if (req.file?.path) {
            await fs.promises.unlink(req.file.path).catch(() => {});
        }
        if (erro instanceof multer.MulterError && erro.code === "LIMIT_FILE_SIZE") {
            return next(new ErrorResponse(400, "A imagem deve ter no máximo 10 MB."));
        }
        next(erro.statusCode ? erro : new ErrorResponse(400, "Não foi possível receber a imagem."));
    });
};

module.exports = (app, banco) => {

    const control = new AnaliseIAControl(banco);
    const middleware = new AnaliseIAMiddleware();

    const jwt = new JwtMiddleware(banco);
    const role = new RoleMiddleware();
    
    app.post(
        "/analise-ia/gerar",
        jwt.validateToken,
        role.authorize("Médico"),
        receberImagem,
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

const LoginControl = require("../control/LoginControl");
const LoginMiddleware = require("../middleware/LoginMiddleware");

const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = (app, banco) => {

    const control = new LoginControl(banco);
    const middleware = new LoginMiddleware();

    const jwt = new JwtMiddleware();
    const role = new RoleMiddleware();


    app.post(
        "/login",
        jwt.validateToken,
        role.authorize("Administrador"),
        middleware.validateBody,
        control.store
    );
    app.get(
        "/login/meu-login",
        jwt.validateToken,
        role.authorize(
            "Médico",
            "Paciente",
            "Administrador"
        ),
        control.meuLogin
    );

    app.get(
        "/login",
        jwt.validateToken,
        role.authorize("Administrador"),
        control.index
    );
    app.get(
        "/login/:id",
        jwt.validateToken,
        role.authorize(
            "Administrador",
            "Médico",
            "Paciente"
        ),
        control.show
    );

    app.put(
        "/login/alterar-credenciais",
        jwt.validateToken,
        role.authorize(
            "Administrador",
            "Médico",
            "Paciente"
        ),
        middleware.validateAlterarCredenciais,
        control.alterarCredenciais
    );

    app.put(
        "/login/:id",
        jwt.validateToken,
        role.authorize(
            "Administrador",
            "Médico",
            "Paciente"
        ),
        middleware.validateBody,
        control.update
    );
    app.delete(
        "/login/:id",
        jwt.validateToken,
        role.authorize("Administrador"),
        control.destroy
    );

    app.post("/auth", middleware.validateLogin, control.login);
}
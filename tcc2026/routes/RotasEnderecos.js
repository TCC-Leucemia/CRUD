const { request, response } = require("express");
const Enderecos = require('../model/Enderecos')
const EnderecosControl = require('../control/EnderecosControl')
const EnderecosMiddleware = require ('../middleware/EnderecosMiddleware')
const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");

module.exports = function (app, banco) {

    const enderecosControl = new EnderecosControl(banco);
    const enderecosMiddleware = new EnderecosMiddleware();
    const jwtMiddleware = new JwtMiddleware();
    const roleMiddleware = new RoleMiddleware();

    app.post(
        "/enderecos",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        enderecosMiddleware.validateBody,
        enderecosControl.store
    );

    app.get(
        "/enderecos",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        enderecosControl.index
    );
arguments
    app.get(
        "/enderecos/:id_endereco",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize(
            "Administrador",
            "Médico",
            "Paciente"
        ),
        enderecosMiddleware.validateIdParam,
        enderecosControl.show
    );

    app.put(
        "/enderecos/:id_endereco",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        enderecosMiddleware.validateIdParam,
        enderecosMiddleware.validateBody,
        enderecosControl.update
    );

    app.delete(
        "/enderecos/:id_endereco",
        jwtMiddleware.validateToken,
        roleMiddleware.authorize("Administrador"),
        enderecosMiddleware.validateIdParam,
        enderecosControl.destroy
    );
}
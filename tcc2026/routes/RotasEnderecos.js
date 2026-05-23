const { request, response } = require("express");
const Enderecos = require('../model/Enderecos')
const EnderecosControl = require('../control/EnderecosControl')
const EnderecosMiddleware = require ('../middleware/EnderecosMiddleware')

module.exports = function (app, banco) {

    const enderecosControl = new EnderecosControl(banco);
    const enderecosMiddleware = new EnderecosMiddleware();

    app.post("/enderecos", enderecosMiddleware.validateBody, enderecosControl.store);
    app.get("/enderecos", enderecosControl.index);
    app.get("/enderecos/:id_endereco", enderecosControl.show);
    app.put("/enderecos/:id_endereco", enderecosMiddleware.validateIdParam, enderecosControl.update);
    app.delete("/enderecos/:id_endereco", enderecosMiddleware.validateIdParam, enderecosControl.destroy);
}
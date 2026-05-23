const Enderecos = require('../model/Enderecos');
const EnderecosDAO = require('../dao/EnderecosDAO')
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class EnderecosService {

    #enderecosDAO;

    constructor(banco) {
        this.#enderecosDAO = new EnderecosDAO(banco);
    }

    async create(dados) {

        const enderecos = new Enderecos();

        enderecos.rua = dados.rua;
        enderecos.numero = dados.numero;
        enderecos.bairro = dados.bairro;
        enderecos.cidade = dados.cidade;
        enderecos.estado = dados.estado;
        enderecos.cep = dados.cep;

        return await this.#enderecosDAO.create(enderecos);
    }

    async findAll() {
        const enderecos = new Enderecos();
        return await this.#enderecosDAO.findAll();
    }

    async findById(id) {
        const enderecos = new Enderecos();
        return await this.#enderecosDAO.findById(id);
    }

    async update(id, dados) {
        const enderecos = new Enderecos();

        enderecos.id_endereco = id;
        enderecos.rua = dados.rua;
        enderecos.numero = dados.numero;
        enderecos.bairro = dados.bairro;
        enderecos.cidade = dados.cidade;
        enderecos.estado = dados.estado;
        enderecos.cep = dados.cep;

        const resultado = await this.#enderecosDAO.update(enderecos);

        if (!resultado) {
            throw new ErrorResponse(404, "Endereço não encontrado");
        }

        return true;
    }

    async delete(id) {
        const deletado = await this.#enderecosDAO.delete(id);

        if (!deletado) {
            throw new ErrorResponse(404, "Endereço não encontrado");
        }

        return true;
    }
}
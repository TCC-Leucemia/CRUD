const Enderecos = require('../model/Enderecos');
const EnderecosDAO = require('../dao/EnderecosDAO')
const ErrorResponse = require("../utils/ErrorResponse");

const PacientesDAO = require("../dao/PacientesDAO");
const MedicosDAO = require("../dao/MedicosDAO");

module.exports = class EnderecosService {

    #enderecosDAO;
    #pacientesDAO;
    #medicosDAO;

    constructor(banco) {
        this.#enderecosDAO = new EnderecosDAO(banco);
        this.#pacientesDAO = new PacientesDAO(banco);
        this.#medicosDAO = new MedicosDAO (banco);
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

    validarAcessoEndereco = async (id_endereco, user) => {

        const endereco =
            await this.#enderecosDAO.findById(
                id_endereco
            );

        if (!endereco) {

            throw new ErrorResponse(
                404,
                "Endereço não encontrado"
            );
        }

        if (user.role === "Administrador") {
            return endereco;
        }

        if (user.role === "Paciente") {

            const paciente =
                await this.#pacientesDAO.findById(
                    user.cpf
                );

            if (
                !paciente ||
                paciente.id_endereco != id_endereco
            ) {

                throw new ErrorResponse(
                    403,
                    "Acesso negado"
                );
            }

            return endereco;
        }

        if (user.role === "Médico") {

            const medico =
                await this.#medicosDAO.findByCRM(
                    user.crm
                );

            if (
                !medico ||
                medico.id_endereco != id_endereco
            ) {

                throw new ErrorResponse(
                    403,
                    "Acesso negado"
                );
            }

            return endereco;
        }

        throw new ErrorResponse(
            403,
            "Acesso negado"
        );
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
const MedicosDAO = require("../dao/MedicosDAO");
const LoginDAO = require("../dao/LoginDAO");
const EnderecosDAO = require("../dao/EnderecosDAO");
const Medicos = require("../model/Medicos");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class MedicosService {

    #dao;
    #loginDAO;
    #enderecoDAO;

    constructor(banco) {
        this.#dao = new MedicosDAO(banco);
        this.#loginDAO = new LoginDAO(banco);
        this.#enderecoDAO = new EnderecosDAO(banco);
    }

    create = async (dados) => {

        const existente = await this.#dao.findByCRM(dados.crm);

        if (existente) {
            throw new ErrorResponse(400, "Médico já cadastrado");
        }

        const medico = new Medicos();
        Object.assign(medico, dados);

        return await this.#dao.create(medico);
    }

    findAll = async () => {
        return await this.#dao.findAll();
    }

    findByCRM = async (crm) => {
        const medico = await this.#dao.findByCRM(crm);

        if (!medico) {
            throw new ErrorResponse(404, "Médico não encontrado");
        }

        return medico;
    }

    findByPaciente = async (cpf) => {
        const dados =
            await this.#dao.findMedicoByPaciente(
                cpf
            );

        return dados;
    }

    update = async (crm, dados) => {

        const existente = await this.#dao.findByCRM(crm);

        if (!existente) {
            throw new ErrorResponse(404, "Médico não encontrado");
        }

        const medico = new Medicos();
        Object.assign(medico, dados);
        medico.crm = crm;

        const result = await this.#dao.update(medico);

        return result;
    }

    delete = async (crm) => {

        const medico = await this.#dao.findByCRM(crm);

        if (!medico) {
            throw new ErrorResponse(
                404,
                "Médico não encontrado"
            );
        }

        const result = await this.#dao.delete(crm);

        if (result.affectedRows === 0) {
            throw new ErrorResponse(
                404,
                "Médico não encontrado"
            );
        }

        await this.#loginDAO.delete(
            medico.id_usuario
        );

        await this.#enderecoDAO.delete(
            medico.id_endereco
        );

        return true;
    }
}
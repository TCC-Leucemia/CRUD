const PacientesDAO = require("../dao/PacientesDAO");
const Pacientes = require("../model/Pacientes");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class PacientesService {

    #dao;

    constructor(banco) {
        this.#dao = new PacientesDAO(banco);
    }

    create = async (dados) => {

        const existente = await this.#dao.findById(dados.cpf);

        if (existente) {
            throw new ErrorResponse(400, "Paciente já cadastrado");
        }

        const paciente = new Pacientes();
        Object.assign(paciente, dados);

        return await this.#dao.create(paciente);
    }

    findAll = async () => {
        return await this.#dao.findAll();
    }

    async findById(cpf) {
        const paciente = await this.#dao.findById(cpf);

        if (!paciente) {
            throw new ErrorResponse(404, "Paciente não encontrado");
        }

        return paciente;
    }

    update = async (cpf, dados) => {

        const existente = await this.#dao.findById(cpf);

        if (!existente) {
            throw new ErrorResponse(404, "Paciente não encontrado");
        }

        const paciente = new Pacientes();
        Object.assign(paciente, dados);
        paciente.cpf = cpf;

        const result = await this.#dao.update(paciente);

        return {
            atualizado: result.changedRows > 0
        };
    }

    delete = async (cpf) => {

        const result = await this.#dao.delete(cpf);

        if (result.affectedRows === 0) {
            throw new ErrorResponse(404, "Paciente não encontrado");
        }

        return true;
    }
}
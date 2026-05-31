const ConsultasDAO = require("../dao/ConsultasDAO");
const Consultas = require("../model/Consultas");
const MedicosDAO = require("../dao/MedicosDAO");
const PacientesDAO = require("../dao/PacientesDAO");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ConsultasService {

    #dao;
    #medicosDAO;
    #pacientesDAO;

    constructor(banco) {
        this.#dao = new ConsultasDAO(banco);
        this.#medicosDAO = new MedicosDAO(banco);
        this.#pacientesDAO = new PacientesDAO(banco);
    }

    create = async (dados) => {

        const medico = await this.#medicosDAO.findByCRM(dados.crm);
        if (!medico) {
            throw new ErrorResponse(404, "Médico não encontrado");
        }

        const paciente = await this.#pacientesDAO.findById(dados.cpf);
        if (!paciente) {
            throw new ErrorResponse(404, "Paciente não encontrado");
        }

        const consulta = new Consultas();
        Object.assign(consulta, dados);

        return await this.#dao.create(consulta);
    }

    findAll = async () => {
        return await this.#dao.findAll();
    }

    findByPaciente = async (cpf) => {
        return await this.#dao.findByPaciente(cpf);
    }

    findByMedico = async (crm) => {
        return await this.#dao.findByMedico(crm);
    }


    findById = async (id) => {
        const result = await this.#dao.findById(id);

        if (!result) {
            throw new ErrorResponse(404, "Consulta não encontrada");
        }

        return result;
    }

    update = async (id, dados) => {

        const existente = await this.#dao.findById(id);

        if (!existente) {
            throw new ErrorResponse(404, "Consulta não encontrada");
        }

        // valida CRM se enviado
        if (dados.crm) {
            const medico = await this.#medicosDAO.findByCRM(dados.crm);
            if (!medico) {
                throw new ErrorResponse(404, "Médico não encontrado");
            }
        }

        if (dados.cpf) {
            const paciente = await this.#pacientesDAO.findById(dados.cpf);
            if (!paciente) {
                throw new ErrorResponse(404, "Paciente não encontrado");
            }
        }

        const consulta = new Consultas();
        Object.assign(consulta, dados);
        consulta.id_consulta = id;

        const result = await this.#dao.update(consulta);

        return {
            atualizado: result.changedRows > 0
        };
    }

    delete = async (id) => {

        const result = await this.#dao.delete(id);

        if (result.affectedRows === 0) {
            throw new ErrorResponse(404, "Consulta não encontrada");
        }

        return true;
    }
}
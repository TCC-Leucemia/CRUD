const ExamesDAO = require("../dao/ExamesDAO");
const Exames = require("../model/Exames");
const ConsultasDAO = require("../dao/ConsultasDAO");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ExamesService {

    #dao;
    #consultasDAO;

    constructor(banco) {
        this.#dao = new ExamesDAO(banco);
        this.#consultasDAO = new ConsultasDAO(banco);
    }

    create = async (dados) => {

        // valida FK
        const consulta = await this.#consultasDAO.findById(dados.id_consulta);
        if (!consulta) {
            throw new ErrorResponse(404, "Consulta não encontrada");
        }

        const exame = new Exames();
        Object.assign(exame, dados);

        return await this.#dao.create(exame);
    }

    findAll = async () => {
        return await this.#dao.findAll();
    }

    findById = async (id) => {
        const exame = await this.#dao.findById(id);

        if (!exame) {
            throw new ErrorResponse(404, "Exame não encontrado");
        }

        return exame;
    }

    findByCpf = async (cpf) => {

        return await this.#dao.findByCpf(cpf);
    }

    findByCrm = async (crm) => {

        return await this.#dao.findByCrm(crm);
    }


    update = async (id, dados) => {

        const existente = await this.#dao.findById(id);
        if (!existente) {
            throw new ErrorResponse(404, "Exame não encontrado");
        }

        if (dados.id_consulta) {
            const consulta = await this.#consultasDAO.findById(dados.id_consulta);
            if (!consulta) {
                throw new ErrorResponse(404, "Consulta não encontrada");
            }
        }

        const exame = new Exames();
        Object.assign(exame, dados);
        exame.id_exame = id;

        const result = await this.#dao.update(exame);

        return {
            atualizado: result.changedRows > 0
        };
    }

    delete = async (id) => {
        const result = await this.#dao.delete(id);

        if (result.affectedRows === 0) {
            throw new ErrorResponse(404, "Exame não encontrado");
        }

        return true;
    }
}
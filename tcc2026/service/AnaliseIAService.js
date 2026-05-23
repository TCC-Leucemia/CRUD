const AnaliseIADAO = require("../dao/AnaliseIADAO");
const ExamesDAO = require("../dao/ExamesDAO");
const AnaliseIA = require("../model/AnaliseIA");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class AnaliseIAService {

    #dao;
    #examesDAO;

    constructor(banco) {

        this.#dao = new AnaliseIADAO(banco);
        this.#examesDAO = new ExamesDAO(banco);
    }

    create = async (dados) => {

        const exame = await this.#examesDAO.findById(
            dados.id_exame
        );

        if (!exame) {
            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        const analise = new AnaliseIA();

        Object.assign(analise, dados);

        return await this.#dao.create(analise);
    }

    findAll = async () => {

        const result = await this.#dao.findAll();

        if (result.length === 0) {
            throw new ErrorResponse(
                404,
                "Nenhuma análise encontrada"
            );
        }

        return result;
    }

    findById = async (id) => {

        const result = await this.#dao.findById(id);

        if (!result) {
            throw new ErrorResponse(
                404,
                "Análise não encontrada"
            );
        }

        return result;
    }

    update = async (id, dados) => {

        const existente = await this.#dao.findById(id);

        if (!existente) {
            throw new ErrorResponse(
                404,
                "Análise não encontrada"
            );
        }

        const exame = await this.#examesDAO.findById(
            dados.id_exame
        );

        if (!exame) {
            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        const analise = new AnaliseIA();

        Object.assign(analise, dados);

        analise.id_analise = id;

        return await this.#dao.update(analise);
    }

    delete = async (id) => {

        const result = await this.#dao.delete(id);

        if (result.affectedRows === 0) {

            throw new ErrorResponse(
                404,
                "Análise não encontrada"
            );
        }

        return true;
    }
}
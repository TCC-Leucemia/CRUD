const ResultadosExameDAO = require("../dao/ResultadosExameDAO");
const ExamesDAO = require("../dao/ExamesDAO");
const ResultadosExame = require("../model/ResultadosExames");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ResultadosExameService {

    #dao;
    #examesDAO;

    constructor(banco) {

        this.#dao = new ResultadosExameDAO(banco);
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

        const resultado = new ResultadosExame();

        Object.assign(resultado, dados);

        return await this.#dao.create(resultado);
    }

    findAll = async () => {

        const resultados = await this.#dao.findAll();

        if (resultados.length === 0) {
            throw new ErrorResponse(
                404,
                "Nenhum resultado encontrado"
            );
        }

        return resultados;
    }

    findById = async (id) => {

        const resultado = await this.#dao.findById(id);

        if (!resultado) {
            throw new ErrorResponse(
                404,
                "Resultado não encontrado"
            );
        }

        return resultado;
    }

    update = async (id, dados) => {

        const existente = await this.#dao.findById(id);

        if (!existente) {
            throw new ErrorResponse(
                404,
                "Resultado não encontrado"
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

        const resultado = new ResultadosExame();

        Object.assign(resultado, dados);

        resultado.id_resultado = id;

        return await this.#dao.update(resultado);
    }

    delete = async (id) => {

        const result = await this.#dao.delete(id);

        if (result.affectedRows === 0) {

            throw new ErrorResponse(
                404,
                "Resultado não encontrado"
            );
        }

        return true;
    }
}
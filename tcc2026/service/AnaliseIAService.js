const AnaliseIADAO = require("../dao/AnaliseIADAO");
const ExamesDAO = require("../dao/ExamesDAO");
const AnaliseIA = require("../model/AnaliseIA");
const ErrorResponse = require("../utils/ErrorResponse");

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ImagensExameDAO = require("../dao/ImagensExameDAO");
const ImagensExame = require("../model/ImagensExame");

module.exports = class AnaliseIAService {

    #dao;
    #examesDAO;
    #imagensDAO;

    constructor(banco) {
        this.#imagensDAO = new ImagensExameDAO(banco);
        this.#dao = new AnaliseIADAO(banco);
        this.#examesDAO = new ExamesDAO(banco);
    }

    create = async (dados, user) => {

        const exame = await this.#examesDAO.findById(
            dados.id_exame
        );

        if (!exame) {
            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }
        const owner =
            await this.#dao.findOwnerByExameId(
                dados.id_exame
            );

        if (!owner) {

            throw new ErrorResponse(
                404,
                "Exame não vinculado a nenhuma consulta"
            );
        }

        if (owner.crm !== user.crm) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
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

    findByCrm = async (crm) => {
        return await this.#dao.findByCrm(crm);
    }

    validarAcessoAnalise = async (
        id_analise,
        crm
    ) => {

        const analise =
            await this.#dao.findByIdAndCrm(
                id_analise,
                crm
            );

        if (!analise) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return analise;
    }

    update = async (id, dados, user) => {

        const existente = await this.#dao.findById(id);

        if (!existente) {
            throw new ErrorResponse(
                404,
                "Análise não encontrada"
            );
        }
        const owner =
            await this.#dao.findOwnerByExameId(
                dados.id_exame
            );

        if (!owner) {

            throw new ErrorResponse(
                404,
                "Exame não vinculado a nenhuma consulta"
            );
        }

        if (owner.crm !== user.crm) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
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
const ImagensExameDAO = require("../dao/ImagensExameDAO");
const ExamesDAO = require("../dao/ExamesDAO");
const ImagensExame = require("../model/ImagensExame");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ImagensExameService {

    #dao;
    #examesDAO;

    constructor(banco) {
        this.#dao = new ImagensExameDAO(banco);
        this.#examesDAO = new ExamesDAO(banco);
    }

    create = async (dados) => {

        const exame = await this.#examesDAO.findById(dados.id_exame);

        if (!exame) {
            throw new ErrorResponse(404, "Exame não encontrado");
        }

        const imagem = new ImagensExame();

        Object.assign(imagem, dados);

        return await this.#dao.create(imagem);
    }

    findAll = async () => {

        const dados = await this.#dao.findAll();

        if (dados.length === 0) {
            throw new ErrorResponse(404, "Nenhuma imagem encontrada");
        }

        return dados;
    }

    findById = async (id) => {

        const imagem = await this.#dao.findById(id);

        if (!imagem) {
            throw new ErrorResponse(404, "Imagem não encontrada");
        }

        return imagem;
    }

    findByCpf = async (cpf) => {
        return await this.#dao.findByCpf(cpf);
    }

    findByCrm = async (crm) => {
        return await this.#dao.findByCrm(crm);
    }

    validarAcessoImagem = async (idImagem,usuario) => {

        const owner =
            await this.#dao.findOwnerByImagemId(
                idImagem
            );

        if (!owner) {

            throw new ErrorResponse(
                404,
                "Imagem não encontrada"
            );
        }

        if (
            usuario.role === "Paciente" &&
            owner.cpf !== usuario.cpf
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        if (
            usuario.role === "Médico" &&
            owner.crm !== usuario.crm
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return true;
    }

    update = async (id, dados) => {

        const existente = await this.#dao.findById(id);

        if (!existente) {
            throw new ErrorResponse(404, "Imagem não encontrada");
        }

        if (dados.id_exame) {

            const exame = await this.#examesDAO.findById(dados.id_exame);

            if (!exame) {
                throw new ErrorResponse(404, "Exame não encontrado");
            }
        }

        const imagem = new ImagensExame();

        Object.assign(imagem, dados);

        imagem.id_imagem = id;

        const resultado = await this.#dao.update(imagem);

        return {
            atualizado: resultado.changedRows > 0
        };
    }

    delete = async (id) => {

        const resultado = await this.#dao.delete(id);

        if (resultado.affectedRows === 0) {
            throw new ErrorResponse(404, "Imagem não encontrada");
        }

        return true;
    }
}
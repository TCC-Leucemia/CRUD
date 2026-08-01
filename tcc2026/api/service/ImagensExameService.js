const ImagensExameDAO = require("../dao/ImagensExameDAO");
const ExamesDAO = require("../dao/ExamesDAO");
const ImagensExame = require("../model/ImagensExame");
const ErrorResponse = require("../utils/ErrorResponse");

const fs = require("fs");
const path = require("path");

// caminho_arquivo é gravado relativo à raiz do projeto (ex.: "uploads/exames/x.jpg").
const raizProjeto = path.resolve(__dirname, "..", "..");
const pastaUploads = path.join(raizProjeto, "uploads");

module.exports = class ImagensExameService {

    #dao;
    #examesDAO;

    constructor(banco) {
        this.#dao = new ImagensExameDAO(banco);
        this.#examesDAO = new ExamesDAO(banco);
    }

    create = async (dados, user) => {

        const exame =
            await this.#examesDAO.findById(
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

        if (
            owner.crm !== user.crm
        ) {
            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
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

    findByExame = async (idExame, usuario) => {

        const owner =
            await this.#dao.findOwnerByExameId(idExame);

        if (!owner) {

            throw new ErrorResponse(
                404,
                "Exame não encontrado ou não vinculado a uma consulta"
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

        return await this.#dao.findByExameId(idExame);
    }

    obterArquivo = async (idImagem, usuario) => {

        await this.validarAcessoImagem(idImagem, usuario);

        const imagem = await this.findById(idImagem);

        const caminho = path.resolve(
            raizProjeto,
            String(imagem.caminho_arquivo || "")
        );

        // Sem esta checagem um caminho gravado errado no banco poderia expor
        // qualquer arquivo do servidor.
        if (
            caminho !== pastaUploads &&
            !caminho.startsWith(pastaUploads + path.sep)
        ) {
            throw new ErrorResponse(
                400,
                "Caminho da imagem inválido"
            );
        }

        if (!fs.existsSync(caminho)) {
            throw new ErrorResponse(
                404,
                "Arquivo da imagem não encontrado no servidor"
            );
        }

        return caminho;
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

    update = async (
        id,
        dados,
        user
    ) => {

        const existente = await this.#dao.findById(id);

        if (!existente) {
            throw new ErrorResponse(404, "Imagem não encontrada");
        }

        if (dados.id_exame) {

            const exame = await this.#examesDAO.findById(dados.id_exame);
            const owner =
                await this.#dao.findOwnerByExameId(
                    dados.id_exame
                );

            if (
                owner.crm !== user.crm
            ) {
                throw new ErrorResponse(
                    403,
                    "Acesso negado"
                );
            }

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
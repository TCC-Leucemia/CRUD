const AdministradoresDAO = require("../dao/AdministradoresDAO");
const LoginDAO = require("../dao/LoginDAO");

const Administradores = require("../model/Administradores");

const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class AdministradoresService {

    #dao;
    #loginDAO;

    constructor(banco) {

        this.#dao = new AdministradoresDAO(banco);
        this.#loginDAO = new LoginDAO(banco);
    }

    create = async (dados) => {

        const existente =
            await this.#dao.findById(dados.cpf);

        if (existente) {
            throw new ErrorResponse(
                400,
                "Administrador já cadastrado"
            );
        }

        const usuario =
            await this.#loginDAO.findById(dados.id_usuario);

        if (!usuario) {
            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        const administrador = new Administradores();

        Object.assign(administrador, dados);

        return await this.#dao.create(administrador);
    }

    findAll = async () => {

        const resultado = await this.#dao.findAll();

        if (resultado.length === 0) {
            throw new ErrorResponse(
                404,
                "Nenhum administrador encontrado"
            );
        }

        return resultado;
    }

    findById = async (cpf) => {

        const administrador =
            await this.#dao.findById(cpf);

        if (!administrador) {
            throw new ErrorResponse(
                404,
                "Administrador não encontrado"
            );
        }

        return administrador;
    }

    update = async (cpf, dados) => {

        const existente =
            await this.#dao.findById(cpf);

        if (!existente) {
            throw new ErrorResponse(
                404,
                "Administrador não encontrado"
            );
        }

        if (dados.id_usuario) {

            const usuario =
                await this.#loginDAO.findById(
                    dados.id_usuario
                );

            if (!usuario) {
                throw new ErrorResponse(
                    404,
                    "Usuário não encontrado"
                );
            }
        }

        const administrador = new Administradores();

        Object.assign(administrador, dados);

        administrador.cpf = cpf;

        const resultado =
            await this.#dao.update(administrador);

        return {
            atualizado: resultado.changedRows > 0
        };
    }

    delete = async (cpf) => {

        const resultado =
            await this.#dao.delete(cpf);

        if (resultado.affectedRows === 0) {
            throw new ErrorResponse(
                404,
                "Administrador não encontrado"
            );
        }

        return true;
    }
}
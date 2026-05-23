const LoginDAO = require("../dao/LoginDAO");
const Login = require("../model/Login");
const md5 = require("md5");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class LoginService {

    #dao;

    constructor(banco) {
        this.#dao = new LoginDAO(banco);
    }

    create = async (dados) => {

        const existente =
            await this.#dao.findByEmail(dados.email);

        if (existente) {
            throw new ErrorResponse(
                400,
                "Email já cadastrado"
            );
        }

        const login = new Login();

        login.email = dados.email;
        login.senha = md5(dados.senha);
        login.tipo = dados.tipo;

        return await this.#dao.create(login);
    }

    findAll = async () => {
        return await this.#dao.findAll();
    }

    findById = async (id) => {

        const resultado =
            await this.#dao.findById(id);

        if (!resultado) {
            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        return resultado;
    }

    update = async (id, dados) => {

        const existente =
            await this.#dao.findById(id);

        if (!existente) {
            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        const emailExistente =
            await this.#dao.findByEmail(dados.email);

        if (
            emailExistente &&
            emailExistente.id_usuario != id
        ) {
            throw new ErrorResponse(
                400,
                "Email já está em uso"
            );
        }

        const login = new Login();

        login.id_usuario = id;
        login.email = dados.email;
        login.senha = md5(dados.senha);
        login.tipo = dados.tipo;

        const resultado =
            await this.#dao.update(login);

        return {
            atualizado:
                resultado.changedRows > 0
        };
    }

    delete = async (id) => {

        const resultado =
            await this.#dao.delete(id);

        if (resultado.affectedRows === 0) {
            throw new ErrorResponse(
                404,
                "Usuário não encontrado para exclusão"
            );
        }

        return true;
    }

    login = async (dados) => {

        const user =
            await this.#dao.findByEmail(dados.email);

        if (!user) {
            throw new ErrorResponse(
                401,
                "Usuário não encontrado"
            );
        }

        const senhaHash = md5(dados.senha);

        if (senhaHash !== user.senha) {
            throw new ErrorResponse(
                401,
                "Senha inválida"
            );
        }

        return {
            id_usuario: user.id_usuario,
            email: user.email,
            tipo: user.tipo
        };
    }
}
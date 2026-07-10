const PacientesDAO = require("../dao/PacientesDAO");
const Pacientes = require("../model/Pacientes");
const ErrorResponse = require("../utils/ErrorResponse");

const LoginDAO = require("../dao/LoginDAO");
const EnderecosDAO = require("../dao/EnderecosDAO");

const md5 = require("md5");

module.exports = class PacientesService {

    #dao;

    constructor(banco) {
        this.#dao = new PacientesDAO(banco);
        this.loginDAO = new LoginDAO(banco);
        this.enderecoDAO = new EnderecosDAO(banco);
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

    findAll = async (user) => {

        if (user.role === "Administrador") {
            return await this.#dao.findAll();
        }

        if (user.role === "Médico") {
            return await this.#dao.findByMedico(user.crm);
        }

        throw new ErrorResponse(403, "Acesso negado");
    }

    findByMedico = async (crm) => {

        return await this.#dao.findByMedico(crm);
    }

    findById = async (cpf, user) => {

        let paciente;

        if (user.role === "Administrador") {

            paciente = await this.#dao.findById(cpf);

        } else if (user.role === "Médico") {

            paciente = await this.#dao.findByCpfAndMedico(
                cpf,
                user.crm
            );

        } else {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        if (!paciente) {

            throw new ErrorResponse(
                404,
                "Paciente não encontrado"
            );
        }

        return paciente;
    }

    findMeuPerfil = async (cpf) => {

        const paciente =
            await this.#dao.findById(cpf);

        if (!paciente) {

            throw new ErrorResponse(
                404,
                "Paciente não encontrado"
            );
        }

        return paciente;
    }

    updateMeuPerfil = async (cpf, dados) => {

        const paciente = await this.#dao.findById(cpf);

        if (!paciente) {

            throw new ErrorResponse(
                404,
                "Paciente não encontrado"
            );

        }

        const login = await this.loginDAO.findById(
            paciente.id_usuario
        );

        if (!login) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );

        }
        const senhaHash = md5(dados.senhaAtual);

        if (senhaHash !== login.senha) {

            throw new ErrorResponse(
                400,
                "Senha atual incorreta"
            );

        }
        

        // Atualização do e-mail
        let email = login.email;

        if (dados.email && dados.email !== login.email) {

            const existente = await this.loginDAO.findByEmail(
                dados.email
            );

            if (
                existente &&
                existente.id_usuario !== login.id_usuario
            ) {

                throw new ErrorResponse(
                    400,
                    "E-mail já cadastrado"
                );

            }

            email = dados.email;
        }

        let senha = login.senha;
        if (dados.novaSenha) {
            senha = md5(dados.novaSenha);
        }

        await this.loginDAO.updateCredenciais(
            login.id_usuario,
            email,
            senha
        );

        return {
            atualizado: true
        };

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

        const paciente = await this.#dao.findById(cpf);

        if (!paciente) {
            throw new ErrorResponse(
                404,
                "Paciente não encontrado"
            );
        }

        await this.#dao.delete(cpf);

        await this.loginDAO.delete(
            paciente.id_usuario
        );

        await this.enderecoDAO.delete(
            paciente.id_endereco
        );

        return true;
    }
}
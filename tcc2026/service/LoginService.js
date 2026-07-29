const LoginDAO = require("../dao/LoginDAO");
const EmailService = require("./EmailService");
const Login = require("../model/Login");
const md5 = require("md5");
const ErrorResponse = require("../utils/ErrorResponse");

const codigosRecuperacao = {};

module.exports = class LoginService {

    #dao;
    #email;

    constructor(banco) {
        this.#dao = new LoginDAO(banco);
        this.#email = new EmailService();
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

        const usuarios =
            await this.#dao.findAll();

        const resultado = [];

        for (const usuario of usuarios) {

            if (usuario.tipo === "Paciente") {

                const paciente =
                    await this.#dao.findPacienteByIdUsuario(
                        usuario.id_usuario
                    );

                resultado.push(paciente);
            }
            else if (usuario.tipo === "Médico") {

                const medico =
                    await this.#dao.findMedicoByIdUsuario(
                        usuario.id_usuario
                    );

                resultado.push(medico);
            }
            else {

                resultado.push(usuario);
            }
        }

        return resultado;
    }

    findById = async (id) => {

        const login =
            await this.#dao.findById(id);

        if (!login) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        if (login.tipo === "Paciente") {

            const paciente =
                await this.#dao.findPacienteByIdUsuario(id);

            return paciente;
        }

        if (login.tipo === "Médico") {

            const medico =
                await this.#dao.findMedicoByIdUsuario(id);

            return medico;
        }

        return login;
    }

    alterarCredenciais = async (id_usuario, dados) => {

        const usuario =
            await this.#dao.findById(id_usuario);

        if (!usuario) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        const senhaHash =
            md5(dados.senhaAtual);

        if (senhaHash !== usuario.senha) {

            throw new ErrorResponse(
                401,
                "Senha atual incorreta"
            );
        }

        if (dados.novoEmail) {

            const existente =
                await this.#dao.findByEmail(
                    dados.novoEmail
                );

            if (
                existente &&
                existente.id_usuario != id_usuario
            ) {

                throw new ErrorResponse(
                    400,
                    "Email já está em uso"
                );
            }

            usuario.email = dados.novoEmail;
        }

        if (
            dados.novaSenha &&
            dados.novaSenha === dados.senhaAtual
        ) {
            throw new ErrorResponse(
                400,
                "A nova senha deve ser diferente da senha atual"
            );
        }

        if (dados.novaSenha) {
            usuario.senha = md5(dados.novaSenha);
        }
        console.log("USUÁRIO ANTES DO UPDATE:");
        console.log(usuario);

        await this.#dao.update(usuario);

        return true;
    }

    update = async (id, dados, user) => {

        const existente =
            await this.#dao.findById(id);

        if (!existente) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        const emailExistente =
            await this.#dao.findByEmail(
                dados.email
            );

        if (
            emailExistente &&
            emailExistente.id_usuario != id
        ) {

            throw new ErrorResponse(
                400,
                "Email já está em uso"
            );
        }

        if (
            user.role !== "Administrador"
        ) {

            if (
                dados.tipo &&
                dados.tipo !== existente.tipo
            ) {

                throw new ErrorResponse(
                    403,
                    "Você não pode alterar o tipo do usuário"
                );
            }

            dados.tipo =
                existente.tipo;
        }

        const login = new Login();

        login.id_usuario = id;
        login.email = dados.email;
        if (dados.senha) {
            login.senha = md5(dados.senha);
        } else {
            login.senha = existente.senha;
        }
        login.tipo = dados.tipo;

        const resultado =
            await this.#dao.update(login);

        return {
            atualizado:
                resultado.changedRows > 0
        };
    }

    delete = async (id, user) => {

        const login =
            await this.#dao.findById(id);

        if (!login) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        if (
            user.role !== "Administrador"
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        if (
            login.tipo === "Administrador"
        ) {

            throw new ErrorResponse(
                403,
                "Administradores não podem ser excluídos"
            );
        }

        const resultado =
            await this.#dao.delete(id);

        if (
            resultado.affectedRows === 0
        ) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado para exclusão"
            );
        }

        return true;
    }

    login = async (dados) => {

        let user;

        if (dados.tipo === "Médico") {

            user =
                await this.#dao.findMedicoByEmail(
                    dados.email
                );

        }
        else if (dados.tipo === "Paciente") {

            user =
                await this.#dao.findPacienteByEmail(
                    dados.email
                );

        }
        else if (dados.tipo === "Administrador") {

            user =
                await this.#dao.findAdministradorByEmail(
                    dados.email
                );
        }

        if (!user) {

            throw new ErrorResponse(
                401,
                "Usuário não encontrado"
            );
        }

        const senhaHash =
            md5(dados.senha);

        if (senhaHash !== user.senha) {

            throw new ErrorResponse(
                401,
                "Senha inválida"
            );
        }

        return {

            id_usuario: user.id_usuario,

            email: user.email,

            tipo: user.tipo,

            crm: user.crm,

            cpf: user.cpf,

            nome: user.nome
        };
    }
    async buscarEmailPorCpf(cpf) {

        const usuario =
            await this.#dao.buscarEmailPorCpf(cpf);

        if (!usuario) {

            throw new ErrorResponse(
                404,
                "CPF não encontrado."
            );

        }

        const codigo =
            this.gerarCodigo();

        codigosRecuperacao[cpf] = {
            email: usuario.email,
            codigo,
            expira: Date.now() + 10 * 60 * 1000
        };

        await this.#email.enviarCodigo(

            usuario.email,

            codigo

        );

        return true;

    }
    gerarCodigo() {
        return Math.floor(
            100000 + Math.random() * 900000
        ).toString();
    }

    validarAcessoLogin = async (id_usuario, user) => {

        const login =
            await this.#dao.findById(id_usuario);

        if (!login) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        if (
            user.role !== "Administrador" &&
            login.id_usuario != user.id_usuario
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return login;
    }
    validarCodigo(dados) {

        const registro = codigosRecuperacao[dados.cpf];

        if (!registro) {

            throw new ErrorResponse(
                400,
                "Nenhum código solicitado."
            );

        }

        if (Date.now() > registro.expira) {

            delete codigosRecuperacao[dados.cpf];

            throw new ErrorResponse(
                400,
                "Código expirado."
            );

        }

        if (registro.codigo !== dados.codigo) {

            throw new ErrorResponse(
                400,
                "Código inválido."
            );

        }

        return true;

    }
    alterarSenhaRecuperacao = async (cpf, novaSenha) => {

        const usuario =
            await this.#dao.buscarEmailPorCpf(cpf);

        if (!usuario) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado."
            );

        }

        const login =
            await this.#dao.findById(usuario.id_usuario);

        login.senha = md5(novaSenha);

        await this.#dao.update(login);

        delete codigosRecuperacao[cpf];

        return true;

    }
}
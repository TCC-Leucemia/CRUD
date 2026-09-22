const MedicosDAO = require("../dao/MedicosDAO");
const LoginDAO = require("../dao/LoginDAO");
const EnderecosDAO = require("../dao/EnderecosDAO");
const Medicos = require("../model/Medicos");
const ErrorResponse = require("../utils/ErrorResponse");
const md5 = require("md5");

const executarMetodo = (connection, metodo) => new Promise((resolve, reject) => {
    connection[metodo]((erro) => erro ? reject(erro) : resolve());
});

const executarTransacao = async (banco, operacao) => {
    const connection = await new Promise((resolve, reject) => {
        banco.getConnection((erro, conexao) => erro ? reject(erro) : resolve(conexao));
    });
    let iniciada = false;

    try {
        await executarMetodo(connection, "beginTransaction");
        iniciada = true;
        const resultado = await operacao(connection);
        await executarMetodo(connection, "commit");
        return resultado;
    } catch (erro) {
        if (iniciada) {
            try {
                await executarMetodo(connection, "rollback");
            } catch (_erroRollback) {
                // Mantém o erro original.
            }
        }
        throw erro;
    } finally {
        connection.release();
    }
};

module.exports = class MedicosService {

    #banco;
    #dao;
    #loginDAO;
    #enderecoDAO;

    constructor(banco) {
        this.#banco = banco;
        this.#dao = new MedicosDAO(banco);
        this.#loginDAO = new LoginDAO(banco);
        this.#enderecoDAO = new EnderecosDAO(banco);
    }

    create = async (dados) => {

        const existente = await this.#dao.findByCRM(dados.crm);

        if (existente) {
            throw new ErrorResponse(400, "Médico já cadastrado");
        }

        const medico = new Medicos();
        Object.assign(medico, dados);

        return await this.#dao.create(medico);
    }

    findAll = async () => {
        return await this.#dao.findAll();
    }

    findByCRM = async (crm) => {
        const medico = await this.#dao.findByCRM(crm);

        if (!medico) {
            throw new ErrorResponse(404, "Médico não encontrado");
        }

        return medico;
    }

    findOwnProfile = async (crm, idUsuario) => {
        const [medico, login] = await Promise.all([
            this.#dao.findByCRM(crm),
            this.#loginDAO.findById(idUsuario)
        ]);

        if (!medico || Number(medico.id_usuario) !== Number(idUsuario)) {
            throw new ErrorResponse(403, "Acesso negado.");
        }
        if (!login || login.tipo !== "Médico") {
            throw new ErrorResponse(404, "Conta do médico não encontrada.");
        }

        return { ...medico, email: login.email };
    }

    findByPaciente = async (cpf) => {
        const dados =
            await this.#dao.findMedicoByPaciente(
                cpf
            );

        return dados;
    }

    update = async (crm, dados) => {

        const existente = await this.#dao.findByCRM(crm);

        if (!existente) {
            throw new ErrorResponse(404, "Médico não encontrado");
        }

        const medico = new Medicos();
        Object.assign(medico, dados);
        medico.crm = crm;

        const result = await this.#dao.update(medico);

        return result;
    }

    updateOwnProfile = async (crmAtual, idUsuario, dados) => {
        try {
            return await executarTransacao(this.#banco, async (connection) => {
                const medicoAtual = await this.#dao.findByCRM(crmAtual, connection);
                if (!medicoAtual || Number(medicoAtual.id_usuario) !== Number(idUsuario)) {
                    throw new ErrorResponse(403, "Acesso negado.");
                }

                const loginAtual = await this.#loginDAO.findById(idUsuario, connection);
                if (!loginAtual || loginAtual.tipo !== "Médico") {
                    throw new ErrorResponse(404, "Conta do médico não encontrada.");
                }

                const alteracaoSensivel =
                    dados.email !== loginAtual.email ||
                    Boolean(dados.senha);

                if (alteracaoSensivel && !dados.senhaAtual) {
                    throw new ErrorResponse(
                        428,
                        "Confirme sua senha atual para alterar e-mail ou senha.",
                        { codigo: "REAUTENTICACAO_NECESSARIA" }
                    );
                }
                if (
                    alteracaoSensivel &&
                    md5(dados.senhaAtual) !== loginAtual.senha
                ) {
                    throw new ErrorResponse(
                        400,
                        "Senha atual incorreta.",
                        { codigo: "SENHA_ATUAL_INCORRETA" }
                    );
                }

                if (dados.crm !== crmAtual) {
                    const crmEmUso = await this.#dao.findByCRM(dados.crm, connection);
                    if (crmEmUso) {
                        throw new ErrorResponse(400, "CRM já está em uso.");
                    }
                }

                if (dados.email !== loginAtual.email) {
                    const emailEmUso = await this.#loginDAO.findOtherByEmailAndType(
                        dados.email,
                        "Médico",
                        idUsuario,
                        connection
                    );
                    if (emailEmUso) {
                        throw new ErrorResponse(400, "E-mail já está em uso por outro médico.");
                    }
                }

                const resultado = await this.#dao.updateOwnProfile(
                    crmAtual,
                    dados,
                    connection
                );
                if (resultado.affectedRows === 0) {
                    throw new ErrorResponse(404, "Médico não encontrado.");
                }

                const senha = dados.senha ? md5(dados.senha) : loginAtual.senha;
                await this.#loginDAO.updateCredenciais(
                    idUsuario,
                    dados.email,
                    senha,
                    connection
                );

                return {
                    ...medicoAtual,
                    crm: dados.crm,
                    nome: dados.nome,
                    email: dados.email,
                    telefone: dados.telefone,
                    especialidade: dados.especialidade
                };
            });
        } catch (erro) {
            if (erro.code === "ER_DUP_ENTRY") {
                throw new ErrorResponse(400, "CRM ou e-mail já está em uso.");
            }
            throw erro;
        }
    }
    updateStatus = async (crm, status) => {

        const medico = await this.#dao.findByCRM(crm);

        if (!medico) {
            throw new ErrorResponse(
                404,
                "Médico não encontrado"
            );
        }

        if (
            status !== "Ativo" &&
            status !== "Desativado"
        ) {
            throw new ErrorResponse(
                400,
                "Status inválido"
            );
        }

        const result = await this.#dao.updateStatus(
            medico.id_usuario,
            status
        );

        if (result.affectedRows === 0) {
            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        return {
            crm: medico.crm,
            nome: medico.nome,
            status
        };
    }

    delete = async (crm) => {

        const medico = await this.#dao.findByCRM(crm);

        if (!medico) {
            throw new ErrorResponse(
                404,
                "Médico não encontrado"
            );
        }

        const result = await this.#dao.delete(crm);

        if (result.affectedRows === 0) {
            throw new ErrorResponse(
                404,
                "Médico não encontrado"
            );
        }

        await this.#loginDAO.delete(
            medico.id_usuario
        );

        await this.#enderecoDAO.delete(
            medico.id_endereco
        );

        return true;
    }
}

const ExamesDAO = require("../dao/ExamesDAO");
const Exames = require("../model/Exames");
const ConsultasDAO = require("../dao/ConsultasDAO");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ExamesService {

    #dao;
    #consultasDAO;

    constructor(banco) {
        this.#dao = new ExamesDAO(banco);
        this.#consultasDAO = new ConsultasDAO(banco);
    }

    create = async (dados, user) => {
        const consulta =
            await this.#consultasDAO.findById(
                dados.id_consulta
            );

        if (!consulta) {

            throw new ErrorResponse(
                404,
                "Consulta não encontrada"
            );
        }

        if (
            user.role === "Médico" &&
            consulta.crm !== user.crm
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        const exame = new Exames();

        Object.assign(exame, dados);

        return await this.#dao.create(exame);
    }

    findById = async (id) => {
        const exame = await this.#dao.findById(id);

        if (!exame) {
            throw new ErrorResponse(404, "Exame não encontrado");
        }

        return exame;
    }

    findByCpf = async (cpf) => {

        return await this.#dao.findByCpf(cpf);
    }

    findByCrm = async (crm) => {

        return await this.#dao.findByCrm(crm);
    }

    validarAcessoExame = async (id, user) => {

        const exame =
            await this.#dao.findById(id);

        if (!exame) {

            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        const consulta =
            await this.#consultasDAO.findById(
                exame.id_consulta
            );

        if (!consulta) {

            throw new ErrorResponse(
                404,
                "Consulta não encontrada"
            );
        }

        if (
            user.role === "Paciente" &&
            consulta.cpf !== user.cpf
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        if (
            user.role === "Médico" &&
            consulta.crm !== user.crm
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return exame;
    }


    update = async (id, dados, user) => {

        const exame =
            await this.#dao.findById(id);

        if (!exame) {

            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        const consultaAtual =
            await this.#consultasDAO.findById(
                exame.id_consulta
            );

        if (
            user.role === "Médico" &&
            consultaAtual.crm !== user.crm
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        if (dados.id_consulta) {

            const novaConsulta =
                await this.#consultasDAO.findById(
                    dados.id_consulta
                );

            if (!novaConsulta) {

                throw new ErrorResponse(
                    404,
                    "Consulta não encontrada"
                );
            }

            if (
                user.role === "Médico" &&
                novaConsulta.crm !== user.crm
            ) {

                throw new ErrorResponse(
                    403,
                    "Acesso negado"
                );
            }
        }

        const novoExame = new Exames();

        Object.assign(
            novoExame,
            dados
        );

        novoExame.id_exame = id;

        const result =
            await this.#dao.update(
                novoExame
            );

        return {
            atualizado:
                result.changedRows > 0
        };
    }

    delete = async (id, user) => {

        const exame =
            await this.#dao.findById(id);

        if (!exame) {

            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        const consulta =
            await this.#consultasDAO.findById(
                exame.id_consulta
            );

        if (
            user.role === "Médico" &&
            consulta.crm !== user.crm
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        const result =
            await this.#dao.delete(id);

        if (result.affectedRows === 0) {

            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        return true;
    }
}
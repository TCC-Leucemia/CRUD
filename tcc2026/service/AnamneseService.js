const AnamneseDAO = require("../dao/AnamneseDAO");
const PacientesDAO = require("../dao/PacientesDAO");
const MedicosDAO = require("../dao/MedicosDAO");
const ConsultasDAO = require("../dao/ConsultasDAO");

const Anamnese = require("../model/Anamnese");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class AnamneseService {

    #dao;
    #pacientesDAO;
    #medicosDAO;
    #consultasDAO;

    constructor(banco) {

        this.#dao = new AnamneseDAO(banco);

        this.#pacientesDAO = new PacientesDAO(banco);
        this.#medicosDAO = new MedicosDAO(banco);
        this.#consultasDAO = new ConsultasDAO(banco);
    }

    create = async (dados, user) => {

        dados.crm = user.crm;

        const paciente =
            await this.#pacientesDAO.findById(
                dados.cpf
            );

        if (!paciente) {

            throw new ErrorResponse(
                404,
                "Paciente não encontrado"
            );
        }

        const medico =
            await this.#medicosDAO.findByCRM(
                dados.crm
            );

        if (!medico) {

            throw new ErrorResponse(
                404,
                "Médico não encontrado"
            );
        }

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

        if (consulta.crm !== user.crm) {

            throw new ErrorResponse(
                403,
                "Você só pode criar anamnese para consultas vinculadas a você"
            );
        }

        const anamnese = new Anamnese();

        Object.assign(anamnese, dados);

        return await this.#dao.create(anamnese);
    }

    findAll = async () => {

        const dados = await this.#dao.findAll();

        if (dados.length === 0) {
            throw new ErrorResponse(
                404,
                "Nenhuma anamnese encontrada"
            );
        }

        return dados;
    }

    findById = async (id) => {

        const anamnese = await this.#dao.findById(id);

        if (!anamnese) {
            throw new ErrorResponse(
                404,
                "Anamnese não encontrada"
            );
        }

        return anamnese;
    }

    findByCpf = async (cpf) => {
        return await this.#dao.findByCpf(cpf);
    }

    findByCrm = async (crm) => {
        return await this.#dao.findByCrm(crm);
    }

    validarAcessoAnamnese = async (id, user) => {

        const anamnese =
            await this.#dao.findById(id);

        if (!anamnese) {

            throw new ErrorResponse(
                404,
                "Anamnese não encontrada"
            );
        }

        if (
            user.role === "Médico" &&
            anamnese.crm !== user.crm
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return anamnese;
    }

    update = async (id, dados, user) => {

        const existente =
            await this.#dao.findById(id);

        if (!existente) {

            throw new ErrorResponse(
                404,
                "Anamnese não encontrada"
            );
        }

        if (existente.crm !== user.crm) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        dados.crm = user.crm;

        if (dados.cpf) {

            const paciente =
                await this.#pacientesDAO.findById(
                    dados.cpf
                );

            if (!paciente) {

                throw new ErrorResponse(
                    404,
                    "Paciente não encontrado"
                );
            }
        }

        const medico =
            await this.#medicosDAO.findByCRM(
                dados.crm
            );

        if (!medico) {

            throw new ErrorResponse(
                404,
                "Médico não encontrado"
            );
        }

        if (dados.id_consulta) {

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

            if (consulta.crm !== user.crm) {

                throw new ErrorResponse(
                    403,
                    "Acesso negado"
                );
            }
        }

        const anamnese = new Anamnese();

        Object.assign(anamnese, dados);

        anamnese.id_anamnese = id;

        const resultado =
            await this.#dao.update(anamnese);

        return {
            atualizado:
                resultado.changedRows > 0
        };
    }

    delete = async (id, user) => {

        const anamnese = await this.#dao.findById(id);

        if (!anamnese) {

            throw new ErrorResponse(
                404,
                "Anamnese não encontrada"
            );
        }

        if (anamnese.crm !== user.crm) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        const resultado =
            await this.#dao.delete(id);

        if (resultado.affectedRows === 0) {

            throw new ErrorResponse(
                404,
                "Anamnese não encontrada"
            );
        }

        return true;
    }
}
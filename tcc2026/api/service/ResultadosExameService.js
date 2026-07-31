const ResultadosExameDAO = require("../dao/ResultadosExameDAO");
const ExamesDAO = require("../dao/ExamesDAO");
const ResultadosExame = require("../model/ResultadosExames");
const ErrorResponse = require("../utils/ErrorResponse");

module.exports = class ResultadosExameService {

    #dao;
    #examesDAO;

    constructor(banco) {

        this.#dao = new ResultadosExameDAO(banco);
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

        if (!owner) {

            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        if (
            owner.crm !== user.crm
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        const resultado = new ResultadosExame();

        Object.assign(
            resultado,
            dados
        );

        return await this.#dao.create(
            resultado
        );
    }

    findAll = async () => {

        const resultados = await this.#dao.findAll();

        if (resultados.length === 0) {
            throw new ErrorResponse(
                404,
                "Nenhum resultado encontrado"
            );
        }

        return resultados;
    }

    findByCpf = async (cpf) => {

        return await this.#dao.findByCpf(cpf);
    }

    findByCrm = async (crm) => {

        return await this.#dao.findByCrm(crm);
    }

    findById = async (id) => {

        const resultado = await this.#dao.findById(id);

        if (!resultado) {
            throw new ErrorResponse(
                404,
                "Resultado não encontrado"
            );
        }

        return resultado;
    }
    validarAcessoResultado = async (
        id_resultado,
        user
    ) => {

        const resultado =
            await this.#dao.findByIdWithConsulta(
                id_resultado
            );

        if (!resultado) {

            throw new ErrorResponse(
                404,
                "Resultado não encontrado"
            );
        }

        if (
            user.role === "Paciente" &&
            resultado.cpf !== user.cpf
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        if (
            user.role === "Médico" &&
            resultado.crm !== user.crm
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return resultado;
    }

    update = async (id,dados,user) => {

        const existente =
            await this.#dao.findById(id);

        if (!existente) {

            throw new ErrorResponse(
                404,
                "Resultado não encontrado"
            );
        }

        if (dados.id_exame) {

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
                !owner ||
                owner.crm !== user.crm
            ) {

                throw new ErrorResponse(
                    403,
                    "Acesso negado"
                );
            }
        }

        const resultado =
            new ResultadosExame();

        Object.assign(
            resultado,
            dados
        );

        resultado.id_resultado = id;

        const res =
            await this.#dao.update(
                resultado
            );

        return {
            atualizado:
                res.changedRows > 0
        };
    }

    delete = async (id) => {

        const result = await this.#dao.delete(id);

        if (result.affectedRows === 0) {

            throw new ErrorResponse(
                404,
                "Resultado não encontrado"
            );
        }

        return true;
    }
    findByExame = async (idExame, user) => {

        const resultado =
            await this.#dao.findByExame(idExame);

        if (!resultado) {
            return null;
        }

        if (
            user.role === "Paciente" &&
            resultado.cpf !== user.cpf
        ) {
            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        if (
            user.role === "Médico" &&
            resultado.crm !== user.crm
        ) {
            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return resultado;
    }
}
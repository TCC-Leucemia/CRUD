const ResultadosExameService = require("../service/ResultadosExameService");

module.exports = class ResultadosExameControl {

    #service;

    constructor(banco) {

        console.log("ResultadosExameControl.constructor");

        this.#service = new ResultadosExameService(banco);
    }

    store = async (req, res, next) => {

        try {

            const result = await this.#service.create(
                req.body,
                req.user
            );

            return res.status(201).send({
                status: true,
                msg: "Resultado cadastrado",
                dados: {
                    id_resultado: result.insertId,
                    ...req.body
                }
            });

        } catch (erro) {
            next(erro);
        }
    }

    index = async (req, res, next) => {

        try {

            let result;

            if (req.user.role === "Paciente") {

                result =
                    await this.#service.findByCpf(
                        req.user.cpf
                    );

            }
            else if (req.user.role === "Médico") {

                result =
                    await this.#service.findByCrm(
                        req.user.crm
                    );

            }

            return res.status(200).send({
                status: true,
                dados: result
            });

        } catch (erro) {
            next(erro);
        }
    }

    show = async (req, res, next) => {

        try {

            const result =
                await this.#service.validarAcessoResultado(
                    req.params.id_resultado,
                    req.user
                );

            return res.status(200).send({
                status: true,
                dados: result
            });

        } catch (erro) {
            next(erro);
        }
    }

    update = async (req, res, next) => {

        try {
            await this.#service.validarAcessoResultado(
                req.params.id_resultado,
                req.user
            );
            await this.#service.update(
                req.params.id_resultado,
                req.body,
                req.user
            );

            return res.status(200).send({
                status: true,
                msg: "Resultado atualizado"
            });

        } catch (erro) {
            next(erro);
        }
    }

    destroy = async (req, res, next) => {

        try {
            await this.#service.validarAcessoResultado(
                req.params.id_resultado,
                req.user
            );
            await this.#service.delete(
                req.params.id_resultado
            );

            return res.status(200).send({
                status: true,
                msg: "Resultado deletado"
            });

        } catch (erro) {
            next(erro);
        }
    }
}
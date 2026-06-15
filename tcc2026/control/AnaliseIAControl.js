const AnaliseIAService = require("../service/AnaliseIAService");

module.exports = class AnaliseIAControl {

    #service;

    constructor(banco) {

        console.log("AnaliseIAControl.constructor");

        this.#service = new AnaliseIAService(banco);
    }

    store = async (req, res, next) => {

        try {

            const result = await this.#service.create(
                req.body,
                req.user
            );

            return res.status(201).send({
                status: true,
                msg: "Análise cadastrada",
                dados: {
                    id_analise: result.insertId,
                    ...req.body
                }
            });

        } catch (erro) {
            next(erro);
        }
    }

    index = async (req, res, next) => {

        try {

            const result =
                await this.#service.findByCrm(
                    req.user.crm
                );

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
                await this.#service.validarAcessoAnalise(
                    req.params.id_analise,
                    req.user.crm
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

            await this.#service.validarAcessoAnalise(
                req.params.id_analise,
                req.user.crm
            );

            await this.#service.update(
                req.params.id_analise,
                req.body,
                req.user
            );

            return res.status(200).send({
                status: true,
                msg: "Análise atualizada"
            });

        } catch (erro) {
            next(erro);
        }
    }

    destroy = async (req, res, next) => {

        try {
            await this.#service.validarAcessoAnalise(
                req.params.id_analise,
                req.user.crm
            );
            
            await this.#service.delete(
                req.params.id_analise
            );

            return res.status(200).send({
                status: true,
                msg: "Análise deletada"
            });

        } catch (erro) {
            next(erro);
        }
    }
}
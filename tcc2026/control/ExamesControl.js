const ExamesService = require("../service/ExamesService");

module.exports = class ExamesControl {

    #service;

    constructor(banco) {
        console.log("ExamesControl.constructor");
        this.#service = new ExamesService(banco);
    }

    store = async (req, res, next) => {
        try {
            const result =
                await this.#service.create(
                    req.body,
                    req.user
                );

            res.status(201).send({
                status: true,
                msg: "Exame cadastrado",
                dados: {
                    id_exame: result.insertId,
                    ...req.body
                }
            });

        } catch (err) {
            next(err);
        }
    }

    index = async (req, res, next) => {
        try {
            let dados;

            if (req.user.role === "Médico") {

                dados =
                    await this.#service.findByCrm(
                        req.user.crm
                    );
            }
            else if (req.user.role === "Paciente") {

                dados =
                    await this.#service.findByCpf(
                        req.user.cpf
                    );
            }

            res.status(200).send({ status: true, dados });

        } catch (err) {
            next(err);
        }
    }

    show = async (req, res, next) => {

        try {

            const dados =
                await this.#service
                    .validarAcessoExame(
                        req.params.id,
                        req.user
                    );

            res.status(200).send({
                status: true,
                dados
            });

        } catch (err) {

            next(err);
        }
    }

    update = async (req, res, next) => {
        try {
            const result =
                await this.#service.update(
                    req.params.id,
                    req.body,
                    req.user
                );

            res.status(200).send({
                status: true,
                msg: "Atualizado",
                dados: result
            });

        } catch (err) {
            next(err);
        }
    }

    destroy = async (req, res, next) => {
        try {
            await this.#service.delete(
                req.params.id,
                req.user
            );

            res.status(200).send({
                status: true,
                msg: "Deletado"
            });

        } catch (err) {
            next(err);
        }
    }
}
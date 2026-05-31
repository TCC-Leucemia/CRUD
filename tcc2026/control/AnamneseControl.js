const AnamneseService = require("../service/AnamneseService");

module.exports = class AnamneseControl {

    #banco;

    constructor(banco) {
        this.#banco = banco;
        console.log("AnamneseControl.constructor");
    }

    store = async (req, res, next) => {

        try {

            const service = new AnamneseService(this.#banco);

            const resultado = await service.create(req.body);

            res.status(201).send({
                status: true,
                msg: "Anamnese cadastrada",
                dados: {
                    id_anamnese: resultado.insertId,
                    ...req.body
                }
            });

        } catch (erro) {
            next(erro);
        }
    }

    index = async (req, res, next) => {

        try {

            const service = new AnamneseService(this.#banco);

            let resultado;

            if (req.user.role === "Paciente") {

                resultado =
                    await service.findByCpf(
                        req.user.cpf
                    );

            }
            else if (req.user.role === "Médico") {

                resultado =
                    await service.findByCrm(
                        req.user.crm
                    );

            }

            res.status(200).send({
                status: true,
                dados: resultado
            });

        } catch (erro) {
            next(erro);
        }
    }

    show = async (req, res, next) => {

        try {

            const service = new AnamneseService(this.#banco);

            const resultado = await service.findById(
                req.params.id_anamnese
            );

            res.status(200).send({
                status: true,
                dados: resultado
            });

        } catch (erro) {
            next(erro);
        }
    }

    update = async (req, res, next) => {

        try {

            const service = new AnamneseService(this.#banco);

            const resultado = await service.update(
                req.params.id_anamnese,
                req.body
            );

            res.status(200).send({
                status: true,
                msg: "Atualizado",
                dados: resultado
            });

        } catch (erro) {
            next(erro);
        }
    }

    destroy = async (req, res, next) => {

        try {

            const service = new AnamneseService(this.#banco);

            await service.delete(req.params.id_anamnese);

            res.status(200).send({
                status: true,
                msg: "Anamnese deletada"
            });

        } catch (erro) {
            next(erro);
        }
    }
}
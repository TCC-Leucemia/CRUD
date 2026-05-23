const ConsultasService = require("../service/ConsultasService");

module.exports = class ConsultasControl {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    store = async (req, res, next) => {
        try {
            const service = new ConsultasService(this.#banco);

            const result = await service.create(req.body);

            res.status(201).send({
                status: true,
                msg: "Consulta criada",
                dados: {
                    id_consulta: result.insertId,
                    ...req.body
                }
            });

        } catch (err) {
            next(err);
        }
    }

    index = async (req, res, next) => {
        try {
            const service = new ConsultasService(this.#banco);
            const data = await service.findAll();

            res.status(200).send({ status: true, dados: data });

        } catch (err) {
            next(err);
        }
    }

    show = async (req, res, next) => {
        try {
            const service = new ConsultasService(this.#banco);
            const data = await service.findById(req.params.id);

            res.status(200).send({ status: true, dados: data });

        } catch (err) {
            next(err);
        }
    }

    update = async (req, res, next) => {
        try {
            const service = new ConsultasService(this.#banco);

            const result = await service.update(req.params.id, req.body);

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
            const service = new ConsultasService(this.#banco);

            await service.delete(req.params.id);

            res.status(200).send({
                status: true,
                msg: "Deletado"
            });

        } catch (err) {
            next(err);
        }
    }
}
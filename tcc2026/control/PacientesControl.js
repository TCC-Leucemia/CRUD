const PacientesService = require("../service/PacientesService");


module.exports = class PacientesControl {

    #service;

    constructor(banco) {
        this.#service = new PacientesService(banco);
    }

    store = async (req, res, next) => {
        try {
            const result = await this.#service.create(req.body);
            res.status(201).send({
                status: true,
                msg: "Paciente cadastrado com sucesso.",
                dados: {
                    cpf: req.body.cpf,
                    nome: req.body.nome,
                    email: req.body.email,
                    telefone: req.body.telefone
                }

            });
        } catch (err) {
            next(err);
        }
    }

    index = async (req, res, next) => {

        try {

            const result = await this.#service.findAll(
                req.user
            );

            res.status(200).send({
                status: true,
                dados: result
            });

        } catch (err) {

            next(err);
        }
    }

    show = async (req, res, next) => {
        try {
            const result = await this.#service.findById(
                req.params.cpf,
                req.user
            );
            res.status(200).send({ status: true, dados: result });
        } catch (err) {
            next(err);
        }
    }

    update = async (req, res, next) => {
        try {
            const result = await this.#service.update(req.params.cpf, req.body);

            res.status(200).send({
                status: true,
                msg: result.atualizado ? "Atualizado com sucesso" : "Sem alteração"
            });

        } catch (err) {
            next(err);
        }
    }

    destroy = async (req, res, next) => {
        try {
            await this.#service.delete(req.params.cpf);
            res.status(200).send({ status: true, msg: "Deletado" });
        } catch (err) {
            next(err);
        }
    }

    meusDados = async (req, res, next) => {

        try {

            const result =
                await this.#service.findMeuPerfil(
                    req.user.cpf
                );

            return res.status(200).send({
                status: true,
                dados: result
            });

        } catch (erro) {

            next(erro);
        }
    }
}
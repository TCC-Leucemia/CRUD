const AdministradoresService =
require("../service/AdministradoresService");

module.exports = class AdministradoresControl {

    #service;

    constructor(banco) {

        console.log("AdministradoresControl.constructor");

        this.#service =
            new AdministradoresService(banco);
    }

    store = async (req, res, next) => {

        try {

            const resultado =
                await this.#service.create(req.body);

            res.status(201).send({
                status: true,
                msg: "Administrador cadastrado",
                dados: {
                    cpf: req.body.cpf,
                    nome: req.body.nome,
                    email: req.body.email,
                    telefone: req.body.telefone,
                    id_usuario: req.body.id_usuario
                }
            });

        } catch (erro) {
            next(erro);
        }
    }

    index = async (req, res, next) => {

        try {

            const resultado =
                await this.#service.findAll();

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

            const resultado =
                await this.#service.findById(
                    req.params.cpf
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

            const resultado =
                await this.#service.update(
                    req.params.cpf,
                    req.body
                );

            res.status(200).send({
                status: true,
                msg: "Administrador atualizado",
                dados: resultado
            });

        } catch (erro) {
            next(erro);
        }
    }

    destroy = async (req, res, next) => {

        try {

            await this.#service.delete(
                req.params.cpf
            );

            res.status(200).send({
                status: true,
                msg: "Administrador deletado"
            });

        } catch (erro) {
            next(erro);
        }
    }
}
const ImagensExameService = require("../service/ImagensExameService");

module.exports = class ImagensExameControl {

    #banco;

    constructor(banco) {
        this.#banco = banco;
        console.log("ImagensExameControl.constructor");
    }

    store = async (req, res, next) => {

        try {

            const service = new ImagensExameService(this.#banco);

            const resultado = await service.create(
                req.body,
                req.user
            );

            res.status(201).send({
                status: true,
                msg: "Imagem cadastrada",
                dados: {
                    id_imagem: resultado.insertId,
                    ...req.body
                }
            });

        } catch (erro) {
            next(erro);
        }
    }

    index = async (req, res, next) => {

        try {

            const service =
                new ImagensExameService(this.#banco);

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

            const service = new ImagensExameService(this.#banco);

            await service.validarAcessoImagem(
                req.params.id_imagem,
                req.user
            );

            const resultado = await service.findById(req.params.id_imagem);

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

            const service = new ImagensExameService(this.#banco);

            await service.validarAcessoImagem(
                req.params.id_imagem,
                req.user
            );

            const resultado = await service.update(
                req.params.id_imagem,
                req.body,
                req.user
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

            const service = new ImagensExameService(this.#banco);

            await service.validarAcessoImagem(
                req.params.id_imagem,
                req.user
            );

            await service.delete(req.params.id_imagem);

            res.status(200).send({
                status: true,
                msg: "Imagem deletada"
            });

        } catch (erro) {
            next(erro);
        }
    }
}
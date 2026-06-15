const LoginService = require("../service/LoginService");
const MeuTokenJWT = require("../http/MeuTokenJWT");

module.exports = class LoginControl {

    #service;

    constructor(banco) {
        console.log("LoginControl.constructor");
        this.#service = new LoginService(banco);
    }

    store = async (req, res, next) => {
        try {
            const result = await this.#service.create(req.body);

            res.status(201).send({
                status: true,
                msg: "Criado com sucesso",
                dados: result
            });

        } catch (err) {
            next(err);
        }
    }

    index = async (req, res, next) => {
        try {
            const result = await this.#service.findAll();
            res.status(200).send({ status: true, dados: result });
        } catch (err) {
            next(err);
        }
    }

    show = async (req, res, next) => {
        try {
            const result = await this.#service.findById(req.params.id);
            res.status(200).send({ status: true, dados: result });
        } catch (err) {
            next(err);
        }
    }

    update = async (req, res, next) => {
        try {
            await this.#service.validarAcessoLogin(
                req.params.id,
                req.user
            );

            const result =
                await this.#service.update(
                    req.params.id,
                    req.body,
                    req.user
                );
            res.status(200).send({
                status: true,
                msg: result.atualizado
                    ? "Atualizado com sucesso."
                    : "Nenhuma alteração foi feita."
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
                msg: "Deletado com sucesso."
            });

        } catch (err) {
            next(err);
        }
    }

    login = async (req, res, next) => {

        try {

            const user =
                await this.#service.login(req.body);

            const jwt = new MeuTokenJWT();

            const token = jwt.gerarToken({

                id_usuario: user.id_usuario,

                nome: user.nome,

                email: user.email,

                role: user.tipo,

                crm: user.crm,

                cpf: user.cpf
            });

            res.status(200).send({

                status: true,

                token: token,

                usuario: {

                    id_usuario: user.id_usuario,

                    nome: user.nome,

                    email: user.email,

                    role: user.tipo
                }
            });

        } catch (err) {

            next(err);
        }
    }

    meuLogin = async (req, res, next) => {

        try {

            const result =
                await this.#service.findById(
                    req.user.id_usuario
                );

            res.status(200).send({
                status: true,
                dados: result
            });

        } catch (erro) {
            next(erro);
        }
    }
}
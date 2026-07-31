const MedicosService = require("../service/MedicosService");
const MeuTokenJWT = require("../http/MeuTokenJWT");

module.exports = class MedicosControl {

    #service;

    constructor(banco) {
        console.log("MedicosControl.constructor");
        this.#service = new MedicosService(banco);
    }

    store = async (req, res, next) => {
        try {
            await this.#service.create(req.body);

            res.status(201).send({
                status: true,
                msg: "Médico cadastrado com sucesso",
                dados: {
                    crm: req.body.crm,
                    nome: req.body.nome,
                    email: req.body.email,
                    especialidade: req.body.especialidade
                }
            });

        } catch (err) {
            next(err);
        }
    }

    index = async (req, res, next) => {
        try {
            const dados = await this.#service.findAll();
            res.send({ status: true, dados });
        } catch (err) {
            next(err);
        }
    }

    show = async (req, res, next) => {
        try {
            const dados = await this.#service.findByCRM(req.params.crm);
            res.send({ status: true, dados });
        } catch (err) {
            next(err);
        }
    }

    update = async (req, res, next) => {
        try {
            await this.#service.update(req.params.crm, req.body);

            res.send({
                status: true,
                msg: "Atualizado com sucesso",
                dados: req.body
            });

        } catch (err) {
            next(err);
        }
    }

    destroy = async (req, res, next) => {
        try {
            await this.#service.delete(req.params.crm);

            res.send({
                status: true,
                msg: "Deletado com sucesso"
            });

        } catch (err) {
            next(err);
        }
    }

    meusDados = async (req, res, next) => {

        try {

            const dados =
                await this.#service.findOwnProfile(
                    req.user.crm,
                    req.user.id_usuario
                );

            res.send({
                status: true,
                dados
            });

        } catch (err) {

            next(err);
        }
    }

    updateMeusDados = async (req, res, next) => {
        try {
            const dados = await this.#service.updateOwnProfile(
                req.user.crm,
                req.user.id_usuario,
                req.body
            );
            const token = new MeuTokenJWT().gerarToken({
                id_usuario: req.user.id_usuario,
                nome: dados.nome,
                email: dados.email,
                role: "Médico",
                crm: dados.crm
            });

            res.status(200).send({
                status: true,
                msg: "Dados pessoais atualizados com sucesso.",
                token,
                usuario: {
                    id_usuario: req.user.id_usuario,
                    nome: dados.nome,
                    email: dados.email,
                    role: "Médico"
                },
                dados
            });
        } catch (err) {
            next(err);
        }
    }

    meuMedico = async (
        req,
        res,
        next
    ) => {

        try {

            const dados =
                await this.#service.findByPaciente(
                    req.user.cpf
                );

            res.send({
                status: true,
                dados
            });

        } catch (err) {

            next(err);
        }
    }
    
}

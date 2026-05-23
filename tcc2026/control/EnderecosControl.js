const { response, request } = require('express');
const Enderecos = require('../model/Enderecos')
const EnderecosService = require('../service/EnderecosService')

module.exports = class EnderecosControl {
    #banco;

    constructor(banco) {
        console.log("EnderecosControl.constructor");
        this.#banco = banco;
    }

    store = async (request, response, next) => {
        console.log("POST: /enderecos - EnderecosControl.store()");

        try {
            const { rua, numero, bairro, cidade, estado, cep } = request.body;

            const enderecosService = new EnderecosService(this.#banco);

            const resultado = await enderecosService.create({
                rua,
                numero,
                bairro,
                cidade,
                estado,
                cep
            });

            response.status(201).send({
                status: true,
                msg: 'Cadastrado com sucesso.',
                codigo: '002',
                dados: {
                    id_enderecos: resultado.insertId,
                    rua,
                    numero,
                    bairro,
                    cidade,
                    estado,
                    cep
                }
            });

        } catch (erro) {
            console.log("ERRO REAL:", erro);
            next(erro);
        }
    }


    index = async (request, response, next) => {
        console.log("GET: /enderecos - EnderecosControl.index()");

        const enderecosService = new EnderecosService(this.#banco);

        enderecosService.findAll().then(respostaPromise => {

            const resposta = {
                status: true,
                msg: 'Sucesso.',
                codigo: '002',
                dados: respostaPromise
            }
            response.status(201).send(resposta);

        }).catch(erro => {
            console.log("ERRO REAL:", erro);
            const resposta = {

                status: false,
                msg: 'Erro ao realizar ao cadastrar',
                codigo: '003',
                dados: {}
            }
            response.status(500).send(resposta);
        });
    }

    show = async (request, response, next) => {
        console.log("GET: /enderecos/:id_endereco - EnderecosControl.show()");

        const id_endereco = request.params.id_endereco;

        if (!id_endereco) {
            return response.status(400).send({
                status: false,
                msg: 'ID não informado',
                codigo: '001',
                dados: {}
            });
        }

        const enderecosService = new EnderecosService(this.#banco);

        enderecosService.findById(id_endereco).then(resultado => {

            if (!resultado) {
                return response.status(404).send({
                    status: false,
                    msg: 'Endereço não encontrado',
                    codigo: '004',
                    dados: {}
                });
            }

            response.status(200).send({
                status: true,
                msg: 'Busca realizada com sucesso',
                codigo: '002',
                dados: resultado
            });

        }).catch(erro => {
            console.log("ERRO REAL:", erro);

            response.status(500).send({
                status: false,
                msg: 'Erro ao buscar endereço',
                codigo: '003',
                dados: {}
            });
        });
    }


    update = async (request, response, next) => {
        console.log("EnderecosControl.update()");

        try {
            const { rua, numero, bairro, cidade, estado, cep } = request.body;
            const id_endereco = request.params.id_endereco;

            if (!rua || !numero || !bairro || !cidade || !estado) {
                return response.status(400).send({
                    status: false,
                    msg: 'Preencha todos os campos obrigatoriamente.',
                    codigo: '001',
                    dados: {}
                });
            }

            const enderecosService = new EnderecosService(this.#banco);

            await enderecosService.update(id_endereco, {
                rua,
                numero,
                bairro,
                cidade,
                estado,
                cep
            });

            return response.status(200).send({
                status: true,
                msg: 'Atualizado com sucesso.',
                codigo: '002',
                dados: {
                    rua,
                    numero,
                    bairro,
                    cidade,
                    estado,
                    cep
                }
            });

        } catch (erro) {
            next(erro);
        }
    };

    destroy = async (request, response, next) => {
        console.log("DELETE: /enderecos/:id_endereco");

        try {
            const id = request.params.id_endereco;

            const enderecosService = new EnderecosService(this.#banco);

            await enderecosService.delete(id);

            return response.status(200).send({
                status: true,
                msg: 'Deletado com sucesso.',
                codigo: '002',
                dados: {}
            });

        } catch (erro) {
            next(erro);
        }
    }
}


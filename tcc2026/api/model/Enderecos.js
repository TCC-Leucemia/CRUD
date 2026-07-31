module.exports = class Enderecos {

    constructor(banco) {

        this._banco = banco;
        this._id_endereco = null,
            this._rua = null,
            this._numero = null,
            this._bairro = null,
            this._cidade = null,
            this._estado = null,
            this._cep = null

    }

    set banco(valor) {
        this._banco = valor;
    }
    get banco() {
        return this._banco;
    }
    set id_endereco(id_endereco) {
        this._id_endereco = id_endereco;
    }
    get id_endereco() {
        return this._id_endereco;
    }
    set rua(rua) {
        this._rua = rua;
    }
    get rua() {
        return this._rua;
    }
    set numero(numero) {
        this._numero = numero;
    }
    get numero() {
        return this._numero;
    }
    set bairro(bairro) {
        this._bairro = bairro;
    }
    get bairro() {
        return this._bairro;
    }
    set cidade(cidade) {
        this._cidade = cidade;
    }
    get cidade() {
        return this._cidade;
    }
    set estado(estado) {
        this._estado = estado;
    }
    get estado() {
        return this._estado;
    }
    set cep(cep) {
        this._cep = cep;
    }
    get cep() {
        return this._cep;
    }
}
module.exports = class Pacientes {

    constructor() {
        this._cpf = null;
        this._nome = null;
        this._data_nasc = null;
        this._sexo = null;
        this._email = null;
        this._telefone = null;
        this._id_usuario = null;
        this._id_endereco = null;
    }

    get cpf() {
        return this._cpf;
    }
    set cpf(cpf) {
        this._cpf = cpf;
    }

    get nome() {
        return this._nome;
    }
    set nome(nome) {
        this._nome = nome;
    }

    get data_nasc() {
        return this._data_nasc;
    }
    set data_nasc(data_nasc) {
        this._data_nasc = data_nasc;
    }

    get sexo() {
        return this._sexo;
    }
    set sexo(sexo) {
        this._sexo = sexo;
    }

    get email() {
        return this._email;
    }
    set email(email) {
        this._email = email;
    }

    get telefone() {
        return this._telefone;
    }
    set telefone(telefone) {
        this._telefone = telefone;
    }

    get id_usuario() {
        return this._id_usuario;
    }
    set id_usuario(id_usuario) {
        this._id_usuario = id_usuario;
    }

    get id_endereco() {
        return this._id_endereco;
    }
    set id_endereco(id_endereco) {
        this._id_endereco = id_endereco;
    }
}
module.exports = class Login {
    constructor() {
        this._id_usuario = null;
        this._email = null;
        this._senha = null;
        this._tipo = null;
    }

    get id_usuario() {
        return this._id_usuario;
    }
    set id_usuario(id_usuario) {
        this._id_usuario = id_usuario;
    }

    get email() {
        return this._email;
    }
    set email(email) {
        this._email = email;
    }

    get senha() {
        return this._senha;
    }
    set senha(senha) {
        this._senha = senha;
    }

    get tipo() {
        return this._tipo;
    }
    set tipo(tipo) {
        this._tipo = tipo;
    }
}
module.exports = class Administradores {

    #cpf;
    #nome;
    #email;
    #telefone;
    #id_usuario;

    get cpf() {
        return this.#cpf;
    }

    set cpf(cpf) {
        this.#cpf = cpf;
    }

    get nome() {
        return this.#nome;
    }

    set nome(nome) {
        this.#nome = nome;
    }

    get email() {
        return this.#email;
    }

    set email(email) {
        this.#email = email;
    }

    get telefone() {
        return this.#telefone;
    }

    set telefone(telefone) {
        this.#telefone = telefone;
    }

    get id_usuario() {
        return this.#id_usuario;
    }

    set id_usuario(id_usuario) {
        this.#id_usuario = id_usuario;
    }
}
module.exports = class ResultadosExame {

    #id_resultado;
    #id_exame;
    #resultado_texto;
    #suspeita_leucemia;
    #tipo_leucemia;
    #data_resultado;

    set id_resultado(id_resultado) {
        this.#id_resultado = id_resultado;
    }

    get id_resultado() {
        return this.#id_resultado;
    }

    set id_exame(id_exame) {
        this.#id_exame = id_exame;
    }

    get id_exame() {
        return this.#id_exame;
    }

    set resultado_texto(resultado_texto) {
        this.#resultado_texto = resultado_texto;
    }

    get resultado_texto() {
        return this.#resultado_texto;
    }

    set suspeita_leucemia(suspeita_leucemia) {
        this.#suspeita_leucemia = suspeita_leucemia;
    }

    get suspeita_leucemia() {
        return this.#suspeita_leucemia;
    }

    set tipo_leucemia(tipo_leucemia) {
        this.#tipo_leucemia = tipo_leucemia;
    }

    get tipo_leucemia() {
        return this.#tipo_leucemia;
    }

    set data_resultado(data_resultado) {
        this.#data_resultado = data_resultado;
    }

    get data_resultado() {
        return this.#data_resultado;
    }
}
module.exports = class AnaliseIA {

    #id_analise;
    #id_exame;
    #resultado_ia;
    #confianca;
    #data_analise;
    #statusc;

    set id_analise(id_analise) {
        this.#id_analise = id_analise;
    }

    get id_analise() {
        return this.#id_analise;
    }

    set id_exame(id_exame) {
        this.#id_exame = id_exame;
    }

    get id_exame() {
        return this.#id_exame;
    }

    set resultado_ia(resultado_ia) {
        this.#resultado_ia = resultado_ia;
    }

    get resultado_ia() {
        return this.#resultado_ia;
    }

    set confianca(confianca) {
        this.#confianca = confianca;
    }

    get confianca() {
        return this.#confianca;
    }

    set data_analise(data_analise) {
        this.#data_analise = data_analise;
    }

    get data_analise() {
        return this.#data_analise;
    }

    set statusc(statusc) {
        this.#statusc = statusc;
    }

    get statusc() {
        return this.#statusc;
    }
}
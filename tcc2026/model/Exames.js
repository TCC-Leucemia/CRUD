module.exports = class Exames {

    constructor() {
        this._id_exame = null;
        this._id_consulta = null;
        this._tipo_exame = null;
        this._data_exame = null;
        this._statusc = null;
    }

    get id_exame() {
        return this._id_exame;
    }
    set id_exame(id_exame) {
        this._id_exame = id_exame;

    }

    get id_consulta() {
        return this._id_consulta;
    }
    set id_consulta(id_exame) {
        this._id_consulta = id_exame;
    }

    get tipo_exame() {
        return this._tipo_exame;
    }
    set tipo_exame(tipo_exame) {
        this._tipo_exame = tipo_exame;
    }

    get data_exame() {
        return this._data_exame;
    }
    set data_exame(data_exame) {
        this._data_exame = data_exame;
    }

    get statusc() {
        return this._statusc;
    }
    set statusc(statusc) {
        this._statusc = statusc;
    }
}
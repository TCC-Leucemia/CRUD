module.exports = class Consultas {

    constructor() {
        this._id_consulta = null;
        this._cpf = null;
        this._crm = null;
        this._data_consulta = null;
        this._tipo_consulta = null;
        this._statusc = null;
    }

    set id_consulta(id_consulta) {
        this._id_consulta = id_consulta;
    }
    get id_consulta() {
        return this._id_consulta;
    }

    set cpf(cpf) {
        this._cpf = cpf;
    }
    get cpf() {
        return this._cpf;
    }

    set crm(crm) {
        this._crm = crm;
    }
    get crm() {
        return this._crm;
    }

    set data_consulta(data_consulta) {
        this._data_consulta = data_consulta;
    }
    get data_consulta() {
        return this._data_consulta;
    }

    set tipo_consulta(tipo_consulta) {
        this._tipo_consulta = tipo_consulta;
    }
    get tipo_consulta() {
        return this._tipo_consulta;
    }

    set statusc(statusc) {
        this._statusc = statusc;
    }
    get statusc() {
        return this._statusc;
    }
}
module.exports = class Anamnese {

    constructor() {
        this._id_anamnese = null;
        this._cpf = null;
        this._crm = null;
        this._id_consulta = null;
        this._sintomas = null;
        this._comorbidades = null;
    }

    get id_anamnese() {
        return this._id_anamnese;
    }

    set id_anamnese(id_anamnese) {
        this._id_anamnese = id_anamnese;
    }

    get cpf() {
        return this._cpf;
    }

    set cpf(cpf) {
        this._cpf = cpf;
    }

    get crm() {
        return this._crm;
    }

    set crm(crm) {
        this._crm = crm;
    }

    get id_consulta() {
        return this._id_consulta;
    }

    set id_consulta(id_consulta) {
        this._id_consulta = id_consulta;
    }

    get sintomas() {
        return this._sintomas;
    }

    set sintomas(sintomas) {
        this._sintomas = sintomas;
    }

    get comorbidades() {
        return this._comorbidades;
    }

    set comorbidades(comorbidades) {
        this._comorbidades = comorbidades;
    }
}
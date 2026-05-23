module.exports = class Medicos {

    constructor() {
        this._crm = null;
        this._nome = null;
        this._email = null;
        this._cpf = null;
        this._telefone = null;
        this._especialidade = null;
        this._id_usuario = null;
        this._id_endereco = null;
    }

    set crm(crm) { 
        this._crm = crm 
    }
    get crm() { 
        return this._crm 
    }
    set nome(nome) { 
        this._nome = nome 
    }
    get nome() { 
        return this._nome 
    }

    set email(email) { 
        this._email = email 
    }
    get email() { 
        return this._email 
    }

    set cpf(cpf) { 
        this._cpf = cpf 
    }
    get cpf() { 
        return this._cpf 
    }

    set telefone(telefone) { 
        this._telefone = telefone 
    }
    get telefone() { 
        return this._telefone 
    }

    set especialidade(especialidade) { 
        this._especialidade = especialidade 
    }
    get especialidade() { 
        return this._especialidade 
    }

    set id_usuario(id_usuario) { 
        this._id_usuario = id_usuario 
    }
    get id_usuario() { 
        return this._id_usuario 
    }
    
    set id_endereco(id_endereco) { 
        this._id_endereco = id_endereco 
    }
    get id_endereco() { 
        return this._id_endereco 
    }
}
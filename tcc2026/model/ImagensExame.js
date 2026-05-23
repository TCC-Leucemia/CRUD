module.exports = class ImagensExame {

    constructor() {
        this._id_imagem = null;
        this._id_exame = null;
        this._caminho_arquivo = null;
        this._descricao = null;
        this._data_upload = null;
    }

    get id_imagem() {
        return this._id_imagem;
    }

    set id_imagem(id_imagem) {
        this._id_imagem = id_imagem;
    }

    get id_exame() {
        return this._id_exame;
    }

    set id_exame(id_exame) {
        this._id_exame = id_exame;
    }

    get caminho_arquivo() {
        return this._caminho_arquivo;
    }

    set caminho_arquivo(caminho_arquivo) {
        this._caminho_arquivo = caminho_arquivo;
    }

    get descricao() {
        return this._descricao;
    }

    set descricao(descricao) {
        this._descricao = descricao;
    }

    get data_upload() {
        return this._data_upload;
    }

    set data_upload(data_upload) {
        this._data_upload = data_upload;
    }
}
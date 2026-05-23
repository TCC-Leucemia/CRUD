module.exports = class ImagensExameDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    create = async (imagem) => {

        const sql = `
            INSERT INTO imagens_exame
            (id_exame, caminho_arquivo, descricao, data_upload)
            VALUES (?, ?, ?, ?)
        `;

        const valores = [
            imagem.id_exame,
            imagem.caminho_arquivo,
            imagem.descricao,
            imagem.data_upload
        ];

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, valores, (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }

            });

        });
    }

    findAll = async () => {

        const sql = `SELECT * FROM imagens_exame`;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }

            });

        });
    }

    findById = async (id) => {

        const sql = `
            SELECT * FROM imagens_exame
            WHERE id_imagem = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [id], (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado[0]);
                }

            });

        });
    }

    update = async (imagem) => {

        const sql = `
            UPDATE imagens_exame
            SET
                id_exame = ?,
                caminho_arquivo = ?,
                descricao = ?,
                data_upload = ?
            WHERE id_imagem = ?
        `;

        const valores = [
            imagem.id_exame,
            imagem.caminho_arquivo,
            imagem.descricao,
            imagem.data_upload,
            imagem.id_imagem
        ];

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, valores, (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }

            });

        });
    }

    delete = async (id) => {

        const sql = `
            DELETE FROM imagens_exame
            WHERE id_imagem = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [id], (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }

            });

        });
    }
}
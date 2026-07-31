module.exports = class ImagensExameDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    create = async (imagem, conexao = this.#banco) => {

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

            conexao.query(sql, valores, (erro, resultado) => {

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

    findByCpf = async (cpf) => {

        const sql = `
            SELECT ie.*
            FROM imagens_exame ie
            INNER JOIN exames e
                ON e.id_exame = ie.id_exame
            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta
            WHERE c.cpf = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [cpf],
                (erro, resultado) => {

                    if (erro) {
                        reject(erro);
                    } else {
                        resolve(resultado);
                    }
                }
            );
        });
    }

    findByCrm = async (crm) => {

        const sql = `
            SELECT ie.*
            FROM imagens_exame ie
            INNER JOIN exames e
                ON e.id_exame = ie.id_exame
            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta
            WHERE c.crm = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [crm],
                (erro, resultado) => {

                    if (erro) {
                        reject(erro);
                    } else {
                        resolve(resultado);
                    }
                }
            );
        });
    }

    findOwnerByImagemId = async (idImagem) => {

        const sql = `
            SELECT
                ie.id_imagem,
                c.cpf,
                c.crm
            FROM imagens_exame ie
            INNER JOIN exames e
                ON e.id_exame = ie.id_exame
            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta
            WHERE ie.id_imagem = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [idImagem],
                (erro, resultado) => {

                    if (erro) {
                        reject(erro);
                    } else {
                        resolve(resultado[0] || null);
                    }
                }
            );
        });
    }
    findOwnerByExameId = async (idExame) => {

        const sql = `
            SELECT
                e.id_exame,
                c.cpf,
                c.crm
            FROM exames e
            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta
            WHERE e.id_exame = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [idExame],
                (erro, resultado) => {

                    if (erro) {
                        reject(erro);
                    } else {
                        resolve(resultado[0] || null);
                    }
                }
            );
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

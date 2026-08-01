module.exports = class AnamneseDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    create = async (anamnese, conexao = this.#banco) => {

        const sql = `
            INSERT INTO anamnese
            (cpf, crm, id_consulta, sintomas, comorbidades)
            VALUES (?, ?, ?, ?, ?)
        `;

        const valores = [
            anamnese.cpf,
            anamnese.crm,
            anamnese.id_consulta,
            anamnese.sintomas,
            anamnese.comorbidades
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

        const sql = `SELECT * FROM anamnese`;

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
            SELECT * FROM anamnese
            WHERE id_anamnese = ?
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
            SELECT * FROM anamnese
            WHERE cpf = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [cpf],
                (erro, resultado) => {

                    if (erro) reject(erro);
                    else resolve(resultado);

                }
            );
        });
    }

    findByCrm = async (crm) => {

        const sql = `
            SELECT * FROM anamnese
            WHERE crm = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [crm],
                (erro, resultado) => {

                    if (erro) reject(erro);
                    else resolve(resultado);

                }
            );
        });
    }

    findByConsulta(id_consulta) {

        const sql = `
            SELECT *
            FROM anamnese
            WHERE id_consulta = ?
            LIMIT 1
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [id_consulta],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result[0] || null);

                }
            );

        });

    }

    update = async (anamnese) => {

        const sql = `
            UPDATE anamnese
            SET
                cpf = ?,
                crm = ?,
                id_consulta = ?,
                sintomas = ?,
                comorbidades = ?
            WHERE id_anamnese = ?
        `;

        const valores = [
            anamnese.cpf,
            anamnese.crm,
            anamnese.id_consulta,
            anamnese.sintomas,
            anamnese.comorbidades,
            anamnese.id_anamnese
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
            DELETE FROM anamnese
            WHERE id_anamnese = ?
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

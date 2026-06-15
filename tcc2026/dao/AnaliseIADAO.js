module.exports = class AnaliseIADAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    async create(analise) {

        const sql = `
            INSERT INTO analise_ia
            (
                id_exame,
                resultado_ia,
                confianca,
                data_analise,
                statusc
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        const valores = [
            analise.id_exame,
            analise.resultado_ia,
            analise.confianca,
            analise.data_analise,
            analise.statusc
        ];

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, valores, (erro, result) => {

                if (erro) reject(erro);
                else resolve(result);

            });

        });
    }

    async findAll() {

        const sql = `SELECT * FROM analise_ia`;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, (erro, result) => {

                if (erro) reject(erro);
                else resolve(result);

            });

        });
    }

    async findById(id) {

        const sql = `
            SELECT * FROM analise_ia
            WHERE id_analise = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [id], (erro, result) => {

                if (erro) reject(erro);
                else resolve(result[0]);

            });

        });
    }
    findByCrm(crm) {

        const sql = `
            SELECT ai.*
            FROM analise_ia ai
            INNER JOIN exames e
                ON e.id_exame = ai.id_exame
            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta
            WHERE c.crm = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [crm],
                (erro, result) => {

                    if (erro) reject(erro);
                    else resolve(result);
                }
            );
        });
    }

    findByIdAndCrm(id_analise, crm) {

        const sql = `
            SELECT ai.*
            FROM analise_ia ai
            INNER JOIN exames e
                ON e.id_exame = ai.id_exame
            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta
            WHERE ai.id_analise = ?
            AND c.crm = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [id_analise, crm],
                (erro, result) => {

                    if (erro) reject(erro);
                    else resolve(result[0] || null);
                }
            );
        });
    }

    findOwnerByExameId(idExame) {

        const sql = `
            SELECT
                e.id_exame,
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
                (erro, result) => {

                    if (erro) {
                        reject(erro);
                    }
                    else {
                        resolve(result[0] || null);
                    }
                }
            );
        });
    }

    async update(analise) {

        const sql = `
            UPDATE analise_ia
            SET
                id_exame = ?,
                resultado_ia = ?,
                confianca = ?,
                data_analise = ?,
                statusc = ?
            WHERE id_analise = ?
        `;

        const valores = [
            analise.id_exame,
            analise.resultado_ia,
            analise.confianca,
            analise.data_analise,
            analise.statusc,
            analise.id_analise
        ];

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, valores, (erro, result) => {

                if (erro) reject(erro);
                else resolve(result);

            });

        });
    }

    async delete(id) {

        const sql = `
            DELETE FROM analise_ia
            WHERE id_analise = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [id], (erro, result) => {

                if (erro) reject(erro);
                else resolve(result);

            });

        });
    }
}
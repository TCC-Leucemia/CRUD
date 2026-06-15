module.exports = class ResultadosExameDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    async create(resultado) {

        const sql = `
            INSERT INTO resultados_exame
            (id_exame, resultado_texto, suspeita_leucemia, tipo_leucemia, data_resultado)
            VALUES (?, ?, ?, ?, ?)
        `;

        const valores = [
            resultado.id_exame,
            resultado.resultado_texto,
            resultado.suspeita_leucemia,
            resultado.tipo_leucemia,
            resultado.data_resultado
        ];

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, valores, (erro, result) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(result);
                }

            });

        });
    }

    async findAll() {

        const sql = `SELECT * FROM resultados_exame`;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, (erro, result) => {

                if (erro) reject(erro);
                else resolve(result);

            });

        });
    }

    findByCpf(cpf) {

        const sql = `
            SELECT re.*
            FROM resultados_exame re
            INNER JOIN exames e
                ON e.id_exame = re.id_exame
            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta
            WHERE c.cpf = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [cpf],
                (erro, result) => {

                    if (erro) reject(erro);
                    else resolve(result);
                }
            );
        });
    }
    findByCrm(crm) {

        const sql = `
            SELECT re.*
            FROM resultados_exame re
            INNER JOIN exames e
                ON e.id_exame = re.id_exame
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
    
    

    async findById(id) {

        const sql = `
            SELECT * FROM resultados_exame
            WHERE id_resultado = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [id], (erro, result) => {

                if (erro) reject(erro);
                else resolve(result[0]);

            });

        });
    }

    findByIdWithConsulta(id) {

        const sql = `
            SELECT
                re.*,
                c.cpf,
                c.crm
            FROM resultados_exame re
            INNER JOIN exames e
                ON e.id_exame = re.id_exame
            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta
            WHERE re.id_resultado = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [id],
                (erro, result) => {

                    if (erro) return reject(erro);

                    resolve(result[0] || null);
                }
            );
        });
    }

    findOwnerByExameId(idExame) {

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
                (erro, result) => {

                    if (erro) {
                        reject(erro);
                    } else {
                        resolve(result[0] || null);
                    }
                }
            );
        });
    }

    async update(resultado) {

        const sql = `
            UPDATE resultados_exame
            SET
                id_exame = ?,
                resultado_texto = ?,
                suspeita_leucemia = ?,
                tipo_leucemia = ?,
                data_resultado = ?
            WHERE id_resultado = ?
        `;

        const valores = [
            resultado.id_exame,
            resultado.resultado_texto,
            resultado.suspeita_leucemia,
            resultado.tipo_leucemia,
            resultado.data_resultado,
            resultado.id_resultado
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
            DELETE FROM resultados_exame
            WHERE id_resultado = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [id], (erro, result) => {

                if (erro) reject(erro);
                else resolve(result);

            });

        });
    }
}
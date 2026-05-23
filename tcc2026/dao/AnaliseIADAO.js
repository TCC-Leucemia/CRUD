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
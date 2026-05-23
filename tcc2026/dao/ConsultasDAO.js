module.exports = class ConsultasDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    create(consulta) {
        const sql = `
            INSERT INTO consultas (cpf, crm, data_consulta, tipo_consulta, statusc)
            VALUES (?, ?, ?, ?, ?)
        `;

        const params = [
            consulta.cpf,
            consulta.crm,
            consulta.data_consulta,
            consulta.tipo_consulta,
            consulta.statusc
        ];

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, params, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    findAll() {
        return new Promise((resolve, reject) => {
            this.#banco.query("SELECT * FROM consultas", (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    findById(id) {
        return new Promise((resolve, reject) => {
            this.#banco.query(
                "SELECT * FROM consultas WHERE id_consulta = ?",
                [id],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result[0] || null);
                }
            );
        });
    }

    update(consulta) {
        const sql = `
            UPDATE consultas 
            SET data_consulta=?, tipo_consulta=?, statusc=?
            WHERE id_consulta=?
        `;

        const params = [
            consulta.data_consulta,
            consulta.tipo_consulta,
            consulta.statusc,
            consulta.id_consulta
        ];

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, params, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            this.#banco.query(
                "DELETE FROM consultas WHERE id_consulta=?",
                [id],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    }
}
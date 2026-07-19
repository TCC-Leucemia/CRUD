module.exports = class ExamesDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    create(exame) {
        const sql = `
            INSERT INTO exames (id_consulta, tipo_exame, data_exame, statusc)
            VALUES (?, ?, ?, ?)
        `;

        const params = [
            exame.id_consulta,
            exame.tipo_exame,
            exame.data_exame,
            exame.statusc
        ];

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, params, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    findById(id) {
        return new Promise((resolve, reject) => {
            this.#banco.query(
                "SELECT * FROM exames WHERE id_exame = ?",
                [id],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result[0] || null);
                }
            );
        });
    }

    findByCpf(cpf) {

        const sql = `
            SELECT
            e.id_exame,
            e.id_consulta,
            e.tipo_exame,
            e.data_exame,
            e.statusc,

            c.data_consulta,

            m.nome AS medico,
            m.especialidade,

            p.nome AS paciente,
            p.cpf,

            r.resultado_texto,
            r.suspeita_leucemia,
            r.tipo_leucemia,
            r.data_resultado

            FROM exames e

            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta

            INNER JOIN pacientes p
                ON p.cpf = c.cpf

            INNER JOIN medicos m
                ON m.crm = c.crm

            LEFT JOIN resultados_exame r
                ON r.id_exame = e.id_exame

            WHERE c.cpf = ?

            ORDER BY e.data_exame DESC
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [cpf],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result);

                }
            );

        });

    }

    
    findByCrm(crm) {

        const sql = `
            SELECT
            e.id_exame,
            e.id_consulta,
            e.tipo_exame,
            e.data_exame,
            e.statusc,

            c.data_consulta,

            m.nome AS medico,
            m.especialidade,

            p.nome AS paciente,
            p.cpf,

            r.resultado_texto,
            r.suspeita_leucemia,
            r.tipo_leucemia,
            r.data_resultado

            FROM exames e

            INNER JOIN consultas c
                ON c.id_consulta = e.id_consulta

            INNER JOIN pacientes p
                ON p.cpf = c.cpf

            INNER JOIN medicos m
                ON m.crm = c.crm

            LEFT JOIN resultados_exame r
                ON r.id_exame = e.id_exame

            WHERE c.crm = ?

            ORDER BY e.data_exame DESC
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [crm],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result);

                }
            );

        });
    }
    update(exame) {
        const sql = `
            UPDATE exames 
            SET id_consulta=?, tipo_exame=?, data_exame=?, statusc=?
            WHERE id_exame=?
        `;

        const params = [
            exame.id_consulta,
            exame.tipo_exame,
            exame.data_exame,
            exame.statusc,
            exame.id_exame
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
                "DELETE FROM exames WHERE id_exame=?",
                [id],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    }
}
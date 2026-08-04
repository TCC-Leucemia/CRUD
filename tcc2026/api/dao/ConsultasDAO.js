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

            const sql = `
                SELECT
                    c.*,
                    p.nome AS paciente,
                    m.nome AS medico,
                    m.especialidade
                FROM consultas c
                INNER JOIN pacientes p
                ON p.cpf = c.cpf
                INNER JOIN medicos m
                ON m.crm = c.crm
            `;

            this.#banco.query(sql, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });

        });
    }

    findById(id) {

        const sql = `
        SELECT
            c.*,
            p.nome AS paciente,
            m.nome AS medico,
            m.especialidade
        FROM consultas c
        INNER JOIN pacientes p
            ON p.cpf = c.cpf
        INNER JOIN medicos m
            ON m.crm = c.crm
        WHERE c.id_consulta = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [id],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result[0] || null);

                }
            );

        });
    }

    findByPaciente(cpf) {

        const sql = `
            SELECT
                c.*,
                p.nome AS paciente,
                m.nome AS medico,
                m.especialidade
            FROM consultas c
            INNER JOIN pacientes p
                ON p.cpf = c.cpf
            INNER JOIN medicos m
                ON m.crm = c.crm
            WHERE c.cpf = ?
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

    findByMedico(crm) {

        const sql = `
            SELECT
                c.*,
                p.nome AS paciente,
                p.data_nasc,
                p.sexo,
                m.nome AS medico,
                m.especialidade,
                a.id_anamnese,
                a.sintomas,
                a.comorbidades

            FROM consultas c

            INNER JOIN pacientes p
                ON p.cpf = c.cpf

            INNER JOIN medicos m
                ON m.crm = c.crm

            LEFT JOIN anamnese a
                ON a.id_consulta = c.id_consulta

            WHERE c.crm = ?

            ORDER BY c.data_consulta DESC;
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
    updateStatus(id_consulta, statusc) {

        const sql = `
            UPDATE consultas
            SET statusc = ?
            WHERE id_consulta = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [statusc, id_consulta],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result);
                }
            );
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
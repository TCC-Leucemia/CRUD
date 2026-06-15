module.exports = class MedicosDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    create(medico) {
        const sql = `
        INSERT INTO medicos 
        (crm, nome, email, cpf, telefone, especialidade, id_usuario, id_endereco)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            medico.crm,
            medico.nome,
            medico.email,
            medico.cpf,
            medico.telefone,
            medico.especialidade,
            medico.id_usuario,
            medico.id_endereco
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
            this.#banco.query("SELECT * FROM medicos", (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    findByCRM(crm) {
        return new Promise((resolve, reject) => {
            this.#banco.query("SELECT * FROM medicos WHERE crm = ?", [crm], (err, result) => {
                if (err) return reject(err);
                resolve(result[0] || null);
            });
        });
    }

    findMedicoByPaciente(cpf) {

        const sql = `
            SELECT DISTINCT m.*
            FROM medicos m
            INNER JOIN consultas c
                ON c.crm = m.crm
            WHERE c.cpf = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [cpf],
                (err, result) => {

                    if (err)
                        return reject(err);

                    resolve(result);
                }
            );
        });
    }

    update(medico) {
        const sql = `
        UPDATE medicos SET 
        nome=?, email=?, telefone=?, especialidade=?, id_endereco=?
        WHERE crm=?`;

        const params = [
            medico.nome,
            medico.email,
            medico.telefone,
            medico.especialidade,
            medico.id_endereco,
            medico.crm
        ];

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, params, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    delete(crm) {
        return new Promise((resolve, reject) => {
            this.#banco.query("DELETE FROM medicos WHERE crm = ?", [crm], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }
}
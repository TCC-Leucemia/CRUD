module.exports = class MedicosDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    getConnection() {
        return this.#banco;
    }

    create(medico, connection = this.#banco) {
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
            connection.query(sql, params, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    findAll() {
        return new Promise((resolve, reject) => {

            const sql = `
                SELECT
                    m.*,
                    e.rua,
                    e.numero,
                    e.bairro,
                    e.cidade,
                    e.estado,
                    e.cep
                FROM medicos m
                INNER JOIN enderecos e
                    ON m.id_endereco = e.id_endereco
            `;

            this.#banco.query(sql, (err, result) => {

                if (err) {
                    return reject(err);
                }

                const medicos = result.map(m => ({

                    crm: m.crm,
                    nome: m.nome,
                    email: m.email,
                    cpf: m.cpf,
                    telefone: m.telefone,
                    especialidade: m.especialidade,
                    id_usuario: m.id_usuario,
                    id_endereco: m.id_endereco,

                    endereco: {
                        rua: m.rua,
                        numero: m.numero,
                        bairro: m.bairro,
                        cidade: m.cidade,
                        estado: m.estado,
                        cep: m.cep
                    }

                }));

                resolve(medicos);

            });

        });
    }

    findByCRM(crm, connection = this.#banco) {

        const sql = `
            SELECT
                m.*,
                e.rua,
                e.numero,
                e.bairro,
                e.cidade,
                e.estado,
                e.cep
            FROM medicos m
            INNER JOIN enderecos e
                ON e.id_endereco = m.id_endereco
            WHERE m.crm = ?
        `;

        return new Promise((resolve, reject) => {

            connection.query(
                sql,
                [crm],
                (err, result) => {

                    if (err)
                        return reject(err);

                    if (result.length === 0)
                        return resolve(null);

                    const m = result[0];

                    resolve({

                        crm: m.crm,
                        nome: m.nome,
                        email: m.email,
                        cpf: m.cpf,
                        telefone: m.telefone,
                        especialidade: m.especialidade,
                        id_usuario: m.id_usuario,
                        id_endereco: m.id_endereco,

                        endereco: {
                            rua: m.rua,
                            numero: m.numero,
                            bairro: m.bairro,
                            cidade: m.cidade,
                            estado: m.estado,
                            cep: m.cep
                        }

                    });

                }

            );

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

    update(medico, connection = this.#banco) {
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
            connection.query(sql, params, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    updateOwnProfile(crmAtual, medico, connection = this.#banco) {
        const sql = `
            UPDATE medicos
            SET crm = ?, nome = ?, email = ?, telefone = ?, especialidade = ?
            WHERE crm = ?
        `;

        return new Promise((resolve, reject) => {
            connection.query(sql, [
                medico.crm,
                medico.nome,
                medico.email,
                medico.telefone,
                medico.especialidade,
                crmAtual
            ], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    delete(crm, connection = this.#banco) {
        return new Promise((resolve, reject) => {
            connection.query("DELETE FROM medicos WHERE crm = ?", [crm], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }
}

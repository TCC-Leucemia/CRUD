const Pacientes = require("../model/Pacientes");

module.exports = class PacientesDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    create = async (paciente) => {
        const sql = `
            INSERT INTO pacientes 
            (cpf, nome, data_nasc, sexo, email, telefone, id_usuario, id_endereco)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, [
                paciente.cpf,
                paciente.nome,
                paciente.data_nasc,
                paciente.sexo,
                paciente.email,
                paciente.telefone,
                paciente.id_usuario,
                paciente.id_endereco
            ], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    findAll = async () => {

        const sql = `
            SELECT
                p.*,
                l.statusu AS status,
                e.rua,
                e.numero,
                e.bairro,
                e.cidade,
                e.estado,
                e.cep
            FROM pacientes p
            INNER JOIN login l
                ON p.id_usuario = l.id_usuario
            LEFT JOIN enderecos e
                ON p.id_endereco = e.id_endereco
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [], (err, result) => {

                if (err) return reject(err);

                const pacientes = result.map(p => ({

                    ...p,

                    endereco: {
                        rua: p.rua,
                        numero: p.numero,
                        bairro: p.bairro,
                        cidade: p.cidade,
                        estado: p.estado,
                        cep: p.cep
                    }

                }));

                resolve(pacientes);

            });

        });
    }

    findById = async (cpf) => {
        return new Promise((resolve, reject) => {
            this.#banco.query("SELECT * FROM pacientes WHERE cpf = ?", [cpf],
                (err, result) => err ? reject(err) : resolve(result[0] || null)
            );
        });
    }

    findByMedico = async (crm) => {

        const sql = `
            SELECT DISTINCT p.*
            FROM pacientes p
            INNER JOIN consultas c
                ON c.cpf = p.cpf
            WHERE c.crm = ?
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

    findByCpfAndMedico = async (cpf, crm) => {

        const sql = `
            SELECT DISTINCT p.*
            FROM pacientes p
            INNER JOIN consultas c
                ON c.cpf = p.cpf
            WHERE p.cpf = ?
            AND c.crm = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [cpf, crm],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result[0] || null);
                }
            );
        });
    }

    findByCPF(cpf) {
        return new Promise((resolve, reject) => {

            this.#banco.query(
                "SELECT * FROM pacientes WHERE cpf = ?",
                [cpf],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result[0] || null);
                }
            );

        });
    }

    update = async (paciente) => {
        const sql = `
            UPDATE pacientes 
            SET nome=?, data_nasc=?, sexo=?, email=?, telefone=?, id_usuario=?, id_endereco=?
            WHERE cpf=?
        `;

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, [
                paciente.nome,
                paciente.data_nasc,
                paciente.sexo,
                paciente.email,
                paciente.telefone,
                paciente.id_usuario,
                paciente.id_endereco,
                paciente.cpf
            ], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    updateStatus = async (cpf, status) => {

        const sql = `
            UPDATE login l
            INNER JOIN pacientes p
                ON p.id_usuario = l.id_usuario
            SET l.statusu = ?
            WHERE p.cpf = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [status, cpf],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result);
                }
            );

        });
    }

    delete = async (cpf) => {
        return new Promise((resolve, reject) => {
            this.#banco.query("DELETE FROM pacientes WHERE cpf = ?", [cpf],
                (err, result) => err ? reject(err) : resolve(result)
            );
        });
    }
}
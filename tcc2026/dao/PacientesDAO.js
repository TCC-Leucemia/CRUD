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
        return new Promise((resolve, reject) => {
            this.#banco.query("SELECT * FROM pacientes", [],
                (err, result) => err ? reject(err) : resolve(result)
            );
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

    delete = async (cpf) => {
        return new Promise((resolve, reject) => {
            this.#banco.query("DELETE FROM pacientes WHERE cpf = ?", [cpf],
                (err, result) => err ? reject(err) : resolve(result)
            );
        });
    }
}
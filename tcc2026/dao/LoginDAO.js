const Login = require("../model/Login");

module.exports = class LoginDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    create = async (login) => {
        const sql = `
            INSERT INTO login (email, senha, tipo)
            VALUES (?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, [login.email, login.senha, login.tipo],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    }

    findAll = async () => {
        return new Promise((resolve, reject) => {
            this.#banco.query("SELECT * FROM login", [],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    }

    findById = async (id) => {
        return new Promise((resolve, reject) => {
            this.#banco.query("SELECT * FROM login WHERE id_usuario = ?", [id],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result[0] || null);
                }
            );
        });
    }

    findByEmail = async (email) => {
        return new Promise((resolve, reject) => {
            this.#banco.query("SELECT * FROM login WHERE email = ?", [email],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result[0] || null);
                }
            );
        });
    }

    findPacienteByEmail = async (email) => {

        const sql = `
            SELECT
                l.id_usuario,
                l.email,
                l.senha,
                l.tipo,
                p.cpf,
                p.nome
            FROM login l
            INNER JOIN pacientes p
                ON p.id_usuario = l.id_usuario
            WHERE l.email = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [email],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result[0] || null);
                }
            );
        });
    }

    findMedicoByEmail = async (email) => {

        const sql = `
            SELECT
                l.id_usuario,
                l.email,
                l.senha,
                l.tipo,
                m.crm,
                m.nome
            FROM login l
            INNER JOIN medicos m
                ON m.id_usuario = l.id_usuario
            WHERE l.email = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [email],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result[0] || null);
                }
            );
        });
    }

    findAdministradorByEmail = async (email) => {

        const sql = `
            SELECT
                l.id_usuario,
                l.email,
                l.senha,
                l.tipo
            FROM login l
            WHERE l.email = ?
            AND l.tipo = 'Administrador'
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [email],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result[0] || null);
                }
            );
        });
    }

    update = async (login) => {
        const sql = `
            UPDATE login 
            SET email=?, senha=?, tipo=? 
            WHERE id_usuario=?
        `;

        return new Promise((resolve, reject) => {
            this.#banco.query(sql,
                [login.email, login.senha, login.tipo, login.id_usuario],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    }

    delete = async (id) => {
        return new Promise((resolve, reject) => {
            this.#banco.query("DELETE FROM login WHERE id_usuario = ?", [id],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    }
}
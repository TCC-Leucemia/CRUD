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
const Login = require("../model/Login");

module.exports = class LoginDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    getConnection() {
        return this.#banco;
    }

    create = async (login, connection = this.#banco) => {
        const sql = `
            INSERT INTO login (email, senha, tipo)
            VALUES (?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            connection.query(sql, [login.email, login.senha, login.tipo],
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

    findById = async (id, connection = this.#banco) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM login WHERE id_usuario = ?", [id],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result[0] || null);
                }
            );
        });
    }

    findByEmail = async (email, connection = this.#banco) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM login WHERE email = ?", [email],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result[0] || null);
                }
            );
        });
    }

    findOtherByEmailAndType = async (email, tipo, idUsuario, connection = this.#banco) => {
        return new Promise((resolve, reject) => {
            connection.query(
                "SELECT * FROM login WHERE email = ? AND tipo = ? AND id_usuario <> ? LIMIT 1",
                [email, tipo, idUsuario],
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
                l.statusu,
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
                l.statusu,
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
                l.tipo,
                l.statusu
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
    findMedicoByIdUsuario(id_usuario) {

        const sql = `
            SELECT
                l.*,
                m.crm,
                m.nome,
                m.cpf,
                m.telefone,
                m.especialidade
            FROM login l
            INNER JOIN medicos m
                ON m.id_usuario = l.id_usuario
            WHERE l.id_usuario = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [id_usuario],
                (erro, result) => {

                    if (erro) reject(erro);
                    else resolve(result[0] || null);
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
                l.statusu,
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


    update = async (login, connection = this.#banco) => {
        const sql = `
            UPDATE login
            SET email=?, senha=?, tipo=?
            WHERE id_usuario=?
        `;

        return new Promise((resolve, reject) => {
            connection.query(
                sql,
                [login.email, login.senha, login.tipo, login.id_usuario],
                (err, result) => {

                    if (err) {
                        console.error(err);
                        return reject(err);
                    }

                    resolve(result);
                }
            );
        });
    }
    updateCredenciais = async (id_usuario, email, senha, connection = this.#banco) => {

        const sql = `
            UPDATE login
            SET email = ?, senha = ?
            WHERE id_usuario = ?
        `;

        return new Promise((resolve, reject) => {

            connection.query(
                sql,
                [email, senha, id_usuario],
                (err, result) => {

                    if (err) return reject(err);

                    resolve(result);
                }
            );

        });

    }

    delete = async (id, connection = this.#banco) => {
        return new Promise((resolve, reject) => {
            connection.query("DELETE FROM login WHERE id_usuario = ?", [id],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });
    }
    buscarEmailPorCpf(cpf) {

        const sql = `
            SELECT
                l.id_usuario,
                l.email,
                l.tipo
            FROM login l
            LEFT JOIN pacientes p
                ON p.id_usuario = l.id_usuario
            LEFT JOIN medicos m
                ON m.id_usuario = l.id_usuario
            WHERE
                p.cpf = ?
                OR m.cpf = ?
            LIMIT 1`;

        return new Promise((resolve, reject) => {

            this.#banco.query(
                sql,
                [cpf, cpf],
                (erro, result) => {

                    if (erro) {
                        reject(erro);
                    }
                    else {
                        resolve(result[0] || null);
                    }

                }
            );

        });

    }
}

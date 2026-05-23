module.exports = class AdministradoresDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }

    async create(administrador) {

        const sql = `
            INSERT INTO administradores
            (cpf, nome, email, telefone, id_usuario)
            VALUES (?, ?, ?, ?, ?)
        `;

        const valores = [
            administrador.cpf,
            administrador.nome,
            administrador.email,
            administrador.telefone,
            administrador.id_usuario
        ];

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, valores, (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }
            });
        });
    }

    async findAll() {

        const sql = `SELECT * FROM administradores`;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }
            });
        });
    }

    async findById(cpf) {

        const sql = `
            SELECT * FROM administradores
            WHERE cpf = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [cpf], (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {

                    if (resultado.length > 0) {
                        resolve(resultado[0]);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    async update(administrador) {

        const sql = `
            UPDATE administradores
            SET nome = ?,
                email = ?,
                telefone = ?,
                id_usuario = ?
            WHERE cpf = ?
        `;

        const valores = [
            administrador.nome,
            administrador.email,
            administrador.telefone,
            administrador.id_usuario,
            administrador.cpf
        ];

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, valores, (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }
            });
        });
    }

    async delete(cpf) {

        const sql = `
            DELETE FROM administradores
            WHERE cpf = ?
        `;

        return new Promise((resolve, reject) => {

            this.#banco.query(sql, [cpf], (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }
            });
        });
    }
}
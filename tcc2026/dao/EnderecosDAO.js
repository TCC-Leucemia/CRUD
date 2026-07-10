const Enderecos = require("../model/Enderecos");

module.exports = class EnderecosDAO {

    #banco;

    constructor(banco) {
        this.#banco = banco;
    }
    getConnection() {
        return this.#banco;
    }

    async create(endereco, connection = this.#banco) {
        const sql = `
            INSERT INTO enderecos (rua, numero, bairro, cidade, estado, cep)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
            endereco.rua,
            endereco.numero,
            endereco.bairro,
            endereco.cidade,
            endereco.estado,
            endereco.cep
        ];

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, params, (erro, resultado) => {
                if (erro) return reject(erro);
                resolve(resultado.insertId);
            });
        });
    }

    async findAll() {
        const sql = `SELECT * FROM enderecos ORDER BY rua`;

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, [], (erro, resultado) => {
                if (erro) return reject(erro);
                resolve(resultado);
            });
        });
    }

    async findById(id) {
        const sql = `SELECT * FROM enderecos WHERE id_endereco = ?`;

        return new Promise((resolve, reject) => {
            this.#banco.query(sql, [id], (erro, resultado) => {
                if (erro) return reject(erro);
                resolve(resultado[0] || null);
            });
        });
    }

    async update(endereco, connection = this.#banco) {
        const sql = `
            UPDATE enderecos 
            SET rua=?, numero=?, bairro=?, cidade=?, estado=?, cep=? 
            WHERE id_endereco=?
        `;

        const params = [
            endereco.rua,
            endereco.numero,
            endereco.bairro,
            endereco.cidade,
            endereco.estado,
            endereco.cep,
            endereco.id_endereco
        ];

        return new Promise((resolve, reject) => {
            connection.query(sql, params, (erro, resultado) => {
                if (erro) return reject(erro);
                resolve(resultado.affectedRows > 0);
            });
        });
    }

    async delete(id, connection = this.#banco) {
        const sql = `DELETE FROM enderecos WHERE id_endereco = ?`;

        return new Promise((resolve, reject) => {
            connection.query(sql, [id], (erro, resultado) => {
                if (erro) return reject(erro);
                resolve(resultado.affectedRows > 0);
            });
        });
    }
}
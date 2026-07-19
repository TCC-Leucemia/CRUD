const jwt = require("jsonwebtoken");
const crypto = require("crypto");

module.exports = class MeuTokenJWT {

    #key;
    #alg;
    #type;
    #iss;
    #aud;
    #sub;
    #duracaoToken;
    #payload;

    constructor() {

        this.#key = process.env.JWT_SECRET;

        console.log("JWT_SECRET:", this.#key);

        this.#alg = "HS256";

        this.#type = "JWT";

        this.#iss = "hemoscan-api";

        this.#aud = "hemoscan-client";

        this.#sub = "auth";

        this.#duracaoToken = 3600 * 24;

        this.#payload = null;
    }

    gerarToken = (claims) => {

        const headers = {
            alg: this.#alg,
            typ: this.#type
        };

        const payload = {

            iss: this.#iss,
            aud: this.#aud,
            sub: this.#sub,

            iat: Math.floor(Date.now() / 1000),

            exp: Math.floor(Date.now() / 1000) + this.#duracaoToken,

            nbf: Math.floor(Date.now() / 1000),

            jti: crypto.randomBytes(16).toString("hex"),

            id_usuario: claims.id_usuario,

            email: claims.email,

            role: claims.role,

            nome: claims.nome
        };

        if (claims.crm) {
            payload.crm = claims.crm;
        }

        if (claims.cpf) {
            payload.cpf = claims.cpf;
        }

        return jwt.sign(
            payload,
            this.#key,
            {
                algorithm: this.#alg,
                header: headers
            }
        );
    }

    validarToken = (tokenString) => {

        if (!tokenString) {
            return false;
        }

        const token = tokenString
            .replace("Bearer ", "")
            .trim();

        try {

            const decoded = jwt.verify(
                token,
                this.#key,
                {
                    algorithms: [this.#alg]
                }
            );

            this.#payload = decoded;

            return true;

        } catch (err) {

            return false;
        }
    }

    get payload() {
        return this.#payload;
    }
}
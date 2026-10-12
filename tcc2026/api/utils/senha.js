// Hash de senha com scrypt (módulo crypto do Node, sem dependência nativa)
// e salt aleatório por usuário.
//
// Contas antigas guardam MD5 sem salt (32 caracteres hexadecimais). Elas
// continuam entrando normalmente: verificarSenha aceita o formato antigo e
// avisa que o hash precisa ser atualizado; o login regrava a senha no formato
// novo na mesma hora. Assim nenhuma conta deixa de funcionar na migração.
const crypto = require("crypto");

const PREFIXO = "scrypt";
const N = 16384;
const R = 8;
const P = 1;
const TAMANHO_CHAVE = 64;
const TAMANHO_SALT = 16;

const md5 = (valor) =>
    crypto.createHash("md5").update(String(valor)).digest("hex");

const derivar = (senha, salt, n, r, p) =>
    new Promise((resolve, reject) => {
        crypto.scrypt(
            String(senha),
            salt,
            TAMANHO_CHAVE,
            { N: n, r, p, maxmem: 64 * 1024 * 1024 },
            (erro, chave) => (erro ? reject(erro) : resolve(chave))
        );
    });

const ehHashLegado = (hash) =>
    typeof hash === "string" && /^[a-f0-9]{32}$/i.test(hash);

const gerarHash = async (senha) => {
    const salt = crypto.randomBytes(TAMANHO_SALT);
    const chave = await derivar(senha, salt, N, R, P);
    return [PREFIXO, N, R, P, salt.toString("base64"), chave.toString("base64")].join("$");
};

// Retorna { valida, precisaAtualizar }. Nunca lança por hash desconhecido:
// formato inválido conta como senha errada.
const verificarSenha = async (senha, hashArmazenado) => {
    if (typeof senha !== "string" || typeof hashArmazenado !== "string") {
        return { valida: false, precisaAtualizar: false };
    }

    if (ehHashLegado(hashArmazenado)) {
        const calculado = Buffer.from(md5(senha), "utf8");
        const armazenado = Buffer.from(hashArmazenado.toLowerCase(), "utf8");
        const valida = crypto.timingSafeEqual(calculado, armazenado);
        return { valida, precisaAtualizar: valida };
    }

    const partes = hashArmazenado.split("$");
    if (partes.length !== 6 || partes[0] !== PREFIXO) {
        return { valida: false, precisaAtualizar: false };
    }

    const [, n, r, p, saltB64, chaveB64] = partes;
    const esperado = Buffer.from(chaveB64, "base64");
    const calculado = await derivar(
        senha,
        Buffer.from(saltB64, "base64"),
        Number(n),
        Number(r),
        Number(p)
    );

    const valida =
        esperado.length === calculado.length &&
        crypto.timingSafeEqual(esperado, calculado);

    return {
        valida,
        precisaAtualizar: valida && (Number(n) !== N || Number(r) !== R || Number(p) !== P)
    };
};

module.exports = { gerarHash, verificarSenha, ehHashLegado };

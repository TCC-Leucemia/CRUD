const LoginDAO = require("../dao/LoginDAO");
const EmailService = require("./EmailService");
const Login = require("../model/Login");
const md5 = require("md5");
const crypto = require("crypto");
const ErrorResponse = require("../utils/ErrorResponse");

// Recuperação de senha em três passos, todos identificados pelo CPF:
// 1) buscarEmailPorCpf envia um código de 6 dígitos ao e-mail da conta;
// 2) validarCodigo troca o código por um token de uso único;
// 3) alterarSenhaRecuperacao só troca a senha com esse token.
// Nenhuma resposta revela se o CPF tem conta: CPF inexistente e código
// errado, vencido ou nunca pedido recebem exatamente a mesma mensagem.
const codigosRecuperacao = {};
const DURACAO_CODIGO = 10 * 60 * 1000;
const DURACAO_TOKEN_RECUPERACAO = 10 * 60 * 1000;
const MAX_TENTATIVAS_CODIGO = 5;
const INTERVALO_REENVIO = 60 * 1000;
const MSG_CODIGO_ENVIADO = "Se o CPF estiver cadastrado, enviaremos um código de verificação para o e-mail vinculado a ele.";
const MSG_CODIGO_INVALIDO = "Código inválido ou expirado. Confira o código recebido por e-mail ou solicite um novo.";
const MSG_RECUPERACAO_EXPIRADA = "A verificação do código expirou ou não foi concluída. Solicite um novo código para redefinir a senha.";

const somenteDigitosCpf = (cpf) => String(cpf || "").replace(/\D/g, "");

const hashSha256 = (valor) =>
    crypto.createHash("sha256").update(String(valor)).digest("hex");

// Comparação em tempo constante: o tempo de resposta não indica quantos
// caracteres do código/token estavam certos.
const compararSeguro = (a, b) => {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const limparRecuperacoesExpiradas = () => {
    const agora = Date.now();
    for (const cpf of Object.keys(codigosRecuperacao)) {
        if (codigosRecuperacao[cpf].expira <= agora) {
            delete codigosRecuperacao[cpf];
        }
    }
};
const selecoesPerfil = new Map();
const duracaoSelecaoPerfil = 5 * 60 * 1000;

const hashTokenPerfil = (tokenPerfil) =>
    crypto.createHash("sha256").update(tokenPerfil).digest("hex");

const limparSelecoesExpiradas = () => {
    const agora = Date.now();

    for (const [hash, selecao] of selecoesPerfil) {
        if (selecao.expiraEm <= agora) {
            selecoesPerfil.delete(hash);
        }
    }
};

const criarSelecaoPerfil = (candidatos) => {
    limparSelecoesExpiradas();

    const tokenPerfil = crypto.randomBytes(32).toString("hex");
    const usuarios = new Map(
        candidatos.map(({ tipo, user }) => [
            tipo,
            {
                id_usuario: user.id_usuario,
                email: user.email,
                tipo,
                crm: user.crm,
                cpf: user.cpf,
                nome: user.nome
            }
        ])
    );

    selecoesPerfil.set(hashTokenPerfil(tokenPerfil), {
        usuarios,
        expiraEm: Date.now() + duracaoSelecaoPerfil
    });

    return tokenPerfil;
};

module.exports = class LoginService {

    #dao;
    #email;

    constructor(banco) {
        this.#dao = new LoginDAO(banco);
        this.#email = new EmailService();
    }

    create = async (dados) => {

        const existente =
            await this.#dao.findByEmail(dados.email);

        if (existente) {
            throw new ErrorResponse(
                400,
                "Email já cadastrado"
            );
        }

        const login = new Login();

        login.email = dados.email;
        login.senha = md5(dados.senha);
        login.tipo = dados.tipo;

        return await this.#dao.create(login);
    }

    findAll = async () => {

        const usuarios =
            await this.#dao.findAll();

        const resultado = [];

        for (const usuario of usuarios) {

            if (usuario.tipo === "Paciente") {

                const paciente =
                    await this.#dao.findPacienteByIdUsuario(
                        usuario.id_usuario
                    );

                resultado.push(paciente);
            }
            else if (usuario.tipo === "Médico") {

                const medico =
                    await this.#dao.findMedicoByIdUsuario(
                        usuario.id_usuario
                    );

                resultado.push(medico);
            }
            else {

                resultado.push(usuario);
            }
        }

        return resultado;
    }

    findById = async (id) => {

        const login =
            await this.#dao.findById(id);

        if (!login) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        if (login.tipo === "Paciente") {

            const paciente =
                await this.#dao.findPacienteByIdUsuario(id);

            return paciente;
        }

        if (login.tipo === "Médico") {

            const medico =
                await this.#dao.findMedicoByIdUsuario(id);

            return medico;
        }

        return login;
    }

    alterarCredenciais = async (id_usuario, dados) => {

        const usuario =
            await this.#dao.findById(id_usuario);

        if (!usuario) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        const senhaHash =
            md5(dados.senhaAtual);

        if (senhaHash !== usuario.senha) {

            throw new ErrorResponse(
                401,
                "Senha atual incorreta"
            );
        }

        if (dados.novoEmail) {

            const existente =
                await this.#dao.findByEmail(
                    dados.novoEmail
                );

            if (
                existente &&
                existente.id_usuario != id_usuario
            ) {

                throw new ErrorResponse(
                    400,
                    "Email já está em uso"
                );
            }

            usuario.email = dados.novoEmail;
        }

        if (
            dados.novaSenha &&
            dados.novaSenha === dados.senhaAtual
        ) {
            throw new ErrorResponse(
                400,
                "A nova senha deve ser diferente da senha atual"
            );
        }

        if (dados.novaSenha) {
            usuario.senha = md5(dados.novaSenha);
        }
        console.log("USUÁRIO ANTES DO UPDATE:");
        console.log(usuario);

        await this.#dao.update(usuario);

        return true;
    }

    update = async (id, dados, user) => {

        const existente =
            await this.#dao.findById(id);

        if (!existente) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        const emailExistente =
            await this.#dao.findByEmail(
                dados.email
            );

        if (
            emailExistente &&
            emailExistente.id_usuario != id
        ) {

            throw new ErrorResponse(
                400,
                "Email já está em uso"
            );
        }

        if (
            user.role !== "Administrador"
        ) {

            if (
                dados.tipo &&
                dados.tipo !== existente.tipo
            ) {

                throw new ErrorResponse(
                    403,
                    "Você não pode alterar o tipo do usuário"
                );
            }

            dados.tipo =
                existente.tipo;
        }

        const login = new Login();

        login.id_usuario = id;
        login.email = dados.email;
        if (dados.senha) {
            login.senha = md5(dados.senha);
        } else {
            login.senha = existente.senha;
        }
        login.tipo = dados.tipo;

        const resultado =
            await this.#dao.update(login);

        return {
            atualizado:
                resultado.changedRows > 0
        };
    }

    delete = async (id, user) => {

        const login =
            await this.#dao.findById(id);

        if (!login) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        if (
            user.role !== "Administrador"
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        if (
            login.tipo === "Administrador"
        ) {

            throw new ErrorResponse(
                403,
                "Administradores não podem ser excluídos"
            );
        }

        const resultado =
            await this.#dao.delete(id);

        if (
            resultado.affectedRows === 0
        ) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado para exclusão"
            );
        }

        return true;
    }

    login = async (dados) => {

        const [medico, paciente, administrador] = await Promise.all([
            this.#dao.findMedicoByEmail(dados.email),
            this.#dao.findPacienteByEmail(dados.email),
            this.#dao.findAdministradorByEmail(dados.email)
        ]);

        const senhaHash = md5(dados.senha);

        const candidatos = [
            { tipo: "Médico", user: medico },
            { tipo: "Paciente", user: paciente },
            { tipo: "Administrador", user: administrador }
        ].filter(({ user }) => user && user.senha === senhaHash);

        // E-mail ou senha incorretos
        if (candidatos.length === 0) {
            throw new ErrorResponse(
                401,
                "Email ou senha inválidos"
            );
        }

        // Quando o usuário escolheu explicitamente um perfil
        if (dados.tipo) {

            const candidato = candidatos.find(
                ({ tipo }) => tipo === dados.tipo
            );

            if (!candidato) {
                throw new ErrorResponse(
                    401,
                    "Email ou senha inválidos"
                );
            }

            if (candidato.user.statusu !== "Ativo") {
                throw new ErrorResponse(
                    403,
                    "Usuário desativado."
                );
            }

            const user = candidato.user;

            return {
                id_usuario: user.id_usuario,
                email: user.email,
                tipo: candidato.tipo,
                crm: user.crm,
                cpf: user.cpf,
                nome: user.nome,
                statusu: user.statusu
            };
        }

        // Sem perfil informado: considerar somente contas ativas
        const candidatosAtivos = candidatos.filter(
            ({ user }) => user.statusu === "Ativo"
        );

        // Existem credenciais válidas, mas todas as contas estão desativadas
        if (candidatosAtivos.length === 0) {
            throw new ErrorResponse(
                403,
                "Usuário desativado."
            );
        }

        let selecionado = candidatosAtivos.find(
            ({ tipo }) => tipo === "Administrador"
        );

        const perfis = [
            ...new Set(
                candidatosAtivos
                    .filter(({ tipo }) => tipo !== "Administrador")
                    .map(({ tipo }) => tipo)
            )
        ];

        // Mais de um perfil ativo
        if (!selecionado && perfis.length > 1) {
            return {
                requerPerfil: true,
                tokenPerfil: criarSelecaoPerfil(
                    candidatosAtivos.filter(
                        ({ tipo }) => tipo !== "Administrador"
                    )
                ),
                perfis
            };
        }

        selecionado = selecionado || candidatosAtivos[0];

        const user = selecionado.user;

        return {
            id_usuario: user.id_usuario,
            email: user.email,
            tipo: selecionado.tipo,
            crm: user.crm,
            cpf: user.cpf,
            nome: user.nome,
            statusu: user.statusu
        };
    }

    selecionarPerfil = async (tokenPerfil, tipo) => {

        limparSelecoesExpiradas();

        if (
            typeof tokenPerfil !== "string" ||
            !/^[a-f0-9]{64}$/.test(tokenPerfil)
        ) {
            throw new ErrorResponse(
                401,
                "Seleção de perfil inválida ou expirada"
            );
        }

        const hash = hashTokenPerfil(tokenPerfil);
        const selecao = selecoesPerfil.get(hash);

        if (
            !selecao ||
            selecao.expiraEm <= Date.now() ||
            !selecao.usuarios.has(tipo)
        ) {
            selecoesPerfil.delete(hash);
            throw new ErrorResponse(
                401,
                "Seleção de perfil inválida ou expirada"
            );
        }

        selecoesPerfil.delete(hash);

        return selecao.usuarios.get(tipo);
    }

    async buscarEmailPorCpf(cpf) {

        const cpfLimpo = somenteDigitosCpf(cpf);

        // Formato inválido não revela nada sobre contas existentes.
        if (cpfLimpo.length !== 11) {
            throw new ErrorResponse(
                400,
                "Informe um CPF válido, com 11 dígitos."
            );
        }

        limparRecuperacoesExpiradas();

        // Pedido repetido em menos de 1 minuto não dispara outro e-mail
        // (evita encher a caixa de entrada de alguém); o código já enviado
        // continua valendo.
        const pendente = codigosRecuperacao[cpfLimpo];
        if (pendente && pendente.codigo && Date.now() - pendente.enviadoEm < INTERVALO_REENVIO) {
            return MSG_CODIGO_ENVIADO;
        }

        const usuario =
            await this.#dao.buscarEmailPorCpf(cpfLimpo);

        if (!usuario) {
            return MSG_CODIGO_ENVIADO;
        }

        const codigo = this.gerarCodigo();

        codigosRecuperacao[cpfLimpo] = {
            id_usuario: usuario.id_usuario,
            codigo,
            tentativas: 0,
            tokenHash: null,
            enviadoEm: Date.now(),
            expira: Date.now() + DURACAO_CODIGO
        };

        try {
            await this.#email.enviarCodigo(usuario.email, codigo);
        } catch (erro) {
            delete codigosRecuperacao[cpfLimpo];
            // Devolver erro aqui confirmaria que o CPF tem conta: a falha
            // fica só no terminal de quem roda o servidor.
            console.error(
                `[ERRO] Falha ao enviar o código de recuperação por e-mail (${erro.code || erro.name}): ` +
                `${erro.message}. Confira EMAIL_USER e EMAIL_PASS em tcc2026/.env.`
            );
        }

        return MSG_CODIGO_ENVIADO;
    }

    gerarCodigo() {
        // Gerador criptográfico: Math.random é previsível.
        return crypto.randomInt(100000, 1000000).toString();
    }

    validarAcessoLogin = async (id_usuario, user) => {

        const login =
            await this.#dao.findById(id_usuario);

        if (!login) {

            throw new ErrorResponse(
                404,
                "Usuário não encontrado"
            );
        }

        if (
            user.role !== "Administrador" &&
            login.id_usuario != user.id_usuario
        ) {

            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return login;
    }
    validarCodigo(dados) {

        const cpfLimpo = somenteDigitosCpf(dados && dados.cpf);
        const codigo = String((dados && dados.codigo) || "").trim();
        const registro = codigosRecuperacao[cpfLimpo];

        if (!registro || !registro.codigo || Date.now() > registro.expira) {
            if (registro && Date.now() > registro.expira) {
                delete codigosRecuperacao[cpfLimpo];
            }
            throw new ErrorResponse(400, MSG_CODIGO_INVALIDO);
        }

        if (!compararSeguro(registro.codigo, codigo)) {
            registro.tentativas += 1;

            // Sem limite, os 900 mil códigos possíveis poderiam ser
            // testados um a um. Esgotadas as tentativas, o código morre.
            if (registro.tentativas >= MAX_TENTATIVAS_CODIGO) {
                delete codigosRecuperacao[cpfLimpo];
            }

            throw new ErrorResponse(400, MSG_CODIGO_INVALIDO);
        }

        // Código certo: vira um token de uso único, e o código não vale mais.
        const token = crypto.randomBytes(32).toString("hex");
        registro.codigo = null;
        registro.tokenHash = hashSha256(token);
        registro.expira = Date.now() + DURACAO_TOKEN_RECUPERACAO;

        return { token };
    }

    alterarSenhaRecuperacao = async (cpf, token, novaSenha) => {

        const cpfLimpo = somenteDigitosCpf(cpf);
        const registro = codigosRecuperacao[cpfLimpo];

        const autorizado =
            registro &&
            registro.tokenHash &&
            typeof token === "string" &&
            Date.now() <= registro.expira &&
            compararSeguro(registro.tokenHash, hashSha256(token));

        if (!autorizado) {
            throw new ErrorResponse(400, MSG_RECUPERACAO_EXPIRADA);
        }

        // Senha fora da regra não consome o token: dá para corrigir e reenviar.
        const senha = typeof novaSenha === "string" ? novaSenha.trim() : "";

        if (senha.length < 8) {
            throw new ErrorResponse(
                400,
                "A nova senha deve ter pelo menos 8 caracteres."
            );
        }

        if (senha.length > 255) {
            throw new ErrorResponse(
                400,
                "A nova senha excede o tamanho permitido."
            );
        }

        const login =
            await this.#dao.findById(registro.id_usuario);

        if (!login) {
            delete codigosRecuperacao[cpfLimpo];
            throw new ErrorResponse(400, MSG_RECUPERACAO_EXPIRADA);
        }

        login.senha = md5(senha);

        await this.#dao.update(login);

        delete codigosRecuperacao[cpfLimpo];

        return true;

    }
}

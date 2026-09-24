const ErrorResponse = require("./ErrorResponse");

// Traduz qualquer erro que chegue ao middleware global em uma resposta HTTP
// precisa para o usuário e um registro detalhado para quem roda o servidor.
//
// Regra de segurança: a resposta nunca carrega mensagem crua de biblioteca,
// SQL, caminho de arquivo, nome de variável de ambiente ou qualquer dado que
// ajude a atacar o sistema. O detalhe técnico vai só para o terminal (`log`).

// Falhas de rede até o MySQL: o servidor não está de pé ou não é alcançável.
const BANCO_FORA_DO_AR = [
    "ECONNREFUSED", "ETIMEDOUT", "EHOSTUNREACH", "ENOTFOUND",
    "PROTOCOL_CONNECTION_LOST", "ER_CON_COUNT_ERROR", "ER_SERVER_SHUTDOWN"
];

// O MySQL respondeu, mas recusou o usuário/senha configurados na API.
const BANCO_ACESSO_NEGADO = [
    "ER_ACCESS_DENIED_ERROR", "ER_DBACCESS_DENIED_ERROR",
    "ER_NOT_SUPPORTED_AUTH_MODE", "ER_TABLEACCESS_DENIED_ERROR"
];

// Estrutura do banco diferente da que o código espera.
const BANCO_ESTRUTURA = ["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR", "ER_PARSE_ERROR", "ER_SP_DOES_NOT_EXIST"];

// Valor enviado não cabe/não serve para a coluna.
const VALOR_INVALIDO = [
    "ER_BAD_NULL_ERROR", "ER_NO_DEFAULT_FOR_FIELD", "ER_TRUNCATED_WRONG_VALUE",
    "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD", "ER_WRONG_VALUE", "ER_WRONG_VALUE_FOR_TYPE",
    "WARN_DATA_TRUNCATED", "ER_WARN_DATA_OUT_OF_RANGE", "ER_INVALID_JSON_TEXT",
    "ER_CHECK_CONSTRAINT_VIOLATED"
];

const resposta = (status, msg, codigo, detalhes) => ({
    status,
    corpo: {
        status: false,
        msg,
        detalhes: detalhes || (codigo ? { codigo } : {})
    }
});

function traduzirErro(erro, contexto = {}) {
    const codigo = erro && erro.code;
    const env = contexto.env || process.env;
    const bancoAlvo = `${env.DB_HOST || "127.0.0.1"}:${env.DB_PORT || 3306}`;

    // Erros lançados de propósito pelas regras de negócio: a mensagem já foi
    // escrita para o usuário final.
    if (erro instanceof ErrorResponse) {
        return {
            ...resposta(erro.statusCode, erro.message, null, erro.details || {}),
            log: null
        };
    }

    // Corpo da requisição (express.json)
    if (erro && erro.type === "entity.parse.failed") {
        return {
            ...resposta(400, "Os dados enviados estão em um formato inválido. Recarregue a página e tente novamente.", "CORPO_INVALIDO"),
            log: `JSON malformado no corpo da requisição: ${erro.message}`
        };
    }

    if (erro && erro.type === "entity.too.large") {
        return {
            ...resposta(413, "Os dados enviados excedem o tamanho permitido.", "CORPO_GRANDE_DEMAIS"),
            log: `Corpo da requisição acima do limite (${erro.limit} bytes).`
        };
    }

    if (erro && erro.name === "MulterError") {
        return {
            ...resposta(400, "Não foi possível receber o arquivo enviado. Verifique o tipo e o tamanho e tente novamente.", "ARQUIVO_INVALIDO"),
            log: `Upload recusado pelo multer: ${erro.code}`
        };
    }

    // Banco de dados
    if (BANCO_FORA_DO_AR.includes(codigo)) {
        return {
            ...resposta(503, "Banco de dados indisponível: o MySQL não está respondendo. Verifique se o serviço do MySQL está iniciado e tente novamente.", "BANCO_INDISPONIVEL"),
            log: `MySQL não respondeu em ${bancoAlvo} (${codigo}). Confira se o serviço está rodando e se DB_HOST/DB_PORT em tcc2026/.env apontam para ele.`
        };
    }

    if (BANCO_ACESSO_NEGADO.includes(codigo)) {
        return {
            ...resposta(503, "O servidor não conseguiu acessar o banco de dados: o acesso foi recusado pelo MySQL. A configuração de conexão da API precisa ser revisada. Os detalhes estão no terminal do servidor.", "BANCO_ACESSO_NEGADO"),
            // Nunca registrar o valor da senha, só qual variável conferir.
            log: `MySQL em ${bancoAlvo} recusou o usuário "${env.DB_USER}" (${codigo}). Confira DB_USER e DB_PASSWORD em tcc2026/.env e os privilégios desse usuário no banco "${env.DB_NAME || "tccof"}".`
        };
    }

    if (codigo === "ER_BAD_DB_ERROR") {
        return {
            ...resposta(503, "O banco de dados do sistema não foi encontrado no servidor MySQL. A instalação do banco precisa ser revisada. Os detalhes estão no terminal do servidor.", "BANCO_INEXISTENTE"),
            log: `O banco "${env.DB_NAME || "tccof"}" não existe em ${bancoAlvo}. Rode tcc2026/api/database/banco.sql ou corrija DB_NAME em tcc2026/.env.`
        };
    }

    if (BANCO_ESTRUTURA.includes(codigo)) {
        return {
            ...resposta(500, "Erro interno ao consultar o banco de dados. Tente novamente. Se continuar, avise o responsável técnico.", "BANCO_ESTRUTURA"),
            log: `Estrutura do banco diferente da esperada (${codigo}): ${erro.sqlMessage || erro.message}. O banco pode estar desatualizado em relação a api/database/banco.sql.`
        };
    }

    if (codigo === "ER_DUP_ENTRY") {
        return {
            ...resposta(409, "Já existe um registro com esses dados. Revise as informações e tente novamente.", "REGISTRO_DUPLICADO"),
            log: `Duplicidade no banco: ${erro.sqlMessage || erro.message}`
        };
    }

    if (codigo === "ER_ROW_IS_REFERENCED_2" || codigo === "ER_ROW_IS_REFERENCED") {
        return {
            ...resposta(409, "Este registro não pode ser excluído porque está vinculado a outros registros do sistema.", "REGISTRO_EM_USO"),
            log: `Exclusão bloqueada por chave estrangeira: ${erro.sqlMessage || erro.message}`
        };
    }

    if (codigo === "ER_NO_REFERENCED_ROW_2" || codigo === "ER_NO_REFERENCED_ROW") {
        return {
            ...resposta(400, "Um dos registros relacionados informados não existe mais. Atualize a página e tente novamente.", "REFERENCIA_INEXISTENTE"),
            log: `Chave estrangeira sem registro correspondente: ${erro.sqlMessage || erro.message}`
        };
    }

    if (codigo === "ER_DATA_TOO_LONG") {
        return {
            ...resposta(400, "Um dos campos excede o tamanho permitido. Encurte o texto e tente novamente.", "CAMPO_GRANDE_DEMAIS"),
            log: `Valor maior que a coluna: ${erro.sqlMessage || erro.message}`
        };
    }

    if (VALOR_INVALIDO.includes(codigo)) {
        return {
            ...resposta(400, "Um ou mais campos estão vazios ou com valor inválido. Revise as informações e tente novamente.", "VALOR_INVALIDO"),
            log: `Valor recusado pelo banco (${codigo}): ${erro.sqlMessage || erro.message}`
        };
    }

    // Outras bibliotecas que marcam o erro como 4xx: a mensagem delas é
    // técnica (e em inglês), então só o status é aproveitado.
    const statusBiblioteca = erro && (erro.statusCode || erro.status);
    if (Number.isInteger(statusBiblioteca) && statusBiblioteca >= 400 && statusBiblioteca < 500) {
        return {
            ...resposta(statusBiblioteca, "Não foi possível processar a requisição. Revise os dados e tente novamente.", "REQUISICAO_INVALIDA"),
            log: `Erro ${statusBiblioteca} de biblioteca: ${erro && erro.message}`
        };
    }

    return {
        ...resposta(500, "Erro interno do servidor. Tente novamente em instantes. Se continuar, avise o responsável técnico.", "ERRO_INTERNO"),
        log: erro && erro.stack ? erro.stack : String(erro)
    };
}

// Middleware final do Express.
function middlewareErros(erro, req, res, _next) {
    const { status, corpo, log } = traduzirErro(erro);

    if (log) {
        console.error(`[ERRO ${status}] ${req.method} ${req.originalUrl} -> ${corpo.detalhes.codigo || ""}\n  ${log}`);
    }

    res.status(status).send(corpo);
}

// Rota não encontrada: resposta em JSON, igual ao restante da API.
function middlewareRotaInexistente(req, res) {
    res.status(404).send({
        status: false,
        msg: "Recurso não encontrado. Verifique o endereço e tente novamente.",
        detalhes: { codigo: "ROTA_INEXISTENTE" }
    });
}

module.exports = { traduzirErro, middlewareErros, middlewareRotaInexistente };

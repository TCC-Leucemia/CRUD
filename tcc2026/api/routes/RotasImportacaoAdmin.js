const multer = require("multer");
const JwtMiddleware = require("../middleware/JwtMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");
const ErrorResponse = require("../utils/ErrorResponse");
const { lerArquivo, validar } = require("../utils/importacaoAdmin");
const { gerarHash } = require("../utils/senha");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const aceitos = [".csv", ".xml", ".pdf", ".xlsx"];
        const extensao = String(file.originalname || "").toLowerCase().slice(String(file.originalname || "").lastIndexOf("."));
        cb(null, aceitos.includes(extensao));
    }
});

module.exports = (app, banco) => {
    const jwt = new JwtMiddleware(banco);
    const role = new RoleMiddleware();
    app.post("/admin/importar/:tipo", jwt.validateToken, role.authorize("Administrador"), upload.single("arquivo"), async (req, res, next) => {
        try {
            if (!["medicos", "pacientes"].includes(req.params.tipo)) throw new ErrorResponse(400, "Tipo de cadastro inválido.");
            if (!req.file) throw new ErrorResponse(400, "Selecione um arquivo CSV, XML ou PDF.");
            const dados = await lerArquivo(req.file);
            if (!dados.length) throw new ErrorResponse(422, "Nenhum registro foi encontrado no documento.");
            if (dados.length > 500) throw new ErrorResponse(413, "O arquivo pode conter no máximo 500 registros por importação.");
            const erros = dados.map((registro, indice) => validar(registro, req.params.tipo, indice + 2)).filter(Boolean);
            if (erros.length) throw new ErrorResponse(422, "Arquivo não importado: corrija os campos obrigatórios.", { erros });
            const conexao = await new Promise((resolve, reject) => banco.getConnection((erro, c) => erro ? reject(erro) : resolve(c)));
            const query = (sql, parametros) => new Promise((resolve, reject) => conexao.query(sql, parametros, (erro, resultado) => erro ? reject(erro) : resolve(resultado)));
            try {
                await query("START TRANSACTION");
                const criados = [];
                for (const registro of dados) {
                    const email = registro.email.toLowerCase();
                    const senha = await gerarHash(registro.senha);
                    const login = await query("INSERT INTO login (email, senha, tipo) VALUES (?, ?, ?)", [email, senha, req.params.tipo === "medicos" ? "Médico" : "Paciente"]);
                    const endereco = await query("INSERT INTO enderecos (rua, numero, bairro, cidade, estado, cep) VALUES (?, ?, ?, ?, ?, ?)", [registro.rua, Number(registro.numero), registro.bairro, registro.cidade, registro.estado.toUpperCase(), registro.cep ? registro.cep.replace(/\D/g, "") : null]);
                    if (req.params.tipo === "medicos") {
                        await query("INSERT INTO medicos (crm, nome, email, cpf, telefone, especialidade, id_usuario, id_endereco) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [registro.crm, registro.nome, email, registro.cpf.replace(/\D/g, ""), registro.telefone || null, registro.especialidade, login.insertId, endereco.insertId]);
                        criados.push(registro.crm);
                    } else {
                        await query("INSERT INTO pacientes (cpf, nome, data_nasc, sexo, email, telefone, id_usuario, id_endereco) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [registro.cpf.replace(/\D/g, ""), registro.nome, registro.data_nasc, registro.sexo, email, registro.telefone || null, login.insertId, endereco.insertId]);
                        criados.push(registro.cpf);
                    }
                }
                await query("COMMIT");
                res.status(201).send({ status: true, tipo: req.params.tipo, total: criados.length, cadastrados: criados });
            } catch (erroBanco) {
                try { await query("ROLLBACK"); } catch (_rollback) { /* mantém o erro original */ }
                if (erroBanco.code === "ER_DUP_ENTRY") {
                    console.error("Erro de duplicidade na importação:", {
                        mensagem: erroBanco.message,
                        codigo: erroBanco.code,
                        sqlMessage: erroBanco.sqlMessage
                    });

                    throw new ErrorResponse(
                        409,
                        `Importação cancelada por duplicidade. Detalhes: ${erroBanco.sqlMessage || erroBanco.message}`
                    );
                }
            } finally { conexao.release(); }
        } catch (erro) { next(erro); }
    });
};

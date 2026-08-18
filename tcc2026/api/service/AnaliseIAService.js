const AnaliseIADAO = require("../dao/AnaliseIADAO");
const ExamesDAO = require("../dao/ExamesDAO");
const AnamneseDAO = require("../dao/AnamneseDAO");
const AnaliseIA = require("../model/AnaliseIA");
const Anamnese = require("../model/Anamnese");
const ErrorResponse = require("../utils/ErrorResponse");

const fs = require("fs");
const path = require("path");
const executar = require("util").promisify(require("child_process").execFile);

const ImagensExameDAO = require("../dao/ImagensExameDAO");
const ImagensExame = require("../model/ImagensExame");

const extrairDiagnostico = (laudo) => {
    const texto = String(laudo || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[*`]/g, "");

    const principal = texto.match(
        /^\s*[-\u2022]?\s*SUSPEITA(?:_|\s+)PRINCIPAL\s*:\s*\[?\s*(LMA|LLA|LMC|LLC|NORMAL|INDETERMINADO)\b\s*\]?/im
    );

    const nivel = texto.match(
        /^\s*[-\u2022]?\s*NIVEL(?:_|\s+)CONFIANCA\s*:\s*\[?\s*(ALTO|MODERADO|BAIXO)\b\s*(?:\([^)\r\n]*\))?\s*\]?/im
    );

    if (!principal || !nivel) {
        throw new ErrorResponse(
            502,
            "A IA devolveu um laudo sem os campos diagnósticos esperados. Tente novamente."
        );
    }

    const tipoDetectado = principal[1].toUpperCase();
    const tiposLeucemia = ["LMA", "LLA", "LMC", "LLC"];

    const tipo_leucemia_ia = tiposLeucemia.includes(tipoDetectado)
        ? tipoDetectado
        : "Não identificado";

    const niveis = {
        ALTO: { suspeita: "Alta", confianca: 85 },
        MODERADO: { suspeita: "Moderada", confianca: 60 },
        BAIXO: { suspeita: "Baixa", confianca: 0 }
    };

    const nivelDetectado = niveis[nivel[1].toUpperCase()];
    const confianca = nivelDetectado.confianca;

    if (!Number.isFinite(confianca) || confianca < 0 || confianca > 100) {
        throw new ErrorResponse(
            502,
            "A IA devolveu uma confiança inválida. Tente novamente."
        );
    }

    return {
        suspeita_ia: tipo_leucemia_ia === "Não identificado"
            ? "Sem suspeita"
            : nivelDetectado.suspeita,
        tipo_leucemia_ia,
        confianca: Number(confianca.toFixed(2))
    };
};

const validarAssinaturaImagem = (arquivo) => {
    let descritor;
    let valida = false;

    try {
        descritor = fs.openSync(arquivo.path, "r");

        const assinatura = Buffer.alloc(8);

        const bytesLidos = fs.readSync(
            descritor,
            assinatura,
            0,
            assinatura.length,
            0
        );

        const jpeg =
            bytesLidos >= 3
            && assinatura[0] === 0xff
            && assinatura[1] === 0xd8
            && assinatura[2] === 0xff;

        const png =
            bytesLidos >= 8
            && assinatura.equals(
                Buffer.from([
                    0x89,
                    0x50,
                    0x4e,
                    0x47,
                    0x0d,
                    0x0a,
                    0x1a,
                    0x0a
                ])
            );

        valida =
            (["image/jpeg", "image/jpg"].includes(arquivo.mimetype) && jpeg)
            || (arquivo.mimetype === "image/png" && png);

    } catch (_erro) {
        throw new ErrorResponse(
            400,
            "Não foi possível validar a imagem enviada."
        );

    } finally {
        if (descritor !== undefined) {
            fs.closeSync(descritor);
        }
    }

    if (!valida) {
        throw new ErrorResponse(
            400,
            "O arquivo enviado não é uma imagem JPG ou PNG válida."
        );
    }
};

const dataLocal = () => {
    const agora = new Date();

    const doisDigitos = (valor) =>
        String(valor).padStart(2, "0");

    return `${agora.getFullYear()}-${doisDigitos(
        agora.getMonth() + 1
    )}-${doisDigitos(agora.getDate())}`;
};

const caminhoRelativoSeguro = (raiz, arquivo) => {
    const relativo = path
        .relative(raiz, arquivo)
        .replace(/\\/g, "/");

    if (
        path.isAbsolute(relativo)
        || relativo.startsWith("../")
        || !relativo.startsWith("uploads/exames/")
    ) {
        throw new ErrorResponse(
            500,
            "Não foi possível definir o caminho seguro da imagem."
        );
    }

    return relativo;
};

const executarMetodoConexao = (conexao, metodo) =>
    new Promise((resolve, reject) => {
        conexao[metodo](
            (erro) => erro
                ? reject(erro)
                : resolve()
        );
    });

const executarEmTransacao = async (banco, operacao) => {
    const conexao = await new Promise((resolve, reject) => {
        banco.getConnection(
            (erro, connection) =>
                erro
                    ? reject(erro)
                    : resolve(connection)
        );
    });

    let iniciada = false;

    try {
        await executarMetodoConexao(
            conexao,
            "beginTransaction"
        );

        iniciada = true;

        const resultado = await operacao(conexao);

        await executarMetodoConexao(
            conexao,
            "commit"
        );

        return resultado;

    } catch (erro) {

        if (iniciada) {
            try {
                await executarMetodoConexao(
                    conexao,
                    "rollback"
                );
            } catch (_erroRollback) {
                // O erro original é mais útil para o cliente e para o log global.
            }
        }

        throw erro;

    } finally {
        conexao.release();
    }
};

const removerArquivo = async (arquivo) => {
    if (!arquivo) return;

    try {
        await fs.promises.unlink(arquivo);

    } catch (erro) {
        if (erro.code !== "ENOENT") {
            throw erro;
        }
    }
};

module.exports = class AnaliseIAService {

    #banco;
    #dao;
    #examesDAO;
    #imagensDAO;
    #anamneseDAO;

    constructor(banco) {

        this.#banco = banco;

        this.#imagensDAO =
            new ImagensExameDAO(banco);

        this.#dao =
            new AnaliseIADAO(banco);

        this.#examesDAO =
            new ExamesDAO(banco);

        this.#anamneseDAO =
            new AnamneseDAO(banco);
    }

    create = async (dados, user) => {

        const exame =
            await this.#examesDAO.findById(
                dados.id_exame
            );

        if (!exame) {
            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        const owner =
            await this.#dao.findOwnerByExameId(
                dados.id_exame
            );

        if (!owner) {
            throw new ErrorResponse(
                404,
                "Exame não vinculado a nenhuma consulta"
            );
        }

        if (owner.crm !== user.crm) {
            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        const analise = new AnaliseIA();

        Object.assign(
            analise,
            dados
        );

        return await this.#dao.create(
            analise
        );
    };

    findAll = async () => {

        const result =
            await this.#dao.findAll();

        if (result.length === 0) {
            throw new ErrorResponse(
                404,
                "Nenhuma análise encontrada"
            );
        }

        return result;
    };

    findById = async (id) => {

        const result =
            await this.#dao.findById(id);

        if (!result) {
            throw new ErrorResponse(
                404,
                "Análise não encontrada"
            );
        }

        return result;
    };

    findByCrm = async (crm) => {
        return await this.#dao.findByCrm(crm);
    };

    validarAcessoAnalise = async (
        id_analise,
        crm
    ) => {

        const analise =
            await this.#dao.findByIdAndCrm(
                id_analise,
                crm
            );

        if (!analise) {
            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        return analise;
    };

    update = async (
        id,
        dados,
        user
    ) => {

        const existente =
            await this.#dao.findById(id);

        if (!existente) {
            throw new ErrorResponse(
                404,
                "Análise não encontrada"
            );
        }

        const owner =
            await this.#dao.findOwnerByExameId(
                dados.id_exame
            );

        if (!owner) {
            throw new ErrorResponse(
                404,
                "Exame não vinculado a nenhuma consulta"
            );
        }

        if (owner.crm !== user.crm) {
            throw new ErrorResponse(
                403,
                "Acesso negado"
            );
        }

        const exame =
            await this.#examesDAO.findById(
                dados.id_exame
            );

        if (!exame) {
            throw new ErrorResponse(
                404,
                "Exame não encontrado"
            );
        }

        const analise = new AnaliseIA();

        Object.assign(
            analise,
            dados
        );

        analise.id_analise = id;

        return await this.#dao.update(
            analise
        );
    };

    delete = async (id) => {

        const result =
            await this.#dao.delete(id);

        if (result.affectedRows === 0) {
            throw new ErrorResponse(
                404,
                "Análise não encontrada"
            );
        }

        return true;
    };

    gerarLaudo = async (req, user) => {

        const arquivo = req.file;

        let caminhoImagem =
            arquivo?.path;

        let caminhoPdf;

        let concluido = false;

        try {

            const {
                idade,
                sexo,
                sintomas,
                historia,
                idExame
            } = req.body;

            const id_exame =
                Number(
                    req.body.id_exame || idExame
                );

            if (
                !arquivo
                || !fs.existsSync(arquivo.path)
                || !Number.isInteger(id_exame)
                || id_exame <= 0
                || !idade
                || !sexo
                || !sintomas
                || !historia
            ) {
                throw new ErrorResponse(
                    400,
                    "Preencha a imagem, o exame e os dados clínicos."
                );
            }

            validarAssinaturaImagem(
                arquivo
            );

            const owner =
                await this.#dao.findOwnerByExameId(
                    id_exame
                );

            if (!owner) {
                throw new ErrorResponse(
                    404,
                    "Exame não encontrado ou não vinculado a uma consulta."
                );
            }

            if (owner.crm !== user.crm) {
                throw new ErrorResponse(
                    403,
                    "Acesso negado."
                );
            }

            const script =
                path.join(
                    __dirname,
                    "..",
                    "..",
                    "backend",
                    "analise_celular.py"
                );

            if (!fs.existsSync(script)) {
                throw new ErrorResponse(
                    500,
                    `Script de análise não encontrado em ${script}. Confira se a pasta backend foi movida.`
                );
            }

            let stdout;

            try {

                ({
                    stdout
                } = await executar(
                    "python",
                    [
                        script,
                        arquivo.path,
                        idade,
                        sexo,
                        sintomas,
                        historia
                    ],
                    {
                        cwd: path.dirname(script),
                        maxBuffer: 10 * 1024 * 1024
                    }
                ));

            } catch (erro) {

                console.error(
                    "FALHA AO EXECUTAR O PYTHON:",
                    {
                        codigo: erro.code,
                        mensagem: erro.message,
                        stderr: String(
                            erro.stderr || ""
                        ).slice(0, 2000)
                    }
                );

                const detalhe =
                    `${erro.stderr || ""} ${erro.message || ""}`;

                if (erro.code === "ENOENT") {
                    throw new ErrorResponse(
                        500,
                        "O interpretador 'python' não foi encontrado pelo servidor. Verifique se o Python está no PATH e reinicie o Node."
                    );
                }

                if (
                    /OPENAI_API_KEY|credentials|api key/i
                        .test(detalhe)
                ) {
                    throw new ErrorResponse(
                        503,
                        "Integração com a OpenAI não configurada. Defina OPENAI_API_KEY no arquivo .env de tcc2026."
                    );
                }

                if (
                    /ModuleNotFoundError|ImportError/i
                        .test(detalhe)
                ) {

                    const modulo =
                        detalhe.match(
                            /No module named ['"]([^'"]+)['"]/i
                        );

                    throw new ErrorResponse(
                        502,
                        `Falta uma biblioteca Python${modulo ? `: ${modulo[1]}` : ""}. Instale-a e tente novamente.`
                    );
                }

                const ultimaLinha =
                    String(
                        erro.stderr || ""
                    )
                        .trim()
                        .split(/\r?\n/)
                        .filter(Boolean)
                        .pop();

                throw new ErrorResponse(
                    502,
                    `O processo Python não concluiu a análise${ultimaLinha ? `: ${ultimaLinha.slice(0, 200)}` : "."}`
                );
            }

            const [
                pdf,
                ...partes
            ] =
                String(stdout || "")
                    .trim()
                    .split("|||");

            const laudo =
                partes.join("|||");

            if (pdf === "ERRO") {

                if (
                    /401|incorrect api key|invalid_api_key|authentication/i
                        .test(laudo)
                ) {
                    throw new ErrorResponse(
                        502,
                        "A OpenAI recusou a chave configurada. Atualize OPENAI_API_KEY no arquivo .env de tcc2026."
                    );
                }

                if (
                    /429|quota|rate limit/i
                        .test(laudo)
                ) {
                    throw new ErrorResponse(
                        502,
                        "A OpenAI recusou a análise por limite de uso. Verifique a conta e tente novamente."
                    );
                }

                if (
                    /gerar PDF/i
                        .test(laudo)
                ) {
                    throw new ErrorResponse(
                        502,
                        "A análise terminou, mas o PDF não pôde ser gerado. Tente novamente."
                    );
                }

                throw new ErrorResponse(
                    502,
                    "A IA não conseguiu analisar a imagem. Verifique a configuração e tente novamente."
                );
            }

            if (
                !laudo
                || !pdf
                || path.basename(pdf) !== pdf
                || !pdf.toLowerCase().endsWith(".pdf")
            ) {
                throw new ErrorResponse(
                    502,
                    "O Python devolveu uma resposta inválida para a análise."
                );
            }

            caminhoPdf =
                path.join(
                    path.dirname(script),
                    "laudos_gerados",
                    pdf
                );

            const pdfBase64 =
                fs.readFileSync(
                    caminhoPdf
                ).toString("base64");

            const diagnostico =
                extrairDiagnostico(
                    laudo
                );

            const raizProjeto =
                path.resolve(
                    __dirname,
                    "..",
                    ".."
                );

            const pastaFinal =
                path.join(
                    raizProjeto,
                    "uploads",
                    "exames"
                );

            const caminhoFinal =
                path.join(
                    pastaFinal,
                    path.basename(
                        arquivo.filename
                    )
                );

            fs.mkdirSync(
                pastaFinal,
                {
                    recursive: true
                }
            );

            fs.renameSync(
                arquivo.path,
                caminhoFinal
            );

            caminhoImagem =
                caminhoFinal;

            const caminho_arquivo =
                caminhoRelativoSeguro(
                    raizProjeto,
                    caminhoFinal
                );

            const data =
                dataLocal();

            const analise =
                new AnaliseIA();

            Object.assign(
                analise,
                {
                    id_exame,
                    resultado_ia: laudo,
                    ...diagnostico,
                    data_analise: data,
                    statusc: "Finalizado"
                }
            );

            const imagem =
                new ImagensExame();

            Object.assign(
                imagem,
                {
                    id_exame,
                    caminho_arquivo,
                    descricao:
                        "Imagem enviada para análise por IA",
                    data_upload: data
                }
            );

            const anamnese =
                new Anamnese();

            const insercoes =
                await executarEmTransacao(
                    this.#banco,
                    async (conexao) => {

                        const ownerAtual =
                            await this.#dao.findOwnerByExameId(
                                id_exame,
                                conexao,
                                true
                            );

                        if (!ownerAtual) {
                            throw new ErrorResponse(
                                404,
                                "O vínculo do exame não está mais disponível."
                            );
                        }

                        if (
                            ownerAtual.crm !== user.crm
                        ) {
                            throw new ErrorResponse(
                                403,
                                "O vínculo do exame foi alterado."
                            );
                        }

                        Object.assign(
                            anamnese,
                            {
                                cpf: ownerAtual.cpf,
                                crm: ownerAtual.crm,
                                id_consulta:
                                    ownerAtual.id_consulta,
                                sintomas,
                                comorbidades:
                                    historia
                            }
                        );

                        const insercaoAnalise =
                            await this.#dao.create(
                                analise,
                                conexao
                            );

                        const insercaoImagem =
                            await this.#imagensDAO.create(
                                imagem,
                                conexao
                            );

                        const insercaoAnamnese =
                            await this.#anamneseDAO.create(
                                anamnese,
                                conexao
                            );

                        return {
                            id_analise:
                                insercaoAnalise.insertId,

                            id_imagem:
                                insercaoImagem.insertId,

                            id_anamnese:
                                insercaoAnamnese.insertId
                        };
                    }
                );

            concluido = true;

            return {
                laudo,

                pdf:
                    `data:application/pdf;base64,${pdfBase64}`,

                caminho_imagem:
                    caminho_arquivo,

                ...insercoes
            };

        } finally {

            if (!concluido) {

                await Promise.allSettled([
                    removerArquivo(
                        caminhoImagem
                    ),

                    removerArquivo(
                        caminhoPdf
                    )
                ]);
            }
        }
    };
};
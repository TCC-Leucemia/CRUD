
const fs = require("fs/promises");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { XMLParser } = require("fast-xml-parser");
const { PDFParse } = require("pdf-parse");
const XLSX = require("xlsx");
const ErrorResponse = require("./ErrorResponse");

const aliases = {
    nome: ["nome", "nome completo", "name"],
    cpf: ["cpf"],
    email: ["email", "e-mail"],
    telefone: ["telefone", "celular", "phone"],
    senha: ["senha", "password"],
    data_nasc: [
        "data_nasc",
        "data nascimento",
        "data de nascimento",
        "nascimento",
        "birth date"
    ],
    sexo: ["sexo", "genero", "gênero", "sex"],
    crm: ["crm"],
    especialidade: ["especialidade", "specialty"],
    rua: ["rua", "logradouro", "street"],
    numero: ["numero", "número", "number"],
    bairro: ["bairro", "district"],
    cidade: ["cidade", "city"],
    estado: ["estado", "uf", "state"],
    cep: ["cep", "código postal", "postal code"]
};

const normalizar = (valor) => String(valor ?? "").trim();

const chave = (valor) =>
    normalizar(valor)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

const campos = Object.fromEntries(
    Object.entries(aliases).flatMap(([campo, nomes]) =>
        nomes.map((nome) => [chave(nome), campo])
    )
);

function normalizarRegistro(obj) {
    const registro = {};

    for (const [nome, valor] of Object.entries(obj || {})) {
        const campo = campos[chave(nome)];

        if (campo && registro[campo] === undefined) {
            registro[campo] = normalizar(valor);
        }
    }

    return registro;
}

function registrosXml(obj) {
    const encontrados = [];

    const visitar = (valor) => {
        if (Array.isArray(valor)) {
            return valor.forEach(visitar);
        }

        if (!valor || typeof valor !== "object") {
            return;
        }

        const registro = normalizarRegistro(valor);

        if (Object.keys(registro).length >= 2) {
            encontrados.push(registro);
        }

        Object.values(valor).forEach((filho) => {
            if (filho && typeof filho === "object") {
                visitar(filho);
            }
        });
    };

    visitar(obj);

    return encontrados.filter(
        (registro, indice, lista) => lista.indexOf(registro) === indice
    );
}

function registrosTexto(texto) {
    const linhas = texto
        .split(/\r?\n/)
        .map((linha) => linha.trim())
        .filter(Boolean);

    const registros = [];
    let atual = {};

    for (const linha of linhas) {
        const match = linha.match(/^([^:;-]{2,40})\s*[:;-]\s*(.+)$/);

        if (!match) {
            continue;
        }

        const campo = campos[chave(match[1])];

        if (!campo) {
            continue;
        }

        if (campo === "nome" && atual.nome) {
            registros.push(atual);
            atual = {};
        }

        atual[campo] = normalizar(match[2]);
    }

    if (Object.keys(atual).length) {
        registros.push(atual);
    }

    return registros;
}

async function extrairTextoPdf(buffer) {
    const parser = new PDFParse({ data: buffer });

    try {
        const resultado = await parser.getText();
        const texto = normalizar(resultado.text);

        if (!texto) {
            throw new ErrorResponse(
                422,
                "O PDF não contém texto selecionável. Exporte o documento com OCR ou use CSV/XML/Excel."
            );
        }

        return texto;
    } finally {
        await parser.destroy();
    }
}

function lerExcel(buffer) {
    let workbook;

    try {
        workbook = XLSX.read(buffer, {
            type: "buffer",
            cellDates: false
        });
    } catch (_erro) {
        throw new ErrorResponse(
            422,
            "Não foi possível ler o arquivo Excel. Verifique se o arquivo está válido."
        );
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new ErrorResponse(
            422,
            "O arquivo Excel não contém nenhuma planilha."
        );
    }

    // Usa a primeira aba do arquivo.
    const nomeAba = workbook.SheetNames[0];
    const planilha = workbook.Sheets[nomeAba];

    if (!planilha || !planilha["!ref"]) {
        throw new ErrorResponse(
            422,
            "A primeira aba do Excel está vazia."
        );
    }

    const linhas = XLSX.utils.sheet_to_json(planilha, {
        defval: "",
        raw: false,
        blankrows: false
    });

    return linhas.map((linha) => {
        const registro = normalizarRegistro(linha);

        // Trata datas Excel que possam ter sido lidas como números.
        if (registro.data_nasc) {
            registro.data_nasc = normalizarData(registro.data_nasc);
        }

        return registro;
    });
}

function normalizarData(valor) {
    const texto = normalizar(valor);

    // Já está no formato ISO esperado pelo banco.
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return texto;
    }

    // Converte datas comuns no formato DD/MM/AAAA.
    const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (brasileira) {
        return `${brasileira[3]}-${brasileira[2]}-${brasileira[1]}`;
    }

    return texto;
}

async function lerArquivo(file) {
    const extensao = path.extname(file.originalname || "").toLowerCase();

    if (![".csv", ".xml", ".pdf", ".xlsx"].includes(extensao)) {
        throw new ErrorResponse(
            400,
            "Formato inválido. Envie CSV, XML, PDF ou Excel (.xlsx)."
        );
    }

    if (extensao === ".csv") {
        const texto = file.buffer
            .toString("utf8")
            .replace(/^\uFEFF/, "");

        const primeira = texto.split(/\r?\n/, 1)[0] || "";

        const delimitador = primeira.includes(";")
            ? ";"
            : primeira.includes("\t")
                ? "\t"
                : ",";

        return parse(texto, {
            columns: true,
            skip_empty_lines: true,
            bom: true,
            delimiter: delimitador,
            relax_column_count: true
        }).map(normalizarRegistro);
    }

    if (extensao === ".xlsx") {
        return lerExcel(file.buffer);
    }

    if (extensao === ".xml") {
        let objeto;

        try {
            objeto = new XMLParser({
                ignoreAttributes: false,
                isArray: () => false
            }).parse(file.buffer.toString("utf8"));
        } catch (_erro) {
            throw new ErrorResponse(
                422,
                "XML inválido ou malformado."
            );
        }

        return registrosXml(objeto);
    }

    const texto = await extrairTextoPdf(file.buffer);

    return registrosTexto(texto).map(normalizarRegistro);
}

function validar(registro, tipo, indice) {
    const obrigatorios =
        tipo === "medicos"
            ? [
                "nome",
                "cpf",
                "email",
                "senha",
                "crm",
                "especialidade",
                "rua",
                "numero",
                "bairro",
                "cidade",
                "estado"
            ]
            : [
                "nome",
                "cpf",
                "email",
                "senha",
                "data_nasc",
                "sexo",
                "rua",
                "numero",
                "bairro",
                "cidade",
                "estado"
            ];

    const ausentes = obrigatorios.filter(
        (campo) => !normalizar(registro[campo])
    );

    if (ausentes.length) {
        return `Linha ${indice}: campos obrigatórios ausentes: ${ausentes.join(", ")}.`;
    }

    return null;
}

module.exports = {
    lerArquivo,
    validar
};
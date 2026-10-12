// Regras de apresentação da análise preliminar por IA.
//
// A IA devolve dois campos técnicos:
//   SUSPEITA_PRINCIPAL: LMA | LLA | LMC | LLC | NORMAL | INDETERMINADO
//   NÍVEL_CONFIANÇA:    ALTO | MODERADO | BAIXO
//
// O nível de confiança é só uma categoria (Alto, Moderado ou Baixo). Ele não
// é probabilidade clínica: por isso nenhum percentual é gravado nem mostrado.
// NORMAL e INDETERMINADO têm rótulos próprios: INDETERMINADO nunca aparece
// como "sem suspeita".
const ErrorResponse = require("./ErrorResponse");

const TIPOS_LEUCEMIA = ["LMA", "LLA", "LMC", "LLC"];

// Coluna analise_ia.suspeita_ia (enum Alta/Moderada/Baixa/Sem suspeita):
// guarda o nível de confiança. "Sem suspeita" só existe em registros antigos.
const NIVEL_PARA_COLUNA = { ALTO: "Alta", MODERADO: "Moderada", BAIXO: "Baixa" };
const COLUNA_PARA_NIVEL = { Alta: "Alto", Moderada: "Moderado", Baixa: "Baixo" };

const CLASSIFICACAO_SEM_EVIDENCIA = "Sem evidência de leucemia";
const CLASSIFICACAO_INDETERMINADA = "Indeterminado";
const CLASSIFICACAO_NAO_INFORMADA = "Não identificado";

const semAcento = (texto) =>
    String(texto || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[*`]/g, "");

const extrairDiagnostico = (laudo) => {
    const texto = semAcento(laudo);

    const principal = texto.match(
        /^\s*[-•]?\s*SUSPEITA(?:_|\s+)PRINCIPAL\s*:\s*\[?\s*(LMA|LLA|LMC|LLC|NORMAL|INDETERMINADO)\b\s*\]?/im
    );

    const nivel = texto.match(
        /^\s*[-•]?\s*NIVEL(?:_|\s+)CONFIANCA\s*:\s*\[?\s*(ALTO|MODERADO|BAIXO)\b\s*(?:\([^)\r\n]*\))?\s*\]?/im
    );

    if (!principal || !nivel) {
        throw new ErrorResponse(
            502,
            "A IA devolveu uma análise sem os campos esperados. Tente novamente."
        );
    }

    const tipo = principal[1].toUpperCase();

    return {
        // Nível de confiança (categoria), sempre preenchido.
        suspeita_ia: NIVEL_PARA_COLUNA[nivel[1].toUpperCase()],
        // A coluna só aceita os quatro tipos ou "Não identificado"; NORMAL e
        // INDETERMINADO são distinguidos pelo texto (ver classificacaoIA).
        tipo_leucemia_ia: TIPOS_LEUCEMIA.includes(tipo) ? tipo : CLASSIFICACAO_NAO_INFORMADA,
        // Sem percentual: o nível não é probabilidade.
        confianca: null
    };
};

// Nível de confiança de um registro, inclusive dos antigos (que gravavam
// 85/60/0 em "confianca" e "Sem suspeita" quando a IA não apontava um tipo).
const nivelConfianca = (analise) => {
    if (!analise) return null;
    if (COLUNA_PARA_NIVEL[analise.suspeita_ia]) {
        return COLUNA_PARA_NIVEL[analise.suspeita_ia];
    }

    const texto = semAcento(analise.resultado_ia);
    const doTexto = texto.match(/GRAU\s+DE\s+CERTEZA\s*:\s*\[?\s*(ALTO|MODERADO|BAIXO)/i);
    if (doTexto) {
        return COLUNA_PARA_NIVEL[NIVEL_PARA_COLUNA[doTexto[1].toUpperCase()]];
    }

    const numero = Number(analise.confianca);
    if (analise.confianca !== null && analise.confianca !== undefined && Number.isFinite(numero)) {
        if (numero >= 80) return "Alto";
        if (numero >= 50) return "Moderado";
        return "Baixo";
    }
    return null;
};

// LMA/LLA/LMC/LLC, "Sem evidência de leucemia" (NORMAL) ou "Indeterminado".
const classificacaoIA = (analise) => {
    if (!analise) return CLASSIFICACAO_NAO_INFORMADA;
    if (TIPOS_LEUCEMIA.includes(analise.tipo_leucemia_ia)) {
        return analise.tipo_leucemia_ia;
    }

    const texto = semAcento(analise.resultado_ia).toUpperCase();
    const linha = texto.match(/SUSPEITA\s+DIAGNOSTICA\s*:\s*([^\r\n]*)/);
    const valor = linha ? linha[1] : "";

    if (/INDETERMINADO/.test(valor)) return CLASSIFICACAO_INDETERMINADA;
    if (/NORMAL|SEM EVIDENCIA/.test(valor)) return CLASSIFICACAO_SEM_EVIDENCIA;
    return CLASSIFICACAO_NAO_INFORMADA;
};

// Linhas de separador ("=====", "-----") com largura fixa, para não
// ultrapassarem a caixa de texto da tela nem a página do PDF.
const LARGURA_SEPARADOR = 48;

const normalizarTextoIA = (texto) =>
    String(texto || "")
        .split(/\r?\n/)
        .map((linha) => {
            const limpa = linha.trim();
            if (/^={5,}$/.test(limpa)) return "=".repeat(LARGURA_SEPARADOR);
            if (/^-{5,}$/.test(limpa)) return "-".repeat(LARGURA_SEPARADOR);
            // "GRAU DE CERTEZA: Alto (85-95%)" -> "GRAU DE CERTEZA: Alto"
            if (/^GRAU\s+DE\s+CERTEZA\s*:/i.test(limpa)) {
                return linha.replace(/\s*\([^)]*%[^)]*\)/g, "").replace(/\s*\d+(?:[.,]\d+)?\s*%/g, "").trimEnd();
            }
            return linha;
        })
        .join("\n");

const apresentarAnalise = (analise) => {
    if (!analise || typeof analise !== "object") return analise;
    // "confianca" (85/60/0 nos registros antigos) não sai da API: parecia
    // probabilidade clínica. A tela usa nivel_confianca.
    const { confianca, ...resto } = analise;
    return {
        ...resto,
        resultado_ia: normalizarTextoIA(analise.resultado_ia),
        nivel_confianca: nivelConfianca(analise),
        classificacao_ia: classificacaoIA(analise)
    };
};

module.exports = {
    extrairDiagnostico,
    nivelConfianca,
    classificacaoIA,
    normalizarTextoIA,
    apresentarAnalise,
    CLASSIFICACAO_SEM_EVIDENCIA,
    CLASSIFICACAO_INDETERMINADA
};

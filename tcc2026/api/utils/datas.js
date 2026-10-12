// Datas vindas do formulário.
//
// "AAAA-MM-DD" (campo de data sem hora) é lido no fuso local. new Date() leria
// como meia-noite UTC: no Brasil (UTC-3) isso vira 21h do dia anterior, e
// "amanhã" passava pela regra "não pode ser data futura".
const parseDataLocal = (valor) => {
    const texto = String(valor ?? "").trim();
    const soData = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (soData) {
        return new Date(Number(soData[1]), Number(soData[2]) - 1, Number(soData[3]));
    }
    return new Date(texto);
};

// Mesmo minuto (o formulário envia AAAA-MM-DDTHH:mm, sem segundos).
const mesmoMinuto = (a, b) => {
    const da = a instanceof Date ? a : parseDataLocal(a);
    const db = b instanceof Date ? b : parseDataLocal(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
    return Math.floor(da.getTime() / 60000) === Math.floor(db.getTime() / 60000);
};

module.exports = { parseDataLocal, mesmoMinuto };

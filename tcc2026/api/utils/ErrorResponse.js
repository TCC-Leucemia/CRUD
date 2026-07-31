module.exports = class ErrorResponse extends Error {
    constructor(statusCode, message, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
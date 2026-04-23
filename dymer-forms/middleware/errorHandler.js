const logger = require("../utils/logger");
const { jsonResponse } = require("../utils/utility");

const errorHandler = (err, req, res, next) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path, method: req.method, ip: req.ip });

    const ret = new jsonResponse();
    ret.setSuccess(false);
    ret.setMessages(err.message || "Errore interno del server");
    ret.setExtraData({ log: err.stack });

    // Determina lo status code appropriato
    let statusCode = 500;
    if (err.name === "ValidationError") {
        statusCode = 400; // Bad Request per errori di validazione Mongoose
    } else if (err.name === "UnauthorizedError") {
        statusCode = 401; // Unauthorized per errori di autenticazione
    } else if (err.name === "ForbiddenError") {
        statusCode = 403; // Forbidden per errori di autorizzazione
    } else if (err.status) {
        statusCode = err.status;
    }

    res.status(statusCode).send(ret);
};

module.exports = errorHandler;

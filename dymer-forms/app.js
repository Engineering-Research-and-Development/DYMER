const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const v1Routes = require("./routes/v1");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();

// Middleware di sicurezza
app.use(helmet());

// Abilita CORS per tutte le richieste
app.use(cors());

// Logging delle richieste HTTP
app.use(morgan("combined", { stream: { write: message => logger.info(message.trim()) } }));

// Parsing del body delle richieste
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rotte API
app.use("/api/v1", v1Routes);

// Gestione delle rotte non trovate (404)
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// Middleware centralizzato per la gestione degli errori
app.use(errorHandler);

module.exports = app;

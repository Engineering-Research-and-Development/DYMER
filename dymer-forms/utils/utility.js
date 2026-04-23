const jsonResponse = require("../jsonResponse"); // Assumendo che jsonResponse sia un modulo separato o da refactorizzare qui

const mongoUrl = () => {
    // Questa funzione dovrebbe restituire l'URL di connessione a MongoDB
    // Per ora, useremo un placeholder o un valore di default.
    // In un'applicazione reale, questo verrebbe da variabili d'ambiente o un file di configurazione.
    return process.env.MONGO_URI || "mongodb://localhost:27017/dymer_db";
};

const getAllQuery = (req) => {
    // Questa funzione estrae i dati dalla richiesta (query, body, params)
    // e li combina in un unico oggetto.
    return {
        query: req.query,
        params: req.params,
        data: req.body
    };
};

// Placeholder per jsonResponse, da refactorizzare se necessario
// In un approccio moderno, si potrebbe usare un formato di risposta standardizzato
// o classi per le risposte API.
class JsonResponse {
    constructor() {
        this.success = true;
        this.messages = [];
        this.data = null;
        this.extraData = null;
    }

    setSuccess(success) {
        this.success = success;
    }

    setMessages(message) {
        this.messages.push(message);
    }

    setData(data) {
        this.data = data;
    }

    addData(data) {
        if (this.data) {
            if (Array.isArray(this.data) && Array.isArray(data)) {
                this.data = this.data.concat(data);
            } else if (typeof this.data === 'object' && typeof data === 'object') {
                this.data = { ...this.data, ...data };
            } else {
                this.data = data;
            }
        } else {
            this.data = data;
        }
    }

    setExtraData(extraData) {
        this.extraData = extraData;
    }
}

const convertString = (input) => {
    if (input.startsWith("data[") && input.endsWith("]")) {
        input = input.substring(5, input.length - 1);
    }
    const output = input.replace(/\]\[0\]\[/g, ".[0].");
    return output;
};

module.exports = {
    mongoUrl,
    getAllQuery,
    jsonResponse: JsonResponse, // Esporta la classe
    convertString
};

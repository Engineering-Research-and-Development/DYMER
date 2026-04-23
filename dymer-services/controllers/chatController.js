const AiAgent = require('../models/AiAgent');
const axios = require('axios');

exports.processStreamChat = async (req, res) => {
    const { prompt, agentId } = req.body;

    try {
        // Recuperiamo la configurazione dell'agente scelto nella sidebar
        const agent = await AiAgent.findById(agentId);
        
        if (!agent) {
            return res.status(404).json({ message: "Agente non configurato correttamente." });
        }

        // Qui decidiamo dove inviare la richiesta in base a come hai configurato l'agente
        if (agent.provider === 'ollama') {
            return handleOllamaStream(res, agent, prompt);
        } else if (agent.provider === 'openai') {
            return handleOpenAIStream(res, agent, prompt);
        } else if (agent.provider === 'custom') {
            return handleCustomAgentStream(res, agent, prompt);
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


async function handleCustomAgentStream(res, agent, prompt) {
    try {
        // Configuriamo la chiamata verso l'URL salvato nelle impostazioni dell'agente
        const response = await axios.post(agent.settings.baseUrl, {
            prompt: prompt,
            context: agent.systemPrompt,
            model: agent.model
        }, {
            responseType: 'stream', // Fondamentale per ricevere i dati a pezzi
            headers: { 
                'Authorization': `Bearer ${agent.settings.apiKey}`, // Se l'API custom richiede auth
                'Content-Type': 'application/json'
            }
        });

        // Impostiamo gli header per lo streaming verso il frontend Angular
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // "Pippiamo" lo stream dell'API custom direttamente nella risposta del nostro server
        response.data.pipe(res);

    } catch (error) {
        console.error("Custom Agent Error:", error.message);
        res.status(502).json({ message: "L'agente custom non risponde correttamente" });
    }
}

 
async function handleOllamaStream(res, agent, prompt) {
    try {
        // 1. Configurazione della chiamata a Ollama
        // Usiamo l'endpoint /api/generate o /api/chat
        const ollamaUrl = `${agent.settings.baseUrl}/api/generate`;

        const response = await axios.post(ollamaUrl, {
            model: agent.model,
            prompt: prompt,
            system: agent.systemPrompt, // Iniettiamo le istruzioni dell'agente
            stream: true,               // Fondamentale per ricevere i chunk
            options: {
                temperature: 0.7        // Puoi rendere anche questo parametrizzabile nell'agente
            }
        }, {
            responseType: 'stream',     // Riceviamo i dati come flusso binario
            timeout: 10000              // Timeout se Ollama è spento
        });

        // 2. Prepariamo gli header della risposta HTTP per il frontend
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 3. Gestione del flusso dati
        // Ollama invia chunk di JSON. Dobbiamo inoltrarli così come sono.
        response.data.on('data', (chunk) => {
            // Inoltriamo il pezzetto di codice al frontend
            res.write(chunk);
        });

        // 4. Gestione chiusura stream
        response.data.on('end', () => {
            res.end();
        });

        // 5. Gestione errori durante lo streaming
        response.data.on('error', (err) => {
            console.error("Errore nello stream di Ollama:", err);
            res.write(JSON.stringify({ error: "Errore durante la generazione" }));
            res.end();
        });

    } catch (error) {
        console.error("Errore connessione Ollama:", error.message);
        
        // Se il server Ollama è offline o l'URL è sbagliato
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return res.status(503).json({ 
                message: "Il server Ollama non risponde. Verifica l'URL o se il servizio è attivo.",
                error: error.code 
            });
        }
        
        res.status(500).json({ message: "Errore interno nel caricamento di Ollama" });
    }
}
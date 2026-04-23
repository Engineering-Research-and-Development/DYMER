require("../models/agent/Agent.js");

const mongoose = require("mongoose");
const agentModel = mongoose.model("Agent");
const path = require('path');
const nameFile = path.basename(__filename);
const axios = require('axios');

// GET - Lista tutti gli agenti
exports.getAllAgents = async (req, res) => {
    try {
        const agents = await agentModel.find().sort({ createdAt: -1 });
        res.json(agents);
    } catch (error) {
        res.status(500).json({ message: "Errore recupero agenti", error: error.message });
    }
};

// POST - Crea un nuovo agente
exports.createAgent = async (req, res) => {
    try {
        console.info("info | " + nameFile + " | createAgent | save body:", req.body);
        const newAgent = new agentModel(req.body);
        const saved = await newAgent.save();
        console.info("info | " + nameFile + " | createAgent | save :", saved);
        res.status(201).json(saved);
    } catch (error) {
        console.error("error | " + nameFile + " | createAgent | save :", error);
        res.status(400).json({ message: "Dati non validi", error: error.message });
    }
};

// PUT - Aggiorna un agente
exports.updateAgent = async (req, res) => {
    try {
        console.info("info | " + nameFile + " | updateAgent | body:", req.body);
        const updated = await agentModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        console.info("info | " + nameFile + " | updateAgent | updated:", updated);
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Errore aggiornamento", error: error.message });
    }
};

// DELETE - Rimuove un agente
exports.deleteAgent = async (req, res) => {
    try {
        await AiAgent.findByIdAndDelete(req.params.id);
        res.json({ message: "Agente rimosso" });
    } catch (error) {
        res.status(500).json({ message: "Errore eliminazione", error: error.message });
    }
};

// POST - Test di connessione verso il provider AI
exports.testConnection = async (req, res) => {
    const { provider, settings } = req.body;

    try {
        if (provider === 'ollama') {
            // Verifica se Ollama risponde
            await axios.get(`${settings.baseUrl}/api/tags`, { timeout: 3000 });
            return res.json({ success: true, message: "Connessione Ollama OK" });
        } 
        
        if (provider === 'openai') {
            // Verifica la API Key chiamando i modelli di OpenAI
            await axios.get('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${settings.apiKey}` },
                timeout: 5000
            });
            return res.json({ success: true, message: "OpenAI API Key valida" });
        }

        res.status(400).json({ success: false, message: "Provider non supportato" });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Fallito: ${error.response?.data?.error?.message || 'Host non raggiungibile'}` 
        });
    }
};

// Aggiungi questo al tuo controller in Node.js
exports.checkAgentStatus = async (req, res) => {
    try {
        console.log(`chiamata services - Controllo stato agente con ID: ${req.params.id}`);
        const agent = await agentModel.findById(req.params.id);
        if (!agent) return res.status(404).json({ status: 'offline', message: 'Agente non trovato' });

        if (agent.provider === 'ollama') {
            await axios.get(`${agent.settings.baseUrl}/api/tags`, { timeout: 2000 });
            return res.json({ status: 'online' });
        } 
        
        if (agent.provider === 'openai') {
            // Un check leggero per validare la chiave
            await axios.get('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${agent.settings.apiKey}` },
                timeout: 3000
            });
            return res.json({ status: 'online' });
        }

        res.json({ status: 'unknown' });
    } catch (error) {
        res.json({ status: 'offline', details: error.message });
    }
};

exports.processStreamChat = async (req, res) => {
    const { prompt, agentId } = req.body;

    try {
        // Recuperiamo la configurazione dell'agente scelto nella sidebar
        const agent = await agentModel.findById(agentId);
        
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
        
        const ollamaUrl = `${agent.settings.baseUrl}/api/generate`;

        const response = await axios.post(ollamaUrl, {
            model: agent.model,
            prompt: prompt,
            system: agent.systemPrompt,  
            stream: true,               
            options: {
                temperature: 0.7         
            }
        }, {
            responseType: 'stream'            
        });

        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

         
        response.data.on('data', (chunk) => {
            
            res.write(chunk);
        });

        
        response.data.on('end', () => {
            res.end();
        });

         
        response.data.on('error', (err) => {
            console.error("Errore nello stream di Ollama:", err);
            res.write(JSON.stringify({ error: "Errore durante la generazione" }));
            res.end();
        });

    } catch (error) {
        console.error("Errore connessione Ollama:", error.message);

        if (error.response) {
            // Risposta ricevuta dal server Ollama
            console.error("Dettagli errore:", error.response.data);
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return res.status(503).json({ 
                message: "Il server Ollama non risponde. Verifica l'URL o se il servizio è attivo.",
                error: error.code 
            });
        }
        
        res.status(500).json({ message: "Errore interno nel caricamento di Ollama" });
    }
}
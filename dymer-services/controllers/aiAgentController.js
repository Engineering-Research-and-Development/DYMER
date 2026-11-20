require("../models/agent/Agent.js");

const mongoose = require("mongoose");
const agentModel = mongoose.model("Agent");
const path = require('path');
const nameFile = path.basename(__filename);
const axios = require('axios');
const dymerMcpIntentResolver = require('../ai/dymerMcpIntentResolver');
const dymerMcpIntentPlanner = require('../ai/dymerMcpIntentPlanner');
const dymerMcpPlanExecutor = require('../ai/dymerMcpPlanExecutor');
const ollamaMcpDeterministic = require('../ai/ollamaMcpDeterministic');
const mcpClientManager = require('../mcp/mcpClientManager');
const dymerMultiCatalogOrchestrator = require('../ai/dymerMultiCatalogOrchestrator');

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
        console.info("info | " + nameFile + " | deleteAgent | deleted:", req.params.id);
        await agentModel.findByIdAndDelete(req.params.id);
   
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
    const { prompt, agentId } = req.body || {};

    try {
        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({
                message: 'Prompt mancante.'
            });
        }

        const agent = await agentModel.findById(agentId);

        if (!agent) {
            return res.status(404).json({
                message: 'Agente non configurato correttamente.'
            });
        }

        let publishedModels = [];

        if (dymerMcpIntentResolver.looksLikeDymerDataRequest(prompt)) {
            const dymeruser = req.headers.dymeruser;

            if (!dymeruser || typeof dymeruser !== 'string') {
                return res.status(401).json({
                    message: 'Utente DYMER non autenticato.'
                });
            }

            const modelsResult = await mcpClientManager.callTool({
                serverId: 'dymer',
                tool: 'list_models',
                arguments: {},
                dymeruser
            });

            publishedModels =
                modelsResult?.result?.structuredContent?.models || [];
        }

        const multiCatalogPlan =
            dymerMultiCatalogOrchestrator.parseMultiCatalogPrompt(
                prompt,
                publishedModels
            );

        if (multiCatalogPlan.matched) {
            const dymeruser = req.headers.dymeruser;

            if (!dymeruser || typeof dymeruser !== 'string') {
                return res.status(401).json({
                    message: 'Utente DYMER non autenticato.'
                });
            }

            console.log('[AI AGENT MCP] Multi-catalog intent matched', {
                agentId: String(agent._id),
                intent: multiCatalogPlan.intent,
                sourceIndexesCount: multiCatalogPlan.source.indexes.length,
                targetIndexesCount:
                    multiCatalogPlan.relationTraversal.targetIndexes.length,
                topics: multiCatalogPlan.source.topics,
                topicOperator: multiCatalogPlan.source.topicOperator,
                hasRequestedTarget:
                    Boolean(multiCatalogPlan.requestedTarget.query)
            });

            const result =
                await dymerMultiCatalogOrchestrator.runMultiCatalogOrchestration({
                    agentId: agent._id,
                    prompt,
                    publishedModels,
                    dymeruser
                });

            const executedTools = result.executedTools || {};

            const executedToolNames = Array.isArray(executedTools)
                ? executedTools
                    .map((entry) => {
                        if (typeof entry === 'string') {
                            return entry;
                        }

                        return entry?.tool || entry?.name || entry?.toolName || null;
                    })
                    .filter(Boolean)
                : Array.isArray(executedTools.sequence)
                    ? executedTools.sequence.filter(Boolean)
                    : [];

            const executedToolCounts = Array.isArray(executedTools)
                ? executedToolNames.reduce((counts, toolName) => {
                    counts[toolName] = (counts[toolName] || 0) + 1;
                    return counts;
                }, {})
                : {
                    search_entities: Number(executedTools.searchEntities || 0),
                    get_entity_relations: Number(executedTools.getEntityRelations || 0),
                    get_entity: Number(executedTools.getEntity || 0)
                };

            const executedToolsTotal = Array.isArray(executedTools)
                ? executedToolNames.length
                : Number(executedTools.total || executedToolNames.length || 0);

            const targetMatchesCount = Array.isArray(result.data?.targetMatches)
                ? result.data.targetMatches.length
                : 0;

            const targetResolutionStatus = !result.plan.requestedTarget.query
                ? 'not_requested'
                : targetMatchesCount === 0
                    ? 'not_found'
                    : targetMatchesCount === 1
                        ? 'unique'
                        : 'ambiguous';

            console.log('[AI AGENT MCP] Multi-catalog execution summary', {
                agentId: String(agent._id),
                intent: result.plan.intent,
                sourceIndexesCount: result.plan.source.indexes.length,
                targetIndexesCount:
                    result.plan.relationTraversal.targetIndexes.length,
                topics: result.plan.source.topics,
                topicOperator: result.plan.source.topicOperator,
                requestedTarget: result.plan.requestedTarget.query || null,
                targetMatchesCount,
                targetResolutionStatus,
                targetMatchOrigin: result.data?.targetMatchOrigin || null,
                resolvedTarget: result.data?.uniqueTargetDetail
                    ? {
                        index: result.data.uniqueTargetDetail.index,
                        id: result.data.uniqueTargetDetail.id,
                        title: result.data.uniqueTargetDetail.title
                    }
                    : null,
                executedToolsTotal,
                executedToolCounts,
                executedToolSequence: executedToolNames
            });

            return res.json({
                success: true,
                generatedCode: result.answer,
                mcp: {
                    used: true,
                    mode: result.mode,
                    usedFallback: result.usedFallback,
                    executedTools: result.executedTools,
                    plan: {
                        intent: result.plan.intent,
                        sourceIndexes: result.plan.source.indexes,
                        targetIndexes:
                            result.plan.relationTraversal.targetIndexes,
                        topics: result.plan.source.topics,
                        topicOperator: result.plan.source.topicOperator,
                        requestedTarget: result.plan.requestedTarget.query
                    }
                }
            });
        }

        if (dymerMcpIntentResolver.looksLikeDymerDataRequest(prompt)) {
            const dymeruser = req.headers.dymeruser;
            const discovery = await mcpClientManager.listTools({ serverId: 'dymer', dymeruser });
            const workflows = [{
                name: 'multi_catalog_entity_search',
                description: 'Ricerca entity sorgente, attraversa relazioni e risolve target in più cataloghi DYMER.'
            }];
            const plannerResult = await dymerMcpIntentPlanner.planPrompt({
                agent, prompt, tools: discovery.tools, workflows
            });
            console.log('[AI AGENT MCP] Dynamic planner', {
                used: plannerResult.used,
                reason: plannerResult.reason || null,
                error: plannerResult.error || null,
                kind: plannerResult.plan?.kind || null,
                tool: plannerResult.plan?.tool || null,
                workflow: plannerResult.plan?.workflow || null,
                responseGoal: plannerResult.plan?.responseGoal || null
            });
            if (plannerResult.plan && plannerResult.plan.kind !== 'general_chat') {
                try {
                    const planned = await dymerMcpPlanExecutor.executePlan({
                        plan: plannerResult.plan, tools: discovery.tools, agent, prompt,
                        dymeruser, publishedModels
                    });
                    if (planned.executed) {
                        return res.json({
                            success: true,
                            generatedCode: planned.answer,
                            mcp: {
                                used: true,
                                mode: 'dynamic_planner',
                                kind: planned.kind,
                                plan: plannerResult.plan,
                                executedTool: planned.result?.executedTool || null
                            }
                        });
                    }
                    console.log('[AI AGENT MCP] Dynamic plan fallback', { reason: planned.reason });
                } catch (plannerExecutionError) {
                    console.error('[AI AGENT MCP] Dynamic plan error, deterministic fallback', {
                        message: plannerExecutionError.message
                    });
                }
            }
        }

        const mcpIntent =
            dymerMcpIntentResolver.resolveMcpIntent(
                prompt,
                publishedModels
            );

        console.log('[AI AGENT MCP] Resolution', {
            publishedModelsCount: publishedModels.length,
            matched: Boolean(mcpIntent?.matched),
            reason: mcpIntent?.reason || null,
            tool: mcpIntent?.tool || null,
            catalogIndex: mcpIntent?.catalog?.index || null
        });

        if (mcpIntent.matched) {
            const dymeruser = req.headers.dymeruser;

            if (!dymeruser || typeof dymeruser !== 'string') {
                return res.status(401).json({
                    message: 'Utente DYMER non autenticato.'
                });
            }

            const result =
                await ollamaMcpDeterministic.runDeterministicToolPrompt({
                    agentId: agent._id,
                    serverId: mcpIntent.serverId,
                    tool: mcpIntent.tool,
                    arguments: mcpIntent.arguments,
                    prompt: mcpIntent.prompt,
                    responseLimit: mcpIntent.requestedLimit,
                    dymeruser
                });

            return res.json({
                success: true,
                generatedCode: result.answer,
                mcp: {
                    used: true,
                    mode: result.mode,
                    usedFallback: result.usedFallback,
                    executedTool: result.executedTool
                }
            });
        }

        if (mcpIntent.dymerDataRequest) {
            const reasonMessages = {
                catalog_ambiguous:
                    'Sono stati individuati più cataloghi DYMER compatibili. Specifica il titolo completo o l indice desiderato.',
                model_required_for_schema:
                    'Non è stato possibile individuare il modello DYMER richiesto per recuperarne lo schema.',
                catalog_required_for_relations:
                    'Per recuperare le relazioni devi specificare il catalogo DYMER della entity.',
                entity_id_required_for_relations:
                    'Per recuperare le relazioni devi specificare l ID della entity.',
                catalog_required_for_entity:
                    'Per recuperare il dettaglio devi specificare il catalogo DYMER della entity.',
                entity_id_required:
                    'Per recuperare il dettaglio devi specificare l ID della entity.',
                catalog_not_resolved:
                    'Non è stato possibile individuare un catalogo DYMER valido.'
            };

            const candidateText = Array.isArray(mcpIntent.candidates) && mcpIntent.candidates.length
                ? ` Candidati: ${mcpIntent.candidates
                    .map(candidate => `${candidate.title} (${candidate.index})`)
                    .join(', ')}.`
                : '';

            return res.status(422).json({
                success: false,
                reason: mcpIntent.reason || 'unresolved_dymer_intent',
                message:
                    (reasonMessages[mcpIntent.reason] ||
                        'La richiesta DYMER non è stata interpretata in modo univoco.') +
                    candidateText
            });
        }

        if (agent.provider === 'ollama') {
            return handleOllamaStream(res, agent, prompt);
        }

        if (agent.provider === 'openai') {
            if (typeof handleOpenAIStream !== 'function') {
                return res.status(501).json({
                    message: 'Provider OpenAI non implementato.'
                });
            }

            return handleOpenAIStream(res, agent, prompt);
        }

        if (agent.provider === 'custom') {
            return handleCustomAgentStream(res, agent, prompt);
        }

        return res.status(400).json({
            message: `Provider non supportato: ${agent.provider}`
        });
    } catch (error) {
        console.error('[AI AGENT] processStreamChat error', {
            message: error.message,
            statusCode: error.statusCode,
            stack: error.stack
        });

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Errore durante la chat dell Agent'
        });
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
        /*
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
        */
        const response = await axios.post(ollamaUrl, {
                    model: agent.model, 
                    prompt: prompt,
                    stream: false, 
                    options: {
                    }
                });
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
 
        const generatedCode = response.data.response;
        res.json({ success: true, generatedCode: generatedCode });
        /*
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
        */
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
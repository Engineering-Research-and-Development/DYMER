const axios = require('axios');

const agentModel = require('../models/agent/Agent');
const mcpAgentToolService = require('../mcp/mcpAgentToolService');

function createError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function normalizeBaseUrl(baseUrl) {
    if (!baseUrl || typeof baseUrl !== 'string') {
        throw createError('Base URL Ollama non configurato nell Agent', 400);
    }

    return baseUrl
        .trim()
        .replace(/\/+$/, '')
        .replace('://0.0.0.0:', '://127.0.0.1:')
        .replace('://localhost:', '://127.0.0.1:');
}

function sanitizePlainText(value) {
    return String(value || '')
        .replace(/```[a-z0-9_-]*\s*/gi, '')
        .replace(/```/g, '')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
        .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractMcpResult(callResult) {
    const structured = callResult?.result?.structuredContent;
    if (structured && typeof structured === 'object') return structured;

    const content = callResult?.result?.content;
    if (Array.isArray(content)) {
        const text = content
            .filter(item => item && item.type === 'text')
            .map(item => item.text)
            .join('\n');

        if (text) {
            try {
                return JSON.parse(text);
            } catch {
                return { text };
            }
        }
    }

    return { result: null };
}

function compactEntity(item) {
    const source = item?._source || item || {};

    return {
        id: item?._id || source._id || source.id || '',
        index: item?._index || source._index || source.index || '',
        title: String(source.title || source.name || '').trim(),
        description: String(source.description || '').trim(),
        status: source.status || source.properties?.status || '',
        updatedAt: source.updatedAt || '',
        score: item?._score ?? source.score ?? null
    };
}

function compactResultForModel(toolName, result) {
    if (toolName === 'list_models' && Array.isArray(result?.models)) {
        return {
            titles: result.models
                .map(model => String(model.title || '').trim())
                .filter(Boolean)
        };
    }

    if (toolName === 'get_model_schema') {
        return {
            id: result?.id || '',
            title: result?.title || '',
            description: result?.description || '',
            instances: Array.isArray(result?.instances) ? result.instances : [],
            sources: Array.isArray(result?.sources) ? result.sources : [],
            fields: Array.isArray(result?.fields)
                ? result.fields.slice(0, 200).map(field => ({
                    name: field.name || field.key || '',
                    normalizedName: field.normalizedName || '',
                    label: field.label || '',
                    tag: field.tag || '',
                    type: field.type || '',
                    required: Boolean(field.required),
                    hidden: Boolean(field.hidden),
                    placeholder: field.placeholder || '',
                    sourceType: field.sourceType || '',
                    sourceFile: field.sourceFile || null
                }))
                : [],
            relations: Array.isArray(result?.relations)
                ? result.relations.slice(0, 100).map(relation => ({
                    fieldName: relation.fieldName || '',
                    label: relation.label || '',
                    description: relation.description || '',
                    direction: relation.direction || '',
                    targetIndex: relation.targetIndex || '',
                    attribute: relation.attribute || '',
                    sourceType: relation.sourceType || '',
                    sourceFile: relation.sourceFile || null
                }))
                : [],
            warnings: Array.isArray(result?.warnings) ? result.warnings : [],
            metadata: result?.metadata && typeof result.metadata === 'object'
                ? result.metadata
                : {}
        };
    }

    if (toolName === 'count_entities') {
        return {
            total: Number.isFinite(Number(result?.total)) ? Number(result.total) : 0,
            complete: result?.complete !== false,
            countMode: String(result?.countMode || ''),
            totalsByIndex: result?.totalsByIndex && typeof result.totalsByIndex === 'object' ? result.totalsByIndex : {},
            requestedIndexes: Array.isArray(result?.requestedIndexes) ? result.requestedIndexes : []
        };
    }

    if (toolName === 'search_entities' && Array.isArray(result?.items)) {
        const items = result.items
            .slice(0, 20)
            .map(compactEntity)
            .filter(item => item.title || item.id);

        return {
            total: Number.isFinite(Number(result?.total)) ? Number(result.total) : items.length,
            returned: Number.isFinite(Number(result?.returned)) ? Number(result.returned) : items.length,
            totalsByIndex: result?.totalsByIndex && typeof result.totalsByIndex === 'object' ? result.totalsByIndex : {},
            searchedIndexes: Array.isArray(result?.searchedIndexes) ? result.searchedIndexes : [],
            failedIndexes: Array.isArray(result?.failedIndexes) ? result.failedIndexes : [],
            items
        };
    }

    if (toolName === 'get_entity') {
        const sourceItems = Array.isArray(result?.items)
            ? result.items
            : Array.isArray(result)
                ? result
                : [result];

        return {
            items: sourceItems
                .slice(0, 5)
                .map(compactEntity)
                .filter(item => item.id || item.title)
        };
    }

    if (toolName === 'get_entity_relations') {
        const items = Array.isArray(result?.items)
            ? result.items
            : Array.isArray(result?.relations)
                ? result.relations
                : [];

        return {
            source: {
                entityId: String(result?.source?.entityId || ''),
                index: String(result?.source?.index || '')
            },
            total: Number.isFinite(Number(result?.total))
                ? Number(result.total)
                : items.length,
            from: Number.isFinite(Number(result?.from)) ? Number(result.from) : 0,
            size: Number.isFinite(Number(result?.size)) ? Number(result.size) : items.length,
            relationsCount:
                result?.relationsCount && typeof result.relationsCount === 'object'
                    ? result.relationsCount
                    : {},
            relatedIndexes: Array.isArray(result?.relatedIndexes)
                ? result.relatedIndexes
                : [],
            items: items.slice(0, 20).map(compactEntity)
        };
    }

    return result;
}

function formatListModels(toolData, context = {}) {
    const titles = Array.isArray(toolData?.titles) ? toolData.titles : [];
    if (context.responseGoal === 'count') {
        return `Nel DYMER sono presenti ${titles.length} modelli pubblicati.`;
    }
    if (!titles.length) return 'Nessun modello DYMER disponibile.';
    return titles.map((title, index) => `${index + 1}. ${title}`).join('\n');
}

function formatSearchEntities(toolData, context = {}) {
    const items = Array.isArray(toolData?.items) ? toolData.items : [];
    if (context.responseGoal === 'count') {
        const total = Number.isFinite(Number(toolData?.total)) ? Number(toolData.total) : 0;
        const details = Object.entries(toolData?.totalsByIndex || {}).sort((a, b) => Number(b[1]) - Number(a[1])).map(([index, count]) => `${index}: ${count}`);
        return [`Nel DYMER sono presenti ${total} entity.`, details.length ? `Dettaglio per indice:\n${details.join('\n')}` : ''].filter(Boolean).join('\n\n');
    }
    if (!items.length) return 'Nessuna entity trovata per i criteri richiesti.';

    return items.map((item, index) => [
        `${index + 1}. ${item.title || item.id || 'Entity'}`,
        item.index ? `Catalogo: ${item.index}` : '',
        item.id ? `ID: ${item.id}` : '',
        `Descrizione: ${item.description || 'Descrizione non disponibile'}`
    ].filter(Boolean).join('\n')).join('\n\n');
}

function formatCountEntities(toolData) {
    const total = Number.isFinite(Number(toolData?.total))
        ? Number(toolData.total)
        : 0;
    const details = Object.entries(toolData?.totalsByIndex || {})
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .map(([index, count]) => `${index}: ${count}`);

    return [
        `Nel DYMER sono presenti ${total} entity visibili.`,
        toolData?.complete === false
            ? 'Attenzione: il conteggio è parziale.'
            : '',
        details.length
            ? `Dettaglio per indice:\n${details.join('\n')}`
            : ''
    ].filter(Boolean).join('\n\n');
}

function formatModelSchema(toolData) {
    const fields = Array.isArray(toolData?.fields) ? toolData.fields : [];
    const relations = Array.isArray(toolData?.relations) ? toolData.relations : [];
    const warnings = Array.isArray(toolData?.warnings) ? toolData.warnings : [];
    const instances = Array.isArray(toolData?.instances) ? toolData.instances : [];

    const header = [
        `Modello: ${toolData?.title || 'Non disponibile'}`,
        toolData?.id ? `ID: ${toolData.id}` : '',
        instances.length
            ? `Indici: ${instances.map(item => item.index).filter(Boolean).join(', ')}`
            : ''
    ].filter(Boolean).join('\n');

    const fieldSection = fields.length
        ? [
            `Campi (${fields.length}):`,
            ...fields.map((field, index) => {
                const label = field.label || field.name || `Campo ${index + 1}`;
                const details = [
                    field.name && field.name !== label ? field.name : '',
                    field.type || field.tag || '',
                    field.required ? 'obbligatorio' : '',
                    field.hidden ? 'nascosto' : ''
                ].filter(Boolean).join(', ');

                return `${index + 1}. ${label}${details ? ` (${details})` : ''}`;
            })
        ].join('\n')
        : 'Campi: nessun campo estraibile dalle fonti disponibili.';

    const relationSection = relations.length
        ? [
            `Relazioni (${relations.length}):`,
            ...relations.map((relation, index) => {
                const label = relation.label || relation.fieldName || `Relazione ${index + 1}`;
                const arrow = relation.direction === 'from' ? '<-' : '->';
                const target = relation.targetIndex || 'destinazione non disponibile';
                const description = relation.description
                    ? ` - ${relation.description}`
                    : '';

                return `${index + 1}. ${label} ${arrow} ${target}${description}`;
            })
        ].join('\n')
        : 'Relazioni: nessuna relazione dichiarata nello schema.';

    const warningSection = warnings.length
        ? `Avvisi:\n${warnings.map((warning, index) => `${index + 1}. ${warning}`).join('\n')}`
        : '';

    return [header, fieldSection, relationSection, warningSection]
        .filter(Boolean)
        .join('\n\n');
}

function formatEntity(toolData) {
    const item = toolData?.items?.[0];
    if (!item) return 'Entity non trovata.';

    return [
        'Dettaglio entity',
        `Titolo: ${item.title || 'Non disponibile'}`,
        `Catalogo: ${item.index || 'Non disponibile'}`,
        `ID: ${item.id || 'Non disponibile'}`,
        `Descrizione: ${item.description || 'Descrizione non disponibile'}`,
        `Stato: ${item.status || 'Non disponibile'}`,
        item.updatedAt ? `Data aggiornamento: ${item.updatedAt}` : ''
    ].filter(Boolean).join('\n');
}

function formatEntityRelations(toolData) {
    const items = Array.isArray(toolData?.items) ? toolData.items : [];
    const total = Number.isFinite(Number(toolData?.total))
        ? Number(toolData.total)
        : items.length;

    if (!items.length) return 'Nessuna relazione trovata per la entity richiesta.';

    const header = [
        `Relazioni trovate: ${total}`,
        toolData?.source?.index ? `Catalogo sorgente: ${toolData.source.index}` : '',
        toolData?.source?.entityId ? `ID sorgente: ${toolData.source.entityId}` : ''
    ].filter(Boolean).join('\n');

    const relations = items.map((item, index) => [
        `${index + 1}. ${item.title || item.id || 'Entity collegata'}`,
        `Catalogo: ${item.index || 'Non disponibile'}`,
        `ID: ${item.id || 'Non disponibile'}`,
        `Descrizione: ${item.description || 'Descrizione non disponibile'}`,
        item.status ? `Stato: ${item.status}` : '',
        item.updatedAt ? `Data aggiornamento: ${item.updatedAt}` : ''
    ].filter(Boolean).join('\n')).join('\n\n');

    return `${header}\n\n${relations}`;
}

function buildDeterministicAnswer(toolName, toolData, context = {}) {
    const formatters = {
        list_models: formatListModels,
        search_entities: formatSearchEntities,
        count_entities: formatCountEntities,
        get_model_schema: formatModelSchema,
        get_entity: formatEntity,
        get_entity_relations: formatEntityRelations
    };

    const formatter = formatters[toolName];
    return formatter ? formatter(toolData, context) : JSON.stringify(toolData, null, 2);
}

function requiresOllamaAnalysis(prompt) {
    const normalized = String(prompt || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return /\b(confronta|confrontami|compar[ae]|riassumi|sintetizza|analizza|spiega|valuta|consiglia|differenze|similarita|vantaggi|svantaggi|compare|summarize|analyse|analyze|explain|evaluate)\b/.test(normalized);
}

async function loadAgent(agentId) {
    if (!agentId) throw createError('Identificativo Agent mancante', 400);
    const agent = await agentModel.findById(agentId);
    if (!agent) throw createError(`Agent "${agentId}" non trovato`, 404);
    if (agent.isActive === false) throw createError(`Agent "${agent.name}" non attivo`, 409);
    if (agent.provider !== 'ollama') throw createError(`L Agent "${agent.name}" non usa Ollama`, 400);
    return agent;
}

function getToolInstructions(toolName) {
    const common = 'Usa esclusivamente i dati verificati. Non inventare informazioni. Non usare Markdown, asterischi, backtick, titoli Markdown o altre marcature.';
    const instructions = {
        list_models: 'Analizza esclusivamente i modelli forniti.',
        get_model_schema: 'Analizza esclusivamente campi e relazioni dello schema fornito.',
        search_entities: 'Analizza esclusivamente le entity fornite.',
        count_entities: 'Analizza esclusivamente il conteggio verificato delle entity.',
        get_entity: 'Analizza esclusivamente il dettaglio della entity fornita.',
        get_entity_relations: 'Analizza esclusivamente le relazioni fornite.'
    };

    return `${common} ${instructions[toolName] || ''}`.trim();
}

async function askOllamaWithoutTools({ agent, prompt, toolName, toolData }) {
    const baseUrl = normalizeBaseUrl(agent.settings?.baseUrl || agent.baseUrl);
    const systemPrompt = String(agent.systemPrompt || '').trim();
    const content = [
        systemPrompt ? `Istruzioni Agent: ${systemPrompt}` : '',
        `Richiesta: ${String(prompt || '').trim()}`,
        `Dati verificati (${toolName}): ${JSON.stringify(toolData)}`,
        getToolInstructions(toolName)
    ].filter(Boolean).join('\n');

    console.log('[OLLAMA MCP DETERMINISTIC] Request', {
        url: `${baseUrl}/api/generate`,
        model: agent.model,
        tool: toolName,
        promptLength: content.length
    });

    try {
        const startedAt = Date.now();
        const response = await axios.post(
            `${baseUrl}/api/generate`,
            {
                model: agent.model,
                prompt: content,
                stream: false,
                options: {}
            },
            {
                timeout: Number(process.env.OLLAMA_MCP_TIMEOUT_MS || 120000),
                proxy: false,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        console.log('[OLLAMA MCP DETERMINISTIC] Response', {
            durationMs: Date.now() - startedAt,
            responseLength: typeof response.data?.response === 'string'
                ? response.data.response.length
                : 0
        });

        if (
            !response.data ||
            typeof response.data.response !== 'string' ||
            response.data.response.trim() === ''
        ) {
            throw createError('Ollama ha restituito una risposta vuota', 502);
        }

        return {
            role: 'assistant',
            content: sanitizePlainText(response.data.response)
        };
    } catch (error) {
        if (error.statusCode) throw error;

        const status = error.response?.status;
        const detail = error.response?.data?.error ||
            error.response?.data?.message ||
            error.message;

        throw createError(
            `Errore Ollama${status ? ` HTTP ${status}` : ''}: ${detail}`,
            status || 502
        );
    }
}

async function runDeterministicToolPrompt({
    agentId,
    serverId = 'dymer',
    tool,
    arguments: toolArguments = {},
    prompt,
    responseLimit,
    responseGoal,
    dymeruser
}) {
    if (!tool || typeof tool !== 'string') {
        throw createError('Nome del tool MCP mancante', 400);
    }

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        throw createError('Prompt mancante', 400);
    }

    const agent = await loadAgent(agentId);
    const callResult = await mcpAgentToolService.callAgentTool({
        agentId,
        serverId,
        tool,
        arguments: toolArguments,
        dymeruser
    });

    const rawToolData = extractMcpResult(callResult);
    let toolData = compactResultForModel(tool, rawToolData);

    const parsedLimit = Number.parseInt(responseLimit, 10);
    const safeLimit = Number.isFinite(parsedLimit)
        ? Math.min(20, Math.max(1, parsedLimit))
        : null;

    if (safeLimit && tool === 'list_models' && Array.isArray(toolData?.titles)) {
        toolData = { titles: toolData.titles.slice(0, safeLimit) };
    }

    const analyticalRequest = requiresOllamaAnalysis(prompt);
    let message;
    let usedFallback = false;

    if (!analyticalRequest) {
        message = {
            role: 'assistant',
            content: sanitizePlainText(buildDeterministicAnswer(tool, toolData, { prompt, toolArguments, responseGoal }))
        };
    } else {
        try {
            message = await askOllamaWithoutTools({
                agent,
                prompt,
                toolName: tool,
                toolData
            });
        } catch (error) {
            usedFallback = true;
            console.error('[OLLAMA MCP DETERMINISTIC] Fallback', {
                tool,
                message: error.message
            });
            message = {
                role: 'assistant',
                content: sanitizePlainText(buildDeterministicAnswer(tool, toolData, { prompt, toolArguments, responseGoal }))
            };
        }
    }

    const cleanAnswer = sanitizePlainText(message.content || '');

    return {
        mode: analyticalRequest ? 'analytical' : 'deterministic',
        usedFallback,
        agent: {
            id: agent._id,
            name: agent.name,
            provider: agent.provider,
            model: agent.model
        },
        executedTool: {
            serverId,
            tool,
            arguments: toolArguments
        },
        toolData,
        answer: cleanAnswer,
        message: {
            ...message,
            content: cleanAnswer
        }
    };
}

module.exports = {
    runDeterministicToolPrompt,
    sanitizePlainText
};

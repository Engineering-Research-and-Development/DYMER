const axios = require('axios');

const agentModel =
    require('../models/agent/Agent');

const mcpAgentToolService =
    require('../mcp/mcpAgentToolService');

function createError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}

function normalizeBaseUrl(baseUrl) {
    if (
        !baseUrl ||
        typeof baseUrl !== 'string'
    ) {
        throw createError(
            'Base URL Ollama non configurato nell’Agent',
            400
        );
    }

    let normalized = baseUrl
        .trim()
        .replace(/\/+$/, '');

    normalized = normalized
        .replace(
            '://0.0.0.0:',
            '://localhost:'
        );

    return normalized;
}

function getAgentBaseUrl(agent) {
    return normalizeBaseUrl(
        agent.settings?.baseUrl ||
        agent.baseUrl
    );
}

function getEnabledMcpServers(agent) {
    const accessList = Array.isArray(
        agent.mcpAccess
    )
        ? agent.mcpAccess
        : [];

    return accessList.filter((access) => {
        return (
            access &&
            access.serverId &&
            access.enabled !== false
        );
    });
}

function createOllamaTool(tool) {
    const inputSchema =
        tool &&
        tool.inputSchema &&
        typeof tool.inputSchema === 'object' &&
        !Array.isArray(tool.inputSchema)
            ? tool.inputSchema
            : {};

    const properties =
        inputSchema.properties &&
        typeof inputSchema.properties === 'object' &&
        !Array.isArray(inputSchema.properties)
            ? inputSchema.properties
            : {};

    const required =
        Array.isArray(inputSchema.required)
            ? inputSchema.required
            : [];

    return {
        type: 'function',

        function: {
            name: String(tool.name),

            description:
                typeof tool.description === 'string'
                    ? tool.description
                    : `Esegue il tool MCP ${tool.name}`,

            parameters: {
                type: 'object',
                properties,
                required
            }
        }
    };
}

function normalizeToolArguments(argumentsValue) {
    if (
        argumentsValue &&
        typeof argumentsValue === 'object' &&
        !Array.isArray(argumentsValue)
    ) {
        return argumentsValue;
    }

    if (
        typeof argumentsValue === 'string' &&
        argumentsValue.trim() !== ''
    ) {
        try {
            const parsed = JSON.parse(
                argumentsValue
            );

            if (
                parsed &&
                typeof parsed === 'object' &&
                !Array.isArray(parsed)
            ) {
                return parsed;
            }
        } catch (error) {
            throw createError(
                'Ollama ha restituito argomenti tool non validi',
                502
            );
        }
    }

    return {};
}

function extractToolResult(result) {
    const structured =
        result?.result?.structuredContent;

    if (
        structured &&
        typeof structured === 'object'
    ) {
        return structured;
    }

    const content =
        result?.result?.content;

    if (Array.isArray(content)) {
        const text = content
            .filter((item) => {
                return (
                    item &&
                    item.type === 'text'
                );
            })
            .map((item) => item.text)
            .join('\n');

        if (text) {
            try {
                return JSON.parse(text);
            } catch {
                return {
                    text
                };
            }
        }
    }

    return {
        result: null
    };
}

async function loadAgent(agentId) {
    if (!agentId) {
        throw createError(
            'Identificativo Agent mancante',
            400
        );
    }

    const agent = await agentModel.findById(
        agentId
    );

    if (!agent) {
        throw createError(
            `Agent "${agentId}" non trovato`,
            404
        );
    }

    if (agent.isActive === false) {
        throw createError(
            `Agent "${agent.name}" non attivo`,
            409
        );
    }

    if (agent.provider !== 'ollama') {
        throw createError(
            `L’Agent "${agent.name}" non usa il provider Ollama`,
            400
        );
    }

    if (!agent.model) {
        throw createError(
            `Modello Ollama non configurato per l’Agent "${agent.name}"`,
            400
        );
    }

    return agent;
}

async function loadAuthorizedTools({
    agent,
    dymeruser
}) {
    const enabledServers =
        getEnabledMcpServers(agent);

    const ollamaTools = [];
    const toolRegistry = new Map();
    const serverSummary = [];

    for (const access of enabledServers) {
        const serverId = access.serverId;

        const result =
            await mcpAgentToolService
                .getAuthorizedTools({
                    agentId: agent._id,
                    serverId,
                    dymeruser
                });

        const allowedTools =
            result.allowedTools || [];

        for (const tool of allowedTools) {
            if (toolRegistry.has(tool.name)) {
                throw createError(
                    `Il tool "${tool.name}" è pubblicato ` +
                    'da più server MCP associati allo stesso Agent',
                    409
                );
            }

            toolRegistry.set(
                tool.name,
                {
                    serverId,
                    tool
                }
            );

            ollamaTools.push(
                createOllamaTool(tool)
            );
        }

        serverSummary.push({
            serverId,
            server: result.server,
            tools: allowedTools.map(
                (tool) => tool.name
            )
        });
    }

    return {
        ollamaTools,
        toolRegistry,
        serverSummary
    };
}

async function callOllama({
    agent,
    messages,
    tools
}) {
    const baseUrl =
        getAgentBaseUrl(agent);

    const payload = {
        model: agent.model,
        messages,
        stream: false,
        keep_alive: '10m'
    };

    if (
        Array.isArray(tools) &&
        tools.length > 0
    ) {
        payload.tools = tools;
    }

    const serializedPayload = JSON.stringify(payload);

    console.log('[OLLAMA MCP] Payload summary', {
        payloadBytes: Buffer.byteLength(
            serializedPayload,
            'utf8'
        ),

        messagesCount: Array.isArray(payload.messages)
            ? payload.messages.length
            : 0,

        toolsCount: Array.isArray(payload.tools)
            ? payload.tools.length
            : 0,

        tools: Array.isArray(payload.tools)
            ? payload.tools.map((item) => ({
                type: item.type,

                name:
                    item.function?.name || null,

                descriptionLength:
                    typeof item.function?.description === 'string'
                        ? item.function.description.length
                        : 0,

                parameters:
                    item.function?.parameters || null
            }))
            : []
    });

    try {
        console.log('[OLLAMA MCP] Request', {
            url: `${baseUrl}/api/chat`,
            model: agent.model,
            messagesCount: messages.length,
            toolsCount: Array.isArray(tools)
                ? tools.length
                : 0
        });
        
        const fs = require('fs');
        const path = require('path');

        const debugPayloadPath = path.join(
            __dirname,
            '..',
            'ollama-mcp-payload-debug.json'
        );

        fs.writeFileSync(
            debugPayloadPath,
            JSON.stringify(payload, null, 2),
            'utf8'
        );

        console.log(
            '[OLLAMA MCP] Debug payload saved:',
            debugPayloadPath
        );
        
        const response = await axios.post(
            `${baseUrl}/api/chat`,
            payload,
            {
                timeout: 120000,

                proxy: false,

                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (
            !response.data ||
            !response.data.message
        ) {
            throw createError(
                'Ollama non ha restituito un messaggio valido',
                502
            );
        }

        return response.data;
    } catch (error) {

        console.error('[OLLAMA MCP] Error', {
            url: `${baseUrl}/api/chat`,
            model: agent.model,
            code: error.code,
            status: error.response?.status,
            message: error.message,
            response: error.response?.data
        });

        if (error.statusCode) {
            throw error;
        }

        const status =
            error.response?.status;

        const detail =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message;

        throw createError(
            `Errore Ollama${status ? ` HTTP ${status}` : ''}: ${detail}`,
            status || 502
        );
    }
}

async function runAgentPrompt({
    agentId,
    prompt,
    dymeruser,
    maxToolRounds = 5
}) {
    if (
        !prompt ||
        typeof prompt !== 'string' ||
        prompt.trim() === ''
    ) {
        throw createError(
            'Prompt mancante',
            400
        );
    }

    const agent = await loadAgent(
        agentId
    );

    const {
        ollamaTools,
        toolRegistry,
        serverSummary
    } = await loadAuthorizedTools({
        agent,
        dymeruser
    });

    const messages = [];

    const systemPrompt =
        agent.systemPrompt &&
        String(agent.systemPrompt).trim() !== ''
            ? String(agent.systemPrompt).trim()
            : '';

    const userContent = systemPrompt
        ? [
            'Istruzioni dell’Agent:',
            systemPrompt,
            '',
            'Richiesta dell’utente:',
            prompt.trim()
        ].join('\n')
        : prompt.trim();

    messages.push({
        role: 'user',
        content: userContent
    });

    const executedTools = [];

    for (
        let round = 0;
        round <= maxToolRounds;
        round += 1
    ) {
        const toolsForThisRound =
            round === 0
                ? ollamaTools
                : [];

        console.log('[OLLAMA MCP] Round', {
            round: round + 1,
            messagesCount: messages.length,
            toolsCount: toolsForThisRound.length,
            executedToolsCount: executedTools.length
        });

        console.log('[OLLAMA MCP] Messages', {
            round: round + 1,

            messages: messages.map(
                (message, index) => ({
                    index,

                    role: message.role,

                    hasContent:
                        typeof message.content === 'string' &&
                        message.content.length > 0,

                    contentLength:
                        typeof message.content === 'string'
                            ? message.content.length
                            : 0,

                    toolCallsCount:
                        Array.isArray(message.tool_calls)
                            ? message.tool_calls.length
                            : 0,

                    toolName:
                        message.tool_name || null
                })
            )
        });
        const response = await callOllama({
            agent,
            messages,
            tools: toolsForThisRound
        });

        const assistantMessage = response.message;

        const toolCalls =
            Array.isArray(
                assistantMessage.tool_calls
            )
                ? assistantMessage.tool_calls
                : [];

        if (toolCalls.length === 0) {
            messages.push({
                role: 'assistant',
                content:
                    assistantMessage.content || ''
            });

            return {
                agent: {
                    id: agent._id,
                    name: agent.name,
                    provider: agent.provider,
                    model: agent.model
                },

                mcpServers: serverSummary,

                executedTools,

                answer:
                    assistantMessage.content || '',

                message:
                    assistantMessage
            };
        }

        /*
        * Se Ollama richiede un tool, conserviamo soltanto
        * role e tool_calls. L'eventuale testo prodotto insieme
        * alla tool call non viene reinserito nel secondo round.
        */
        messages.push({
            role: 'assistant',
            content: '',
            tool_calls: toolCalls
        });

        if (round === maxToolRounds) {
            throw createError(
                'Numero massimo di iterazioni tool raggiunto',
                508
            );
        }

        for (const toolCall of toolCalls) {
            const functionCall =
                toolCall?.function;

            const toolName =
                functionCall?.name;

            if (
                !toolName ||
                !toolRegistry.has(toolName)
            ) {
                throw createError(
                    `Ollama ha richiesto il tool non autorizzato ` +
                    `"${toolName || 'sconosciuto'}"`,
                    403
                );
            }

            const registryEntry =
                toolRegistry.get(toolName);

            const toolArguments =
                normalizeToolArguments(
                    functionCall.arguments
                );
            
            console.log('[OLLAMA MCP] Calling tool', {
                round: round + 1,
                serverId: registryEntry.serverId,
                tool: toolName,
                arguments: toolArguments
            });    

            const toolResult =
                await mcpAgentToolService
                    .callAgentTool({
                        agentId: agent._id,
                        serverId:
                            registryEntry.serverId,
                        tool: toolName,
                        arguments:
                            toolArguments,
                        dymeruser
                    });

            const normalizedResult =
                extractToolResult(toolResult);

            let resultForModel = normalizedResult;

            if (
                toolName === 'list_models' &&
                Array.isArray(normalizedResult.models)
            ) {
                resultForModel = {
                    models: normalizedResult.models.map(
                        model => model.title
                    )
                };
            }

            const serializedToolResult =
                JSON.stringify(resultForModel);

            console.log('[OLLAMA MCP] Tool result', {
                round: round + 1,
                tool: toolName,
                resultLength:
                    serializedToolResult.length
            });    

            messages.push({
                role: 'tool',
                tool_name: toolName,
                content: serializedToolResult
            });

            messages.push({
                role: 'user',
                content:
                    'Formula ora la risposta finale usando esclusivamente il risultato del tool. Non richiedere altri strumenti.'
            });

            executedTools.push({
                round: round + 1,
                serverId:
                    registryEntry.serverId,
                tool: toolName,
                arguments:
                    toolArguments
            });
        }
    }

    throw createError(
        'Impossibile completare l’esecuzione dell’Agent',
        500
    );
}

module.exports = {
    runAgentPrompt
};
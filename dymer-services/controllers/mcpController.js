const mcpClientManager = require('../mcp/mcpClientManager');
const agentModel = require('../models/agent/Agent');
const mcpToolPolicy = require('../mcp/mcpToolPolicy');
const mcpAgentToolService = require('../mcp/mcpAgentToolService');
const ollamaMcpOrchestrator = require('../ai/ollamaMcpOrchestrator');
const ollamaMcpDeterministic = require('../ai/ollamaMcpDeterministic');

function getDymerUserHeader(req) {
    const dymeruser = req.headers.dymeruser;

    if (
        !dymeruser ||
        typeof dymeruser !== 'string'
    ) {
        const error = new Error(
            'Header dymeruser mancante'
        );

        error.statusCode = 401;
        throw error;
    }

    return dymeruser;
}

function sendError(res, error) {
    const statusCode =
        error.statusCode ||
        error.status ||
        500;

    console.error(
        '[MCP TEST]',
        error
    );

    return res.status(statusCode).json({
        success: false,
        message:
            error.message ||
            'Errore durante la chiamata MCP'
    });
}

exports.listTools = async function(req, res) {
    try {
        const dymeruser =
            getDymerUserHeader(req);

        const serverId =
            req.query.serverId ||
            'dymer';

        const result =
            await mcpClientManager.listTools({
                serverId,
                dymeruser
            });

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return sendError(res, error);
    }
};

exports.testTool = async function(req, res) {
    try {
        const dymeruser =
            getDymerUserHeader(req);

        const {
            serverId = 'dymer',
            tool,
            arguments: toolArguments = {}
        } = req.body || {};

        const result =
            await mcpClientManager.callTool({
                serverId,
                tool,
                arguments: toolArguments,
                dymeruser
            });

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return sendError(res, error);
    }
};

exports.getAgentTools = async function(req, res) {
    try {
        const dymeruser =
            getDymerUserHeader(req);

        const agentId = req.params.agentId;

        if (!agentId) {
            const error = new Error(
                'Identificativo Agent mancante'
            );

            error.statusCode = 400;
            throw error;
        }

        const agent = await agentModel.findById(
            agentId
        );

        if (!agent) {
            const error = new Error(
                `Agent "${agentId}" non trovato`
            );

            error.statusCode = 404;
            throw error;
        }

        const mcpAccess = Array.isArray(
            agent.mcpAccess
        )
            ? agent.mcpAccess
            : [];

        const enabledServers = mcpAccess.filter(
            (access) => {
                return (
                    access &&
                    access.serverId &&
                    access.enabled !== false
                );
            }
        );

        const serverResults = [];

        for (const access of enabledServers) {
            const serverId = access.serverId;

            const published =
                await mcpClientManager.listTools({
                    serverId,
                    dymeruser
                });

            const allowedTools =
                mcpToolPolicy.filterPublishedTools({
                    agent,
                    serverId,
                    publishedTools:
                        published.tools || []
                });

            serverResults.push({
                server: published.server,

                configuredTools: Array.isArray(
                    access.allowedTools
                )
                    ? access.allowedTools
                    : [],

                allowedTools
            });
        }

        return res.json({
            success: true,

            data: {
                agent: {
                    id: agent._id,
                    name: agent.name,
                    provider: agent.provider,
                    model: agent.model,
                    isActive: agent.isActive
                },

                servers: serverResults
            }
        });
    } catch (error) {
        return sendError(res, error);
    }
};

exports.callAgentTool = async function(req, res) {
    try {
        const dymeruser =
            getDymerUserHeader(req);

        const agentId =
            req.params.agentId;

        const {
            serverId = 'dymer',
            tool,
            arguments: toolArguments = {}
        } = req.body || {};

        if (
            !tool ||
            typeof tool !== 'string' ||
            tool.trim() === ''
        ) {
            const error = new Error(
                'Nome del tool MCP mancante'
            );

            error.statusCode = 400;
            throw error;
        }

        if (
            toolArguments === null ||
            typeof toolArguments !== 'object' ||
            Array.isArray(toolArguments)
        ) {
            const error = new Error(
                'Gli argomenti del tool devono essere un oggetto'
            );

            error.statusCode = 400;
            throw error;
        }

        const result =
            await mcpAgentToolService.callAgentTool({
                agentId,
                serverId,
                tool: tool.trim(),
                arguments: toolArguments,
                dymeruser
            });

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return sendError(res, error);
    }
};

exports.testAgentChat = async function(req, res) {
    try {
        const dymeruser =
            getDymerUserHeader(req);

        const agentId =
            req.params.agentId;

        const {
            prompt,
            maxToolRounds = 5
        } = req.body || {};

        const parsedMaxRounds =
            Number.parseInt(
                maxToolRounds,
                10
            );

        const safeMaxRounds =
            Number.isFinite(parsedMaxRounds)
                ? Math.min(
                    Math.max(
                        parsedMaxRounds,
                        1
                    ),
                    5
                )
                : 5;

        const result =
            await ollamaMcpOrchestrator
                .runAgentPrompt({
                    agentId,
                    prompt,
                    dymeruser,
                    maxToolRounds:
                        safeMaxRounds
                });

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return sendError(res, error);
    }
};

exports.testDeterministicChat = async function(req, res) {
    try {
        const dymeruser =
            getDymerUserHeader(req);

        const agentId =
            req.params.agentId;

        const {
            serverId = 'dymer',
            tool,
            arguments: toolArguments = {},
            prompt
        } = req.body || {};

        if (
            !toolArguments ||
            typeof toolArguments !== 'object' ||
            Array.isArray(toolArguments)
        ) {
            const error = new Error(
                'Gli argomenti del tool devono essere un oggetto'
            );

            error.statusCode = 400;
            throw error;
        }

        const result =
            await ollamaMcpDeterministic
                .runDeterministicToolPrompt({
                    agentId,
                    serverId,
                    tool,
                    arguments: toolArguments,
                    prompt,
                    dymeruser
                });

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return sendError(res, error);
    }
};
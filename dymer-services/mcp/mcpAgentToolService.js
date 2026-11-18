const agentModel =
    require('../models/agent/Agent');

const mcpClientManager =
    require('./mcpClientManager');

const mcpToolPolicy =
    require('./mcpToolPolicy');

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}

async function getAgent(agentId) {
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

    return agent;
}

async function getAuthorizedTools({
    agentId,
    serverId = 'dymer',
    dymeruser
}) {
    const agent = await getAgent(agentId);

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

    return {
        agent,
        server: published.server,
        publishedTools:
            published.tools || [],
        allowedTools
    };
}

async function callAgentTool({
    agentId,
    serverId = 'dymer',
    tool,
    arguments: toolArguments = {},
    dymeruser
}) {
    const {
        agent,
        server,
        publishedTools,
        allowedTools
    } = await getAuthorizedTools({
        agentId,
        serverId,
        dymeruser
    });

    mcpToolPolicy.assertToolAllowed({
        agent,
        serverId,
        toolName: tool,
        publishedTools
    });

    const result =
        await mcpClientManager.callTool({
            serverId,
            tool,
            arguments: toolArguments,
            dymeruser
        });

    return {
        agent: {
            id: agent._id,
            name: agent.name,
            provider: agent.provider,
            model: agent.model
        },

        server,

        authorization: {
            allowedTools: allowedTools.map(
                item => item.name
            ),

            executedTool: tool
        },

        result: result.result
    };
}

module.exports = {
    getAuthorizedTools,
    callAgentTool
};
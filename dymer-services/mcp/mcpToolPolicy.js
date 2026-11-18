function createPolicyError(message, statusCode = 403) {
    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}

function getAgentServerAccess(agent, serverId) {
    if (!agent) {
        throw createPolicyError(
            'Agent non specificato',
            400
        );
    }

    const mcpAccess = Array.isArray(agent.mcpAccess)
        ? agent.mcpAccess
        : [];

    const serverAccess = mcpAccess.find((item) => {
        return (
            item &&
            item.serverId === serverId &&
            item.enabled !== false
        );
    });

    return serverAccess || null;
}

function getAllowedToolNames(agent, serverId) {
    const serverAccess = getAgentServerAccess(
        agent,
        serverId
    );

    if (!serverAccess) {
        return [];
    }

    const allowedTools = Array.isArray(
        serverAccess.allowedTools
    )
        ? serverAccess.allowedTools
        : [];

    return [
        ...new Set(
            allowedTools
                .filter((toolName) => {
                    return (
                        typeof toolName === 'string' &&
                        toolName.trim() !== ''
                    );
                })
                .map((toolName) => toolName.trim())
        )
    ];
}

function filterPublishedTools({
    agent,
    serverId,
    publishedTools
}) {
    const allowedToolNames = getAllowedToolNames(
        agent,
        serverId
    );

    const allowedToolSet = new Set(
        allowedToolNames
    );

    const published = Array.isArray(publishedTools)
        ? publishedTools
        : [];

    return published.filter((tool) => {
        return (
            tool &&
            typeof tool.name === 'string' &&
            allowedToolSet.has(tool.name)
        );
    });
}

function assertToolAllowed({
    agent,
    serverId,
    toolName,
    publishedTools
}) {
    if (
        !toolName ||
        typeof toolName !== 'string'
    ) {
        throw createPolicyError(
            'Nome del tool MCP mancante',
            400
        );
    }

    const allowedToolNames = getAllowedToolNames(
        agent,
        serverId
    );

    if (!allowedToolNames.includes(toolName)) {
        throw createPolicyError(
            `Il tool MCP "${toolName}" non è autorizzato ` +
            `per l'Agent "${agent.name || agent._id}"`,
            403
        );
    }

    if (Array.isArray(publishedTools)) {
        const isPublished = publishedTools.some(
            (tool) => tool?.name === toolName
        );

        if (!isPublished) {
            throw createPolicyError(
                `Il tool MCP "${toolName}" è autorizzato ` +
                `per l'Agent, ma non è pubblicato dal server ` +
                `"${serverId}"`,
                404
            );
        }
    }

    return true;
}

module.exports = {
    getAgentServerAccess,
    getAllowedToolNames,
    filterPublishedTools,
    assertToolAllowed
};
const servers = {
    dymer: {
        id: 'dymer',
        name: 'DYMER MCP',
        transport: 'streamable-http',
        url: process.env.DYMER_MCP_URL || 'http://localhost:3010/mcp',
        enabled: true,
        timeoutMs: Number(
            process.env.DYMER_MCP_TIMEOUT_MS || 20000
        )
    }
};

function getServer(serverId) {
    const server = servers[serverId];

    if (!server) {
        const error = new Error(
            `Server MCP "${serverId}" non configurato`
        );

        error.statusCode = 404;
        throw error;
    }

    if (!server.enabled) {
        const error = new Error(
            `Server MCP "${serverId}" non abilitato`
        );

        error.statusCode = 503;
        throw error;
    }

    return server;
}

function listServers() {
    return Object.values(servers).map((server) => ({
        id: server.id,
        name: server.name,
        transport: server.transport,
        url: server.url,
        enabled: server.enabled
    }));
}

module.exports = {
    getServer,
    listServers
};
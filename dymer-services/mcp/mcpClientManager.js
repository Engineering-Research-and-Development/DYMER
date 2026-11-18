const { getServer } = require('./mcpServerRegistry');

async function loadMcpSdk() {
    const [
        clientModule,
        transportModule
    ] = await Promise.all([
        import('@modelcontextprotocol/sdk/client/index.js'),
        import(
            '@modelcontextprotocol/sdk/client/streamableHttp.js'
        )
    ]);

    return {
        Client: clientModule.Client,
        StreamableHTTPClientTransport:
            transportModule.StreamableHTTPClientTransport
    };
}

function validateDymerUser(dymeruser) {
    if (
        !dymeruser ||
        typeof dymeruser !== 'string' ||
        dymeruser.trim() === ''
    ) {
        const error = new Error(
            'Header dymeruser mancante'
        );

        error.statusCode = 401;
        throw error;
    }
}

async function createClient({
    serverId = 'dymer',
    dymeruser
}) {
    validateDymerUser(dymeruser);

    const serverConfig = getServer(serverId);

    const {
        Client,
        StreamableHTTPClientTransport
    } = await loadMcpSdk();

    const client = new Client(
        {
            name: 'dymer-services',
            version: '0.1.0'
        },
        {
            capabilities: {}
        }
    );

    const transport = new StreamableHTTPClientTransport(
        new URL(serverConfig.url),
        {
            requestInit: {
                headers: {
                    dymeruser
                }
            }
        }
    );

    await client.connect(transport);

    return {
        client,
        transport,
        serverConfig
    };
}

async function closeClient(client, transport) {
    try {
        if (
            client &&
            typeof client.close === 'function'
        ) {
            await client.close();
            return;
        }

        if (
            transport &&
            typeof transport.close === 'function'
        ) {
            await transport.close();
        }
    } catch (error) {
        console.error(
            '[MCP] Errore durante la chiusura del client:',
            error.message
        );
    }
}

async function listTools({
    serverId = 'dymer',
    dymeruser
}) {
    const {
        client,
        transport,
        serverConfig
    } = await createClient({
        serverId,
        dymeruser
    });

    try {
        const result = await client.listTools();

        return {
            server: {
                id: serverConfig.id,
                name: serverConfig.name,
                url: serverConfig.url
            },
            tools: result.tools || []
        };
    } finally {
        await closeClient(client, transport);
    }
}

async function callTool({
    serverId = 'dymer',
    tool,
    arguments: toolArguments = {},
    dymeruser
}) {
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

    const {
        client,
        transport,
        serverConfig
    } = await createClient({
        serverId,
        dymeruser
    });

    try {
        const availableTools = await client.listTools();

        const toolExists = (
            availableTools.tools || []
        ).some((item) => item.name === tool);

        if (!toolExists) {
            const error = new Error(
                `Il tool MCP "${tool}" non è pubblicato ` +
                `dal server "${serverId}"`
            );

            error.statusCode = 404;
            throw error;
        }

        const result = await client.callTool({
            name: tool,
            arguments: toolArguments
        });

        return {
            server: {
                id: serverConfig.id,
                name: serverConfig.name,
                url: serverConfig.url
            },
            tool,
            result
        };
    } finally {
        await closeClient(client, transport);
    }
}

module.exports = {
    listTools,
    callTool
};
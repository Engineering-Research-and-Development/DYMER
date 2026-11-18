import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { config } from './config.js';
import { listModels } from './tools/listModels.js';
import { getModelSchema } from './tools/getModelSchema.js';
import { searchEntities, countEntities, countRelations, getEntity, getEntityRelations } from './clients/entitiesClient.js';
import { textResult } from './utils/normalizeDymerResponse.js';
import { toMcpError } from './utils/toolError.js';

function createServer(dymerUser) {
  const server = new McpServer({ name: 'dymer-mcp', version: '0.1.0' });
  const run = (handler) => async (args) => {
    try { return textResult(await handler(args)); }
    catch (error) { console.error(error); return toMcpError(error); }
  };

  server.tool('list_models', 'Elenca i modelli/cataloghi DYMER visibili all utente.', {}, run(
    () => listModels({ dymerUser })
  ));

  server.tool('get_model_schema', 'Recupera la struttura di un modello DYMER per ID o titolo.', {
    modelId: z.string().optional(),
    title: z.string().optional()
  }, run((args) => getModelSchema({ dymerUser, ...args })));

  server.tool('search_entities', 'Cerca, filtra o conta entity DYMER in uno o più indici, senza relazioni espanse. Usa indexes per ricerche globali.', {
    index: z.string().min(1).optional(),
    indexes: z.array(z.string().min(1)).max(100).optional(),
    query: z.string().default(''),
    exactTitle: z.string().min(1).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(config.maxSearchSize).default(config.defaultSearchSize)
  }, run((args) => searchEntities({ dymerUser, ...args })));

  server.tool('count_entities', 'Conta tutte le entity DYMER visibili oppure quelle appartenenti agli indici specificati.', {
    index: z.string().min(1).optional(),
    indexes: z.array(z.string().min(1)).max(100).optional()
  }, run((args) => countEntities({ dymerUser, ...args })));
  server.tool('count_relations', 'Conta le relazioni delle entity DYMER appartenenti a uno o più indici. Usa questo tool quando l oggetto del conteggio sono le relazioni, non le entity.', {
    index: z.string().min(1).optional(),
    indexes: z.array(z.string().min(1)).max(100).optional()
  }, run((args) => countRelations({ dymerUser, ...args })));
  server.tool('get_entity', 'Recupera una singola entity DYMER per indice e ID.', {
    index: z.string().min(1),
    id: z.string().min(1),
    includeRelations: z.boolean().default(false)
  }, run((args) => getEntity({ dymerUser, ...args })));

  server.tool('get_entity_relations', 'Recupera le relazioni paginate di una entity DYMER, con filtro opzionale sugli indici collegati.', {
    entityId: z.string().min(1),
    index: z.string().min(1),
    relatedIndexes: z.array(z.string().min(1)).max(100).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(config.maxSearchSize).default(config.defaultSearchSize)
  }, run((args) => getEntityRelations({ dymerUser, ...args })));

  return server;
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dymer-mcp', version: '0.1.0' });
});

app.post(config.mcpPath, async (req, res) => {
  const dymerUser = req.get('dymeruser');
  if (!dymerUser) return res.status(401).json({ error: 'Missing dymeruser header' });

  const server = createServer(dymerUser);
  const transport = new StreamableHTTPServerTransport({
	  sessionIdGenerator: undefined,
	  enableJsonResponse: true
  });

  res.on('close', async () => {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ error: 'MCP request failed' });
  }
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`dymer-mcp listening on http://0.0.0.0:${config.port}${config.mcpPath}`);
});

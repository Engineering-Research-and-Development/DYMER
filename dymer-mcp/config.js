import 'dotenv/config';

function intEnv(name, fallback, min, max) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(max, Math.max(min, value));
}

export const config = Object.freeze({
  port: intEnv('PORT', 3010, 1, 65535),
  mcpPath: process.env.MCP_PATH || '/mcp',
  gatewayUrl: (process.env.DYMER_GATEWAY_URL || 'http://localhost:8080').replace(/\/$/, ''),
  requestTimeoutMs: intEnv('DYMER_REQUEST_TIMEOUT_MS', 15000, 1000, 60000),
  defaultSearchSize: intEnv('DYMER_DEFAULT_SEARCH_SIZE', 10, 1, 20),
  maxSearchSize: intEnv('DYMER_MAX_SEARCH_SIZE', 20, 1, 50),
  nodeEnv: process.env.NODE_ENV || 'development'
});

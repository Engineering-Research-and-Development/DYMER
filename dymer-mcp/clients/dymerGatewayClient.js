import { config } from '../config.js';
import { ToolError } from '../utils/toolError.js';

function requireDymerUser(dymerUser) {
  if (!dymerUser || typeof dymerUser !== 'string') {
    throw new ToolError('Header dymeruser mancante: il tool richiede un utente DYMER autenticato', 401);
  }
  return dymerUser;
}

export async function dymerRequest({ path, method = 'GET', body, dymerUser }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(`${config.gatewayUrl}${path}`, {
      method,
      headers: {
        accept: 'application/json',
        ...(body ? { 'content-type': 'application/json' } : {}),
        dymeruser: requireDymerUser(dymerUser)
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const raw = await response.text();
    let payload;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = { message: raw || `HTTP ${response.status}` };
    }

    if (!response.ok) {
      throw new ToolError(
        payload?.message || payload?.messages || `DYMER Gateway ha restituito HTTP ${response.status}`,
        response.status,
        payload
      );
    }

    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ToolError('Timeout durante la chiamata al DYMER Gateway', 504);
    }
    if (error instanceof ToolError) throw error;
    throw new ToolError(`Gateway DYMER non raggiungibile: ${error.message}`, 502);
  } finally {
    clearTimeout(timer);
  }
}

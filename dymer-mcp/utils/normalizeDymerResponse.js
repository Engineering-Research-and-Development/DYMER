import { ToolError } from './toolError.js';

export function extractDymerData(payload) {
  if (payload == null) {
    throw new ToolError('DYMER ha restituito una risposta vuota', 502);
  }

  if (payload.success === false) {
    const message = payload.message || payload.messages || 'Richiesta DYMER non riuscita';
    throw new ToolError(String(message), 502);
  }

  return payload.data ?? payload;
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.hits)) return value.hits;
  if (Array.isArray(value?.hits?.hits)) return value.hits.hits;
  return value == null ? [] : [value];
}

export function textResult(value) {
  const structuredContent =
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
      ? value
      : {
          items: Array.isArray(value) ? value : [value]
        };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredContent, null, 2)
      }
    ],
    structuredContent
  };
}

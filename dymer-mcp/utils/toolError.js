export class ToolError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.name = 'ToolError';
    this.status = status;
    this.details = details;
  }
}

export function toMcpError(error) {
  const message = error instanceof ToolError
    ? error.message
    : 'Errore interno durante l esecuzione del tool DYMER';

  return {
    isError: true,
    content: [{ type: 'text', text: message }]
  };
}

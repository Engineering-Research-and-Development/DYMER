export type AiProvider = 'ollama' | 'openai' | 'custom';

export interface AiAgent {
  _id?: string;
  name: string;
  provider: AiProvider;
  model: string;
  settings: {
    baseUrl?: string;
    apiKey?: string;
    organizationId?: string;
  };
  systemPrompt: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
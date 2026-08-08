import { AIProvider } from "./types";
import { AIRouter } from "./router";

export function getProviderInstance(name: string): AIProvider {
  return AIRouter.getInstance();
}

export interface ModelCapabilities {
  vision: boolean;
  jsonMode: boolean;
  reasoning: boolean;
  streaming: boolean;
  maxTokens: number;
}

export const modelCapabilities: Record<string, Partial<ModelCapabilities>> = {
  "gpt-4o": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 4096 },
  "gpt-4o-mini": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 4096 },
  "o1-preview": { vision: false, jsonMode: false, reasoning: true, streaming: false, maxTokens: 32768 },
  "o1-mini": { vision: false, jsonMode: false, reasoning: true, streaming: false, maxTokens: 32768 },
  "gemini-1.5-pro": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 8192 },
  "gemini-2.5-flash": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 8192 },
  "claude-3-5-sonnet": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 4096 },
  "claude-3-haiku": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 4096 }
};

export function getModelCapabilities(model: string): Partial<ModelCapabilities> {
  const normalizedModel = model.toLowerCase();
  for (const [key, caps] of Object.entries(modelCapabilities)) {
    if (normalizedModel.includes(key)) {
      return caps;
    }
  }
  return {
    vision: false,
    jsonMode: true,
    reasoning: false,
    streaming: true,
    maxTokens: 4096
  };
}

export interface AIRequestOptions {
  mode?: "text" | "docs";
  systemPrompt?: string;
  responseFormat?: "text" | "json_object";
  modelOverride?: string;
  providerOverride?: string;
  stream?: boolean;
  featureKey?: string;
  apiKey?: string;
  abortSignal?: AbortSignal;
  latencySensitive?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  generateText(prompt: string, options: AIRequestOptions): Promise<string>;
  streamText?(prompt: string, options: AIRequestOptions): Promise<any>;
}

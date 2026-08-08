import OpenAI from "openai";
import { AIProvider, AIRequestOptions } from "../types";
import { CustomProviderConfig } from "../settings";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private config: CustomProviderConfig;

  constructor(config: CustomProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey || "missing-key",
      baseURL: config.baseUrl || "https://api.openai.com/v1",
      dangerouslyAllowBrowser: true,
      defaultHeaders: config.headers || {},
    });
  }

  async generateText(prompt: string, options: AIRequestOptions): Promise<string> {
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (this.config.defaultModel || "gpt-4o-mini");

    try {
      const response = await this.client.chat.completions.create({
        model: targetModel,
        messages: [
          { role: "system", content: options.systemPrompt || "" },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined
      }, { signal: options.abortSignal });

      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      throw new Error(`OpenAI Provider Error: ${error.message}`);
    }
  }

  async streamText(prompt: string, options: AIRequestOptions): Promise<any> {
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (this.config.defaultModel || "gpt-4o-mini");

    try {
      return await this.client.chat.completions.create({
        model: targetModel,
        messages: [
          { role: "system", content: options.systemPrompt || "" },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined,
        stream: true
      }, { signal: options.abortSignal });
    } catch (error: any) {
      throw new Error(`OpenAI Provider Error: ${error.message}`);
    }
  }
}

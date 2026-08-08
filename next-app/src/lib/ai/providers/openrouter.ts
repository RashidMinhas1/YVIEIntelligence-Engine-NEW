import OpenAI from "openai";
import { AIProvider, AIRequestOptions } from "../types";
import { CustomProviderConfig } from "../settings";

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI;
  private config: CustomProviderConfig;

  constructor(config: CustomProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey || "missing-key",
      baseURL: config.baseUrl || "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "YouTube Viral Intelligence Engine",
        ...(config.headers || {})
      },
      timeout: 30000, // 30 seconds max timeout so it doesn't hang forever
    });
  }

  async generateText(prompt: string, options: AIRequestOptions): Promise<string> {
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (this.config.defaultModel || "google/gemini-2.5-flash");

    try {
      const response = await this.client.chat.completions.create({
        model: targetModel,
        messages: [
          { role: "system", content: options.systemPrompt || "" },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4000,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined
      }, { signal: options.abortSignal });

      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      throw new Error(`OpenRouter Provider Error: ${error.message}`);
    }
  }

  async streamText(prompt: string, options: AIRequestOptions): Promise<any> {
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (this.config.defaultModel || "google/gemini-2.5-flash");

    try {
      return await this.client.chat.completions.create({
        model: targetModel,
        messages: [
          { role: "system", content: options.systemPrompt || "" },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4000,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined,
        stream: true
      }, { signal: options.abortSignal });
    } catch (error: any) {
      throw new Error(`OpenRouter Provider Error: ${error.message}`);
    }
  }
}

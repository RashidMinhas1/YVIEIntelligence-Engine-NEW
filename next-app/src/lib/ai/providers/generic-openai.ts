import OpenAI from "openai";
import { AIProvider, AIRequestOptions } from "../types";
import { CustomProviderConfig } from "../settings";

export class GenericOpenAIProvider implements AIProvider {
  private client: OpenAI;
  private config: CustomProviderConfig;

  constructor(config: CustomProviderConfig) {
    this.config = config;
    
    const clientOptions: any = {
      apiKey: config.apiKey || "dummy-key-for-local-llms",
      baseURL: config.baseUrl,
      defaultHeaders: config.headers || {},
    };

    if (config.authMethod === "none") {
      clientOptions.apiKey = "none";
    }

    this.client = new OpenAI(clientOptions);
  }

  async generateText(prompt: string, options: AIRequestOptions): Promise<string> {
    const model = options.modelOverride || this.config.defaultModel;
    if (!model) throw new Error("No model specified for Generic OpenAI Provider");

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
      });

      return response.choices[0]?.message?.content || "";
    } catch (err: any) {
      throw new Error(`GenericOpenAI Provider Error: ${err.message}`);
    }
  }

  async streamText(prompt: string, options: AIRequestOptions): Promise<any> {
    const model = options.modelOverride || this.config.defaultModel;
    if (!model) throw new Error("No model specified for Generic OpenAI Provider");

    return this.client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
      stream: true
    });
  }
}

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { AIProvider, AIRequestOptions } from "../types";
import { CustomProviderConfig } from "../settings";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private config: CustomProviderConfig;

  constructor(config: CustomProviderConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey || "missing-key");
  }

  async generateText(prompt: string, options: AIRequestOptions): Promise<string> {
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (this.config.defaultModel || "gemini-1.5-flash");

    try {
      const model = this.client.getGenerativeModel({
        model: targetModel,
        systemInstruction: options.systemPrompt,
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
          responseMimeType: options.responseFormat === "json_object" ? "application/json" : "text/plain",
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      });

      // The Google SDK currently does not support passing AbortSignal in exactly this place in all versions, 
      // but we maintain the compatibility with what the previous code did:
      const result = await model.generateContent(prompt, { signal: options.abortSignal } as any);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      throw new Error(`Gemini Provider Error: ${error.message}`);
    }
  }

  async streamText(prompt: string, options: AIRequestOptions): Promise<any> {
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (this.config.defaultModel || "gemini-1.5-flash");

    try {
      const model = this.client.getGenerativeModel({
        model: targetModel,
        systemInstruction: options.systemPrompt,
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
          responseMimeType: options.responseFormat === "json_object" ? "application/json" : "text/plain",
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      });

      const result = await model.generateContentStream(prompt, { signal: options.abortSignal } as any);
      return result.stream;
    } catch (error: any) {
      throw new Error(`Gemini Provider Error: ${error.message}`);
    }
  }
}

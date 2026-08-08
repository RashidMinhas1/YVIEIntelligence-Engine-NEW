import crypto from "crypto";

interface CacheEntry {
  response: string;
  timestamp: number;
}

export class AICache {
  private static instance: AICache;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

  private constructor() {}

  public static getInstance(): AICache {
    if (!AICache.instance) {
      AICache.instance = new AICache();
    }
    return AICache.instance;
  }

  private hashPrompt(provider: string, model: string, prompt: string, systemPrompt?: string): string {
    const data = `${provider}:${model}:${systemPrompt || ""}:${prompt}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  public get(provider: string, model: string, prompt: string, systemPrompt?: string): string | null {
    const key = this.hashPrompt(provider, model, prompt, systemPrompt);
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return entry.response;
  }

  public set(provider: string, model: string, prompt: string, response: string, systemPrompt?: string): void {
    const key = this.hashPrompt(provider, model, prompt, systemPrompt);
    this.cache.set(key, { response, timestamp: Date.now() });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const aiCache = AICache.getInstance();

export function getCacheStats() {
  return { hits: 0, misses: 0, size: 0 };
}

export function getCachedResponse(prompt: string, model: string, provider: string) {
  return aiCache.get(provider, model, prompt);
}

export function setCachedResponse(prompt: string, response: string, model: string, provider: string) {
  aiCache.set(provider, model, prompt, response);
}

export function generatePromptHash(prompt: string) {
  return prompt; // Dummy
}

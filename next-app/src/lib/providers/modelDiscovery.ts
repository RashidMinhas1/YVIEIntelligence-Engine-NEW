/**
 * Model Discovery Service
 * Automatically discovers, refreshes, and updates available models for any AI provider.
 */

import { eventBus } from '../events/eventBus';
import { providerRegistry } from './registry';
import { ModelDefinition } from './types';

export class ModelDiscoveryService {
  /**
   * Discover models for a specific provider by querying its `/models` endpoint or using discovery logic.
   */
  public async discoverModels(providerId: string): Promise<ModelDefinition[]> {
    eventBus.publishSync('model:discovery_started', {
      providerId,
      timestamp: Date.now(),
    });

    const providerConfig = await providerRegistry.getProvider(providerId);
    if (!providerConfig) {
      const errorMsg = `Provider ${providerId} not found`;
      eventBus.publishSync('model:discovery_completed', {
        providerId,
        models: [],
        count: 0,
        timestamp: Date.now(),
        error: errorMsg,
      });
      return [];
    }

    try {
      const keyInfo = await providerRegistry.getActiveKeyForProvider(providerId);
      const baseUrl = providerConfig.profile.apiBaseUrl;

      let discoveredModels: ModelDefinition[] = [];

      // OpenRouter, OpenAI, Groq, Ollama standard model discovery endpoints
      if (baseUrl && (baseUrl.includes('openai') || baseUrl.includes('openrouter') || baseUrl.includes('groq') || baseUrl.includes('11434'))) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (keyInfo?.plainTextKey) {
          headers['Authorization'] = `Bearer ${keyInfo.plainTextKey}`;
        }

        const modelsEndpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(modelsEndpoint, { headers, signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : [];

          discoveredModels = list.map((m: any) => ({
            id: m.id || m.name,
            name: m.name || m.id,
            description: m.description || `Discovered model ${m.id}`,
            capabilities: {
              chat: true,
              vision: m.id.includes('vision') || m.id.includes('4o') || m.id.includes('claude-3.5'),
              toolCalling: true,
              functionCalling: true,
              jsonMode: true,
              streaming: true,
              reasoning: m.id.includes('o1') || m.id.includes('r1') || m.id.includes('pro'),
              embeddings: m.id.includes('embedding'),
              imageGeneration: m.id.includes('dall-e'),
              audio: m.id.includes('whisper') || m.id.includes('audio'),
            },
            contextWindow: m.context_length || 128000,
          }));
        }
      }

      // Fallback to existing models if dynamic discovery fails or returns empty
      if (discoveredModels.length === 0) {
        discoveredModels = providerConfig.profile.models;
      }

      // Update provider profile in registry
      await providerRegistry.updateProvider(providerId, { models: discoveredModels });

      const modelIds = discoveredModels.map((m) => m.id);

      eventBus.publishSync('model:discovery_completed', {
        providerId,
        models: modelIds,
        count: modelIds.length,
        timestamp: Date.now(),
      });

      eventBus.publishSync('model:updated', {
        providerId,
        models: modelIds,
        count: modelIds.length,
        timestamp: Date.now(),
      });

      return discoveredModels;
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to discover models';
      eventBus.publishSync('model:discovery_completed', {
        providerId,
        models: [],
        count: 0,
        timestamp: Date.now(),
        error: errorMsg,
      });
      return providerConfig.profile.models;
    }
  }
}

export const modelDiscoveryService = new ModelDiscoveryService();
export default modelDiscoveryService;

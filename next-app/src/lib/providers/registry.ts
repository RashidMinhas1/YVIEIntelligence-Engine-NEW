/**
 * Provider Registry Service
 * Manages official, community, local, and custom AI providers.
 * Integrates with Centralized AI Event Bus and Abstract Persistence Layer.
 */

import { eventBus } from '../events/eventBus';
import { CryptoService } from '../crypto/cryptoService';
import { PersistenceFactory } from './persistence/factory';
import {
  ProviderAdapter,
  ProviderCategory,
  ProviderConfig,
  ProviderProfile,
  ManagedApiKey,
  ModelDefinition,
} from './types';

// Default system providers initialization helper
function createDefaultProviderProfiles(): ProviderProfile[] {
  const now = Date.now();
  return [
    {
      id: 'openai',
      name: 'OpenAI',
      category: 'official',
      description: 'Industry-standard LLMs including GPT-4o, o1 reasoning models, and embeddings.',
      website: 'https://openai.com',
      documentation: 'https://platform.openai.com/docs',
      apiBaseUrl: 'https://api.openai.com/v1',
      authType: 'bearer',
      supportedEndpoints: ['/chat/completions', '/embeddings', '/images/generations', '/audio/transcriptions'],
      capabilities: {
        chat: true,
        vision: true,
        toolCalling: true,
        functionCalling: true,
        jsonMode: true,
        streaming: true,
        reasoning: true,
        embeddings: true,
        imageGeneration: true,
        audio: true,
        maxContextTokens: 128000,
        maxOutputTokens: 16384,
      },
      models: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          capabilities: { chat: true, vision: true, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: false, embeddings: false, imageGeneration: false, audio: false },
          contextWindow: 128000,
          isDefault: true,
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          capabilities: { chat: true, vision: true, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: false, embeddings: false, imageGeneration: false, audio: false },
          contextWindow: 128000,
        },
        {
          id: 'o1-preview',
          name: 'o1-Preview',
          capabilities: { chat: true, vision: true, toolCalling: false, jsonMode: false, streaming: false, functionCalling: false, reasoning: true, embeddings: false, imageGeneration: false, audio: false },
          contextWindow: 128000,
        },
      ],
      status: 'active',
      version: '1.0.0',
      author: 'OpenAI',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      category: 'official',
      description: 'Google DeepMind multimodal AI models with high performance and massive context windows.',
      website: 'https://ai.google.dev',
      documentation: 'https://ai.google.dev/docs',
      apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      authType: 'api-key-header',
      customHeaderName: 'x-goog-api-key',
      supportedEndpoints: ['/models/gemini-1.5-pro:generateContent', '/models/gemini-1.5-flash:generateContent'],
      capabilities: {
        chat: true,
        vision: true,
        toolCalling: true,
        functionCalling: true,
        jsonMode: true,
        streaming: true,
        reasoning: true,
        embeddings: true,
        imageGeneration: false,
        audio: true,
        maxContextTokens: 2000000,
        maxOutputTokens: 8192,
      },
      models: [
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          capabilities: { chat: true, vision: true, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: true, embeddings: false, imageGeneration: false, audio: true },
          contextWindow: 2000000,
          isDefault: true,
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          capabilities: { chat: true, vision: true, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: false, embeddings: false, imageGeneration: false, audio: true },
          contextWindow: 1000000,
        },
        {
          id: 'gemini-2.5-flash',
          name: 'Gemini 2.5 Flash',
          capabilities: { chat: true, vision: true, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: true, embeddings: false, imageGeneration: false, audio: true },
          contextWindow: 1000000,
        },
      ],
      status: 'active',
      version: '1.0.0',
      author: 'Google DeepMind',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      category: 'official',
      description: 'Unified router API access to 100+ AI models including Claude 3.5, Llama 3, and Mistral.',
      website: 'https://openrouter.ai',
      documentation: 'https://openrouter.ai/docs',
      apiBaseUrl: 'https://openrouter.ai/api/v1',
      authType: 'bearer',
      supportedEndpoints: ['/chat/completions', '/models'],
      capabilities: {
        chat: true,
        vision: true,
        toolCalling: true,
        functionCalling: true,
        jsonMode: true,
        streaming: true,
        reasoning: true,
        embeddings: true,
        imageGeneration: true,
        audio: true,
        maxContextTokens: 200000,
        maxOutputTokens: 8192,
      },
      models: [
        {
          id: 'anthropic/claude-3.5-sonnet',
          name: 'Claude 3.5 Sonnet',
          capabilities: { chat: true, vision: true, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: true, embeddings: false, imageGeneration: false, audio: false },
          contextWindow: 200000,
          isDefault: true,
        },
        {
          id: 'anthropic/claude-3-haiku',
          name: 'Claude 3 Haiku',
          capabilities: { chat: true, vision: true, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: false, embeddings: false, imageGeneration: false, audio: false },
          contextWindow: 200000,
        },
        {
          id: 'meta-llama/llama-3.1-405b-instruct',
          name: 'Llama 3.1 405B',
          capabilities: { chat: true, vision: false, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: true, embeddings: false, imageGeneration: false, audio: false },
          contextWindow: 128000,
        },
      ],
      status: 'active',
      version: '1.0.0',
      author: 'OpenRouter',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ollama',
      name: 'Ollama',
      category: 'local',
      description: 'Run open-source LLMs locally on CPU/GPU (Llama 3, Mistral, Gemma, DeepSeek).',
      website: 'https://ollama.com',
      documentation: 'https://github.com/ollama/ollama/tree/main/docs',
      apiBaseUrl: 'http://localhost:11434/v1',
      authType: 'none',
      supportedEndpoints: ['/chat/completions', '/api/generate', '/api/tags'],
      capabilities: {
        chat: true,
        vision: true,
        toolCalling: true,
        functionCalling: true,
        jsonMode: true,
        streaming: true,
        reasoning: true,
        embeddings: true,
        imageGeneration: false,
        audio: false,
        maxContextTokens: 32768,
        maxOutputTokens: 4096,
      },
      models: [
        {
          id: 'llama3:latest',
          name: 'Llama 3 Local',
          capabilities: { chat: true, vision: false, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: false, embeddings: true, imageGeneration: false, audio: false },
          contextWindow: 8192,
          isDefault: true,
        },
        {
          id: 'mistral:latest',
          name: 'Mistral 7B Local',
          capabilities: { chat: true, vision: false, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: false, embeddings: true, imageGeneration: false, audio: false },
          contextWindow: 8192,
        },
      ],
      status: 'active',
      version: '1.0.0',
      author: 'Ollama Community',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'groq',
      name: 'Groq',
      category: 'community',
      description: 'Ultra-fast LPU inference engine for open-source AI models.',
      website: 'https://groq.com',
      documentation: 'https://console.groq.com/docs/quickstart',
      apiBaseUrl: 'https://api.groq.com/openai/v1',
      authType: 'bearer',
      supportedEndpoints: ['/chat/completions', '/models'],
      capabilities: {
        chat: true,
        vision: false,
        toolCalling: true,
        functionCalling: true,
        jsonMode: true,
        streaming: true,
        reasoning: false,
        embeddings: false,
        imageGeneration: false,
        audio: true,
        maxContextTokens: 128000,
        maxOutputTokens: 8192,
      },
      models: [
        {
          id: 'llama-3.3-70b-versatile',
          name: 'Llama 3.3 70B',
          capabilities: { chat: true, vision: false, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: true, embeddings: false, imageGeneration: false, audio: false },
          contextWindow: 128000,
          isDefault: true,
        },
      ],
      status: 'active',
      version: '1.0.0',
      author: 'Groq',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

class ProviderRegistryService {
  private configs: Map<string, ProviderConfig> = new Map();
  private initialized: boolean = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const persistence = await PersistenceFactory.getInitializedEngine();
      const storedConfigs = await persistence.get<Record<string, ProviderConfig>>('provider_configs');

      const defaultProfiles = createDefaultProviderProfiles();

      if (storedConfigs && Object.keys(storedConfigs).length > 0) {
        for (const [id, cfg] of Object.entries(storedConfigs)) {
          this.configs.set(id, cfg);
        }
      } else {
        // Initialize default providers
        for (const profile of defaultProfiles) {
          const config: ProviderConfig = {
            profile,
            apiKeys: [],
            enabled: true,
            selectedDefaultModel: profile.models[0]?.id || '',
            routingPriority: 10,
            isSystemDefault: true,
          };
          this.configs.set(profile.id, config);
        }
        await this.persist();
      }

      this.initialized = true;
      console.log(`[ProviderRegistry] Initialized with ${this.configs.size} providers.`);
    } catch (err) {
      console.error('[ProviderRegistry] Initialization error:', err);
    }
  }

  private async persist(): Promise<void> {
    try {
      const persistence = await PersistenceFactory.getInitializedEngine();
      const obj: Record<string, ProviderConfig> = {};
      for (const [id, cfg] of this.configs.entries()) {
        obj[id] = cfg;
      }
      await persistence.set('provider_configs', obj);
    } catch (err) {
      console.error('[ProviderRegistry] Persist error:', err);
    }
  }

  public async getAllProviders(): Promise<ProviderConfig[]> {
    await this.init();
    return Array.from(this.configs.values());
  }

  public async getProvidersByCategory(category: ProviderCategory): Promise<ProviderConfig[]> {
    await this.init();
    return Array.from(this.configs.values()).filter((c) => c.profile.category === category);
  }

  public async getProvider(providerId: string): Promise<ProviderConfig | null> {
    await this.init();
    return this.configs.get(providerId) || null;
  }

  public async registerProvider(profile: ProviderProfile, initialKeys: ManagedApiKey[] = []): Promise<ProviderConfig> {
    await this.init();

    const config: ProviderConfig = {
      profile,
      apiKeys: initialKeys,
      enabled: true,
      selectedDefaultModel: profile.models[0]?.id || '',
      routingPriority: profile.category === 'official' ? 10 : profile.category === 'community' ? 20 : 30,
      isSystemDefault: false,
    };

    this.configs.set(profile.id, config);
    await this.persist();

    // Publish event
    eventBus.publishSync('provider:added', {
      providerId: profile.id,
      name: profile.name,
      category: profile.category,
      timestamp: Date.now(),
    });

    return config;
  }

  public async updateProvider(providerId: string, updates: Partial<ProviderProfile>): Promise<ProviderConfig | null> {
    await this.init();
    const config = this.configs.get(providerId);
    if (!config) return null;

    config.profile = {
      ...config.profile,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.persist();

    eventBus.publishSync('provider:updated', {
      providerId,
      name: config.profile.name,
      category: config.profile.category,
      timestamp: Date.now(),
    });

    return config;
  }

  public async removeProvider(providerId: string): Promise<boolean> {
    await this.init();
    const config = this.configs.get(providerId);
    if (!config) return false;

    // Do not allow deleting system default providers, but allow disabling them
    if (config.isSystemDefault) {
      console.warn(`[ProviderRegistry] Cannot remove system default provider ${providerId}. Disabling instead.`);
      return this.setProviderEnabled(providerId, false);
    }

    this.configs.delete(providerId);
    await this.persist();

    eventBus.publishSync('provider:removed', {
      providerId,
      name: config.profile.name,
      category: config.profile.category,
      timestamp: Date.now(),
    });

    return true;
  }

  public async setProviderEnabled(providerId: string, enabled: boolean): Promise<boolean> {
    await this.init();
    const config = this.configs.get(providerId);
    if (!config) return false;

    config.enabled = enabled;
    await this.persist();

    const eventName = enabled ? 'provider:enabled' : 'provider:disabled';
    eventBus.publishSync(eventName, {
      providerId,
      name: config.profile.name,
      category: config.profile.category,
      timestamp: Date.now(),
    });

    return true;
  }

  // --- API Key Management ---

  public async addApiKey(providerId: string, name: string, plainTextKey: string, priority: number = 1): Promise<ManagedApiKey | null> {
    await this.init();
    const config = this.configs.get(providerId);
    if (!config) return null;

    const encryptedKey = CryptoService.encrypt(plainTextKey);
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newKey: ManagedApiKey = {
      id: keyId,
      name: name || `API Key ${config.apiKeys.length + 1}`,
      encryptedKey,
      enabled: true,
      priority,
      usageCount: 0,
      status: 'active',
    };

    config.apiKeys.push(newKey);
    await this.persist();

    eventBus.publishSync('apikey:added', {
      providerId,
      keyId,
      keyName: newKey.name,
      timestamp: Date.now(),
    });

    return newKey;
  }

  public async removeApiKey(providerId: string, keyId: string): Promise<boolean> {
    await this.init();
    const config = this.configs.get(providerId);
    if (!config) return false;

    const keyIndex = config.apiKeys.findIndex((k) => k.id === keyId);
    if (keyIndex === -1) return false;

    const removedKey = config.apiKeys[keyIndex];
    config.apiKeys.splice(keyIndex, 1);
    await this.persist();

    eventBus.publishSync('apikey:removed', {
      providerId,
      keyId,
      keyName: removedKey.name,
      timestamp: Date.now(),
    });

    return true;
  }

  public async getActiveKeyForProvider(providerId: string): Promise<{ keyId: string; plainTextKey: string } | null> {
    await this.init();
    const config = this.configs.get(providerId);
    if (!config || !config.enabled || config.apiKeys.length === 0) return null;

    // Filter enabled keys and sort by priority (lowest number = highest priority)
    const validKeys = config.apiKeys
      .filter((k) => k.enabled && k.status === 'active')
      .sort((a, b) => a.priority - b.priority);

    if (validKeys.length === 0) return null;

    const keyToUse = validKeys[0];
    const plainTextKey = CryptoService.decrypt(keyToUse.encryptedKey);

    keyToUse.usageCount += 1;
    keyToUse.lastUsed = Date.now();
    await this.persist();

    return {
      keyId: keyToUse.id,
      plainTextKey,
    };
  }
}

export const providerRegistry = new ProviderRegistryService();
export default providerRegistry;

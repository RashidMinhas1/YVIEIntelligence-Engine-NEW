import { FileStorageAdapter } from "./storage/file-adapter";
import { AIStorageAdapter } from "./storage/types";
import { encrypt, decrypt, isMaskedKey, maskApiKey } from "../encryption";

export type CustomProviderConfig = {
  providerType: "openai" | "gemini" | "openrouter" | "openai-compatible" | "ollama" | "lmstudio" | "vllm" | "custom";
  displayName?: string;
  description?: string;
  isEnabled?: boolean;
  priority?: number;
  
  // Auth & Connection
  baseUrl?: string;
  apiKey?: string; // Legacy
  apiKeys?: string[]; // New
  organizationId?: string;
  projectId?: string;
  region?: string;
  authMethod?: "bearer" | "api-key-header" | "basic" | "custom" | "none";
  headers?: Record<string, string>;

  // Endpoints
  healthEndpoint?: string;
  modelsEndpoint?: string;

  // Defaults & Limits
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryCount?: number;
  rateLimit?: number;
  loadBalancingStrategy?: "round_robin" | "least_latency" | "least_errors" | "weighted";
  
  // Capabilities
  streamingSupported?: boolean;
  visionSupported?: boolean;
  embeddingSupported?: boolean;
  imageSupported?: boolean;
  audioSupported?: boolean;
  functionCalling?: boolean;
  jsonMode?: boolean;
  reasoningModels?: boolean;

  notes?: string;
};

export type FeatureModelOverride = {
  profileId?: string;
  provider?: string;
  model?: string;
  apiKeys?: string[];
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryCount?: number;
  streaming?: boolean;
  jsonMode?: boolean;
  visionMode?: boolean;
  loadBalancingStrategy?: "round_robin" | "least_latency" | "least_errors" | "weighted";
  isLocalOverrideEnabled?: boolean;
};

export type AISettings = {
  activeProvider?: string;
  activeProfileId?: string;
  activeProjectId?: string;
  providers?: Record<string, CustomProviderConfig>;
  profiles?: Record<string, any>; // Using any to prevent circular deps with profiles.ts for now
  projects?: Record<string, any>;
  history?: any[];
  features?: Record<string, FeatureModelOverride>;
  models?: Record<string, any>; // Model metadata
};

const storageAdapter: AIStorageAdapter = new FileStorageAdapter();

function migrateSettings(rawSettings: any): AISettings {
  const settings: AISettings = JSON.parse(JSON.stringify(rawSettings));
  
  if (!settings.providers) settings.providers = {};

  // Auto-migrate old hardcoded providers if they exist in legacy shape but not generic shape
  const legacyKeys = ["openai", "gemini", "openrouter"] as const;
  for (const key of legacyKeys) {
    if ((settings as any)[key] && !settings.providers[key]) {
       settings.providers[key] = { ...(settings as any)[key], providerType: key, isEnabled: true, displayName: key.charAt(0).toUpperCase() + key.slice(1) };
       delete (settings as any)[key];
    }
  }

  // Ensure default props
  for (const [key, config] of Object.entries(settings.providers)) {
    if (!config.providerType) config.providerType = key as any;
    if (config.providerType === "openrouter") {
      // Fix OpenRouter default headers/auth method
      if (!config.authMethod) config.authMethod = "bearer";
      if (!config.baseUrl) config.baseUrl = "https://openrouter.ai/api/v1";
      if (!config.headers) config.headers = { "HTTP-Referer": "https://viralclip.local", "X-Title": "Viral Clip" };
    }
  }

  return settings;
}

export function getAISettings(): AISettings {
  const rawSettings = storageAdapter.getSettings();
  const settings = migrateSettings(rawSettings);
  
  if (settings.providers) {
    for (const key of Object.keys(settings.providers)) {
      const config = settings.providers[key];
      if (!config) continue;
      
      if (config.apiKey && (!config.apiKeys || config.apiKeys.length === 0)) {
        config.apiKeys = [config.apiKey];
      }
      
      if (config.apiKeys) {
        config.apiKeys = config.apiKeys.map(k => decrypt(k)).filter(Boolean);
        if (config.apiKeys.length > 0) config.apiKey = config.apiKeys[0];
      } else {
        config.apiKeys = [];
      }
    }
  }
  
  if (settings.features) {
    for (const key of Object.keys(settings.features)) {
      const feature = settings.features[key];
      if (feature && feature.apiKeys) {
        feature.apiKeys = feature.apiKeys.map(k => decrypt(k)).filter(Boolean);
      }
    }
  }
  
  return settings;
}

export function saveAISettings(newSettings: AISettings) {
  const currentSettings = storageAdapter.getSettings();
  const nextProviders: Record<string, CustomProviderConfig> = { ...(currentSettings.providers as any) };
  
  if (newSettings.providers) {
    // Delete any providers that were removed
    for (const key of Object.keys(nextProviders)) {
      if (!newSettings.providers[key]) {
        delete nextProviders[key];
      }
    }

    for (const key of Object.keys(newSettings.providers)) {
      const newConfig = newSettings.providers[key];
      const currentConfig = nextProviders[key];
      
      if (newConfig) {
        let finalApiKeys = currentConfig?.apiKeys || [];
        if (!finalApiKeys.length && currentConfig?.apiKey) {
          finalApiKeys = [currentConfig.apiKey];
        }
        
        if (newConfig.apiKeys !== undefined) {
          finalApiKeys = newConfig.apiKeys.map((k, i) => {
            if (!k) return "";
            if (isMaskedKey(k)) {
              const match = finalApiKeys.find(oldKey => {
                if (!oldKey) return false;
                try { return maskApiKey(decrypt(oldKey)) === k; } catch { return false; }
              });
              return match || finalApiKeys[i] || "";
            }
            return encrypt(k);
          }).filter(k => k !== "");
        } else if (newConfig.apiKey !== undefined) {
          let finalApiKey = currentConfig?.apiKey;
          if (newConfig.apiKey && !isMaskedKey(newConfig.apiKey)) {
            finalApiKey = encrypt(newConfig.apiKey);
          } else if (newConfig.apiKey === "") {
            finalApiKey = "";
          }
          finalApiKeys = finalApiKey ? [finalApiKey] : [];
        }
        
        nextProviders[key] = {
          ...currentConfig,
          ...newConfig,
          apiKey: finalApiKeys[0] || "",
          apiKeys: finalApiKeys
        };
      }
    }
  }
  
  const nextSettings: AISettings = {
    ...currentSettings,
    ...newSettings,
    providers: nextProviders
  };

  storageAdapter.saveSettings(nextSettings);
}

export function getSafeAISettings(): AISettings {
  const settings = getAISettings(); 
  
  if (settings.providers) {
    for (const key of Object.keys(settings.providers)) {
      const config = settings.providers[key];
      if (!config) continue;
      
      if (config.apiKeys) {
        config.apiKeys = config.apiKeys.map(k => maskApiKey(k));
        if (config.apiKeys.length > 0) config.apiKey = config.apiKeys[0];
      }
    }
  }

  if (settings.features) {
    for (const key of Object.keys(settings.features)) {
      const feature = settings.features[key];
      if (feature && feature.apiKeys) {
        feature.apiKeys = feature.apiKeys.map(k => maskApiKey(k));
      }
    }
  }
  
  return settings;
}

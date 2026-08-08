/**
 * Provider Types & Profiles Schema
 * Comprehensive type definitions for Universal AI Provider Ecosystem V2.
 */

import { ProviderCategory } from '../events/eventTypes';
import type { EncryptedData } from '../crypto/cryptoService';

export type { ProviderCategory };

export interface ManagedApiKey {
  id: string;
  name: string;
  encryptedKey: EncryptedData;
  enabled: boolean;
  priority: number; // 1 = highest priority
  usageCount: number;
  lastUsed?: number;
  lastError?: string;
  status: 'active' | 'rate_limited' | 'quota_exceeded' | 'invalid' | 'disabled';
}

export interface ProviderCapabilities {
  chat: boolean;
  vision: boolean;
  toolCalling: boolean;
  functionCalling: boolean;
  jsonMode: boolean;
  streaming: boolean;
  reasoning: boolean;
  embeddings: boolean;
  imageGeneration: boolean;
  audio: boolean;
  maxContextTokens?: number;
  maxOutputTokens?: number;
}

export interface ModelPricing {
  inputPer1kTokens?: number;
  outputPer1kTokens?: number;
  isFree?: boolean;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description?: string;
  capabilities: ProviderCapabilities;
  contextWindow?: number;
  pricing?: ModelPricing;
  isDefault?: boolean;
}

export interface ProviderProfile {
  id: string;
  name: string;
  category: ProviderCategory;
  description: string;
  website: string;
  documentation: string;
  apiBaseUrl: string;
  authType: 'bearer' | 'api-key-header' | 'custom-header' | 'oauth2' | 'none';
  customHeaderName?: string;
  supportedEndpoints: string[];
  capabilities: ProviderCapabilities;
  models: ModelDefinition[];
  rateLimits?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
  pricingNote?: string;
  status: 'active' | 'beta' | 'deprecated' | 'offline';
  version: string;
  author: string;
  isCustom?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProviderConfig {
  profile: ProviderProfile;
  apiKeys: ManagedApiKey[];
  enabled: boolean;
  selectedDefaultModel: string;
  routingPriority: number;
  customHeaders?: Record<string, string>;
  isSystemDefault?: boolean;
}

export interface ProviderAdapter {
  id: string;
  profile: ProviderProfile;
  config: ProviderConfig;
  init(): Promise<void>;
  discoverModels(): Promise<ModelDefinition[]>;
  checkHealth(): Promise<{ status: 'online' | 'offline' | 'degraded'; latencyMs: number; message?: string }>;
  executeRequest(params: {
    model: string;
    prompt: string;
    systemPrompt?: string;
    messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: any }>;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    stream?: boolean;
    jsonMode?: boolean;
    tools?: any[];
  }): Promise<{
    text: string;
    modelUsed: string;
    keyUsedId: string;
    tokensUsed: { prompt: number; completion: number; total: number };
    rawResponse?: any;
  }>;
}

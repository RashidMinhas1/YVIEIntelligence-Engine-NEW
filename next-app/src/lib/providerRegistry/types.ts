export interface ProviderEndpointMap {
  models: string; // e.g. "/v1/models"
  chat: string;   // e.g. "/v1/chat/completions"
  embeddings?: string;
  images?: string;
}

export type AuthMethod = 'apiKey' | 'oauth' | 'none';

export interface ProviderMeta {
  id: string; // unique identifier
  name: string;
  category: 'official' | 'community' | 'local';
  baseUrl: string; // base URL for the provider
  authMethod: AuthMethod;
  endpoints: ProviderEndpointMap;
  streaming?: boolean;
  pricing?: 'free' | 'paid' | 'mixed';
  rateLimits?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
  healthStatus?: 'online' | 'offline' | 'rateLimited' | 'authFailed' | 'quotaExceeded';
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
}

export type TemplateCategory = 'official' | 'community' | 'local' | 'custom' | 'generic' | 'website';
export type AuthType = 'bearer' | 'api-key-header' | 'custom-header' | 'oauth2' | 'cookie' | 'session' | 'basic' | 'none';

export interface ProviderTemplate {
  templateId: string;
  name: string;
  category: TemplateCategory;
  description: string;
  
  // Connection
  apiBaseUrl: string;
  websiteUrl?: string;
  docsUrl: string;
  
  // Auth
  authType: AuthType;
  customHeaderName?: string;
  requiresApiKey: boolean;
  
  // Endpoints (Optional Overrides)
  chatEndpoint?: string;
  modelsEndpoint?: string;
  embeddingsEndpoint?: string;
  imageEndpoint?: string;
  audioEndpoint?: string;
  healthEndpoint?: string;
  
  // Models
  defaultModels: string[];
  
  // Features (if known statically)
  capabilities?: {
    chat?: boolean;
    vision?: boolean;
    toolCalling?: boolean;
    jsonMode?: boolean;
    reasoning?: boolean;
    streaming?: boolean;
    embeddings?: boolean;
    imageGeneration?: boolean;
    audio?: boolean;
    maxContextTokens?: number;
    maxOutputTokens?: number;
  };

  // Additional REST/Custom config
  customHeaders?: Record<string, string>;
  timeoutMs?: number;
}

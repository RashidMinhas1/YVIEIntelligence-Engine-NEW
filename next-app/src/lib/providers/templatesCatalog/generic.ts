import { ProviderTemplate } from './types';

export const genericTemplates: ProviderTemplate[] = [
  {
    templateId: 'generic_openai_compatible',
    name: 'OpenAI Compatible Provider',
    category: 'generic',
    description: 'Connect any server implementing the OpenAI-compatible standard',
    apiBaseUrl: 'https://api.custom-ai.com/v1',
    websiteUrl: '',
    docsUrl: '',
    authType: 'bearer',
    requiresApiKey: true,
    defaultModels: ['custom-model'],
    capabilities: { chat: true, vision: true, toolCalling: true, jsonMode: true, streaming: true, embeddings: true }
  },
  {
    templateId: 'generic_rest_api',
    name: 'Generic REST Provider',
    category: 'generic',
    description: 'Connect custom REST APIs that are not OpenAI compatible',
    apiBaseUrl: 'https://api.custom.com/rest',
    websiteUrl: '',
    docsUrl: '',
    authType: 'custom-header',
    customHeaderName: 'Authorization',
    requiresApiKey: true,
    defaultModels: ['default-model'],
    capabilities: { chat: true }
  },
  {
    templateId: 'website_api',
    name: 'Website AI API',
    category: 'website',
    description: 'Connect to private APIs exposed by websites using cookies, session tokens, or custom headers',
    apiBaseUrl: 'https://www.example.com/api',
    websiteUrl: 'https://www.example.com',
    docsUrl: '',
    authType: 'cookie',
    requiresApiKey: true,
    defaultModels: ['web-model'],
    customHeaders: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Origin': 'https://www.example.com',
      'Referer': 'https://www.example.com/'
    }
  }
];

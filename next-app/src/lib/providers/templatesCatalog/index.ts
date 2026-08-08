import { ProviderTemplate } from './types';
import { officialTemplates } from './official';
import { communityTemplates } from './community';
import { localTemplates } from './local';
import { genericTemplates } from './generic';
import { ProviderProfile } from '../types';

export const ALL_TEMPLATES: ProviderTemplate[] = [
  ...officialTemplates,
  ...communityTemplates,
  ...localTemplates,
  ...genericTemplates
];

export function createProfileFromTemplate(template: ProviderTemplate, customName?: string, customBaseUrl?: string, customApiKey?: string): ProviderProfile {
  const now = Date.now();
  const id = `${template.templateId}_${now.toString(36)}`;

  return {
    id,
    name: customName || template.name,
    category: template.category as any, // Mapped to provider profile category later if needed, though they mostly match
    description: template.description,
    website: template.websiteUrl || '',
    documentation: template.docsUrl || '',
    apiBaseUrl: customBaseUrl || template.apiBaseUrl,
    authType: template.authType as any,
    customHeaderName: template.customHeaderName,
    supportedEndpoints: [
      template.chatEndpoint || '/chat/completions'
    ],
    capabilities: {
      chat: template.capabilities?.chat ?? true,
      vision: template.capabilities?.vision ?? false,
      toolCalling: template.capabilities?.toolCalling ?? false,
      functionCalling: template.capabilities?.toolCalling ?? false,
      jsonMode: template.capabilities?.jsonMode ?? false,
      streaming: template.capabilities?.streaming ?? true,
      reasoning: template.capabilities?.reasoning ?? false,
      embeddings: template.capabilities?.embeddings ?? false,
      imageGeneration: template.capabilities?.imageGeneration ?? false,
      audio: template.capabilities?.audio ?? false,
      maxContextTokens: template.capabilities?.maxContextTokens ?? 128000,
      maxOutputTokens: template.capabilities?.maxOutputTokens ?? 4096,
    },
    models: template.defaultModels.map((m, idx) => ({
      id: m,
      name: m,
      capabilities: { 
        chat: true, vision: template.capabilities?.vision ?? false, toolCalling: template.capabilities?.toolCalling ?? false, 
        jsonMode: template.capabilities?.jsonMode ?? false, streaming: template.capabilities?.streaming ?? true, 
        functionCalling: template.capabilities?.toolCalling ?? false, reasoning: template.capabilities?.reasoning ?? false, 
        embeddings: template.capabilities?.embeddings ?? false, imageGeneration: template.capabilities?.imageGeneration ?? false, 
        audio: template.capabilities?.audio ?? false 
      },
      isDefault: idx === 0,
    })),
    status: 'active',
    version: '1.0.0',
    author: 'Template Wizard',
    isCustom: template.category === 'custom' || template.category === 'generic' || template.category === 'website',
    createdAt: now,
    updatedAt: now,
  };
}

export * from './types';
export * from './official';
export * from './community';
export * from './local';
export * from './generic';

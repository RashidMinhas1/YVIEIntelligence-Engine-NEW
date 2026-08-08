/**
 * Provider Import Engine
 * Imports provider configurations from Local JSON, Remote URLs, GitHub Repos, or Manual Input.
 */

import { eventBus } from '../events/eventBus';
import { providerRegistry } from './registry';
import { ProviderProfile, ProviderCategory } from './types';

export interface ImportSource {
  type: 'local_json' | 'remote_url' | 'github_repo' | 'manual';
  data: string | Record<string, any>;
}

export class ImportEngineService {
  /**
   * Validate raw provider profile object to ensure it meets enterprise schema rules.
   */
  public validateProfile(raw: any): { valid: boolean; errors: string[]; profile?: ProviderProfile } {
    const errors: string[] = [];

    if (!raw.id || typeof raw.id !== 'string') errors.push('Missing or invalid provider id');
    if (!raw.name || typeof raw.name !== 'string') errors.push('Missing or invalid provider name');
    if (!raw.apiBaseUrl || typeof raw.apiBaseUrl !== 'string') errors.push('Missing or invalid apiBaseUrl');

    const validCategories: ProviderCategory[] = ['official', 'community', 'local', 'custom'];
    const category: ProviderCategory = validCategories.includes(raw.category) ? raw.category : 'community';

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const now = Date.now();
    const profile: ProviderProfile = {
      id: raw.id.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      name: raw.name,
      category,
      description: raw.description || `Imported ${category} AI provider`,
      website: raw.website || '',
      documentation: raw.documentation || '',
      apiBaseUrl: raw.apiBaseUrl,
      authType: raw.authType || 'bearer',
      customHeaderName: raw.customHeaderName,
      supportedEndpoints: Array.isArray(raw.supportedEndpoints) ? raw.supportedEndpoints : ['/chat/completions'],
      capabilities: {
        chat: raw.capabilities?.chat ?? true,
        vision: raw.capabilities?.vision ?? false,
        toolCalling: raw.capabilities?.toolCalling ?? true,
        functionCalling: raw.capabilities?.functionCalling ?? true,
        jsonMode: raw.capabilities?.jsonMode ?? true,
        streaming: raw.capabilities?.streaming ?? true,
        reasoning: raw.capabilities?.reasoning ?? false,
        embeddings: raw.capabilities?.embeddings ?? false,
        imageGeneration: raw.capabilities?.imageGeneration ?? false,
        audio: raw.capabilities?.audio ?? false,
        maxContextTokens: raw.capabilities?.maxContextTokens || 128000,
        maxOutputTokens: raw.capabilities?.maxOutputTokens || 4096,
      },
      models: Array.isArray(raw.models) ? raw.models : [
        {
          id: raw.defaultModel || 'default-model',
          name: raw.defaultModelName || raw.defaultModel || 'Default Model',
          capabilities: { chat: true, vision: false, toolCalling: true, jsonMode: true, streaming: true, functionCalling: true, reasoning: false, embeddings: false, imageGeneration: false, audio: false },
          isDefault: true,
        }
      ],
      status: 'active',
      version: raw.version || '1.0.0',
      author: raw.author || 'Community Import',
      isCustom: category === 'custom',
      createdAt: now,
      updatedAt: now,
    };

    return { valid: true, errors: [], profile };
  }

  /**
   * Import a provider from any supported source.
   */
  public async importProvider(source: ImportSource): Promise<{ success: boolean; providerId?: string; error?: string }> {
    try {
      let rawData: any;

      if (source.type === 'manual' || source.type === 'local_json') {
        rawData = typeof source.data === 'string' ? JSON.parse(source.data) : source.data;
      } else if (source.type === 'remote_url' || source.type === 'github_repo') {
        const url = typeof source.data === 'string' ? source.data : '';
        if (!url) return { success: false, error: 'Remote URL cannot be empty' };

        const res = await fetch(url);
        if (!res.ok) return { success: false, error: `Failed to fetch remote provider spec from ${url}` };
        rawData = await res.json();
      }

      const { valid, errors, profile } = this.validateProfile(rawData);
      if (!valid || !profile) {
        return { success: false, error: `Validation failed: ${errors.join(', ')}` };
      }

      await providerRegistry.registerProvider(profile);

      eventBus.publishSync('marketplace:installed', {
        packageId: profile.id,
        name: profile.name,
        version: profile.version,
        timestamp: Date.now(),
        action: 'install',
      });

      return { success: true, providerId: profile.id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Import execution failed' };
    }
  }
}

export const importEngine = new ImportEngineService();
export default importEngine;

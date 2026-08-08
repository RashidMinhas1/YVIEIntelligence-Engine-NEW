import { PROVIDER_TEMPLATES } from './templates';
import { ProviderTemplate } from './templatesCatalog/types';

export function detectProviderFromUrl(url: string): ProviderTemplate | null {
  if (!url) return null;

  const normalizedUrl = url.toLowerCase().trim();

  // Find exact or partial match in apiBaseUrl across all templates
  for (const template of PROVIDER_TEMPLATES) {
    if (template.apiBaseUrl && template.apiBaseUrl !== 'https://api.custom-ai.com/v1') {
      const baseUrlHost = new URL(template.apiBaseUrl.replace('{resource}', 'test').replace('{account_id}', 'test').replace('{model_id}', 'test')).hostname.toLowerCase();
      
      try {
        const inputHost = new URL(normalizedUrl).hostname.toLowerCase();
        
        // Match by hostname
        if (inputHost.includes(baseUrlHost) || baseUrlHost.includes(inputHost)) {
          return template;
        }
      } catch (e) {
        // Not a valid URL, try simple string match
        if (normalizedUrl.includes(baseUrlHost)) {
          return template;
        }
      }
    }
  }

  // Fallback heuristic detection for local vs generic
  if (normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1')) {
    if (normalizedUrl.includes('11434')) return PROVIDER_TEMPLATES.find(t => t.templateId === 'ollama') || null;
    if (normalizedUrl.includes('1234')) return PROVIDER_TEMPLATES.find(t => t.templateId === 'lm_studio') || null;
    if (normalizedUrl.includes('8000')) return PROVIDER_TEMPLATES.find(t => t.templateId === 'vllm_local') || null;
    if (normalizedUrl.includes('8080')) return PROVIDER_TEMPLATES.find(t => t.templateId === 'localai') || null;
  }

  // Fallback to generic open-ai compatible if looks like a standard API
  if (normalizedUrl.includes('/v1') || normalizedUrl.includes('/openai')) {
    return PROVIDER_TEMPLATES.find(t => t.templateId === 'generic_openai_compatible') || null;
  }

  // Completely unknown
  return PROVIDER_TEMPLATES.find(t => t.templateId === 'generic_rest_api') || null;
}

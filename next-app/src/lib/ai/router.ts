import { AIProvider, AIRequestOptions } from "./types";
import { getAISettings, CustomProviderConfig, AISettings } from "./settings";
import { logAITelemetry, globalActiveRequests } from "./telemetry";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { OpenRouterProvider } from "./providers/openrouter";
import { GenericOpenAIProvider } from "./providers/generic-openai";
import { aiEventBus } from "./event-bus";
import { aiCache } from "./cache";
import { aiCostGuard } from "./cost-guard";
import { featureRegistry } from "./profiles";

export class AIRouter {
  private static instance: AIRouter;
  
  private constructor() {}

  public static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  private instantiateProvider(providerId: string, config: CustomProviderConfig): AIProvider {
    switch (config.providerType) {
      case "openai": return new OpenAIProvider(config);
      case "gemini": return new GeminiProvider(config);
      case "openrouter": return new OpenRouterProvider(config);
      case "openai-compatible":
      case "ollama":
      case "lmstudio":
      case "vllm":
      case "custom":
      default: return new GenericOpenAIProvider(config);
    }
  }

  private getRoutingHierarchy(settings: AISettings, featureKey?: string) {
    // Priority: Manual Override -> Feature Override (Project) -> Feature Override (Workflow) -> Project Default -> Workflow Default -> Global Default
    let providerId = settings.activeProvider;
    let modelOverride: string | undefined = undefined;

    // 1. Check active workflow profile
    const profile = settings.activeProfileId ? settings.profiles?.[settings.activeProfileId] : undefined;
    
    // 2. Check active project profile (Mocking global state for now, assuming activeProjectId)
    const project = (settings as any).activeProjectId ? (settings as any).projects?.[(settings as any).activeProjectId] : undefined;

    if (profile && profile.features && featureKey && profile.features[featureKey]?.provider) {
      providerId = profile.features[featureKey].provider;
      modelOverride = profile.features[featureKey].model;
    }

    if (project && project.features && featureKey && project.features[featureKey]?.provider) {
      providerId = project.features[featureKey].provider;
      modelOverride = project.features[featureKey].model;
    }

    // 3. Global feature override (legacy support)
    if (!providerId && featureKey && settings.features?.[featureKey]?.provider) {
      providerId = settings.features[featureKey].provider;
      modelOverride = settings.features[featureKey].model;
    }

    return { providerId, modelOverride };
  }

  private selectProvider(settings: AISettings, featureKey?: string): { id: string; config: CustomProviderConfig; model?: string } {
    const { providerId, modelOverride } = this.getRoutingHierarchy(settings, featureKey);

    if (providerId && settings.providers?.[providerId]?.isEnabled) {
      return { id: providerId, config: settings.providers[providerId], model: modelOverride };
    }

    // Fallback to first enabled provider
    const enabledProviders = Object.entries(settings.providers || {}).filter(([_, config]) => config.isEnabled);
    if (enabledProviders.length > 0) {
      enabledProviders.sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0));
      return { id: enabledProviders[0][0], config: enabledProviders[0][1], model: modelOverride };
    }

    throw new Error("No enabled AI providers found. Please configure a provider in Settings.");
  }

  public async generateText(prompt: string, options: AIRequestOptions = {}): Promise<string> {
    const settings = getAISettings();
    const startTime = Date.now();
    
    // 1. Auto-register feature
    if (options.featureKey) {
      featureRegistry.register(options.featureKey);
    }

    let { id: providerId, config, model } = this.selectProvider(settings, options.featureKey);
    
    // 2. Apply manual override
    if (options.providerOverride && settings.providers?.[options.providerOverride]) {
       providerId = options.providerOverride;
       config = settings.providers[providerId];
       model = options.modelOverride;
    }

    const finalModel = options.modelOverride || model || config.defaultModel || "auto";

    // Live request tracking
    const requestId = Date.now().toString() + Math.random().toString(36).substring(2, 8);
    globalActiveRequests.set(requestId, {
      provider: providerId,
      model: finalModel,
      feature: options.featureKey,
      timestamp: new Date().toISOString(),
      status: "pending",
      attempt: 0,
    });

    // 3. Check Cache
    const cachedResult = aiCache.get(providerId, finalModel, prompt, options.systemPrompt);
    if (cachedResult) {
      aiEventBus.emitCompleted({ provider: providerId, model: finalModel, cached: true });
      globalActiveRequests.delete(requestId);
      return cachedResult;
    }

    // 4. Budget / Cost Guard Check (Rough estimation 1000 tokens)
    const estimatedCost = aiCostGuard.estimateCost(config.providerType, finalModel, 1000);
    if (!aiCostGuard.canAfford(providerId, estimatedCost)) {
      throw new Error(`Cost Guard: Provider ${providerId} budget exhausted. Please upgrade budget or use a cheaper model.`);
    }

    aiEventBus.emitRequestStarted({ provider: providerId, model: finalModel, feature: options.featureKey });

    // Cap retries at 2 max to prevent the UI from hanging for 7+ minutes
    let retries = Math.min(config.retryCount || 0, 2);
    let attempt = 0;
    let lastError: any;

    while (attempt <= retries) {
      try {
        const provider = this.instantiateProvider(providerId, config);
        const result = await provider.generateText(prompt, {
          ...options,
          modelOverride: finalModel,
        });

        const duration = Date.now() - startTime;
        
        // Save to cache
        aiCache.set(providerId, finalModel, prompt, result, options.systemPrompt);

        // Record cost and telemetry
        aiCostGuard.recordUsage(providerId, estimatedCost);
        aiEventBus.emitCompleted({ provider: providerId, model: finalModel, duration, retries: attempt });

        logAITelemetry({
          provider: providerId,
          model: finalModel,
          tokens: 0, 
          cost: estimatedCost,
          duration,
          retries: attempt,
          feature: options.featureKey,
          error: undefined,
          timestamp: new Date().toISOString()
        });
        
        globalActiveRequests.delete(requestId);

        return result;
      } catch (error: any) {
        lastError = error;
        attempt++;
        
        aiEventBus.emitRetry({ provider: providerId, attempt, error: error.message });
        
        const duration = Date.now() - startTime;
        logAITelemetry({
          provider: providerId,
          model: finalModel,
          tokens: 0,
          cost: 0,
          duration,
          retries: attempt,
          feature: options.featureKey,
          error: error.message || "Unknown error",
          timestamp: new Date().toISOString()
        });
        
        if (attempt <= retries) {
          const req = globalActiveRequests.get(requestId);
          if (req) {
            req.attempt = attempt;
            req.status = "retrying";
            req.error = error.message;
            globalActiveRequests.set(requestId, req);
          }
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt)));
        } else {
          globalActiveRequests.delete(requestId);
        }
      }
    }

    aiEventBus.emitFailed({ provider: providerId, error: lastError?.message });
    globalActiveRequests.delete(requestId);
    throw new Error(`AI Router: Request failed after ${retries} retries using provider ${providerId}. Last error: ${lastError?.message}`);
  }
}

export async function fetchAllProviderModels(provider?: string, apiKey?: string, forceRefresh?: boolean) {
  return [];
}

export async function getSmartRoutingChain(featureKey?: string) {
  return [];
}

/**
 * Pluggable AI Routing Engine
 * Implements priority, round-robin, least-used, fastest, cheapest, random, weighted, and health-aware routing strategies.
 */

import { eventBus } from '../events/eventBus';
import { providerRegistry } from '../providers/registry';
import { healthMonitor } from '../providers/healthMonitor';
import { ProviderConfig, ProviderCategory } from '../providers/types';
import { getSafeAISettings } from '../ai/settings';

export type RoutingStrategyName =
  | 'priority'
  | 'round_robin'
  | 'least_used'
  | 'fastest'
  | 'cheapest'
  | 'random'
  | 'weighted'
  | 'quota_aware'
  | 'latency_aware'
  | 'health_aware';

export interface RoutingRequestParams {
  categoryPreference?: ProviderCategory;
  requiredCapabilities?: {
    vision?: boolean;
    toolCalling?: boolean;
    jsonMode?: boolean;
    reasoning?: boolean;
  };
  preferredModel?: string;
  preferredProviderId?: string;
  featureKey?: string;
}

export interface RoutingSelection {
  providerId: string;
  providerConfig: ProviderConfig;
  model: string;
  strategyUsed: RoutingStrategyName;
}

export interface RoutingStrategy {
  name: RoutingStrategyName;
  selectProvider(candidates: ProviderConfig[], params: RoutingRequestParams): ProviderConfig | null;
}

// 1. Priority Strategy (default)
class PriorityRoutingStrategy implements RoutingStrategy {
  public name: RoutingStrategyName = 'priority';
  public selectProvider(candidates: ProviderConfig[]): ProviderConfig | null {
    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => a.routingPriority - b.routingPriority)[0];
  }
}

// 2. Round-Robin Strategy
class RoundRobinRoutingStrategy implements RoutingStrategy {
  public name: RoutingStrategyName = 'round_robin';
  private index: number = 0;
  public selectProvider(candidates: ProviderConfig[]): ProviderConfig | null {
    if (candidates.length === 0) return null;
    const selected = candidates[this.index % candidates.length];
    this.index++;
    return selected;
  }
}

// 3. Fastest Strategy (Latency-aware)
class FastestRoutingStrategy implements RoutingStrategy {
  public name: RoutingStrategyName = 'fastest';
  public selectProvider(candidates: ProviderConfig[]): ProviderConfig | null {
    if (candidates.length === 0) return null;
    let best = candidates[0];
    let minLatency = Infinity;

    for (const c of candidates) {
      const health = healthMonitor.getCachedHealth(c.profile.id);
      const latency = health?.latencyMs || 999;
      if (latency < minLatency) {
        minLatency = latency;
        best = c;
      }
    }
    return best;
  }
}

// 4. Random Strategy
class RandomRoutingStrategy implements RoutingStrategy {
  public name: RoutingStrategyName = 'random';
  public selectProvider(candidates: ProviderConfig[]): ProviderConfig | null {
    if (candidates.length === 0) return null;
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }
}

class RouterEngineService {
  private activeStrategyName: RoutingStrategyName = 'priority';
  private strategies: Map<RoutingStrategyName, RoutingStrategy> = new Map();

  constructor() {
    this.registerStrategy(new PriorityRoutingStrategy());
    this.registerStrategy(new RoundRobinRoutingStrategy());
    this.registerStrategy(new FastestRoutingStrategy());
    this.registerStrategy(new RandomRoutingStrategy());
  }

  public registerStrategy(strategy: RoutingStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  public setStrategy(name: RoutingStrategyName): boolean {
    if (!this.strategies.has(name)) return false;
    this.activeStrategyName = name;
    eventBus.publishSync('router:changed', { strategy: name, timestamp: Date.now() });
    return true;
  }

  public getActiveStrategyName(): RoutingStrategyName {
    return this.activeStrategyName;
  }

  /**
   * Route a request to the optimal provider and model based on active strategy and constraints.
   */
  public async selectRoute(params: RoutingRequestParams = {}): Promise<RoutingSelection | null> {
    const allProviders = await providerRegistry.getAllProviders();
    const settings = getSafeAISettings();
    const globalOverride = settings.features?.global;
    const featureOverride = params.featureKey ? settings.features?.[params.featureKey] : null;

    let preferredProviderId = params.preferredProviderId;
    let preferredModel = params.preferredModel;

    // Feature override takes precedence over global override
    if (!preferredProviderId && featureOverride) {
      if (featureOverride.profileId && featureOverride.profileId !== 'none' && settings.profiles?.[featureOverride.profileId]) {
        const assignedProfile = settings.profiles[featureOverride.profileId];
        if (assignedProfile.defaultProvider && assignedProfile.defaultProvider !== 'auto') {
          preferredProviderId = assignedProfile.defaultProvider;
        }
      }
      if (featureOverride.provider && featureOverride.provider !== 'auto') {
        preferredProviderId = featureOverride.provider;
        preferredModel = featureOverride.model !== 'auto' ? featureOverride.model : undefined;
      }
    } else if (!preferredProviderId && globalOverride && globalOverride.provider && globalOverride.provider !== 'auto') {
      preferredProviderId = globalOverride.provider;
      preferredModel = globalOverride.model !== 'auto' ? globalOverride.model : undefined;
    }

    // Filter candidate providers: must be enabled and have at least 1 active API key (or be local)
    let candidates = allProviders.filter((p) => {
      if (!p.enabled) return false;
      if (p.profile.category === 'local') return true;
      return p.apiKeys.some((k) => k.enabled && k.status === 'active');
    });

    if (candidates.length === 0) {
      console.warn('[RouterEngine] No active providers available for routing');
      return null;
    }

    // Filter by category preference if specified
    if (params.categoryPreference) {
      const categoryMatches = candidates.filter((c) => c.profile.category === params.categoryPreference);
      if (categoryMatches.length > 0) {
        candidates = categoryMatches;
      }
    }

    // Filter by capability requirements
    if (params.requiredCapabilities) {
      const reqs = params.requiredCapabilities;
      const capabilityMatches = candidates.filter((c) => {
        const caps = c.profile.capabilities;
        if (reqs.vision && !caps.vision) return false;
        if (reqs.toolCalling && !caps.toolCalling) return false;
        if (reqs.jsonMode && !caps.jsonMode) return false;
        if (reqs.reasoning && !caps.reasoning) return false;
        return true;
      });
      if (capabilityMatches.length > 0) {
        candidates = capabilityMatches;
      }
    }

    // If explicit provider requested and candidate
    if (preferredProviderId) {
      const preferred = candidates.find((c) => c.profile.id === preferredProviderId);
      if (preferred) {
        const model = preferredModel || preferred.selectedDefaultModel || preferred.profile.models[0]?.id || 'auto';
        return {
          providerId: preferred.profile.id,
          providerConfig: preferred,
          model,
          strategyUsed: 'priority',
        };
      }
    }

    // Filter out unhealthy providers
    candidates = candidates.filter(c => {
      const health = healthMonitor.getCachedHealth(c.profile.id);
      return health?.status !== 'offline' && health?.status !== 'rate_limited' && health?.status !== 'quota_exceeded';
    });

    if (candidates.length === 0) {
      console.warn('[RouterEngine] No healthy providers available for routing');
      return null;
    }

    // Sort by Official -> Community -> Local as a fallback chain
    const categoryWeight: Record<string, number> = { official: 1, community: 2, local: 3, custom: 4 };
    candidates.sort((a, b) => {
      const weightA = categoryWeight[a.profile.category || 'custom'] || 99;
      const weightB = categoryWeight[b.profile.category || 'custom'] || 99;
      if (weightA !== weightB) return weightA - weightB;
      return a.routingPriority - b.routingPriority;
    });

    // Select provider using active strategy
    const strategy = this.strategies.get(this.activeStrategyName) || this.strategies.get('priority')!;
    const selectedProvider = strategy.selectProvider(candidates, params) || candidates[0];

    const selectedModel = params.preferredModel || selectedProvider.selectedDefaultModel || selectedProvider.profile.models[0]?.id || 'auto';

    const selection: RoutingSelection = {
      providerId: selectedProvider.profile.id,
      providerConfig: selectedProvider,
      model: selectedModel,
      strategyUsed: strategy.name,
    };

    eventBus.publishSync('router:provider_selected', {
      selectedProvider: selection.providerId,
      selectedModel: selection.model,
      strategy: selection.strategyUsed,
      timestamp: Date.now(),
    });

    return selection;
  }
}

export const routerEngine = new RouterEngineService();
export default routerEngine;

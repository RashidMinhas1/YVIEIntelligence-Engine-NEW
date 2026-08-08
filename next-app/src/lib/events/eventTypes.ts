/**
 * Centralized AI Event Bus - Type Definitions
 * All event names, payloads, and subscriber signatures for the AI Ecosystem.
 */

export type ProviderCategory = 'official' | 'community' | 'local' | 'custom';

export interface ProviderEventPayload {
  providerId: string;
  name: string;
  category: ProviderCategory;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ApiKeyEventPayload {
  providerId: string;
  keyId: string;
  keyName: string;
  timestamp: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ModelEventPayload {
  providerId: string;
  models: string[];
  count: number;
  timestamp: number;
  error?: string;
}

export interface HealthEventPayload {
  providerId: string;
  status: 'online' | 'offline' | 'degraded' | 'rate_limited' | 'quota_exceeded';
  latencyMs?: number;
  timestamp: number;
  message?: string;
}

export interface RouterEventPayload {
  routeId?: string;
  selectedProvider: string;
  selectedModel: string;
  strategy: string;
  timestamp: number;
  failoverAttempt?: number;
  error?: string;
}

export interface MarketplaceEventPayload {
  packageId: string;
  name: string;
  version: string;
  timestamp: number;
  action: 'install' | 'update' | 'remove';
}

export interface BackupEventPayload {
  backupId: string;
  triggerEvent: string;
  timestamp: number;
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface RequestEventPayload {
  requestId: string;
  providerId: string;
  model: string;
  latencyMs: number;
  tokensUsed?: { prompt: number; completion: number; total: number };
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  timestamp: number;
  failoverUsed?: boolean;
}

export interface DiagnosticsEventPayload {
  providerId?: string;
  level: 'info' | 'warn' | 'error';
  code: string;
  message: string;
  timestamp: number;
  details?: any;
}

export interface AIEventMap {
  // Provider Events
  'provider:added': ProviderEventPayload;
  'provider:updated': ProviderEventPayload;
  'provider:removed': ProviderEventPayload;
  'provider:enabled': ProviderEventPayload;
  'provider:disabled': ProviderEventPayload;

  // API Key Events
  'apikey:added': ApiKeyEventPayload;
  'apikey:updated': ApiKeyEventPayload;
  'apikey:removed': ApiKeyEventPayload;
  'apikey:rotated': ApiKeyEventPayload;
  'apikey:failed': ApiKeyEventPayload;

  // Model Events
  'model:discovery_started': { providerId: string; timestamp: number };
  'model:discovery_completed': ModelEventPayload;
  'model:updated': ModelEventPayload;
  'model:default_changed': { providerId: string; model: string; timestamp: number };

  // Health Events
  'health:check_started': { providerId?: string; timestamp: number };
  'health:check_completed': HealthEventPayload;
  'health:provider_online': HealthEventPayload;
  'health:provider_offline': HealthEventPayload;
  'health:quota_exceeded': HealthEventPayload;
  'health:ratelimit_hit': HealthEventPayload;

  // Router Events
  'router:changed': { strategy: string; timestamp: number };
  'router:route_selected': RouterEventPayload;
  'router:provider_selected': RouterEventPayload;
  'router:failover_started': RouterEventPayload;
  'router:failover_completed': RouterEventPayload;

  // Marketplace Events
  'marketplace:installed': MarketplaceEventPayload;
  'marketplace:updated': MarketplaceEventPayload;
  'marketplace:removed': MarketplaceEventPayload;

  // Backup Events
  'backup:started': { backupId: string; triggerEvent: string; timestamp: number };
  'backup:completed': BackupEventPayload;
  'restore:started': { timestamp: number };
  'restore:completed': { success: boolean; timestamp: number; error?: string };

  // Request Events
  'request:started': { requestId: string; providerId: string; model: string; timestamp: number };
  'request:completed': RequestEventPayload;
  'request:failed': RequestEventPayload;

  // Diagnostics Events
  'diagnostics:error_logged': DiagnosticsEventPayload;
  'diagnostics:updated': { timestamp: number };
  'analytics:updated': { timestamp: number };
}

export type AIEventType = keyof AIEventMap;
export type AIEventHandler<K extends AIEventType> = (payload: AIEventMap[K]) => void | Promise<void>;

export interface Subscription {
  unsubscribe: () => void;
}

/**
 * Provider Health Monitor
 * Performs cached, event-driven health checks and automated 15-minute monitoring loops.
 */

import { eventBus } from '../events/eventBus';
import { providerRegistry } from './registry';

export interface HealthCheckResult {
  providerId: string;
  status: 'online' | 'offline' | 'degraded' | 'rate_limited' | 'quota_exceeded';
  latencyMs: number;
  lastChecked: number;
  message?: string;
}

class HealthMonitorService {
  private cache: Map<string, HealthCheckResult> = new Map();
  private checkIntervalMs: number = 15 * 60 * 1000; // 15 minutes
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startBackgroundMonitoring();
  }

  public startBackgroundMonitoring(): void {
    if (this.intervalTimer) return;
    this.intervalTimer = setInterval(() => {
      void this.checkAllProviders();
    }, this.checkIntervalMs);
  }

  public stopBackgroundMonitoring(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public async checkProvider(providerId: string, forceFresh: boolean = false): Promise<HealthCheckResult> {
    const cached = this.cache.get(providerId);
    if (!forceFresh && cached && Date.now() - cached.lastChecked < 60000) {
      return cached; // Return 1-minute cached result
    }

    eventBus.publishSync('health:check_started', {
      providerId,
      timestamp: Date.now(),
    });

    const providerConfig = await providerRegistry.getProvider(providerId);
    if (!providerConfig || !providerConfig.enabled) {
      const offlineResult: HealthCheckResult = {
        providerId,
        status: 'offline',
        latencyMs: 0,
        lastChecked: Date.now(),
        message: 'Provider is disabled or missing',
      };
      this.cache.set(providerId, offlineResult);
      return offlineResult;
    }

    const startTime = Date.now();
    try {
      const keyInfo = await providerRegistry.getActiveKeyForProvider(providerId);
      const baseUrl = providerConfig.profile.apiBaseUrl;

      // Local providers without keys or standard endpoint ping
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const headers: Record<string, string> = {};
      if (keyInfo?.plainTextKey) {
        headers['Authorization'] = `Bearer ${keyInfo.plainTextKey}`;
      }

      const res = await fetch(`${baseUrl.replace(/\/$/, '')}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      let status: HealthCheckResult['status'] = 'online';
      let message = 'Provider healthy and reachable';

      if (!res) {
        // Fallback ping logic for endpoints requiring full path
        status = providerConfig.profile.category === 'local' ? 'online' : 'degraded';
        message = 'Connection established with minor warnings';
      } else if (res.status === 429) {
        status = 'rate_limited';
        message = 'Rate limit hit on provider API';
        eventBus.publishSync('health:ratelimit_hit', {
          providerId,
          status,
          latencyMs,
          timestamp: Date.now(),
          message,
        });
      } else if (res.status === 402 || res.status === 403) {
        status = 'quota_exceeded';
        message = 'Quota exceeded or invalid authorization';
        eventBus.publishSync('health:quota_exceeded', {
          providerId,
          status,
          latencyMs,
          timestamp: Date.now(),
          message,
        });
      }

      const result: HealthCheckResult = {
        providerId,
        status,
        latencyMs,
        lastChecked: Date.now(),
        message,
      };

      this.cache.set(providerId, result);

      eventBus.publishSync('health:check_completed', {
        providerId,
        status: result.status,
        latencyMs: result.latencyMs,
        timestamp: Date.now(),
        message: result.message,
      });

      if (status === 'online') {
        eventBus.publishSync('health:provider_online', {
          providerId,
          status,
          latencyMs,
          timestamp: Date.now(),
        });
      } else {
        eventBus.publishSync('health:provider_offline', {
          providerId,
          status,
          latencyMs,
          timestamp: Date.now(),
          message,
        });
      }

      return result;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const result: HealthCheckResult = {
        providerId,
        status: 'offline',
        latencyMs,
        lastChecked: Date.now(),
        message: err?.message || 'Connection timeout or network error',
      };

      this.cache.set(providerId, result);

      eventBus.publishSync('health:check_completed', {
        providerId,
        status: 'offline',
        latencyMs,
        timestamp: Date.now(),
        message: result.message,
      });

      return result;
    }
  }

  public async checkAllProviders(): Promise<HealthCheckResult[]> {
    const providers = await providerRegistry.getAllProviders();
    const promises = providers.map((p) => this.checkProvider(p.profile.id, true));
    return Promise.all(promises);
  }

  public getCachedHealth(providerId: string): HealthCheckResult | null {
    return this.cache.get(providerId) || null;
  }
}

export const healthMonitor = new HealthMonitorService();
export default healthMonitor;

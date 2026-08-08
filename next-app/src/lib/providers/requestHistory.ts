/**
 * Configurable AI Request History & Logging System
 * Supports modes: Disabled, Errors Only, Last 100, Last 500, Unlimited.
 * Supports auto-cleanup schedules: 7 Days, 30 Days, 90 Days, Never.
 * Automatically subscribes to Centralized AI Event Bus for decoupled logging.
 */

import { eventBus } from '../events/eventBus';
import { RequestEventPayload } from '../events/eventTypes';
import { PersistenceFactory } from './persistence/factory';

export type HistoryMode = 'disabled' | 'errors_only' | 'last_100' | 'last_500' | 'unlimited';
export type RetentionDays = 7 | 30 | 90 | 'never';

export interface HistoryConfig {
  mode: HistoryMode;
  retentionDays: RetentionDays;
}

export interface RequestLogEntry extends RequestEventPayload {
  id: string;
}

class RequestHistoryService {
  private config: HistoryConfig = {
    mode: 'last_100',
    retentionDays: 30,
  };
  private logs: RequestLogEntry[] = [];
  private initialized: boolean = false;

  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    eventBus.subscribe('request:completed', (payload) => this.handleRequestEvent(payload));
    eventBus.subscribe('request:failed', (payload) => this.handleRequestEvent(payload));
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const persistence = await PersistenceFactory.getInitializedEngine();
      const storedConfig = await persistence.get<HistoryConfig>('request_history_config');
      if (storedConfig) {
        this.config = storedConfig;
      }
      const storedLogs = await persistence.get<RequestLogEntry[]>('request_history_logs');
      if (storedLogs) {
        this.logs = storedLogs;
      }
      this.initialized = true;
      await this.runAutoCleanup();
    } catch (err) {
      console.error('[RequestHistory] Init error:', err);
    }
  }

  private async persist(): Promise<void> {
    try {
      const persistence = await PersistenceFactory.getInitializedEngine();
      await persistence.set('request_history_config', this.config);
      await persistence.set('request_history_logs', this.logs);
    } catch (err) {
      console.error('[RequestHistory] Persist error:', err);
    }
  }

  private async handleRequestEvent(payload: RequestEventPayload): Promise<void> {
    await this.init();

    if (this.config.mode === 'disabled') return;

    if (this.config.mode === 'errors_only' && payload.success) return;

    const entry: RequestLogEntry = {
      ...payload,
      id: payload.requestId || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    this.logs.unshift(entry);

    // Apply cap limits
    if (this.config.mode === 'last_100' && this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    } else if (this.config.mode === 'last_500' && this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }

    await this.persist();
    eventBus.publishSync('analytics:updated', { timestamp: Date.now() });
  }

  public async updateConfig(newConfig: Partial<HistoryConfig>): Promise<HistoryConfig> {
    await this.init();
    this.config = { ...this.config, ...newConfig };
    await this.persist();
    await this.runAutoCleanup();
    return this.config;
  }

  public async getConfig(): Promise<HistoryConfig> {
    await this.init();
    return this.config;
  }

  public async getLogs(providerId?: string): Promise<RequestLogEntry[]> {
    await this.init();
    if (providerId) {
      return this.logs.filter((l) => l.providerId === providerId);
    }
    return this.logs;
  }

  public async clearLogs(providerId?: string): Promise<void> {
    await this.init();
    if (providerId) {
      this.logs = this.logs.filter((l) => l.providerId !== providerId);
    } else {
      this.logs = [];
    }
    await this.persist();
  }

  public async runAutoCleanup(): Promise<number> {
    if (this.config.retentionDays === 'never') return 0;
    const days = typeof this.config.retentionDays === 'number' ? this.config.retentionDays : 30;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const initialLength = this.logs.length;
    this.logs = this.logs.filter((l) => l.timestamp >= cutoffTime);
    const removedCount = initialLength - this.logs.length;

    if (removedCount > 0) {
      await this.persist();
    }
    return removedCount;
  }
}

export const requestHistory = new RequestHistoryService();
export default requestHistory;

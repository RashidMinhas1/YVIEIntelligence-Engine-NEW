/**
 * Provider Diagnostics & Analytics Service
 * Real-time statistics, error logs, latency tracking, and token usage metrics.
 * Listens to Centralized AI Event Bus.
 */

import { eventBus } from '../events/eventBus';
import { DiagnosticsEventPayload, RequestEventPayload } from '../events/eventTypes';
import { healthMonitor } from './healthMonitor';
import { requestHistory } from './requestHistory';

export interface ProviderDiagnosticsData {
  providerId: string;
  status: string;
  latencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  failoverCount: number;
  recentErrors: DiagnosticsEventPayload[];
}

class DiagnosticsService {
  private errorLogs: DiagnosticsEventPayload[] = [];

  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    eventBus.subscribe('diagnostics:error_logged', (payload) => {
      this.errorLogs.unshift(payload);
      if (this.errorLogs.length > 200) {
        this.errorLogs = this.errorLogs.slice(0, 200);
      }
    });
  }

  public async getDiagnosticsForProvider(providerId: string): Promise<ProviderDiagnosticsData> {
    const health = healthMonitor.getCachedHealth(providerId);
    const logs = await requestHistory.getLogs(providerId);

    const totalRequests = logs.length;
    const successfulRequests = logs.filter((l) => l.success).length;
    const failedRequests = logs.filter((l) => !l.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let failoverCount = 0;

    for (const log of logs) {
      if (log.tokensUsed) {
        totalPromptTokens += log.tokensUsed.prompt || 0;
        totalCompletionTokens += log.tokensUsed.completion || 0;
      }
      if (log.failoverUsed) {
        failoverCount++;
      }
    }

    const providerErrors = this.errorLogs.filter((e) => e.providerId === providerId);

    return {
      providerId,
      status: health?.status || 'online',
      latencyMs: health?.latencyMs || 0,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: Math.round(successRate * 10) / 10,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      failoverCount,
      recentErrors: providerErrors,
    };
  }

  public logError(providerId: string, code: string, message: string, details?: any): void {
    eventBus.publishSync('diagnostics:error_logged', {
      providerId,
      level: 'error',
      code,
      message,
      timestamp: Date.now(),
      details,
    });
  }
}

export const diagnosticsService = new DiagnosticsService();
export default diagnosticsService;

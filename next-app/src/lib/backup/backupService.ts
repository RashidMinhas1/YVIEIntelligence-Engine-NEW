/**
 * Event-Driven Backup & Restore Service
 * Automatically creates backups on Provider, API Key, Router, or Marketplace mutations.
 * Subscribes to Centralized AI Event Bus.
 */

import { eventBus } from '../events/eventBus';
import { providerRegistry } from '../providers/registry';
import { requestHistory } from '../providers/requestHistory';
import { PersistenceFactory } from '../providers/persistence/factory';

export interface EcosystemBackupPayload {
  version: string;
  timestamp: number;
  providerConfigs: any[];
  historyConfig: any;
  historyLogs: any[];
}

class BackupService {
  private debouncedTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    const triggerEvents = [
      'provider:added',
      'provider:updated',
      'provider:removed',
      'apikey:added',
      'apikey:updated',
      'apikey:removed',
      'router:changed',
      'marketplace:installed',
      'marketplace:removed',
    ] as const;

    for (const eventName of triggerEvents) {
      eventBus.subscribe(eventName, (payload: any) => {
        this.scheduleEventBackup(eventName);
      });
    }
  }

  private scheduleEventBackup(triggerEvent: string): void {
    if (this.debouncedTimer) {
      clearTimeout(this.debouncedTimer);
    }
    // Debounce for 2 seconds to handle bulk updates
    this.debouncedTimer = setTimeout(() => {
      void this.createBackup(triggerEvent);
    }, 2000);
  }

  public async createBackup(triggerEvent: string = 'manual'): Promise<EcosystemBackupPayload> {
    const backupId = `backup_${Date.now()}`;
    eventBus.publishSync('backup:started', {
      backupId,
      triggerEvent,
      timestamp: Date.now(),
    });

    try {
      const providers = await providerRegistry.getAllProviders();
      const hConfig = await requestHistory.getConfig();
      const hLogs = await requestHistory.getLogs();

      const payload: EcosystemBackupPayload = {
        version: '2.0.0',
        timestamp: Date.now(),
        providerConfigs: providers,
        historyConfig: hConfig,
        historyLogs: hLogs,
      };

      // Store in persistence under backups
      const persistence = await PersistenceFactory.getInitializedEngine();
      await persistence.set('latest_ecosystem_backup', payload);

      eventBus.publishSync('backup:completed', {
        backupId,
        triggerEvent,
        timestamp: Date.now(),
        success: true,
      });

      return payload;
    } catch (err: any) {
      eventBus.publishSync('backup:completed', {
        backupId,
        triggerEvent,
        timestamp: Date.now(),
        success: false,
        error: err?.message || 'Backup creation failed',
      });
      throw err;
    }
  }

  public async restoreFromBackup(backupData: EcosystemBackupPayload): Promise<boolean> {
    eventBus.publishSync('restore:started', { timestamp: Date.now() });

    try {
      if (!backupData || !Array.isArray(backupData.providerConfigs)) {
        throw new Error('Invalid backup file structure.');
      }

      for (const providerCfg of backupData.providerConfigs) {
        if (providerCfg.profile) {
          await providerRegistry.registerProvider(providerCfg.profile, providerCfg.apiKeys || []);
        }
      }

      if (backupData.historyConfig) {
        await requestHistory.updateConfig(backupData.historyConfig);
      }

      eventBus.publishSync('restore:completed', {
        success: true,
        timestamp: Date.now(),
      });

      return true;
    } catch (err: any) {
      eventBus.publishSync('restore:completed', {
        success: false,
        timestamp: Date.now(),
        error: err?.message || 'Restore failed',
      });
      return false;
    }
  }
}

export const backupService = new BackupService();
export default backupService;

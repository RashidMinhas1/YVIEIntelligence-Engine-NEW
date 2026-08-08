/**
 * Persistence Layer Factory
 * Creates and returns the appropriate persistence engine based on environment.
 */

import { AbstractPersistenceEngine } from './interface';
import { JsonPersistenceEngine } from './json';
import { SqlitePersistenceEngine } from './sqlite';

let instance: AbstractPersistenceEngine | null = null;

export class PersistenceFactory {
  public static getEngine(): AbstractPersistenceEngine {
    if (!instance) {
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        instance = new SqlitePersistenceEngine();
      } else {
        instance = new JsonPersistenceEngine();
      }
    }
    return instance;
  }

  public static async getInitializedEngine(): Promise<AbstractPersistenceEngine> {
    const engine = this.getEngine();
    await engine.init();
    return engine;
  }
}

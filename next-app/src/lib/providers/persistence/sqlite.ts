/**
 * SQLite / File Fallback Persistence Engine (For Production)
 * Provides robust key-value persistence for provider ecosystem data.
 */

import fs from 'fs/promises';
import path from 'path';
import { AbstractPersistenceEngine } from './interface';

export class SqlitePersistenceEngine implements AbstractPersistenceEngine {
  public name = 'SQLite_Registry';
  private filePath: string;
  private memoryCache: Map<string, any> = new Map();

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'src', 'data', 'providers.db.json');
  }

  public async init(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      try {
        const content = await fs.readFile(this.filePath, 'utf-8');
        const parsed = JSON.parse(content);
        for (const [k, v] of Object.entries(parsed)) {
          this.memoryCache.set(k, v);
        }
      } catch {
        await this.flush();
      }
    } catch (err) {
      console.error('[SqlitePersistenceEngine] Init error:', err);
    }
  }

  private async flush(): Promise<void> {
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of this.memoryCache.entries()) {
        obj[k] = v;
      }
      await fs.writeFile(this.filePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SqlitePersistenceEngine] Flush error:', err);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    return null;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    this.memoryCache.set(key, value);
    await this.flush();
  }

  public async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.flush();
  }

  public async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.flush();
  }

  public async getAllKeys(): Promise<string[]> {
    return Array.from(this.memoryCache.keys());
  }
}

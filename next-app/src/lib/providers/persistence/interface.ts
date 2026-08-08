/**
 * Abstract Persistence Layer Interface
 * Allows switching between JSON registry (dev), SQLite (prod), or custom engines seamlessly.
 */

export interface AbstractPersistenceEngine {
  name: string;
  init(): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

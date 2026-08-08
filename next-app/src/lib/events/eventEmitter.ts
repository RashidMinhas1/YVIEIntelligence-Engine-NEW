/**
 * Centralized AI Event Bus - Event Emitter
 * Handles event dispatching with error isolation, async execution, and logging.
 */

import { AIEventMap, AIEventType, AIEventHandler } from './eventTypes';

export class AIEventEmitter {
  private listeners: Map<AIEventType, Set<AIEventHandler<any>>> = new Map();
  private debugLogging: boolean = false;

  constructor(enableLogging: boolean = false) {
    this.debugLogging = enableLogging;
  }

  public setLogging(enabled: boolean): void {
    this.debugLogging = enabled;
  }

  /**
   * Register a handler for an event type
   */
  public register<K extends AIEventType>(event: K, handler: AIEventHandler<K>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Remove a handler for an event type
   */
  public unregister<K extends AIEventType>(event: K, handler: AIEventHandler<K>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Clear all registered handlers
   */
  public clearAll(): void {
    this.listeners.clear();
  }

  /**
   * Emit an event to all subscribers asynchronously with error isolation.
   * Ensures that an error in one listener will not break execution or prevent other listeners from running.
   */
  public async emit<K extends AIEventType>(event: K, payload: AIEventMap[K]): Promise<void> {
    if (this.debugLogging) {
      console.log(`[AIEventBus] Emitting event: "${String(event)}"`, payload);
    }

    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises: Promise<void>[] = [];

    for (const handler of Array.from(handlers)) {
      promises.push(
        (async () => {
          try {
            await handler(payload);
          } catch (error) {
            console.error(`[AIEventBus] Error in listener for event "${String(event)}":`, error);
          }
        })()
      );
    }

    await Promise.all(promises);
  }

  /**
   * Synchronously emit an event (fire-and-forget background execution)
   */
  public emitSync<K extends AIEventType>(event: K, payload: AIEventMap[K]): void {
    void this.emit(event, payload);
  }

  /**
   * Return total count of registered listeners for an event (or all events if omitted)
   */
  public listenerCount(event?: AIEventType): number {
    if (event) {
      return this.listeners.get(event)?.size || 0;
    }
    let total = 0;
    for (const handlers of this.listeners.values()) {
      total += handlers.size;
    }
    return total;
  }
}

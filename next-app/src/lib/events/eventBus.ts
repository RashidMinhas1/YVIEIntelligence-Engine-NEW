/**
 * Centralized AI Event Bus - Main API Singleton
 * Master communication backbone for the Universal AI Provider Ecosystem V2.
 */

import { AIEventEmitter } from './eventEmitter';
import { AIEventSubscriber } from './eventSubscriber';
import { AIEventMap, AIEventType, AIEventHandler, Subscription } from './eventTypes';

class AIEventBusClass {
  private emitter: AIEventEmitter;
  private subscriber: AIEventSubscriber;

  constructor() {
    // Enable logging in non-production environments by default
    const isDev = process.env.NODE_ENV !== 'production';
    this.emitter = new AIEventEmitter(isDev);
    this.subscriber = new AIEventSubscriber(this.emitter);
  }

  /**
   * Publish an event to all subscribers asynchronously with error isolation.
   */
  public async publish<K extends AIEventType>(event: K, payload: AIEventMap[K]): Promise<void> {
    await this.emitter.emit(event, payload);
  }

  /**
   * Publish an event synchronously (fire-and-forget background execution).
   */
  public publishSync<K extends AIEventType>(event: K, payload: AIEventMap[K]): void {
    this.emitter.emitSync(event, payload);
  }

  /**
   * Subscribe to an AI ecosystem event. Returns a handle with an `unsubscribe()` function.
   */
  public subscribe<K extends AIEventType>(event: K, handler: AIEventHandler<K>): Subscription {
    return this.subscriber.subscribe(event, handler);
  }

  /**
   * Subscribe to an event for a single invocation.
   */
  public once<K extends AIEventType>(event: K, handler: AIEventHandler<K>): Subscription {
    return this.subscriber.once(event, handler);
  }

  /**
   * Unsubscribe a handler manually from an event.
   */
  public unsubscribe<K extends AIEventType>(event: K, handler: AIEventHandler<K>): void {
    this.subscriber.unsubscribe(event, handler);
  }

  /**
   * Enable or disable debug logging
   */
  public setLogging(enabled: boolean): void {
    this.emitter.setLogging(enabled);
  }

  /**
   * Get active listener count
   */
  public listenerCount(event?: AIEventType): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * Reset all handlers (useful for unit testing or full system reset)
   */
  public reset(): void {
    this.emitter.clearAll();
  }
}

// Export singleton instance
export const eventBus = new AIEventBusClass();
export default eventBus;

// Re-export type definitions for convenience
export * from './eventTypes';

/**
 * Centralized AI Event Bus - Event Subscriber
 * Provides clean subscription abstractions, one-time listeners, and automatic cleanup handles.
 */

import { AIEventEmitter } from './eventEmitter';
import { AIEventMap, AIEventType, AIEventHandler, Subscription } from './eventTypes';

export class AIEventSubscriber {
  private emitter: AIEventEmitter;

  constructor(emitter: AIEventEmitter) {
    this.emitter = emitter;
  }

  /**
   * Subscribe to an event. Returns a Subscription object with an unsubscribe method.
   */
  public subscribe<K extends AIEventType>(event: K, handler: AIEventHandler<K>): Subscription {
    this.emitter.register(event, handler);
    return {
      unsubscribe: () => {
        this.emitter.unregister(event, handler);
      },
    };
  }

  /**
   * Subscribe to an event for a single invocation (one-time listener).
   */
  public once<K extends AIEventType>(event: K, handler: AIEventHandler<K>): Subscription {
    const wrapper: AIEventHandler<K> = async (payload) => {
      this.emitter.unregister(event, wrapper);
      await handler(payload);
    };
    this.emitter.register(event, wrapper);
    return {
      unsubscribe: () => {
        this.emitter.unregister(event, wrapper);
      },
    };
  }

  /**
   * Unsubscribe a handler manually
   */
  public unsubscribe<K extends AIEventType>(event: K, handler: AIEventHandler<K>): void {
    this.emitter.unregister(event, handler);
  }
}

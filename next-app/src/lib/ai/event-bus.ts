import { EventEmitter } from "events";

class AIEventBus extends EventEmitter {
  private static instance: AIEventBus;

  private constructor() {
    super();
    // Increase max listeners for heavy usage
    this.setMaxListeners(100);
  }

  public static getInstance(): AIEventBus {
    if (!AIEventBus.instance) {
      AIEventBus.instance = new AIEventBus();
    }
    return AIEventBus.instance;
  }

  public emitRequestStarted(data: any) { this.emit("request_started", data); }
  public emitStreamingStarted(data: any) { this.emit("streaming_started", data); }
  public emitRetry(data: any) { this.emit("retry", data); }
  public emitFallback(data: any) { this.emit("fallback", data); }
  public emitCompleted(data: any) { this.emit("completed", data); }
  public emitFailed(data: any) { this.emit("failed", data); }
}

export const aiEventBus = AIEventBus.getInstance();

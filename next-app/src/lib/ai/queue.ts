import { AIRequestOptions } from "./types";

export interface AIJob {
  id: string;
  prompt: string;
  options: AIRequestOptions;
  priority: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export class AIQueueManager {
  private static instance: AIQueueManager;
  private queue: AIJob[] = [];
  private concurrency: number = 3;
  private running: number = 0;
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): AIQueueManager {
    if (!AIQueueManager.instance) {
      AIQueueManager.instance = new AIQueueManager();
    }
    return AIQueueManager.instance;
  }

  public enqueue(prompt: string, options: AIRequestOptions, priority: number = 1): string {
    const job: AIJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      prompt,
      options,
      priority,
      status: "pending",
      createdAt: Date.now()
    };
    this.queue.push(job);
    this.sortQueue();
    this.processNext();
    return job.id;
  }

  public getJob(id: string): AIJob | undefined {
    return this.queue.find(j => j.id === id);
  }

  public getAllJobs(): AIJob[] {
    return [...this.queue];
  }

  public cancel(id: string) {
    const job = this.getJob(id);
    if (job && job.status === "pending") {
      job.status = "cancelled";
    }
  }

  public pause(id: string) {
    const job = this.getJob(id);
    if (job && job.status === "pending") {
      job.status = "paused";
    }
  }

  public resume(id: string) {
    const job = this.getJob(id);
    if (job && job.status === "paused") {
      job.status = "pending";
      this.sortQueue();
      this.processNext();
    }
  }

  private sortQueue() {
    // Sort by priority (higher first), then by creation date (older first)
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.createdAt - b.createdAt;
    });
  }

  private async processNext() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.running < this.concurrency) {
      const nextJob = this.queue.find(j => j.status === "pending");
      if (!nextJob) break;

      nextJob.status = "running";
      nextJob.startedAt = Date.now();
      this.running++;

      // We don't await the job execution here to allow concurrency
      this.executeJob(nextJob).finally(() => {
        this.running--;
        this.processNext(); // Trigger next after completion
      });
    }

    this.isProcessing = false;
  }

  private async executeJob(job: AIJob) {
    try {
      const { AIRouter } = require("./router");
      const router = AIRouter.getInstance();
      job.result = await router.generateText(job.prompt, job.options);
      job.status = "completed";
    } catch (err: any) {
      job.status = "failed";
      job.error = err.message;
    } finally {
      job.completedAt = Date.now();
    }
  }
}

export const aiQueueManager = AIQueueManager.getInstance();

export const aiQueue = aiQueueManager;

export enum AIJobPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

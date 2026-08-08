export interface BenchmarkResult {
  provider: string;
  model: string;
  timestamp: number;
  speedTokensPerSec: number;
  latencyMs: number;
  costPer1k: number;
  reliabilityScore: number; // 0-100
  reasoningScore: number; // 0-100
  visionScore: number; // 0-100
}

export class AIBenchmarkEngine {
  private static instance: AIBenchmarkEngine;
  private benchmarks: BenchmarkResult[] = [];

  private constructor() {}

  public static getInstance(): AIBenchmarkEngine {
    if (!AIBenchmarkEngine.instance) {
      AIBenchmarkEngine.instance = new AIBenchmarkEngine();
    }
    return AIBenchmarkEngine.instance;
  }

  public recordBenchmark(result: BenchmarkResult) {
    this.benchmarks.push(result);
  }

  public getBenchmarks(): BenchmarkResult[] {
    return this.benchmarks;
  }

  public getRanking(metric: keyof BenchmarkResult, order: "asc" | "desc" = "desc"): BenchmarkResult[] {
    return [...this.benchmarks].sort((a, b) => {
      const valA = a[metric] as number;
      const valB = b[metric] as number;
      return order === "desc" ? valB - valA : valA - valB;
    });
  }
}

export const aiBenchmarkEngine = AIBenchmarkEngine.getInstance();

export async function runBackgroundBenchmark(provider: string, model: string, apiKey: string) {
  // Stub
  return true;
}

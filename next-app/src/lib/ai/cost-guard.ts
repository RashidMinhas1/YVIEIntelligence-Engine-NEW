import { CustomProviderConfig } from "./settings";

export class AICostGuard {
  private static instance: AICostGuard;

  private dailyUsage: Map<string, number> = new Map(); // provider -> cost
  private monthlyBudget: number = 50.0; // Default budget $50

  private constructor() {}

  public static getInstance(): AICostGuard {
    if (!AICostGuard.instance) {
      AICostGuard.instance = new AICostGuard();
    }
    return AICostGuard.instance;
  }

  public estimateCost(providerType: string, model: string, tokens: number): number {
    // Rough estimation based on generic pricing per 1k tokens
    let rate = 0.01; // default $0.01 per 1k
    if (model.includes("gpt-4o") || model.includes("claude-3-5")) rate = 0.015;
    if (model.includes("mini") || model.includes("flash") || model.includes("haiku")) rate = 0.0005;
    if (model.includes("o1-")) rate = 0.06;
    if (providerType === "ollama" || providerType === "lmstudio" || providerType === "custom") rate = 0; // Local is free
    
    return (tokens / 1000) * rate;
  }

  public recordUsage(provider: string, cost: number) {
    const current = this.dailyUsage.get(provider) || 0;
    this.dailyUsage.set(provider, current + cost);
  }

  public canAfford(provider: string, estimatedCost: number): boolean {
    const current = this.dailyUsage.get(provider) || 0;
    // Simple global budget check
    if (current + estimatedCost > this.monthlyBudget) {
      return false;
    }
    return true;
  }

  public getTotalCost(): number {
    let total = 0;
    for (const cost of this.dailyUsage.values()) {
      total += cost;
    }
    return total;
  }
}

export const aiCostGuard = AICostGuard.getInstance();

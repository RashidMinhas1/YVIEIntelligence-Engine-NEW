import { z } from "zod";

export const FeatureModelOverrideSchema = z.object({
  profileId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKeys: z.array(z.string()).optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  timeout: z.number().optional(),
  retryCount: z.number().optional(),
  streaming: z.boolean().optional(),
  jsonMode: z.boolean().optional(),
  visionMode: z.boolean().optional(),
  loadBalancingStrategy: z.enum(["round_robin", "least_latency", "least_errors", "weighted"]).optional(),
  isLocalOverrideEnabled: z.boolean().optional(),
});

export const WorkflowProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  priority: z.number().optional(),
  isEnabled: z.boolean().optional(),
  
  maxTokens: z.number().optional(),
  dailyBudget: z.number().optional(),
  monthlyBudget: z.number().optional(),
  preferredCheapModels: z.array(z.string()).optional(),
  preferredPremiumModels: z.array(z.string()).optional(),
  
  capabilities: z.array(z.string()).optional(), // e.g., ["vision", "reasoning", "json"]

  features: z.record(z.string(), FeatureModelOverrideSchema).optional(),
});

export const ProjectProfileSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  features: z.record(z.string(), FeatureModelOverrideSchema).optional(),
});

// A quick registry to track all features used in the app dynamically
class FeatureRegistry {
  private static instance: FeatureRegistry;
  private features: Set<string> = new Set();

  private constructor() {}
  public static getInstance(): FeatureRegistry {
    if (!FeatureRegistry.instance) {
      FeatureRegistry.instance = new FeatureRegistry();
    }
    return FeatureRegistry.instance;
  }

  public register(featureKey: string) {
    if (featureKey) {
      this.features.add(featureKey);
    }
  }

  public getAllFeatures(): string[] {
    return Array.from(this.features);
  }
}

export const featureRegistry = FeatureRegistry.getInstance();

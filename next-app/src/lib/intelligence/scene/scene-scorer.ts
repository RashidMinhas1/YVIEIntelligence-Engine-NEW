import { SceneIntelligence } from "@/lib/types/studio";

export function calculateSceneIntelligence(aiResponse: any): SceneIntelligence {
  return {
    hookStrength: Math.max(0, Math.min(100, Number(aiResponse?.hookStrength) || 50)),
    visualImpact: Math.max(0, Math.min(100, Number(aiResponse?.visualImpact) || 50)),
    retentionScore: Math.max(0, Math.min(100, Number(aiResponse?.retentionScore) || 50)),
    productionDifficulty: Math.max(0, Math.min(100, Number(aiResponse?.productionDifficulty) || 50)),
    emotionalImpact: Math.max(0, Math.min(100, Number(aiResponse?.emotionalImpact) || 50)),
    riskFlags: Array.isArray(aiResponse?.riskFlags) ? aiResponse.riskFlags : [],
    suggestions: Array.isArray(aiResponse?.suggestions) ? aiResponse.suggestions : [],
  };
}

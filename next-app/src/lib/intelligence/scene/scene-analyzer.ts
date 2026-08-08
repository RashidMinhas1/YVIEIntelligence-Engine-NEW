import { getAIProvider } from "@/lib/ai/factory";
import { calculateSceneIntelligence } from "./scene-scorer";
import { SceneIntelligence, ScriptSection } from "@/lib/types/studio";

export async function analyzeScene(scene: ScriptSection): Promise<SceneIntelligence> {
  const prompt = `Analyze this video scene for production readiness and intelligence metrics.
Return JSON ONLY.

Scene Content:
${scene.content}

Visuals: ${scene.visualNotes || 'None'}
Camera: ${scene.cameraDirection || 'None'}

Return exactly this JSON format:
{
  "hookStrength": 0-100,
  "visualImpact": 0-100,
  "retentionScore": 0-100,
  "productionDifficulty": 0-100,
  "emotionalImpact": 0-100,
  "riskFlags": ["List of potential risks"],
  "suggestions": ["List of improvements"]
}`;

  try {
    const aiProvider = getAIProvider();
    const result = await aiProvider.generateText(prompt, { 
      featureKey: "scene_intelligence"
    });
    
    // Strip markdown formatting if any
    const jsonStr = result.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    
    return calculateSceneIntelligence(parsed);
  } catch (err) {
    console.error("Failed to analyze scene:", err);
    throw new Error("Scene analysis failed.");
  }
}

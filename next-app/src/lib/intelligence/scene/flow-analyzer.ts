import { getAIProvider } from "@/lib/ai/factory";
import { ScriptSection } from "@/lib/types/studio";

export interface FlowIntelligence {
  continuityScore: number;
  issues: string[];
  recommendations: string[];
}

export async function analyzeFlow(scene: ScriptSection, previousScene?: ScriptSection, nextScene?: ScriptSection): Promise<FlowIntelligence> {
  const prompt = `Analyze the narrative and visual flow of this video sequence.
Return JSON ONLY.

Context:
Previous Scene: ${previousScene ? (previousScene.content + ' | Visual: ' + previousScene.visualNotes) : 'None (Start of video)'}
Current Scene: ${scene.content} | Visual: ${scene.visualNotes}
Next Scene: ${nextScene ? (nextScene.content + ' | Visual: ' + nextScene.visualNotes) : 'None (End of video)'}

Detect:
- Continuity problems
- Repeated visuals
- Weak transitions
- Story progression issues

Return exactly this JSON format:
{
  "continuityScore": 0-100,
  "issues": ["List of flow issues found"],
  "recommendations": ["List of flow improvements"]
}`;

  try {
    const aiProvider = getAIProvider();
    const result = await aiProvider.generateText(prompt, { 
      featureKey: "scene_flow" 
    });
    
    const jsonStr = result.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
      continuityScore: Math.max(0, Math.min(100, Number(parsed.continuityScore) || 50)),
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
    };
  } catch (err) {
    console.error("Failed to analyze flow:", err);
    throw new Error("Flow analysis failed.");
  }
}

import { getAIProvider } from "@/lib/ai/factory";
import { ScriptSection } from "@/lib/types/studio";

export interface AssetIntelligence {
  characters: string[];
  locations: string[];
  objects: string[];
  reuseSuggestions: string[];
}

export async function analyzeAssets(scene: ScriptSection): Promise<AssetIntelligence> {
  const prompt = `Analyze this video scene for production assets (characters, locations, props).
Return JSON ONLY.

Scene Content: ${scene.content}
Visuals: ${scene.visualNotes || 'None'}

Detect:
- Characters
- Locations
- Objects
- Reusable assets

Return exactly this JSON format:
{
  "characters": ["List of characters"],
  "locations": ["List of locations"],
  "objects": ["List of key props/objects"],
  "reuseSuggestions": ["List of ways to reuse assets to save production time"]
}`;

  try {
    const aiProvider = getAIProvider();
    const result = await aiProvider.generateText(prompt, { 
      featureKey: "asset_intelligence" 
    });
    
    const jsonStr = result.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
      reuseSuggestions: Array.isArray(parsed.reuseSuggestions) ? parsed.reuseSuggestions : []
    };
  } catch (err) {
    console.error("Failed to analyze assets:", err);
    throw new Error("Asset analysis failed.");
  }
}

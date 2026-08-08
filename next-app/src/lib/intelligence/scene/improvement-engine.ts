import { getAIProvider } from "@/lib/ai/factory";
import { ScriptSection } from "@/lib/types/studio";

export interface SceneImprovements {
  improvedVisualPrompt?: string;
  improvedCamera?: string;
  improvedHook?: string;
  improvedArtDirection?: string;
  improvedLighting?: string;
  improvedComposition?: string;
  improvedMotion?: string;
  improvedBRoll?: string;
  improvedSFX?: string;
  improvedMusic?: string;
  improvedColorGrade?: string;
  improvedPostProduction?: string;
  improvedEditingNotes?: string;
  reasoning: string;
}

export async function improveScene(scene: ScriptSection, previousScene?: ScriptSection, nextScene?: ScriptSection): Promise<SceneImprovements> {
  const isVisualLocked = scene.lockedFields?.['visualNotes'] === true || scene.lockedFields?.['aiPrompt'] === true;
  const isCameraLocked = scene.lockedFields?.['cameraDirection'] === true;
  const isHookLocked = scene.lockedFields?.['content'] === true;

  const prompt = `Act as an expert YouTube producer. Improve this video scene to maximize viewer retention and engagement.
Return JSON ONLY.

Context:
Previous Scene: ${previousScene?.content || 'None (Start of video)'}
Current Scene: ${scene.content}
Next Scene: ${nextScene?.content || 'None (End of video)'}
Theme: Not specified
Audience: General

Current Visuals: ${scene.visualNotes || scene.aiPrompt || 'None'}
Current Camera: ${scene.cameraDirection || 'None'}
Current Art Direction: ${scene.artDirection || 'None'}
Current Lighting: ${scene.lighting || 'None'}
Current Composition: ${scene.composition || 'None'}
Current Motion: ${scene.motion || 'None'}
Current B-Roll: ${scene.brollNotes || 'None'}
Current SFX: ${scene.soundEffects || 'None'}
Current Music: ${scene.musicNotes || 'None'}
Current Color Grade: ${scene.colorPalette || 'None'}
Current Post Production: ${scene.postProduction || 'None'}
Current Editing Notes: ${scene.editingNotes || 'None'}

Constraints:
${isVisualLocked ? '- Visuals are LOCKED by the user. Do not suggest a new visual prompt.' : '- Suggest an improved, highly engaging visual prompt.'}
${isCameraLocked ? '- Camera is LOCKED by the user. Do not suggest new camera directions.' : '- Suggest a dynamic camera direction that fits the visual and emotion.'}
${isHookLocked ? '- The hook/script content is LOCKED. Do not change it.' : '- If this is a hook or requires better pacing, suggest a punchier script segment.'}
- Do NOT reuse visual, camera, art direction, lighting, composition, motion, B‑Roll, SFX, music, color grade, post‑production, or editing notes from other scenes unless continuity explicitly requires it.

Return exactly this JSON format:
{
  ${!isVisualLocked ? '"improvedVisualPrompt": "...",' : ''}
  ${!isCameraLocked ? '"improvedCamera": "...",' : ''}
  ${!isHookLocked ? '"improvedHook": "...",' : ''}
  "improvedArtDirection": "...",
  "improvedLighting": "...",
  "improvedComposition": "...",
  "improvedMotion": "...",
  "improvedBRoll": "...",
  "improvedSFX": "...",
  "improvedMusic": "...",
  "improvedColorGrade": "...",
  "improvedPostProduction": "...",
  "improvedEditingNotes": "...",
  "reasoning": "Explain why these changes improve the scene."
}`;

  try {
    const aiProvider = getAIProvider();
    const result = await aiProvider.generateText(prompt, { 
      featureKey: "scene_improvement" 
    });
    
    const jsonStr = result.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    
    // Ensure we respect locks even if AI hallucinates them back
    const response: SceneImprovements = {
      reasoning: parsed.reasoning || "No reasoning provided."
    };
    
    if (!isVisualLocked && parsed.improvedVisualPrompt) response.improvedVisualPrompt = parsed.improvedVisualPrompt;
    if (!isCameraLocked && parsed.improvedCamera) response.improvedCamera = parsed.improvedCamera;
    if (!isHookLocked && parsed.improvedHook) response.improvedHook = parsed.improvedHook;
    if (parsed.improvedArtDirection) response.improvedArtDirection = parsed.improvedArtDirection;
    if (parsed.improvedLighting) response.improvedLighting = parsed.improvedLighting;
    if (parsed.improvedComposition) response.improvedComposition = parsed.improvedComposition;
    if (parsed.improvedMotion) response.improvedMotion = parsed.improvedMotion;
    if (parsed.improvedBRoll) response.improvedBRoll = parsed.improvedBRoll;
    if (parsed.improvedSFX) response.improvedSFX = parsed.improvedSFX;
    if (parsed.improvedMusic) response.improvedMusic = parsed.improvedMusic;
    if (parsed.improvedColorGrade) response.improvedColorGrade = parsed.improvedColorGrade;
    if (parsed.improvedPostProduction) response.improvedPostProduction = parsed.improvedPostProduction;
    if (parsed.improvedEditingNotes) response.improvedEditingNotes = parsed.improvedEditingNotes;
    
    return response;
  } catch (err) {
    console.error("Failed to improve scene:", err);
    throw new Error("Scene improvement failed.");
  }
}

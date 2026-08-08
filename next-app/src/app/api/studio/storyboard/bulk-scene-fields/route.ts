import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Bulk endpoint: given a single scene's script chunk + theme,
 * returns ALL storyboard fields in one AI call instead of 14 separate calls.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scriptChunk, globalTheme } = body;
    console.log('[bulk-scene-fields] Received', JSON.stringify(body));
    
    if (!scriptChunk) {
      return NextResponse.json({ error: "Missing scriptChunk" }, { status: 400 });
    }

    const prompt = `You are a professional film director and YouTube content strategist.
Analyze the following script scene and generate ALL production fields for it.

SCENE SCRIPT:
"${scriptChunk}"

GLOBAL VISUAL THEME: ${globalTheme || "Documentary Cinematic"}

Return ONLY valid JSON with these exact fields:
{
  "visualNotes": "1-2 sentence visual description for this scene",
  "cameraMovement": "e.g. Slow push-in, Static wide, Handheld follow",
  "cameraAngle": "e.g. Eye-level medium shot, Low angle wide, High angle overhead",
  "cameraLens": "e.g. 50mm, 85mm portrait, 24mm wide angle",
  "lighting": "e.g. Natural window light, Cinematic side lighting, Soft ring light",
  "colorPalette": "e.g. Warm golden tones, Cool desaturated blues, High contrast black & white",
  "mood": "e.g. Tense, Inspiring, Melancholic, Energetic",
  "emotion": "e.g. Determination, Hope, Curiosity, Fear",
  "onScreenText": "Short text overlay if needed, or empty string",
  "soundEffects": "e.g. Keyboard clicks, Crowd noise, Rain ambience",
  "musicNotes": "e.g. Lo-fi beat, Cinematic swell, Upbeat corporate",
  "transitionNotes": "e.g. Cut to black, J-cut, L-cut, Cross dissolve",
  "editingNotes": "Post production notes: color grade, effects, pacing",
  "aiPrompt": "A detailed Midjourney/DALL-E image generation prompt for this scene"
}`;

    const raw = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const fields = JSON.parse(cleaned);

    return NextResponse.json({ fields });
  } catch (error: any) {
    console.error("[bulk-scene-fields] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate scene fields", details: error.message },
      { status: 500 }
    );
  }
}

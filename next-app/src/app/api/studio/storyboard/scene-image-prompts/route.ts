import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Per-scene image prompt generator.
 * Reads each sentence / visual idea in the scene script and returns
 * a distinct Midjourney-style image prompt for each one.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sceneText, sceneNumber, globalTheme } = body;

    if (!sceneText?.trim()) {
      return NextResponse.json({ error: "Missing sceneText" }, { status: 400 });
    }

    const prompt = `You are a professional cinematographer and AI image-prompt engineer.

Read the following script scene and identify every distinct VISUAL IDEA or VISUAL MOMENT mentioned.
For EACH distinct visual idea, write one Midjourney / DALL-E image generation prompt.

Rules:
- If the scene mentions ONE visual concept → return 1 prompt.
- If it mentions TWO → return 2 prompts.
- Max 4 prompts per scene.
- Each prompt must be vivid, cinematic, and 1-2 sentences (no more).
- Do NOT include text overlays, logos, or watermarks in prompts.
- Include: subject, environment, lighting, mood, camera angle, visual style.

Global Visual Theme: ${globalTheme || "Cinematic Documentary"}
Scene Number: ${sceneNumber || "?"}

SCENE SCRIPT:
"""
${sceneText}
"""

Return ONLY valid JSON:
{
  "imagePrompts": [
    {
      "id": "1",
      "concept": "Brief label of the visual idea (5-8 words)",
      "prompt": "Full Midjourney image generation prompt...",
      "negativePrompt": "blurry, text, watermark, low quality, cartoon",
      "style": "Cinematic / Documentary / Dramatic etc",
      "mood": "e.g. Tense, Inspiring, Mysterious"
    }
  ]
}`;

    const raw = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ imagePrompts: parsed.imagePrompts || [] });
  } catch (error: any) {
    console.error("[scene-image-prompts] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate scene image prompts", details: error.message },
      { status: 500 }
    );
  }
}

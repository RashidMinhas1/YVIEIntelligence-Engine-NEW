import { NextResponse } from "next/server";
import { analyzeScene } from "@/lib/intelligence/scene/scene-analyzer";
import { analyzeFlow } from "@/lib/intelligence/scene/flow-analyzer";
import { analyzeAssets } from "@/lib/intelligence/scene/asset-analyzer";
import { ScriptSection } from "@/lib/types/studio";

export async function POST(req: Request) {
  try {
    const { scene, previousScene, nextScene } = await req.json();

    if (!scene) {
      return NextResponse.json({ error: "Scene is required" }, { status: 400 });
    }

    // Run all independent analysis services concurrently for speed
    const [sceneIntel, flowIntel, assetIntel] = await Promise.all([
      analyzeScene(scene),
      analyzeFlow(scene, previousScene, nextScene),
      analyzeAssets(scene)
    ]);

    // Combine them, or just return them separately.
    // The requirement says return hookStrength, visualImpact, etc., which are in SceneIntelligence.
    // We can merge them into a single intelligence object if needed.
    const combinedResponse = {
      ...sceneIntel,
      flow: flowIntel,
      assets: assetIntel
    };

    return NextResponse.json(combinedResponse);
  } catch (error: any) {
    console.error("[Scene Analyze API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { improveScene } from "@/lib/intelligence/scene/improvement-engine";

export async function POST(req: Request) {
  try {
    const { scene, previousScene, nextScene } = await req.json();

    if (!scene) {
      return NextResponse.json({ error: "Scene is required" }, { status: 400 });
    }

    const improvements = await improveScene(scene, previousScene, nextScene);
    return NextResponse.json(improvements);
  } catch (error: any) {
    console.error("[Scene Improve API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

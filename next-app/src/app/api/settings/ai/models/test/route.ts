import { NextResponse } from "next/server";
import { AIRouter } from "@/lib/ai/router";
import { getAISettings } from "@/lib/ai/settings";

export async function POST(req: Request) {
  try {
    const { providerId, modelId } = await req.json();
    if (!providerId || !modelId) return NextResponse.json({ success: false, error: "providerId and modelId are required" }, { status: 400 });

    // Validate provider exists
    const settings = getAISettings();
    if (!settings.providers?.[providerId]) {
      return NextResponse.json({ success: false, error: "Provider configuration not found" }, { status: 404 });
    }

    const router = AIRouter.getInstance();
    const start = Date.now();
    
    // Direct bypass routing using specific provider and model
    const response = await router.generateText("Ping! Please reply with a single word: Pong.", {
      systemPrompt: "You are a test ping bot.",
      providerOverride: providerId,
      modelOverride: modelId
    });

    const latency = Date.now() - start;

    return NextResponse.json({ success: true, response, latency });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Unknown error occurred" }, { status: 500 });
  }
}

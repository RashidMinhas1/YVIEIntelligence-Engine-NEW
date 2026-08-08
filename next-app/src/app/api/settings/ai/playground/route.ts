import { NextResponse } from "next/server";
import { AIRouter } from "@/lib/ai/router";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, provider, model, temperature, maxTokens, isStream } = body;

    const router = AIRouter.getInstance();
    const result = await router.generateText(prompt, {
      systemPrompt,
      providerOverride: provider,
      modelOverride: model,
      temperature,
      maxTokens,
    });

    return NextResponse.json({ success: true, response: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

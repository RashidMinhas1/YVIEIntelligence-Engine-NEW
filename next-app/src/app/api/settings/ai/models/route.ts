import { NextResponse } from "next/server";
import { getSafeAISettings, getAISettings, saveAISettings } from "@/lib/ai/settings";

export async function GET() {
  const settings = getSafeAISettings();
  return NextResponse.json({ success: true, models: settings.models || {} });
}

export async function POST(req: Request) {
  try {
    const { modelId, provider, contextWindow, isFree, capabilities, name } = await req.json();
    if (!modelId || !provider) {
      return NextResponse.json({ success: false, error: "modelId and provider are required" }, { status: 400 });
    }

    const settings = getAISettings();
    if (!settings.models) settings.models = {};

    settings.models[modelId] = {
      provider,
      name,
      contextWindow,
      isFree,
      reasoning: capabilities?.reasoning || false,
      vision: capabilities?.vision || false,
    };

    saveAISettings(settings);

    return NextResponse.json({ success: true, modelId, model: settings.models[modelId] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    
    const settings = getAISettings();
    if (settings.models && settings.models[id]) {
      delete settings.models[id];
      saveAISettings(settings);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

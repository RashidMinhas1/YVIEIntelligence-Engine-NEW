import { NextResponse } from "next/server";
import { getAISettings, saveAISettings } from "@/lib/ai/settings";

export async function GET() {
  const settings = getAISettings();
  return NextResponse.json({ success: true, providers: settings.providers || {} });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { providerId, config } = body;
    
    const settings = getAISettings();
    settings.providers = settings.providers || {};
    settings.providers[providerId] = config;
    
    saveAISettings(settings);
    
    return NextResponse.json({ success: true, providerId, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("id");
    
    if (!providerId) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }
    
    const settings = getAISettings();
    if (settings.providers && settings.providers[providerId]) {
      delete settings.providers[providerId];
      saveAISettings(settings);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

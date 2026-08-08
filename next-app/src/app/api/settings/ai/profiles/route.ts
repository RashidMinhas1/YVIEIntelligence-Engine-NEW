import { NextResponse } from "next/server";
import { getAISettings, saveAISettings } from "@/lib/ai/settings";

export async function GET() {
  const settings = getAISettings();
  return NextResponse.json({ success: true, profiles: settings.profiles || {} });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, profile } = body;
    
    const settings = getAISettings();
    settings.profiles = settings.profiles || {};
    settings.profiles[id] = profile;
    
    saveAISettings(settings);
    
    return NextResponse.json({ success: true, id, profile });
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
    if (settings.profiles && settings.profiles[id]) {
      delete settings.profiles[id];
      saveAISettings(settings);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

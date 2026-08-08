import { NextResponse } from "next/server";
import { getAISettings, saveAISettings } from "@/lib/ai/settings";

export async function POST(req: Request) {
  try {
    const { providerId, defaultModel } = await req.json();
    const settings = getAISettings();
    
    if (providerId) {
      settings.activeProvider = providerId;
    }
    
    if (providerId && defaultModel && settings.providers?.[providerId]) {
      settings.providers[providerId].defaultModel = defaultModel;
    }

    saveAISettings(settings);
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

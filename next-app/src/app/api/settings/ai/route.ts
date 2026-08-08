import { NextResponse } from "next/server";
import { getSafeAISettings, saveAISettings, AISettings } from "@/lib/ai/settings";
import { AISettingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    const settings = getSafeAISettings();
    const safeSettings = JSON.parse(JSON.stringify(settings));
    return NextResponse.json(safeSettings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AISettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.format() }, { status: 400 });
    }
    saveAISettings(parsed.data as AISettings);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

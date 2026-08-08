import { NextResponse } from "next/server";
import { getSafeAISettings } from "@/lib/ai/settings";

export async function GET() {
  try {
    const settings = getSafeAISettings();
    
    const hasProvider = Object.keys(settings.providers || {}).length > 0;
    const hasTestedConnection = Object.values(settings.providers || {}).some((p: any) => p.isEnabled);
    const hasModels = Object.keys(settings.models || {}).length > 0;
    const hasDefaultModel = !!settings.activeProvider && !!settings.providers?.[settings.activeProvider]?.defaultModel;
    const hasProfile = Object.keys(settings.profiles || {}).length > 0;

    let completedCount = 0;
    if (hasProvider) completedCount++;
    if (hasTestedConnection) completedCount++;
    if (hasModels) completedCount++;
    if (hasDefaultModel) completedCount++;
    if (hasProfile) completedCount++;

    return NextResponse.json({
      success: true,
      status: {
        hasProvider,
        hasTestedConnection,
        hasModels,
        hasDefaultModel,
        hasProfile,
        completedCount,
        isComplete: completedCount === 5
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

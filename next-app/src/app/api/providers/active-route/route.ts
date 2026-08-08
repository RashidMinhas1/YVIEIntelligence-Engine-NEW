import { NextResponse } from 'next/server';
import { routerEngine } from '@/lib/router/routerEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featureKey = searchParams.get("featureKey") || undefined;
    
    // Select the best default route
    const route = await routerEngine.selectRoute({ featureKey });

    if (!route) {
      return NextResponse.json({
        success: false,
        message: "No active AI provider configured or enabled."
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      providerId: route.providerId,
      providerName: route.providerConfig.profile.name,
      model: route.model,
      strategyUsed: route.strategyUsed
    });
  } catch (error: any) {
    console.error("Active route API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

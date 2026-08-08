/**
 * API Route: /api/providers/diagnostics
 * Server-side endpoint for real-time provider diagnostics and health pings.
 */

import { NextResponse } from 'next/server';
import { diagnosticsService } from '@/lib/providers/diagnostics';
import { healthMonitor } from '@/lib/providers/healthMonitor';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ success: false, error: 'providerId is required' }, { status: 400 });
    }

    const diagnostics = await diagnosticsService.getDiagnosticsForProvider(providerId);
    return NextResponse.json({ success: true, diagnostics });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch diagnostics' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { providerId } = await req.json();

    if (!providerId) {
      return NextResponse.json({ success: false, error: 'providerId is required' }, { status: 400 });
    }

    const healthResult = await healthMonitor.checkProvider(providerId, true);
    const diagnostics = await diagnosticsService.getDiagnosticsForProvider(providerId);

    return NextResponse.json({ success: true, healthResult, diagnostics });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to ping health' }, { status: 500 });
  }
}

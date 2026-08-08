/**
 * API Route: /api/providers/history
 * Server-side endpoint for Request History configuration, logs retrieval, and log cleanup.
 */

import { NextResponse } from 'next/server';
import { requestHistory } from '@/lib/providers/requestHistory';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId') || undefined;

    await requestHistory.init();
    const config = await requestHistory.getConfig();
    const logs = await requestHistory.getLogs(providerId);

    return NextResponse.json({ success: true, config, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await requestHistory.init();

    if (body.config) {
      const updatedConfig = await requestHistory.updateConfig(body.config);
      return NextResponse.json({ success: true, config: updatedConfig });
    }

    return NextResponse.json({ success: false, error: 'No config provided' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update history config' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId') || undefined;

    await requestHistory.init();
    await requestHistory.clearLogs(providerId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to clear history' }, { status: 500 });
  }
}

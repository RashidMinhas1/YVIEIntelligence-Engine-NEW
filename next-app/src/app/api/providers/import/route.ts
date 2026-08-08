/**
 * API Route: /api/providers/import
 * Server-side endpoint for importing providers via Import Engine.
 */

import { NextResponse } from 'next/server';
import { importEngine } from '@/lib/providers/importEngine';

export async function POST(req: Request) {
  try {
    const source = await req.json();
    const result = await importEngine.importProvider(source);

    if (result.success) {
      return NextResponse.json({ success: true, providerId: result.providerId });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Import failed' }, { status: 500 });
  }
}

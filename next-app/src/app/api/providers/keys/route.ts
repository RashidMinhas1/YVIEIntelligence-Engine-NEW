/**
 * API Route: /api/providers/keys
 * Handles adding and deleting managed API keys for providers.
 */

import { NextResponse } from 'next/server';
import { providerRegistry } from '@/lib/providers/registry';

export async function POST(req: Request) {
  try {
    const { providerId, name, key, priority } = await req.json();

    if (!providerId || !key) {
      return NextResponse.json({ success: false, error: 'providerId and key are required' }, { status: 400 });
    }

    const newKey = await providerRegistry.addApiKey(providerId, name, key, priority || 1);
    if (!newKey) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, key: newKey });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to add API key' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const keyId = searchParams.get('keyId');

    if (!providerId || !keyId) {
      return NextResponse.json({ success: false, error: 'providerId and keyId are required' }, { status: 400 });
    }

    const success = await providerRegistry.removeApiKey(providerId, keyId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to remove API key' }, { status: 500 });
  }
}

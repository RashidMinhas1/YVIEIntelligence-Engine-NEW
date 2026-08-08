/**
 * API Route: /api/providers
 * Handles listing all providers and registering new custom/community providers.
 */

import { NextResponse } from 'next/server';
import { providerRegistry } from '@/lib/providers/registry';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let providers;
    if (category && ['official', 'community', 'local', 'custom'].includes(category)) {
      providers = await providerRegistry.getProvidersByCategory(category as any);
    } else {
      providers = await providerRegistry.getAllProviders();
    }

    return NextResponse.json({ success: true, providers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch providers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, initialKeys } = body;

    if (!profile || !profile.id || !profile.name || !profile.apiBaseUrl) {
      return NextResponse.json({ success: false, error: 'Invalid profile data' }, { status: 400 });
    }

    const config = await providerRegistry.registerProvider(profile, initialKeys || []);
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to register provider' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Provider ID required' }, { status: 400 });
    }

    const removed = await providerRegistry.removeProvider(id);
    if (removed) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Provider not found or could not be removed (system default)' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to remove provider' }, { status: 500 });
  }
}

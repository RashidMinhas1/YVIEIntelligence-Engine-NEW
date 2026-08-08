/**
 * API Route: /api/providers/playground
 * Executes prompt requests through the Failover & Router Engine for testing.
 */

import { NextResponse } from 'next/server';
import { failoverWrapper } from '@/lib/providers/failover';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, preferredProviderId, preferredModel, categoryPreference, temperature, maxTokens } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const response = await failoverWrapper.executeWithResilience({
      prompt,
      systemPrompt,
      preferredProviderId,
      preferredModel,
      categoryPreference,
      temperature,
      maxTokens,
    });

    return NextResponse.json({ success: true, response });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Playground execution failed' }, { status: 500 });
  }
}

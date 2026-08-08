import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/factory';

export async function POST(req: Request) {
  try {
    const { sourceVideoId, matchVideoId, sourceTitle, matchTitle } = await req.json();

    if (!sourceVideoId || !matchVideoId) {
      return NextResponse.json({ error: 'Missing video IDs' }, { status: 400 });
    }

    const provider = getAIProvider();
    const prompt = `You are an expert YouTube analyst.
Compare the following two videos and perform a deep analysis of how the matched video differs or improves upon the source video concept.

Source Video: "${sourceTitle}"
Matched Video: "${matchTitle}"

Return a detailed JSON analysis matching this exact schema:
{
  "titleFormula": "Explanation of the title formula used in the matched video",
  "hook": "Estimated hook pattern",
  "storyStructure": "Estimated narrative structure",
  "uniqueAngle": "What makes this version different from the source?",
  "presentationStyle": "The general tone and style",
  "whatMakesDifferent": "The primary differentiation factor"
}
`;

    const aiRes = await provider.generateText(prompt, { responseFormat: 'json_object', featureKey: 'concept_analyze' });
    const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
    const deepAnalysis = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, deepAnalysis });
  } catch (error: any) {
    console.error('[Concept Analyze Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze' }, { status: 500 });
  }
}

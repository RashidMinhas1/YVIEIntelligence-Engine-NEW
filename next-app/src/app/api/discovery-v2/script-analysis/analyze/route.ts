import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/factory';
import { V2Video, ScriptAnalysisResult } from '@/lib/types/discovery-v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { video, workspaceIntelligence } = await req.json();

    if (!video || !video.videoId) {
      return NextResponse.json({ error: 'Video ID missing' }, { status: 400 });
    }

    if (!video.userScript || video.userScript.status !== 'added' || !video.userScript.text) {
      return NextResponse.json({ error: 'No script text found for this video' }, { status: 400 });
    }

    const provider = getAIProvider();

    // Trim script to first 4000 chars to avoid token limits while preserving enough to analyze
    const scriptPreview = (video.userScript.text as string).slice(0, 4000);
    const wordCount: number = video.userScript.wordCount || scriptPreview.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.ceil(wordCount / 150);

    const competitorData = workspaceIntelligence?.crossVideoAnalysis
      ? JSON.stringify(workspaceIntelligence.crossVideoAnalysis).slice(0, 2000)
      : 'No cross-video analysis available.';

    const prompt = `You are an elite YouTube Content Strategist and Script Analyst.

Analyze THIS SPECIFIC SCRIPT for the video titled: "${video.title}"
Video ID: ${video.videoId}
Word Count: ${wordCount} words (~${estimatedDuration} minutes)

SCRIPT (first 4000 chars):
"""
${scriptPreview}
"""

COMPETITOR NICHE INTELLIGENCE:
${competitorData}

IMPORTANT: 
- Analyze ONLY the script above. Do NOT copy any example values.
- Every score, insight and recommendation MUST be derived from reading the actual script text above.
- The videoId in your response MUST be exactly: "${video.videoId}"
- Do NOT use placeholder values like "trigger 1" or "loop 1" — write real observations.

Respond ONLY with valid JSON in this exact structure:
{
  "videoId": "${video.videoId}",
  "hookStrength": <score 0-100 based on actual first paragraph>,
  "pacingScore": <score 0-100 based on sentence length and flow>,
  "infoDensityScore": <score 0-100 based on information per minute>,
  "retentionScore": <score 0-100 based on curiosity loops and rehooks>,
  "metrics": {
    "wordCount": ${wordCount},
    "estimatedDurationMins": ${estimatedDuration}
  },
  "breakdown": {
    "hookType": "<actual hook technique used in first paragraph>",
    "opening": "<what the script actually says in the first 30 seconds>",
    "storyStructure": "<actual narrative structure identified>",
    "narrativeFlow": "<how the story actually progresses>",
    "emotionalTriggers": ["<real trigger from script>", "<real trigger from script>"],
    "curiosityLoops": ["<actual curiosity loop from script>", "<actual loop>"],
    "patternInterrupts": ["<actual interrupt found>", "<actual interrupt found>"],
    "retentionTechniques": ["<actual technique>", "<actual technique>"],
    "cta": "<actual call to action from script>",
    "weakSections": ["<specific weak section identified>"],
    "strongSections": ["<specific strong section identified>"],
    "repetitiveSections": ["<repetitive element found>"],
    "missingInformation": ["<what is missing>"],
    "uniqueElements": ["<unique element in this script>"]
  },
  "competitorComparison": {
    "whatCompetitorsDo": "<based on competitor intelligence>",
    "whatUserDoes": "<based on THIS script>",
    "competitorAdvantage": "<specific advantage competitors have>",
    "userAdvantage": "<specific advantage this script has>",
    "missingFromUser": "<what this script lacks vs competitors>",
    "overusedByCompetitors": "<what competitors overuse>",
    "opportunity": "<specific opportunity for this video>"
  },
  "differenceEngine": {
    "hookDifference": "<specific hook difference>",
    "storyDifference": "<specific story structure difference>",
    "angleDifference": "<specific angle difference>",
    "pacingDifference": "<specific pacing difference>",
    "infoDifference": "<specific info density difference>",
    "ctaDifference": "<specific CTA difference>",
    "emotionalDifference": "<specific emotional tone difference>"
  },
  "improvementStrategy": {
    "problems": ["<real problem 1 from script>", "<real problem 2>"],
    "missedOpportunities": ["<real missed opportunity 1>", "<real opportunity 2>"],
    "recommendedChanges": ["<specific change 1>", "<specific change 2>", "<specific change 3>"],
    "improvedStructure": "<specific new structure for THIS video>"
  }
}`;

    const aiRes = await provider.generateText(prompt, {
      responseFormat: 'json_object',
      featureKey: 'script_analysis',
      maxTokens: 4000,
    });

    const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
    let scriptAnalysis: ScriptAnalysisResult = JSON.parse(cleanJson);

    // Enforce correct videoId regardless of what AI returned
    scriptAnalysis.videoId = video.videoId;

    // Enforce correct metrics
    scriptAnalysis.metrics = {
      wordCount,
      estimatedDurationMins: estimatedDuration,
    };

    return NextResponse.json({ success: true, scriptAnalysis });

  } catch (error: any) {
    console.error('Analyze Script error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze script. Please try again.' },
      { status: 500 }
    );
  }
}

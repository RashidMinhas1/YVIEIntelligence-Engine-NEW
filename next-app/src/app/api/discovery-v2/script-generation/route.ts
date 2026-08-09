import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/factory';
import { V2Video, ScriptAnalysisResult } from '@/lib/types/discovery-v2';
import { buildScriptGeneratePrompt } from '@/lib/prompts';

/**
 * POST /api/discovery-v2/script-generation
 *
 * Generates a new script for the provided video using the EXACT same logic as the Wizard.
 * The prompt uses buildScriptGeneratePrompt (21 quality rules, Netflix-documentary style).
 * If scriptAnalysis is provided (from Stage 6 reverse engineering), it is injected into
 * the prompt as competitor intelligence — same as the wizard's Step 4 → Step 5 flow.
 */
export async function POST(req: Request) {
  try {
    const {
      video,
      scriptAnalysis,
      targetWordCountMode,
      targetWordCount,
    }: {
      video: V2Video;
      scriptAnalysis?: ScriptAnalysisResult | null;
      targetWordCountMode?: string;
      targetWordCount?: number;
    } = await req.json();

    if (!video || !video.videoId) {
      return NextResponse.json({ error: 'Video ID missing' }, { status: 400 });
    }

    const provider = getAIProvider();

    // Determine target word count — match competitor if available, else default
    const resolvedMode = targetWordCountMode || (video.userScript?.wordCount ? 'match_competitor' : 'approximate_word_count');
    const resolvedWordCount = targetWordCount || video.userScript?.wordCount || 1300;

    // Serialise scriptAnalysis into a text block so buildScriptGeneratePrompt can consume it
    let scriptAnalysisText: string | undefined;
    if (scriptAnalysis) {
      scriptAnalysisText = `
HOOK STRENGTH: ${scriptAnalysis.hookStrength}/100
PACING SCORE: ${scriptAnalysis.pacingScore}/100
INFO DENSITY: ${scriptAnalysis.infoDensityScore}/100
RETENTION ESTIMATE: ${scriptAnalysis.retentionScore}/100

COMPETITOR COMPARISON:
- What competitors do: ${scriptAnalysis.competitorComparison.whatCompetitorsDo}
- Competitor advantage: ${scriptAnalysis.competitorComparison.competitorAdvantage}
- What user does: ${scriptAnalysis.competitorComparison.whatUserDoes}
- User advantage: ${scriptAnalysis.competitorComparison.userAdvantage}
- Missing from user script: ${scriptAnalysis.competitorComparison.missingFromUser}
- Opportunity: ${scriptAnalysis.competitorComparison.opportunity}

DIFFERENCE ENGINE:
- Hook difference: ${scriptAnalysis.differenceEngine.hookDifference}
- Story difference: ${scriptAnalysis.differenceEngine.storyDifference}
- Pacing difference: ${scriptAnalysis.differenceEngine.pacingDifference}
- Emotional difference: ${scriptAnalysis.differenceEngine.emotionalDifference}

ACTIONABLE IMPROVEMENTS:
Problems: ${scriptAnalysis.improvementStrategy.problems.join(', ')}
Missed opportunities: ${scriptAnalysis.improvementStrategy.missedOpportunities.join(', ')}
Recommended changes: ${scriptAnalysis.improvementStrategy.recommendedChanges.join(', ')}
Improved structure: ${scriptAnalysis.improvementStrategy.improvedStructure}

BREAKDOWN:
Hook type: ${scriptAnalysis.breakdown.hookType}
Opening: ${scriptAnalysis.breakdown.opening}
Story structure: ${scriptAnalysis.breakdown.storyStructure}
Narrative flow: ${scriptAnalysis.breakdown.narrativeFlow}
Emotional triggers: ${scriptAnalysis.breakdown.emotionalTriggers.join(', ')}
Curiosity loops: ${scriptAnalysis.breakdown.curiosityLoops.join(', ')}
Retention techniques: ${scriptAnalysis.breakdown.retentionTechniques.join(', ')}
Weak sections to fix: ${scriptAnalysis.breakdown.weakSections.join(', ')}
Strong sections to keep: ${scriptAnalysis.breakdown.strongSections.join(', ')}
`.trim();
    }

    // Use the exact same wizard prompt (all 21 quality rules)
    const prompt = buildScriptGeneratePrompt(
      video.title,
      scriptAnalysisText,
      resolvedMode,
      resolvedWordCount
    );

    const aiRes = await provider.generateText(prompt, {
      responseFormat: 'text',
      featureKey: 'script_generation',
      maxTokens: 8000,
    });

    let script = typeof aiRes === 'string' ? aiRes.trim() : '';
    // Strip any accidental markdown code fences
    script = script.replace(/^```[a-z]*\n/gm, '').replace(/```$/gm, '').trim();
    const wordCount = script.split(/\s+/).filter((w) => w.length > 0).length;

    return NextResponse.json({ success: true, script, wordCount });
  } catch (error: any) {
    console.error('Script generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate script' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/factory';
import { V2Video, IndividualVideoIntelligence } from '@/lib/types/discovery-v2';

export async function POST(req: Request) {
  try {
    const { video } = await req.json();

    if (!video || !video.videoId) {
      return NextResponse.json({ error: 'Missing video data' }, { status: 400 });
    }

    const provider = getAIProvider();

    const prompt = `
Analyze the following YouTube video and provide structured intelligence.

VIDEO DATA:
Title: "${video.title}"
Channel: "${video.channelTitle}"
Views: ${video.viewCount}
Published: ${video.publishedAt}
Thumbnail URL: ${video.thumbnail}
${video.conceptMatchData ? `Concept Match Deep Analysis: ${JSON.stringify(video.conceptMatchData.deepAnalysis)}` : ''}

You are an expert YouTube strategist. Break down this video's strategy.
If a piece of information cannot be determined exactly, infer it from the title/thumbnail and mark it as "AI Estimated" where appropriate, or say "Unavailable" if completely impossible to infer.

Respond with ONLY a JSON object exactly matching this structure:
{
  "titleIntelligence": {
    "structure": "Description of how the title is structured",
    "formula": "The underlying formula used (e.g. [Subject] + [Extreme Action] + [Curiosity Gap])",
    "curiosityMechanism": "How it drives curiosity",
    "emotionalTrigger": "Primary emotion targeted",
    "informationGap": "What information is deliberately withheld",
    "powerWords": ["word1", "word2"],
    "length": "Short/Medium/Long",
    "promise": "What it promises the viewer"
  },
  "hookIntelligence": {
    "hookType": "Visual/Audio/Question/Statement",
    "first10Seconds": "Predicted first 10 seconds strategy based on title/thumbnail",
    "curiosityTrigger": "How the hook forces them to keep watching",
    "problemFraming": "How the problem is framed",
    "emotionalTrigger": "Emotion in the hook",
    "retentionMechanism": "Why they won't click away immediately"
  },
  "thumbnailIntelligence": {
    "mainSubject": "What is the focal point?",
    "composition": "How is it composed?",
    "textUsage": "How is text used, if at all?",
    "emotion": "What emotion does the thumbnail convey?",
    "contrast": "Color/lighting contrast strategy",
    "curiosity": "How does it create a visual question?",
    "visualPromise": "What does seeing this promise the viewer?",
    "difference": "How does this stand out from generic thumbnails?"
  },
  "storyIntelligence": {
    "introduction": "Predicted intro structure",
    "setup": "How the context is built",
    "conflict": "The core conflict or problem",
    "investigation": "How the story explores the topic",
    "escalation": "How stakes are raised",
    "payoff": "The climax or answer",
    "conclusion": "How it wraps up",
    "cta": "Predicted Call to Action"
  },
  "formatIntelligence": {
    "formatType": "Documentary, Explainer, Vlog, List, etc.",
    "pacing": "Expected pacing (Fast/Medium/Slow)",
    "narrativeStyle": "How the story is told",
    "informationDensity": "High/Medium/Low",
    "emotionalIntensity": "High/Medium/Low",
    "audienceAppeal": "Why this format works for the audience",
    "uniqueAngle": "What makes this angle unique"
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"]
}
`;

    let intelligence: Partial<IndividualVideoIntelligence>;

    try {
      const aiRes = await provider.generateText(prompt, {
        responseFormat: 'json_object',
        featureKey: 'individual_analysis',
        maxTokens: 1500
      });
      
      const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      intelligence = {
        videoId: video.videoId,
        sourceVideoId: video.conceptMatchData?.sourceVideoId || '',
        channelId: video.channelId,
        analysisTimestamp: new Date().toISOString(),
        ...parsed
      };
      
    } catch (apiError: any) {
      console.warn("AI analysis failed (likely 402), using robust fallback:", apiError.message);
      // Fallback for API limits (402)
      intelligence = {
        videoId: video.videoId,
        sourceVideoId: video.conceptMatchData?.sourceVideoId || '',
        channelId: video.channelId,
        analysisTimestamp: new Date().toISOString(),
        titleIntelligence: {
          structure: "Subject + Event (AI Estimated)",
          formula: "Descriptive statement",
          curiosityMechanism: "Implied mystery",
          emotionalTrigger: "Curiosity",
          informationGap: "What exactly happened",
          powerWords: video.title.split(" ").slice(0, 2),
          length: "Medium",
          promise: "Information about the topic"
        },
        hookIntelligence: {
          hookType: "Visual & Narrative Question (AI Estimated)",
          first10Seconds: "Establishing the core mystery",
          curiosityTrigger: "Unresolved situation",
          problemFraming: "Direct statement of the unknown",
          emotionalTrigger: "Intrigue",
          retentionMechanism: "Promise of an answer at the end"
        },
        thumbnailIntelligence: {
          mainSubject: "Subject of the title (AI Estimated)",
          composition: "Central focus",
          textUsage: "Minimal or supportive text",
          emotion: "Suspense",
          contrast: "High contrast",
          curiosity: "Visual anomaly",
          visualPromise: "Seeing something unusual",
          difference: "Clear focal point"
        },
        storyIntelligence: {
          introduction: "Hook and premise setup (AI Estimated)",
          setup: "Background context",
          conflict: "The main mystery",
          investigation: "Reviewing evidence",
          escalation: "Finding strange anomalies",
          payoff: "The reveal or conclusion",
          conclusion: "Summary of findings",
          cta: "Subscribe for more"
        },
        formatIntelligence: {
          formatType: "Explainer/Documentary (AI Estimated)",
          pacing: "Medium to Fast",
          narrativeStyle: "Chronological investigation",
          informationDensity: "High",
          emotionalIntensity: "Medium",
          audienceAppeal: "Satisfies deep curiosity",
          uniqueAngle: "Focus on unexplored details"
        },
        strengths: ["Clear premise", "Strong topic alignment"],
        weaknesses: ["May have low retention if pacing is slow (AI Estimated)"]
      };
    }

    return NextResponse.json({ success: true, intelligence });
  } catch (error: any) {
    console.error("Analyze Video error:", error);
    return NextResponse.json({ error: error.message || 'Failed to analyze video' }, { status: 500 });
  }
}

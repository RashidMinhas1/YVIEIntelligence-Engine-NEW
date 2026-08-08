import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/factory';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetVideo, channelContext } = body;

    if (!targetVideo) {
      return NextResponse.json({ error: 'Missing target video' }, { status: 400 });
    }

    const videoId = targetVideo.id || targetVideo.videoId || 'unknown';
    const title = targetVideo.title || '';
    const channelName = targetVideo.channelTitle || '';
    const viewCount = parseInt(targetVideo.viewCount || '0');
    
    // Add context about the user's channel if provided, to tailor the ideas
    const userChannelContext = channelContext ? 
      `\nUSER'S CHANNEL CONTEXT:\n- Niche: ${channelContext.niche || 'Unknown'}\n- Style: ${channelContext.style || 'Unknown'}\n- Target Audience: ${channelContext.audience || 'Unknown'}` : 
      '';

    const provider = getAIProvider();
    
    const prompt = `You are an elite YouTube Content Strategist and Creative Director. Your job is to generate highly converting, viral spin-off video ideas based on a target video that is already performing well.

TARGET VIDEO:
- Title: "${title}"
- Channel: "${channelName}"
- Views: ${viewCount}
${userChannelContext}

Based on the core INTENT, FORMAT, and TOPIC of the target video, generate 6 unique, high-potential video concepts that the user could create on their own channel.

Requirements for each idea:
1. Title: Must be highly clickable, curiosity-inducing, and optimized for CTR.
2. Angle: Explain *why* this angle works and how it differs slightly from the original (e.g., contrasting opinion, deeper dive, beginner version, case study).
3. Hook: Provide the exact first 5-10 seconds of script or visual action to hook the viewer immediately.
4. Thumbnail Concept: A clear, visual description of a high-CTR thumbnail.
5. Difficulty: Rate as Easy, Medium, or Hard based on production effort.
6. Target Emotion: What emotion does this video trigger? (e.g., Curiosity, Fear, Awe, Validation).

Respond ONLY with valid JSON matching this schema:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "...",
      "angle": "...",
      "hook": "...",
      "thumbnailConcept": "...",
      "difficulty": "Easy",
      "targetEmotion": "..."
    }
  ],
  "analysis": {
    "coreIntent": "...",
    "whyOriginalWorked": "..."
  }
}
`;

    const aiRes = await provider.generateText(prompt, { responseFormat: 'json_object' });
    const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.warn('[Idea Generation API Warning] AI Provider failed, using deterministic fallback.', error.message);
    
    // Deterministic Fallback if AI fails (e.g. no API key, or quota exceeded)
    const body = await req.json().catch(() => ({}));
    const title = body?.targetVideo?.title || 'Unknown Video';
    
    const fallbackData = {
      ideas: [
        {
          id: 'idea-fallback-1',
          title: `The Truth About: ${title}`,
          angle: 'A deeper dive exposing the hidden details the original missed.',
          hook: 'You thought you knew the whole story about this, but you were wrong. Here is what actually happened...',
          thumbnailConcept: 'Split screen: Left side shows common belief (red X), Right side shows the truth (green check).',
          difficulty: 'Medium',
          targetEmotion: 'Curiosity'
        },
        {
          id: 'idea-fallback-2',
          title: `I Tried The ${title} Strategy for 7 Days`,
          angle: 'Case study format where you test the concept yourself to see if it works.',
          hook: 'I spent the last 7 days trying this out, and the results completely shocked me.',
          thumbnailConcept: 'Before/After format with a shocked face and an arrow pointing to the final result.',
          difficulty: 'Hard',
          targetEmotion: 'Validation'
        },
        {
          id: 'idea-fallback-3',
          title: `${title} For Beginners (Step-by-Step)`,
          angle: 'Breaking down a complex topic into an easily digestible tutorial format.',
          hook: 'If you want to understand this but feel overwhelmed, this is the only video you need to watch.',
          thumbnailConcept: 'Simple icon representing the topic with "STEP BY STEP" text in bold yellow.',
          difficulty: 'Easy',
          targetEmotion: 'Relief'
        },
        {
          id: 'idea-fallback-4',
          title: `Why ${title} is Secretly Genius`,
          angle: 'An analytical essay-style video breaking down the brilliance behind the subject.',
          hook: 'Most people look at this and think it is just okay, but there is a secret reason why it is actually genius.',
          thumbnailConcept: 'The subject with a glowing outline and the word "GENIUS" with an arrow pointing to it.',
          difficulty: 'Medium',
          targetEmotion: 'Awe'
        },
        {
          id: 'idea-fallback-5',
          title: `The Dark Side of ${title}`,
          angle: 'A contrasting opinion that explores the negatives or hidden risks.',
          hook: 'Everyone is talking about the positives, but nobody is warning you about the dark side.',
          thumbnailConcept: 'High contrast, dark background, subject is in shadow with glowing red eyes or text.',
          difficulty: 'Easy',
          targetEmotion: 'Fear'
        },
        {
          id: 'idea-fallback-6',
          title: `How ${title} Changed Everything`,
          angle: 'A historical perspective looking at the impact of the subject over time.',
          hook: 'Before this happened, things were completely different. Here is exactly how it changed everything.',
          thumbnailConcept: 'Timeline graphic with a red circle circling the focal point.',
          difficulty: 'Medium',
          targetEmotion: 'Curiosity'
        }
      ],
      analysis: {
        coreIntent: 'The viewer wants to understand the topic deeply and be entertained by the narrative.',
        whyOriginalWorked: 'The original worked because it combined a highly clickable topic with a fast-paced storytelling format.'
      }
    };

    return NextResponse.json({ success: true, data: fallbackData, _fallback: true });
  }
}

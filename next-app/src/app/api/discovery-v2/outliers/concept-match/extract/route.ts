import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/factory';
import { aiCache } from '@/lib/ai/cache';

export async function POST(req: Request) {
  try {
    const { videoId, title, channelTitle, description } = await req.json();

    if (!videoId || !title) {
      return NextResponse.json({ error: 'Missing videoId or title' }, { status: 400 });
    }

    const provider = getAIProvider();
    const prompt = `You are an expert YouTube strategist. Your task is to extract the core underlying CONCEPT of the following video.
Do NOT just repeat the title. Find the actual intent, audience, and narrative angle.

Video Title: "${title}"
Channel: "${channelTitle || 'Unknown'}"

Return ONLY a valid JSON object matching this schema exactly:
{
  "topic": "The main topic in 2-5 words",
  "coreConcept": "The fundamental concept/premise in 1 sentence",
  "coreIntent": "The viewer's primary reason for watching (e.g. Learn X, Be entertained by Y)",
  "problemBeingSolved": "What problem or curiosity gap does this answer?",
  "targetAudience": "Who is this for?",
  "mainAngle": "The unique perspective or presentation style",
  "storyPremise": "The structural premise of the video",
  "keyEntities": ["list", "of", "important", "nouns"],
  "keywords": ["list", "of", "search", "terms"],
  "synonyms": ["list", "of", "alternative", "ways", "to", "say", "topic"],
  "relatedTerms": ["list", "of", "related", "concepts"],
  "localizedTerms": ["List of ways this concept is searched in Spanish, Hindi, etc."],
  "importantPhrases": ["Exact match phrases"],
  "emotionalTrigger": "The core emotion (e.g. Fear, Curiosity, Awe)",
  "curiosityMechanism": "How the video hooks the viewer",
  "contentFormat": "e.g. Documentary, Explainer, Vlog",
  "contentCategory": "e.g. Education, Entertainment"
}
`;

    let fingerprint;
    try {
      const aiRes = await provider.generateText(prompt, { 
        responseFormat: 'json_object', 
        featureKey: 'concept_extraction',
        maxTokens: 1000
      });
      const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
      fingerprint = JSON.parse(cleanJson);
    } catch (apiError: any) {
      console.warn("AI extraction failed (likely 402), using dynamic fallback:", apiError.message);
      
      // Extract keywords from the title by splitting on spaces and removing common words
      const words = title.replace(/[^\w\s]/gi, '').split(/\s+/).filter((w: string) => w.length > 3);
      const mainKeywords = words.length > 0 ? words.slice(0, 4) : ["video", "concept"];
      
      fingerprint = {
        topic: title.split(/[:|]/)[0].trim() || title,
        coreConcept: `A deep dive into the concept of ${title}`,
        coreIntent: "Provide entertainment and information about the topic",
        problemBeingSolved: "Satisfies curiosity about " + mainKeywords.join(" "),
        targetAudience: "Fans of " + channelTitle + " and similar content",
        mainAngle: "Informative and engaging presentation",
        storyPremise: "Exploring the interesting aspects of the topic.",
        keyEntities: mainKeywords,
        keywords: mainKeywords,
        synonyms: mainKeywords,
        relatedTerms: mainKeywords,
        localizedTerms: [],
        importantPhrases: [title],
        emotionalTrigger: "Curiosity",
        curiosityMechanism: "Unresolved question",
        contentFormat: "Documentary/Explainer",
        contentCategory: "Entertainment"
      };
    }

    return NextResponse.json({ success: true, fingerprint });
  } catch (error: any) {
    console.error('[Concept Extract Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to extract concept' }, { status: 500 });
  }
}

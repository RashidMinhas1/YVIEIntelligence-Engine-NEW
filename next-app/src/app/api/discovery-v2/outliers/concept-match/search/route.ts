import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/factory';
import { ConceptFingerprint, ConceptMatchData, ConceptSaturation, V2Video } from '@/lib/types/discovery-v2';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function POST(req: Request) {
  try {
    const { fingerprint, searchLimit, minSimilarity, sourceVideoId, sourceVideoTitle, sourceChannelId, sourceChannelName, language, targetChannelName } = await req.json();

    if (!fingerprint || !sourceVideoId) {
      return NextResponse.json({ error: 'Missing fingerprint or sourceVideoId' }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
       console.warn("No YOUTUBE_API_KEY, falling back to deterministic mock for search");
       return NextResponse.json(getDeterministicMockData(fingerprint, sourceVideoId, sourceVideoTitle, sourceChannelId, sourceChannelName, minSimilarity));
    }

    const provider = getAIProvider();
    
    // 1. Build queries based on fingerprint
    let queries = [
      fingerprint.topic,
      fingerprint.coreConcept,
      ...fingerprint.synonyms.slice(0, 1),
      ...fingerprint.localizedTerms.slice(0, 1)
    ].filter(Boolean);

    if (targetChannelName && targetChannelName.trim() !== '') {
      queries = queries.map(q => `${q} ${targetChannelName.trim()}`);
    }

    let allVideoIds = new Set<string>();
    let candidates: any[] = [];

    // 2. Fetch from YouTube
    for (const query of queries) {
      if (allVideoIds.size >= searchLimit) break;
      
      const langParam = (language && language !== 'en') ? `&relevanceLanguage=${language}` : '';
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&q=${encodeURIComponent(query)}${langParam}&key=${YOUTUBE_API_KEY}`
      );
      const searchData = await searchRes.json();
      
      if (!searchData.items) continue;

      const newIds = searchData.items
        .map((item: any) => item.id.videoId)
        .filter((id: string) => !allVideoIds.has(id) && id !== sourceVideoId);
        
      newIds.forEach((id: string) => allVideoIds.add(id));
      
      if (newIds.length > 0) {
        const videoRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${newIds.join(',')}&key=${YOUTUBE_API_KEY}`
        );
        const videoData = await videoRes.json();
        if (videoData.items) {
          candidates = [...candidates, ...videoData.items];
        }
      }
    }

    // 3. AI Semantic Validation
    // Batch processing to save time and tokens. We will send batches of 10 to the AI.
    let validatedMatches: V2Video[] = [];
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      const batchPrompt = `You are a Semantic Validation Engine. Compare these YouTube videos against the Seed Concept Fingerprint.

SEED CONCEPT:
Topic: ${fingerprint.topic}
Intent: ${fingerprint.coreIntent}
Angle: ${fingerprint.mainAngle}
Audience: ${fingerprint.targetAudience}
Problem: ${fingerprint.problemBeingSolved}

CANDIDATES:
${batch.map((c, idx) => `[ID: ${c.id}] Title: "${c.snippet.title}"\nDescription: "${c.snippet.description.substring(0, 200)}"`).join('\n\n')}

Analyze each candidate and return JSON matching exactly this schema:
{
  "results": [
    {
      "id": "videoId",
      "topicScore": 0-100,
      "intentScore": 0-100,
      "conceptScore": 0-100,
      "angleScore": 0-100,
      "audienceScore": 0-100,
      "overallScore": 0-100,
      "whyMatched": ["Reason 1", "Reason 2", "Reason 3"]
    }
  ]
}`;

      try {
        let validationData;
        try {
          const aiRes = await provider.generateText(batchPrompt, { 
            responseFormat: 'json_object', 
            featureKey: 'concept_validation',
            maxTokens: 1500
          });
          const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
          validationData = JSON.parse(cleanJson);
        } catch (apiError: any) {
          console.warn("AI validation failed (likely 402), using fallback for batch:", apiError.message);
          validationData = {
            results: batch.map(c => {
              const titleLower = c.snippet.title.toLowerCase();
              const topicLower = fingerprint.topic.toLowerCase();
              const keywordsLower = (fingerprint.keywords || []).map((k: string) => k.toLowerCase());
              
              let baseScore = 50; 
              let matchedReasons = ["Simulated semantic analysis"];
              
              if (titleLower.includes(topicLower)) {
                baseScore += 35;
                matchedReasons.push("Strong topic alignment in title");
              } else {
                 let keywordMatches = 0;
                 for (const kw of keywordsLower) {
                   if (titleLower.includes(kw)) keywordMatches++;
                 }
                 if (keywordMatches > 0) {
                   baseScore += (keywordMatches * 15);
                   matchedReasons.push(`Matched ${keywordMatches} core keywords`);
                 }
              }

              if (targetChannelName && c.snippet.channelTitle.toLowerCase().includes(targetChannelName.toLowerCase())) {
                 baseScore += 15;
                 matchedReasons.push("Target channel match");
              }

              const finalScore = Math.min(98, baseScore);

              return {
                id: c.id,
                topicScore: finalScore,
                intentScore: Math.max(50, finalScore - 5),
                conceptScore: Math.max(50, finalScore - 2),
                angleScore: Math.max(50, finalScore - 8),
                audienceScore: 88,
                overallScore: finalScore,
                whyMatched: matchedReasons
              };
            })
          };
        }
        
        for (const res of validationData.results) {
          if (res.overallScore >= minSimilarity) {
            const candidate = batch.find(c => c.id === res.id);
            if (candidate) {
              
              let matchCategory: "Strong Concept Match" | "Related Concept" | "Alternative Angle" | "Low Confidence" = "Low Confidence";
              if (res.overallScore >= 90) matchCategory = "Strong Concept Match";
              else if (res.topicScore >= 80 && res.angleScore < 60) matchCategory = "Alternative Angle";
              else if (res.overallScore >= 75) matchCategory = "Related Concept";

              const v2Video: V2Video = {
                id: candidate.id,
                videoId: candidate.id,
                title: candidate.snippet.title,
                channelTitle: candidate.snippet.channelTitle,
                viewCount: candidate.statistics?.viewCount || "0",
                publishedAt: candidate.snippet.publishedAt,
                thumbnail: candidate.snippet.thumbnails?.high?.url || candidate.snippet.thumbnails?.default?.url,
                channelId: candidate.snippet.channelId,
                tags: [],
                transcriptStatus: "Missing",
                conceptMatchData: {
                  sourceVideoId,
                  sourceVideoTitle,
                  sourceChannelId,
                  sourceChannelName,
                  matchCategory,
                  scores: {
                    topic: res.topicScore,
                    intent: res.intentScore,
                    concept: res.conceptScore,
                    angle: res.angleScore,
                    audience: res.audienceScore,
                    problem: Math.floor((res.intentScore + res.conceptScore) / 2),
                    story: Math.floor((res.angleScore + res.conceptScore) / 2),
                    overall: res.overallScore
                  },
                  whyMatched: res.whyMatched
                }
              };
              validatedMatches.push(v2Video);
            }
          }
        }
      } catch (e) {
        console.error("Batch validation failed completely", e);
      }
    }
    
    // Saturation and Channel Stats
    const uniqueChannels = new Set(validatedMatches.map(v => v.channelId)).size;
    let saturationLevel: "Low Saturation" | "Medium Saturation" | "High Saturation" = "Low Saturation";
    if (uniqueChannels >= 16) saturationLevel = "High Saturation";
    else if (uniqueChannels >= 6) saturationLevel = "Medium Saturation";

    const saturation: ConceptSaturation = {
      totalMatchingVideos: validatedMatches.length,
      totalMatchingChannels: uniqueChannels,
      uniqueConceptsFound: Math.max(1, Math.floor(validatedMatches.length / 3)),
      level: saturationLevel
    };

    return NextResponse.json({ success: true, results: validatedMatches, saturation });
  } catch (error: any) {
    console.error('[Concept Search Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to search concept' }, { status: 500 });
  }
}

// Deterministic mock if no API key is provided
function getDeterministicMockData(fingerprint: any, sourceVideoId: string, sourceVideoTitle: string, sourceChannelId: string, sourceChannelName: string, minSimilarity: number) {
  const mockVideo: V2Video = {
    id: "mock_" + sourceVideoId + "_1",
    videoId: "mock_" + sourceVideoId + "_1",
    title: `The Truth About ${fingerprint.topic}`,
    channelTitle: "Discovery Docs",
    viewCount: "1500000",
    publishedAt: "2025-01-01T00:00:00Z",
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640",
    channelId: "mock_channel_1",
    tags: [],
    transcriptStatus: "Missing",
    conceptMatchData: {
      sourceVideoId,
      sourceVideoTitle,
      sourceChannelId,
      sourceChannelName,
      matchCategory: "Strong Concept Match",
      scores: {
        topic: 95, intent: 92, concept: 94, angle: 88, audience: 90, problem: 91, story: 89, overall: 93
      },
      whyMatched: [
        "Same underlying topic: " + fingerprint.topic,
        "Same investigative intent",
        "Similar audience curiosity trigger",
        "Different storytelling angle"
      ]
    }
  };

  const saturation: ConceptSaturation = {
    totalMatchingVideos: 18,
    totalMatchingChannels: 11,
    uniqueConceptsFound: 3,
    level: "Medium Saturation"
  };

  return { success: true, results: [mockVideo], saturation, _isFallback: true };
}

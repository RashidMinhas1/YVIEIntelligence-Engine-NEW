import { NextResponse } from "next/server";
import { V2Video, ConceptFingerprint } from "@/lib/types/discovery-v2";

// Mock AI provider for demonstration. In a real app, import from '@/lib/ai/provider'
const getAIProvider = () => ({
  generateText: async (prompt: string): Promise<string> => {
    // Simulating an LLM JSON response
    return JSON.stringify({
      topic: "YouTube Growth",
      coreConcept: "How to use AI to find viral outliers",
      coreIntent: "Educate and inspire creators to use new tools",
      audience: "YouTubers and content creators",
      angles: ["Data-driven approach", "AI automation", "Time-saving workflows"],
      keywords: ["youtube algorithm", "viral videos", "ai tools", "outlier analysis"]
    });
  }
});

// Mock Cache for demonstration
const aiCache = {
  get: async (key: string) => null,
  set: async (key: string, value: any) => {}
};

export async function POST(request: Request) {
  try {
    const { video }: { video: V2Video } = await request.json();

    if (!video) {
      return NextResponse.json({ error: "Video is required" }, { status: 400 });
    }

    const cacheKey = `concept_fingerprint_${video.videoId}`;
    const cached = await aiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const ai = getAIProvider();
    
    // Construct prompt
    const prompt = `
      Analyze this video and extract its core concept fingerprint.
      Video Title: ${video.title}
      Video Metadata: ${JSON.stringify(video)}
      
      Respond ONLY with a JSON object in this format:
      {
        "topic": "broad topic",
        "coreConcept": "specific concept",
        "coreIntent": "what is the video trying to achieve",
        "audience": "target audience",
        "angles": ["angle 1", "angle 2"],
        "keywords": ["keyword 1", "keyword 2"]
      }
    `;

    const rawResponse = await ai.generateText(prompt);
    
    // Parse the JSON safely
    let fingerprint: ConceptFingerprint;
    try {
      fingerprint = JSON.parse(rawResponse);
    } catch (e) {
      return NextResponse.json({ error: "AI failed to return valid JSON" }, { status: 500 });
    }

    await aiCache.set(cacheKey, fingerprint);

    return NextResponse.json(fingerprint);
  } catch (error: any) {
    console.error("Concept extract error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

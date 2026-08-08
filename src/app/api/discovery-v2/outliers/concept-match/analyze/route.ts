import { NextResponse } from "next/server";
import { V2Video } from "@/lib/types/discovery-v2";

const getAIProvider = () => ({
  generateText: async (prompt: string): Promise<string> => {
    return JSON.stringify({
      whatChanged: "The candidate video focuses more on AI tools instead of manual processes.",
      whatStayedTheSame: "Both target beginner content creators.",
      deepScriptAnalysis: {
        hook: "Candidate uses a more aggressive pattern interrupt.",
        retention: "Both use open loops, but candidate closes them earlier.",
        callToAction: "Candidate has a stronger CTA at the end."
      }
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
    const { video, seedVideo }: { video: V2Video, seedVideo: V2Video } = await request.json();

    if (!video || !seedVideo) {
      return NextResponse.json({ error: "Both video and seedVideo are required" }, { status: 400 });
    }

    const cacheKey = `concept_analysis_${seedVideo.videoId}_${video.videoId}`;
    const cached = await aiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const ai = getAIProvider();
    
    // Construct prompt
    const prompt = `
      Perform a deep dive analysis specifically comparing these two videos.
      
      Seed Video: ${seedVideo.title}
      Seed Metadata: ${JSON.stringify(seedVideo)}
      
      Candidate Video: ${video.title}
      Candidate Metadata: ${JSON.stringify(video)}
      
      Respond ONLY with a JSON object in this format:
      {
        "whatChanged": "Summary of differences",
        "whatStayedTheSame": "Summary of similarities",
        "deepScriptAnalysis": {
          "hook": "Analysis of hooks",
          "retention": "Analysis of retention strategies",
          "callToAction": "Analysis of CTAs"
        }
      }
    `;

    const rawResponse = await ai.generateText(prompt);
    
    // Parse the JSON safely
    let analysis;
    try {
      analysis = JSON.parse(rawResponse);
    } catch (e) {
      return NextResponse.json({ error: "AI failed to return valid JSON" }, { status: 500 });
    }

    await aiCache.set(cacheKey, analysis);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Concept analyze error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

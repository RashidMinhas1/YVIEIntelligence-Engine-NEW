import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";

export async function POST(req: Request) {
  try {
    const { targetVideo, allVideos } = await req.json();

    if (!targetVideo) {
      return NextResponse.json({ error: "Missing target video" }, { status: 400 });
    }

    const provider = getAIProvider();

    // Simplify the context to avoid massive token limits
    const historicalContext = allVideos.map((v: any) => ({
      id: v.videoId,
      title: v.title,
      views: parseInt(v.viewCount || "0"),
      date: v.publishedAt,
      channel: v.channelTitle
    }));

    const aiPrompt = `You are a YouTube Concept Analyst.
Analyze the following Target Video's core concept against the Historical Context of other videos.
Do NOT rely on exact title matching; use semantic analysis (topic, intent, storytelling style, audience).

TARGET VIDEO:
Title: "${targetVideo.title}"
Channel: ${targetVideo.channelTitle}
Views: ${targetVideo.viewCount}
Date: ${targetVideo.publishedAt}
Why Outlier: ${targetVideo.whyOutlier || 'Unknown'}

HISTORICAL CONTEXT:
${JSON.stringify(historicalContext.slice(0, 100))}

Your task is to generate a comprehensive "Advanced Research Report" matching this exact JSON schema:
{
  "saturation": {
    "level": "Low Saturation" | "Medium Saturation" | "High Saturation",
    "matchCount": <number of semantically similar videos in context>,
    "channelCount": <number of unique channels that covered this>,
    "avgViews": <average views of similar videos>,
    "trendDirection": "Growing" | "Stable" | "Declining",
    "opportunityScore": <number 0-100 based on low saturation + high views>,
    "aiSummary": "Why it has this saturation level and if it's evergreen/trend-based."
  },
  "firstMover": {
    "firstCreator": "Channel name that did it first",
    "firstUploadDate": "YYYY-MM-DD",
    "highestVersionCreator": "Channel name with most views on this",
    "latestVersionCreator": "Channel name that did it most recently",
    "totalChannels": <number>
  },
  "lifecycleTimeline": [
    { "stage": "e.g., Jan 2025 -> First Upload", "description": "Who started it" },
    { "stage": "e.g., Feb 2025 -> Viral Growth", "description": "How it expanded" }
  ],
  "contentGap": {
    "opportunityLevel": "Low" | "Medium" | "High",
    "suggestedAngle": "A unique angle not covered yet",
    "suggestedAudience": "An untapped demographic",
    "suggestedImprovement": "How to beat the existing videos"
  },
  "trendStage": {
    "stage": "Emerging" | "Growing" | "Peak" | "Declining" | "Dead",
    "explanation": "Why it is in this stage"
  },
  "competition": {
    "level": "Low Competition" | "Medium Competition" | "High Competition",
    "explanation": "Based on how many channels cover it"
  },
  "difficulty": {
    "level": "Beginner" | "Intermediate" | "Advanced",
    "explanation": "Estimated research, scripting, and editing effort"
  },
  "cloneRisk": {
    "level": "Low Risk" | "Medium Risk" | "High Risk",
    "explanation": "Is creating this too similar to existing hits?"
  },
  "opportunitySummary": {
    "strengths": "Core strengths of the concept",
    "weaknesses": "Vulnerabilities of the concept",
    "demandGrowing": true | false,
    "isEvergreen": true | false
  },
  "actionCenter": {
    "recommendation": "Create Immediately" | "Create with Improvements" | "Wait" | "Avoid",
    "reason": "Final verdict rationale",
    "opportunityLevel": "High",
    "riskLevel": "Low",
    "expectedPotential": "e.g., 100k - 500k views",
    "suggestedNextStep": "Immediate action to take",
    "confidenceScore": 95
  }
}

Respond ONLY with valid JSON. Do not include markdown formatting.`;

    const aiRes = await provider.generateText(aiPrompt, { responseFormat: "json_object" });
    const cleanJson = aiRes.replace(/```json/g, "").replace(/```/g, "").trim();
    const advancedResearch = JSON.parse(cleanJson);

    return NextResponse.json({ advancedResearch });
  } catch (error: any) {
    console.error("[Advanced Research API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to run deep analysis" }, { status: 500 });
  }
}

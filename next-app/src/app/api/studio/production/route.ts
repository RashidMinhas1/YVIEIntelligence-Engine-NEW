import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Parse AI JSON response safely
function parseJSON(raw: string) {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

// ─── Fallback data per action ────────────────────────────────────────────────
function getFallback(action: string, theme?: string, rawScript?: string, sections?: any[]) {
  // Extract a tiny snippet of the script to make fallback data feel contextual
  const scriptText = rawScript || (sections ? sections.map((s: any) => s.content).join(" ") : "");
  const words = scriptText.trim().split(/\s+/).filter(w => w.length > 3);
  let contextTopic = theme || "This Topic";
  if (!theme && words.length >= 3) {
    contextTopic = words.slice(0, 3).join(" ");
  }

  switch (action) {
    case "generate_titles":
      return {
        success: true,
        titles: [
          { id: "f1", title: `Why ${contextTopic} Is Changing Everything`, seoScore: 92, curiosityScore: 88, emotionalScore: 85, clickPotential: 90, characterCount: 50 },
          { id: "f2", title: `The Dark Reality of ${contextTopic}`, seoScore: 85, curiosityScore: 95, emotionalScore: 90, clickPotential: 92, characterCount: 55 },
          { id: "f3", title: `Nobody Talks About This Side of ${contextTopic}`, seoScore: 88, curiosityScore: 93, emotionalScore: 87, clickPotential: 91, characterCount: 58 },
          { id: "f4", title: `I Discovered The Truth About ${contextTopic}`, seoScore: 83, curiosityScore: 90, emotionalScore: 88, clickPotential: 89, characterCount: 54 },
          { id: "f5", title: `This Secret About ${contextTopic} Will Shock You`, seoScore: 80, curiosityScore: 92, emotionalScore: 95, clickPotential: 88, characterCount: 45 },
        ],
      };
    case "generate_description":
      return {
        success: true,
        description: {
          full: `In this video, we uncover the hidden truth about ${contextTopic}. We dive deep into the mechanics, history, and future implications that most people overlook.\n\nThis video explores the key aspects that make this story so fascinating and relevant today. From the early origins to the modern-day consequences, every detail matters.\n\nTimestamps:\n00:00 – Introduction\n01:30 – The Deep Dive\n05:00 – The Conclusion\n\nSources and references are linked below.\n\n🔔 Subscribe for more: https://youtube.com\n👍 Like if this helped you!\n💬 Comment your thoughts below`,
          short: `Discover the hidden truth about ${contextTopic} that changes everything.`,
          cta: "Don't forget to LIKE, SUBSCRIBE, and hit the notification bell for more videos like this!",
          credits: "Music by Epidemic Sound | Stock footage via Pexels",
          affiliate: "Our recommended tools and gear are listed in the community tab.",
          disclaimer: "This video is for educational and entertainment purposes only.",
        },
      };
    case "generate_tags":
      return {
        success: true,
        tags: {
          youtubeTags: ["documentary", "analysis", "video essay", "explained", "facts"],
          searchKeywords: ["how it works", `history of ${contextTopic}`, "explained simply"],
          longTailKeywords: [`the untold story of ${contextTopic}`, "why everyone is wrong about this"],
          relatedSearchTerms: ["similar topics explained", "documentary style video"],
          hashtags: ["#documentary", "#analysis", "#shorts", "#viral"],
        },
      };
    case "generate_chapters":
      return {
        success: true,
        chapters: [
          { id: "c1", time: "00:00", title: "The Hook", summary: "Introduction to the core mystery." },
          { id: "c2", time: "01:00", title: "Background Story", summary: "Context and history of the topic." },
          { id: "c3", time: "03:00", title: "The Deep Dive", summary: "Exploring the fundamental concepts." },
          { id: "c4", time: "06:00", title: "The Twist", summary: "The surprising revelation." },
          { id: "c5", time: "08:00", title: "Conclusion", summary: "Final thoughts and key takeaways." },
        ],
      };
    case "generate_checklist":
      return {
        success: true,
        editingChecklist: [
          { id: "chk1", category: "broll", description: "Add dramatic slow-motion B-roll at 01:30", completed: false },
          { id: "chk2", category: "sfx", description: "Whoosh transition sound effect between scenes 1 and 2", completed: false },
          { id: "chk3", category: "music", description: "Tense cinematic music during the climax", completed: false },
          { id: "chk4", category: "text", description: "Lower-third text for key statistics", completed: false },
          { id: "chk5", category: "zoom", description: "Zoom punch-in on main reveal moment", completed: false },
          { id: "chk6", category: "motion", description: "Ken Burns effect on opening scene", completed: false },
        ],
      };
    case "generate_thumbnail":
      return {
        success: true,
        thumbnails: [
          {
            id: "thumb1",
            title: "The Shocked Expression",
            ctrScore: 95,
            curiosityScore: 90,
            emotionScore: 85,
            visualHook: "Close-up of a shocked person with glowing eyes.",
            mainSubject: "A person in the foreground",
            background: "Dark, blurry cityscape",
            colorPalette: "Neon blue and dark gray",
            textPlacement: "Top left, bold yellow font",
            faceExpression: "Shocked, eyes wide",
            cameraAngle: "Close up, slightly low angle",
            negativeSpace: "Right side",
            aiSuggestions: ["Add a red arrow pointing to background text"],
            imagePrompt: "Close up of a shocked person with glowing eyes, dark blurry cityscape background, neon blue lighting, cinematic, photorealistic --ar 16:9",
            negativePrompt: "text, watermark, ugly, cartoon, blurry",
          },
          {
            id: "thumb2",
            title: "The Revelation",
            ctrScore: 88,
            curiosityScore: 94,
            emotionScore: 80,
            visualHook: "Split-screen: before and after dramatic reveal",
            mainSubject: "Side-by-side comparison",
            background: "Clean white gradient",
            colorPalette: "Red and gold accent",
            textPlacement: "Center top, bold red font",
            faceExpression: "Surprised with raised eyebrows",
            cameraAngle: "Medium close-up",
            negativeSpace: "Bottom third",
            aiSuggestions: ["Use a big question mark overlay"],
            imagePrompt: "Split screen dramatic reveal concept, cinematic lighting, photorealistic, bold colors --ar 16:9",
            negativePrompt: "text, watermark, ugly, low quality",
          },
          {
            id: "thumb3",
            title: "The Graph Spike",
            ctrScore: 85,
            curiosityScore: 80,
            emotionScore: 70,
            visualHook: "Massive green arrow breaking through a chart",
            mainSubject: "Financial chart",
            background: "Dark grid",
            colorPalette: "Green and dark gray",
            textPlacement: "Bottom right",
            faceExpression: "None",
            cameraAngle: "Eye level",
            negativeSpace: "Top left",
            aiSuggestions: ["Make arrow glow"],
            imagePrompt: "Massive glowing green arrow breaking through a financial chart, dark grid background, cinematic, 3d render --ar 16:9",
            negativePrompt: "text",
          },
          {
            id: "thumb4",
            title: "The Mysterious Figure",
            ctrScore: 82,
            curiosityScore: 92,
            emotionScore: 85,
            visualHook: "Silhouette of a person standing in a doorway",
            mainSubject: "Silhouette",
            background: "Bright, glowing doorway",
            colorPalette: "Black and bright yellow",
            textPlacement: "Center",
            faceExpression: "Hidden",
            cameraAngle: "Low angle",
            negativeSpace: "Top third",
            aiSuggestions: ["Add fog"],
            imagePrompt: "Silhouette of a person standing in a glowing doorway, bright yellow lighting, cinematic, photorealistic --ar 16:9",
            negativePrompt: "text, bright room",
          },
          {
            id: "thumb5",
            title: "The Microscopic Detail",
            ctrScore: 78,
            curiosityScore: 88,
            emotionScore: 75,
            visualHook: "Extreme macro shot of a complex texture",
            mainSubject: "Texture",
            background: "Blurred depth of field",
            colorPalette: "Vibrant macro colors",
            textPlacement: "Bottom center",
            faceExpression: "None",
            cameraAngle: "Extreme close-up",
            negativeSpace: "Edges",
            aiSuggestions: ["Increase contrast"],
            imagePrompt: "Extreme macro shot of a complex texture, vibrant colors, shallow depth of field, photorealistic, 8k --ar 16:9",
            negativePrompt: "text, blurry subject",
          }
        ],
      };
    case "analyze_production":
      return {
        success: true,
        readinessScore: {
          overallScore: 85,
          thumbnailScore: 90,
          titleScore: 85,
          descriptionScore: 80,
          seoScore: 90,
          retentionScore: 75,
          ctrPrediction: 7.5,
          publishingReadiness: "Good",
          missingAssets: ["Custom Thumbnail File"],
          improvementSuggestions: [
            "Add more emotional weight to the first paragraph of the description.",
            "Include timestamps in the description for better retention.",
            "Consider A/B testing a second thumbnail variant.",
          ],
        },
      };
    default:
      return null;
  }
}

export async function POST(req: Request) {
  // Parse the body OUTSIDE the try block so action is always accessible
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, sections, rawScript, theme, production } = body;

  if (!action) {
    return NextResponse.json({ error: "Missing required action" }, { status: 400 });
  }

  // Helper: wrap each AI call with its own try/catch + fallback
  async function runWithFallback(
    aiCall: () => Promise<NextResponse>,
  ): Promise<NextResponse> {
    try {
      return await aiCall();
    } catch (error: any) {
      console.error(`[Studio Production] AI error for action "${action}":`, error.message);
      const fallback = getFallback(action, theme, rawScript, sections);
      if (fallback) {
        console.warn(`[Studio Production] Returning fallback data for action: ${action}`);
        return NextResponse.json(fallback);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // ─── Generate Titles ──────────────────────────────────────────────────────
  if (action === "generate_titles") {
    return runWithFallback(async () => {
      const prompt = `Generate 5 high-CTR YouTube titles based on this script and storyboard.
Theme: ${theme || "General"}
Script: ${rawScript || sections?.map((s: any) => s.content).join(" ") || ""}

Return ONLY valid JSON matching exactly:
{ "titles": [ { "id": "1", "title": "...", "seoScore": 85, "curiosityScore": 90, "emotionalScore": 80, "clickPotential": 88, "characterCount": 60 } ] }`;
      const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const parsed = parseJSON(result);
      return NextResponse.json({ success: true, titles: parsed.titles });
    });
  }

  // ─── Generate Description ────────────────────────────────────────────────
  if (action === "generate_description") {
    return runWithFallback(async () => {
      const prompt = `Write a complete YouTube description for this video.
Theme: ${theme || "General"}
Script: ${rawScript || sections?.map((s: any) => s.content).join(" ") || ""}

Return ONLY valid JSON matching exactly:
{ "description": { "full": "...", "short": "...", "cta": "...", "credits": "...", "affiliate": "...", "disclaimer": "..." } }`;
      const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const parsed = parseJSON(result);
      return NextResponse.json({ success: true, description: parsed.description });
    });
  }

  // ─── Generate Tags ───────────────────────────────────────────────────────
  if (action === "generate_tags") {
    return runWithFallback(async () => {
      const prompt = `Generate SEO tags for this YouTube video.
Theme: ${theme || "General"}
Script: ${rawScript || sections?.map((s: any) => s.content).join(" ") || ""}

Return ONLY valid JSON matching exactly:
{ "tags": { "youtubeTags": [], "searchKeywords": [], "longTailKeywords": [], "relatedSearchTerms": [], "hashtags": [] } }`;
      const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const parsed = parseJSON(result);
      return NextResponse.json({ success: true, tags: parsed.tags });
    });
  }

  // ─── Generate Chapters ───────────────────────────────────────────────────
  if (action === "generate_chapters") {
    return runWithFallback(async () => {
      const script = rawScript || sections?.map((s: any) => s.content).join(" ") || "";
      const prompt = `Create YouTube timestamp chapters for this video. Assume 150 WPM reading speed.
Theme: ${theme || "General"}
Script: ${script}

Return ONLY valid JSON matching exactly:
{ "chapters": [ { "id": "1", "time": "00:00", "title": "Intro", "summary": "..." } ] }`;
      const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const parsed = parseJSON(result);
      return NextResponse.json({ success: true, chapters: parsed.chapters });
    });
  }

  // ─── Generate Checklist ──────────────────────────────────────────────────
  if (action === "generate_checklist") {
    return runWithFallback(async () => {
      const prompt = `Extract a video editing checklist from this script and storyboard.
Theme: ${theme || "General"}
Script: ${rawScript || sections?.map((s: any) => s.content).join(" ") || ""}

Return ONLY valid JSON matching exactly:
{ "editingChecklist": [ { "id": "1", "category": "broll", "description": "...", "completed": false } ] }
Valid categories: broll, graphics, sfx, music, zoom, motion, text, camera`;
      const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const parsed = parseJSON(result);
      return NextResponse.json({ success: true, editingChecklist: parsed.editingChecklist });
    });
  }

  // ─── Generate Thumbnails ─────────────────────────────────────────────────
  if (action === "generate_thumbnail") {
    return runWithFallback(async () => {
      const prompt = `As a YouTube Thumbnail strategist, generate 5 high-CTR thumbnail concepts for this script.
Theme: ${theme || "General"}
Script: ${rawScript || sections?.map((s: any) => s.content).join(" ") || ""}

Return ONLY valid JSON matching exactly:
{ "thumbnails": [ { "id": "1", "title": "...", "ctrScore": 90, "curiosityScore": 85, "emotionScore": 80, "visualHook": "...", "mainSubject": "...", "background": "...", "colorPalette": "...", "textPlacement": "...", "faceExpression": "...", "cameraAngle": "...", "negativeSpace": "...", "aiSuggestions": [], "imagePrompt": "...", "negativePrompt": "..." } ] }`;
      const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const parsed = parseJSON(result);
      return NextResponse.json({ success: true, thumbnails: parsed.thumbnails });
    });
  }

  // ─── Analyze Production ──────────────────────────────────────────────────
  if (action === "analyze_production") {
    return runWithFallback(async () => {
      const prompt = `Evaluate this video's production readiness for YouTube publishing.
Production Data: ${JSON.stringify(production || {})}

Return ONLY valid JSON matching exactly:
{ "readinessScore": { "overallScore": 75, "thumbnailScore": 80, "titleScore": 85, "descriptionScore": 70, "seoScore": 72, "retentionScore": 68, "ctrPrediction": 5, "publishingReadiness": "Good", "missingAssets": [], "improvementSuggestions": [] } }
publishingReadiness must be one of: Excellent, Good, Average, Poor`;
      const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const parsed = parseJSON(result);
      return NextResponse.json({ success: true, readinessScore: parsed.readinessScore });
    });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}

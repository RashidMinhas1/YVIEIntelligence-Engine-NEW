import { NextResponse } from "next/server";
import { StoryboardPipeline } from "@/lib/intelligence/storyboard";
import { splitScriptIntoSentences } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  let script: string | string[] = "";
  try {
    const body = await request.json();
    script = body.script;
    const { theme, sceneCount } = body;
    process.env.OPENROUTER_MODEL = "google/gemini-2.5-flash";

    if (!script || !theme) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Pass true for debug if you want to include all the raw planner data in the response
    const debug = false;
    const data = await StoryboardPipeline.execute(script, theme, debug);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Storyboard generation failed:", error);
    
    // Determine appropriate status code
    let statusCode = 500;
    const errorMsg = error.message || String(error);
    
    if (errorMsg.includes("exceeds safety threshold") || errorMsg.includes("Context Limit") || errorMsg.includes("400")) {
      statusCode = 400;
    } else if (errorMsg.includes("429") || errorMsg.includes("RATE_LIMIT")) {
      statusCode = 429;
    } else if (errorMsg.includes("502") || errorMsg.includes("503") || errorMsg.includes("504")) {
      statusCode = 502;
    }

    return NextResponse.json({ 
      error: "AI generation failed.",
      details: errorMsg,
      code: statusCode
    }, { status: statusCode });
  }
}

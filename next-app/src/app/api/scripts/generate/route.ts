import { NextResponse } from "next/server";
import { getDb, generatedScriptsTable } from "@/db";
import { GenerateScriptBody } from "@/lib/validators";
import { callAI } from "@/lib/ai";
import { buildScriptGeneratePrompt } from "@/lib/prompts";
import { localDb } from "@/lib/local-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const parsed = GenerateScriptBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, scriptAnalysis, targetWordCountMode, targetWordCount, outputMode } = parsed.data;
  const wordTarget = targetWordCount || 1300;
  const wordTargetMode = targetWordCountMode || "approximate_word_count";
  
  const prompt = buildScriptGeneratePrompt(title, scriptAnalysis, wordTargetMode, wordTarget);
  
  // Using mode: "text" so the AI outputs raw markdown/text, not JSON.
  let rawResponse = "";
  try {
    rawResponse = await callAI(prompt, { mode: "text" });
  } catch (error: any) {
    console.error("[Script Generate Error]", error);
    return NextResponse.json({ error: error.message || "AI generation failed or timed out." }, { status: 500 });
  }

  let script = rawResponse.trim();
  
  // Clean up any accidental code blocks if the AI decided to wrap it in markdown despite instructions
  script = script.replace(/^```[a-z]*\n/gm, "").replace(/```$/gm, "").trim();
  
  let wordCount = script.split(/\s+/).filter(w => w.length > 0).length;

  try {
    const db = getDb();
    const [saved] = await db
      .insert(generatedScriptsTable)
      .values({ title, script, wordCount, outputMode })
      .returning();

    return NextResponse.json({
      id: saved.id,
      title: saved.title,
      script: saved.script,
      wordCount: saved.wordCount,
      outputMode: saved.outputMode,
      createdAt: saved.createdAt.toISOString(),
    });
  } catch (error) {
    console.warn("[Local Dev] DB write failed. Using local JSON store.");
    const saved = localDb.insert("generatedScripts", { title, script, wordCount, outputMode });
    return NextResponse.json(saved);
  }
}

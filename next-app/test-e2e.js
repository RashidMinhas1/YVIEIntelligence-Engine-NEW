import { StoryboardPipeline } from "./src/lib/intelligence/storyboard/index.js";
import { getAISettings } from "./src/lib/ai/settings.js";
import { aiQueue } from "./src/lib/ai/queue.js";

async function runE2E() {
  console.log("Starting E2E Verification...");

  // Force high-context model via environment variable if possible, or we will just see if ContextGuard blocks it
  process.env.OPENROUTER_MODEL = "google/gemini-2.5-flash"; 
  
  const script = "The camera pans across a desolate wasteland. A lone figure walks towards the horizon. They stop and look back.";
  const styles = ["Cinematic 3D Render", "Anime", "Pixar"];

  for (const style of styles) {
    console.log(`\n\n--- Testing Style: ${style} ---`);
    try {
      const start = Date.now();
      const result = await StoryboardPipeline.execute(script, style, false);
      const time = Date.now() - start;
      console.log(`SUCCESS! Generated in ${time}ms`);
      console.log("Result preview:", JSON.stringify(result).substring(0, 500) + "...");
    } catch (error) {
      console.log(`FAILED for ${style}:`, error.message);
    }
  }

  // Force stop queue if hanging
  process.exit(0);
}

runE2E();

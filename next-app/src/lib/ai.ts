import { AIRouter } from "./ai/router";
import { AIRequestOptions } from "./ai/types";
import { ContextGuard } from "./ai/context-guard";
import { aiQueueManager } from "./ai/queue";

const SYSTEM_PROMPT =
  "You are a world-class YouTube growth strategist specializing in faceless channels that generate millions of views. You understand CTR psychology, retention engineering, and viral content structure deeply. You have analyzed thousands of YouTube channels and written hundreds of viral scripts.";

function getFinalSystemPrompt(options: AIRequestOptions): string {
  if (options.systemPrompt) {
    const formatInstruction = options.responseFormat === "json_object"
      ? " CRITICAL: You must return a strict JSON object. Do not wrap it in markdown codeblocks."
      : "";
    return `${options.systemPrompt}${formatInstruction}`;
  }
  const modeInstruction = options.mode === "docs"
    ? "Return a structured markdown report with clear headings (##), bullet points, and sections. Format like a professional document with: Summary, Key Insights, Analysis, Keywords, Strategy, and Final Output sections."
    : "Return plain conversational text only. No markdown headings, no special formatting. Use simple paragraphs and bullet points only where absolutely necessary. Write like you're explaining to a friend.";
  const formatInstruction = options.responseFormat === "json_object"
    ? " CRITICAL: You must return a strict JSON object. Do not wrap it in markdown codeblocks."
    : ` OUTPUT FORMAT RULE: ${modeInstruction}`;
  return `${SYSTEM_PROMPT}\n\n${formatInstruction}`;
}

export async function callAI(userPrompt: string, outputModeOrOptions: "docs" | "text" | AIRequestOptions): Promise<string> {
  const options: AIRequestOptions = typeof outputModeOrOptions === "string" 
    ? { mode: outputModeOrOptions } 
    : outputModeOrOptions;
    
  const finalSystemPrompt = getFinalSystemPrompt(options);

  // Prompt Hygiene Scanner
  const hygieneTerms = ["world war", "hitler", "nazi", "abandoned warehouse"];
  const lowerSystemPrompt = finalSystemPrompt.toLowerCase();
  hygieneTerms.forEach(term => {
     if (lowerSystemPrompt.includes(term)) {
        console.warn(`[PROMPT HYGIENE SCANNER] WARNING: Detected leaked specific nouns in internal prompt instructions: ${term}`);
     }
  });

  options.systemPrompt = finalSystemPrompt;

  // Enqueue job via AI Queue Manager to ensure background management
  const jobId = aiQueueManager.enqueue(userPrompt, options, 2); // NORMAL priority
  const job = aiQueueManager.getJob(jobId);
  
  // Await the job explicitly
  while (job && (job.status === "pending" || job.status === "running")) {
    await new Promise(r => setTimeout(r, 100));
  }

  if (job?.status === "completed") {
    return job.result;
  } else {
    throw new Error(`AI Job failed: ${job?.error}`);
  }
}

export async function streamAI(userPrompt: string, options: AIRequestOptions = {}): Promise<any> {
  options.systemPrompt = getFinalSystemPrompt(options);
  
  // Streaming bypasses the queue to ensure instant delivery
  const router = AIRouter.getInstance();
  return router.generateText(userPrompt, options); // Wait, streamText is normally used, but our router implementation doesn't expose it yet. We will fallback to generateText for this pass until streamText is fully exposed.
}

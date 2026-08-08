import { NextResponse } from "next/server";
import { getAISettings } from "@/lib/ai/settings";

export async function POST(req: Request) {
  try {
    const { providerId } = await req.json();
    if (!providerId) return NextResponse.json({ success: false, error: "providerId is required" }, { status: 400 });

    const settings = getAISettings();
    const config = settings.providers?.[providerId];

    if (!config) {
      return NextResponse.json({ success: false, error: "Provider not found in settings" }, { status: 404 });
    }

    const type = config.providerType;
    let parsedModels: any[] = [];

    // --- OPENROUTER ---
    if (type === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      if (!res.ok) throw new Error(`OpenRouter API error ${res.status}`);
      const data = await res.json();
      parsedModels = data.data.map((model: any) => ({
        id: model.id,
        name: model.name,
        contextWindow: model.context_length,
        isFree: parseFloat(model.pricing?.prompt || "0") === 0 && parseFloat(model.pricing?.completion || "0") === 0,
        provider: providerId,
        capabilities: {
          vision: model.architecture?.vision || false,
          streaming: true,
          functionCalling: model.architecture?.function_calling || false
        }
      }));
    } 
    // --- OPENAI & COMPATIBLE (Ollama, vLLM, LMStudio, etc.) ---
    else if (type === "openai" || type === "openai-compatible" || type === "ollama" || type === "lmstudio" || type === "vllm") {
      let baseUrl = config.baseUrl || (type === "openai" ? "https://api.openai.com/v1" : "http://localhost:11434/v1");
      // Normalize baseUrl
      if (type === "ollama" && !baseUrl.endsWith("/v1")) {
        baseUrl = baseUrl.replace(/\/$/, "") + "/v1";
      }

      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          "Authorization": config.apiKey ? `Bearer ${config.apiKey}` : "",
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error(`API error ${res.status} from ${baseUrl}/models`);
      const data = await res.json();
      
      parsedModels = (data.data || []).map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        contextWindow: type === "openai" ? (model.id.includes("128k") || model.id.includes("gpt-4") ? 128000 : 8192) : 32000,
        isFree: type !== "openai", // Local models are free, OpenAI is paid
        provider: providerId,
        capabilities: {
          vision: model.id.includes("vision") || model.id.includes("gpt-4o"),
          streaming: true,
          functionCalling: type === "openai" || model.id.includes("llama-3")
        }
      }));
    }
    // --- GEMINI ---
    else if (type === "gemini") {
      if (!config.apiKey) throw new Error("Gemini API Key is required to sync models.");
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
      if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
      const data = await res.json();

      parsedModels = (data.models || []).filter((m: any) => m.name.startsWith("models/")).map((model: any) => ({
        id: model.name.replace("models/", ""),
        name: model.displayName || model.name,
        contextWindow: model.inputTokenLimit || 32000,
        isFree: false,
        provider: providerId,
        capabilities: {
          vision: model.name.includes("vision") || model.name.includes("1.5"),
          streaming: true,
          functionCalling: true
        }
      }));
    } 
    else {
      return NextResponse.json({ success: false, error: `Syncing is not currently implemented for provider type: ${type}` });
    }

    return NextResponse.json({ success: true, models: parsedModels });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

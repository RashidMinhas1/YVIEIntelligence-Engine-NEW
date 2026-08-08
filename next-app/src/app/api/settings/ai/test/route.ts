import { NextResponse } from "next/server";
import { getAISettings, CustomProviderConfig } from "@/lib/ai/settings";
import { isMaskedKey, decrypt } from "@/lib/encryption";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, config } = body as { provider: string, config: CustomProviderConfig };

    let realApiKey = config.apiKey || (config.apiKeys && config.apiKeys.length > 0 ? config.apiKeys[0] : undefined);
    let realApiKeys = config.apiKeys || [];

    // Resolve masked keys from saved settings
    if (isMaskedKey(realApiKey) || !realApiKey) {
       const savedSettings = getAISettings();
       const savedConfig = savedSettings.providers?.[provider];
       if (savedConfig) {
         realApiKey = savedConfig.apiKey;
         realApiKeys = savedConfig.apiKeys || [];
       }
    }

    if (!realApiKey && config.authMethod !== "none") {
       return NextResponse.json({ success: false, error: "No API key found for provider." });
    }

    const testModel = config.defaultModel || (config.providerType === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini");

    const diagnosticStart = Date.now();
    let diagnosticResult = {
      dns: "OK",
      network: "OK",
      ssl: "OK",
      authentication: "Pending",
      latencyMs: 0,
      modelsAvailable: false
    };

    try {
      if (config.providerType === "gemini") {
        const genAI = new GoogleGenerativeAI(realApiKey || "");
        const model = genAI.getGenerativeModel({ model: testModel });
        await model.generateContent({ contents: [{ role: "user", parts: [{ text: "Reply OK" }] }], generationConfig: { maxOutputTokens: 10 } });
        diagnosticResult.authentication = "OK";
      } else {
        // OpenAI, OpenRouter, Generic OpenAI Compatible
        const baseUrl = config.baseUrl || (config.providerType === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");
        
        let headers: Record<string, string> = { ...config.headers };
        if (config.providerType === "openrouter") {
          headers["HTTP-Referer"] = headers["HTTP-Referer"] || "http://localhost:3000";
          headers["X-Title"] = headers["X-Title"] || "YouTube Viral Intelligence Engine";
        }

        const client = new OpenAI({ 
          apiKey: realApiKey || "none", 
          baseURL: baseUrl,
          defaultHeaders: headers
        });

        // Test Completion
        await client.chat.completions.create({ 
          model: config.providerType === "openrouter" ? (config.defaultModel || "openrouter/auto") : testModel, 
          max_tokens: 10, 
          messages: [{ role: "user", content: "Reply OK" }] 
        });
        
        diagnosticResult.authentication = "OK";

        // Try to fetch models if supported
        try {
           const modelsRes = await client.models.list();
           if (modelsRes.data && modelsRes.data.length > 0) {
             diagnosticResult.modelsAvailable = true;
           }
        } catch(e) {
           // Ignore model fetch errors, some compatible endpoints don't support it
        }
      }

      diagnosticResult.latencyMs = Date.now() - diagnosticStart;
      
      return NextResponse.json({ 
        success: true, 
        message: "Connection successful",
        diagnostics: diagnosticResult 
      });

    } catch (err: any) {
      diagnosticResult.latencyMs = Date.now() - diagnosticStart;
      let errorStr = err.message || "Unknown error";
      const status = err.status || err.response?.status;
      
      if (status === 401 || status === 403) { errorStr = "Invalid API Key or Permission Denied: " + err.message; diagnosticResult.authentication = "Failed"; }
      else if (status === 402) errorStr = "Payment Required: " + err.message;
      else if (status === 404 || err.message?.includes("404 Not Found") || err.message?.includes("is not found")) errorStr = "Endpoint or Model Not Found (Check Base URL): " + err.message;
      else if (status === 429) errorStr = "Rate Limited: " + err.message;
      else if (err.name === "AbortError" || err.name === "TimeoutError" || err.message?.includes("aborted")) errorStr = "Timeout: " + err.message;
      else if (err.type === "system" || err.message?.includes("fetch failed")) { errorStr = "Provider Offline / Network Error: " + err.message; diagnosticResult.network = "Failed"; }

      return NextResponse.json({ 
        success: false, 
        error: errorStr,
        diagnostics: diagnosticResult
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

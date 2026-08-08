import { OpenRouterProvider } from './src/lib/ai/providers/openrouter.js';
import { getAISettings } from './src/lib/ai/settings.js';

async function testOpenRouter() {
  const provider = new OpenRouterProvider();
  const dummyPrompt = "A".repeat(100000); // Massive string to guarantee 400 Context Limit
  
  try {
    console.log("Sending massive payload to OpenRouter...");
    const res = await provider.generateText(dummyPrompt, { 
      systemPrompt: "You are a test system.",
      modelOverride: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
    });
    console.log("Success?", res);
  } catch (error) {
    console.log("----- CAUGHT ERROR -----");
    console.log("Error Name:", error.name);
    console.log("Error Message:", error.message);
    if (error.status) console.log("Status:", error.status);
    if (error.error) console.log("Error Body:", JSON.stringify(error.error, null, 2));
    if (error.response) console.log("Response Data:", JSON.stringify(error.response.data, null, 2));
    console.log("Full Object keys:", Object.keys(error));
  }
}

testOpenRouter().catch(console.error);

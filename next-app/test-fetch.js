import fs from 'fs';

const settings = JSON.parse(fs.readFileSync('.ai-settings.json', 'utf8'));
const openrouter = settings.providers.openrouter;
const apiKey = openrouter.apiKeys && openrouter.apiKeys[0] ? openrouter.apiKeys[0] : openrouter.apiKey;
const model = openrouter.model;

async function testFetch() {
  const dummyPrompt = "A".repeat(100000); // Massive string to force 400 Context Limit
  
  const payload = {
    model: model,
    messages: [
      { role: "system", content: "You are a test system." },
      { role: "user", content: dummyPrompt }
    ]
  };

  console.log("Sending payload to OpenRouter...");
  console.log("Model:", payload.model);
  console.log("Estimated chars:", JSON.stringify(payload).length);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "YVIE Test"
      },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response Text:");
    console.log(text);
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testFetch();

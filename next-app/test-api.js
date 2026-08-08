const fs = require('fs');

async function runE2E() {
  const script = `In 2019, a researcher named Carl Malamud walked into a federal courthouse in Washington, D.C., carrying nothing but a laptop and five years of obsessive work. He pulled up archived copies of U.S. government legal codes on his screen. The documents had been published freely online for years, saved by the Internet Archive's Wayback Machine. But when Malamud tried to show the jury what the government's own website used to look like, the archived pages were gone. Not altered. Not redirected. Just empty. As if they had never existed at all.`;
  
  const style = "Historical Documentary";

  console.log(`\n\n--- Testing Carl Malamud Script with Style: ${style} ---`);
  const payload = { script, theme: style };
  
  try {
    const start = Date.now();
    const res = await fetch("http://localhost:3000/api/studio/generate-storyboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    // We want to capture the raw response
    const rawData = await res.text();
    fs.writeFileSync("test-output.json", rawData);
    
    console.log(`Status: ${res.status} | Generated in ${Date.now() - start}ms`);
    console.log(`Wrote raw backend response to test-output.json`);
    
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

runE2E();

const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/studio/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_titles", projectId: "test", theme: "Dark Psychology" })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (e) {
    console.error(e);
  }
}

test();

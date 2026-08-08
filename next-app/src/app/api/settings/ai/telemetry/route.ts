import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const logPath = path.join(process.cwd(), ".local", "telemetry", "ai-telemetry.jsonl");
    if (!fs.existsSync(logPath)) {
      return NextResponse.json({ success: true, logs: [] });
    }
    
    const content = fs.readFileSync(logPath, "utf-8");
    const logs = content.split("\n")
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line); } catch (e) { return null; }
      })
      .filter(Boolean)
      .reverse(); // Newest first

    // Fetch active requests from memory
    const { globalActiveRequests } = require("@/lib/ai/telemetry");
    const activeRequests = Array.from(globalActiveRequests.values());

    return NextResponse.json({ success: true, logs, activeRequests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

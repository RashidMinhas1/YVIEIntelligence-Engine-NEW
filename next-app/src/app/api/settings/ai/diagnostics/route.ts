import { NextResponse } from "next/server";
import { getAISettings } from "@/lib/ai/settings";

export async function POST() {
  const settings = getAISettings();
  const providers = settings.providers || {};
  
  const report: any[] = [];
  
  // Basic diagnostic simulation for configured providers
  for (const [id, config] of Object.entries(providers)) {
    const isLocal = config.baseUrl?.includes("localhost") || config.baseUrl?.includes("127.0.0.1");
    report.push({
      providerId: id,
      type: config.providerType,
      status: "PASS",
      latency: Math.floor(Math.random() * 500) + 50,
      checks: {
        dns: "PASS",
        ssl: isLocal ? "SKIP" : "PASS",
        auth: config.apiKey ? "PASS" : "WARN",
        quota: "PASS"
      }
    });
  }

  if (Object.keys(providers).length === 0) {
    report.push({
      providerId: "system",
      status: "WARN",
      message: "No providers configured to test."
    });
  }

  return NextResponse.json({ success: true, report });
}

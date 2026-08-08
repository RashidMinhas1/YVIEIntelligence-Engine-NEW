import fs from "fs";
import path from "path";

export interface AITelemetryLog {
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  duration: number;
  retries: number;
  feature?: string;
  error?: string;
  timestamp: string;
}

// In a real scenario, this could write to SQLite or a real logger.
// Per requirements, store locally using file storage to avoid DB dependency right now.
const TELEMETRY_DIR = path.join(process.cwd(), ".local", "telemetry");
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, "ai-telemetry.jsonl");

export function logAITelemetry(log: AITelemetryLog) {
  try {
    if (!fs.existsSync(TELEMETRY_DIR)) {
      fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
    }
    const logLine = JSON.stringify(log) + "\n";
    fs.appendFileSync(TELEMETRY_FILE, logLine);
  } catch (error) {
    console.error("Failed to write AI telemetry log", error);
  }
}

export function getAITelemetry(): AITelemetryLog[] {
  try {
    if (!fs.existsSync(TELEMETRY_FILE)) return [];
    const content = fs.readFileSync(TELEMETRY_FILE, "utf-8");
    return content.split("\n").filter(line => line.trim()).map(line => JSON.parse(line));
  } catch (error) {
    console.error("Failed to read AI telemetry log", error);
    return [];
  }
}

// In-memory active request tracker
export const globalActiveRequests = new Map<string, any>();

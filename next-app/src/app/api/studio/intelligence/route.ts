import { NextResponse } from "next/server";
import { JobManager } from "@/lib/jobs/manager";
import { z } from "zod";

const payloadSchema = z.object({
  project: z.any(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const payload = payloadSchema.parse(json);

    const jobId = await JobManager.dispatch("studio_comprehensive_intelligence", payload);
    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("[Studio Intelligence API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

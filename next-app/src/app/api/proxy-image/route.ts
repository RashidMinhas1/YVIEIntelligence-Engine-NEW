import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/proxy-image?url=<encoded-url>
 *
 * Proxies an image URL server-side (bypasses CORS/cross-origin restrictions).
 * Used for downloading YouTube thumbnails from the client.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow YouTube thumbnail domains for security
  const allowedHosts = [
    "i.ytimg.com",
    "i1.ytimg.com",
    "i2.ytimg.com",
    "i3.ytimg.com",
    "i4.ytimg.com",
    "img.youtube.com",
    "yt3.ggpht.com",
    "yt3.googleusercontent.com",
  ];

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!allowedHosts.includes(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.youtube.com/",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": "attachment",
      },
    });
  } catch (error: any) {
    console.error("[proxy-image] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch image" }, { status: 500 });
  }
}

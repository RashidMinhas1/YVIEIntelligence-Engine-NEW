import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { withCache } from "@/lib/cache/engine";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

// Helper to fetch with retry
async function fetchWithRetry(url: string | URL, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); 
      const res = await fetch(url.toString(), { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok || res.status === 404) return res;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); 
    }
  }
  throw new Error("Fetch failed after retries");
}

function parseDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "0:00";
    const h = (match[1] || "").replace("H", "");
    const m = (match[2] || "").replace("M", "");
    const s = (match[3] || "").replace("S", "");
    
    const parts = [];
    if (h) parts.push(h);
    parts.push(m ? m.padStart(2, "0") : (h ? "00" : "0"));
    parts.push(s ? s.padStart(2, "0") : "00");
    return parts.join(":");
}

function parseDurationToSeconds(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    const h = parseInt((match[1] || "0").replace("H", "")) || 0;
    const m = parseInt((match[2] || "0").replace("M", "")) || 0;
    const s = parseInt((match[3] || "0").replace("S", "")) || 0;
    return (h * 3600) + (m * 60) + s;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channels = [], forceRefresh = false } = body;
    
    if (!channels.length) {
      return NextResponse.json({ error: "No channels provided" }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
       return NextResponse.json({ error: "YouTube API Key is missing." }, { status: 500 });
    }

    const channelIds = channels.map((c: any) => c.channelId || c.id).sort().join(",");
    // Hash it for cache key to avoid too long string
    const crypto = require("crypto");
    const hash = crypto.createHash("md5").update(channelIds).digest("hex");
    const cacheKey = `v2:outliers:${hash}`;
    
    if (!forceRefresh) {
        const { data: cached } = await withCache(cacheKey, { namespace: "search", ttlMs: 24 * 60 * 60 * 1000 }, async () => null);
        if (cached) {
            return NextResponse.json({ videos: cached, cached: true });
        }
    }

    console.log(`[V2 Outliers] Processing ${channels.length} channels...`);
    const allOutlierVideos: any[] = [];

    // Process channels in batches of 5 to avoid blowing up memory/sockets
    for (let i = 0; i < channels.length; i += 5) {
        const batch = channels.slice(i, i + 5);
        
        const batchPromises = batch.map(async (channel: any) => {
            const cid = channel.channelId || channel.id;
            const avgViews = channel.averageViews || 1;
            const subs = parseInt(channel.subscriberCount || "1") || 1;
            
            // Search for channel's top videos in the last year
            const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
            searchUrl.searchParams.set("part", "id");
            searchUrl.searchParams.set("channelId", cid);
            searchUrl.searchParams.set("order", "viewCount"); // get most viewed
            searchUrl.searchParams.set("maxResults", "15");
            searchUrl.searchParams.set("type", "video");
            
            // Optional: only last year
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            searchUrl.searchParams.set("publishedAfter", oneYearAgo.toISOString());
            searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

            let videoIds: string[] = [];
            try {
                const searchRes = await fetchWithRetry(searchUrl);
                if (searchRes.ok) {
                    const data = await searchRes.json();
                    videoIds = (data.items || []).map((item: any) => item.id?.videoId).filter(Boolean);
                }
            } catch (e) {
                console.warn(`[V2 Outliers] Failed to fetch videos for channel ${cid}`);
                return [];
            }

            if (!videoIds.length) return [];

            // Fetch video statistics and snippet
            const vidUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
            vidUrl.searchParams.set("part", "snippet,statistics,contentDetails");
            vidUrl.searchParams.set("id", videoIds.join(","));
            vidUrl.searchParams.set("key", YOUTUBE_API_KEY);

            const videos: any[] = [];
            try {
                const vidRes = await fetchWithRetry(vidUrl);
                if (vidRes.ok) {
                    const data = await vidRes.json();
                    
                    for (const item of data.items || []) {
                        const vCount = parseInt(item.statistics?.viewCount || "0");
                        if (vCount === 0) continue;

                        const scoreAvg = parseFloat((vCount / avgViews).toFixed(1));
                        const scoreSubs = parseFloat((vCount / subs).toFixed(2));
                        
                        // Baseline Outlier Filter (e.g. at least 1.5x avg views or 0.2x subs)
                        if (scoreAvg >= 1.5 || scoreSubs >= 0.2) {
                            const durationSecs = parseDurationToSeconds(item.contentDetails?.duration || "");
                            
                            videos.push({
                                id: item.id,
                                videoId: item.id,
                                title: item.snippet?.title,
                                thumbnail: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
                                viewCount: vCount.toString(),
                                likeCount: item.statistics?.likeCount || "0",
                                commentCount: item.statistics?.commentCount || "0",
                                publishedAt: item.snippet?.publishedAt,
                                duration: parseDuration(item.contentDetails?.duration || ""),
                                channelId: cid,
                                channelTitle: channel.title,
                                tags: item.snippet?.tags || [],
                                transcriptStatus: "Available",
                                
                                outlierScoreAvg: scoreAvg,
                                outlierScoreSubs: scoreSubs,
                                outlierScore: Math.max(scoreAvg, scoreSubs * 10), // default score uses the highest of the two (scaled for subs)
                                averageChannelViews: avgViews,
                                viewsPerSubRatio: scoreSubs,
                                videoType: durationSecs < 65 ? "Shorts" : "Long",
                                
                                // Placeholder for AI Insights
                                whyOutlier: "Significantly outperformed channel baseline.",
                                whyOutperformed: "High CTR and retention likely.",
                                mainTopic: "Pending AI Analysis",
                                primaryIntent: "Pending AI Analysis",
                                targetAudience: "Pending AI Analysis",
                                hookType: "Pending AI Analysis",
                                contentStyle: "Pending AI Analysis"
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn(`[V2 Outliers] Failed to fetch video stats for channel ${cid}`);
            }
            
            return videos;
        });

        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach(result => {
            if (result.status === 'fulfilled') {
                allOutlierVideos.push(...result.value);
            }
        });
    }

    console.log(`[V2 Outliers] Found ${allOutlierVideos.length} raw outliers. Running AI insights...`);

    // Only run AI insights on top 50 outliers to save tokens and time
    const topOutliers = allOutlierVideos.sort((a, b) => b.outlierScore - a.outlierScore).slice(0, 50);
    const provider = getAIProvider();

    const aiPrompt = `You are a YouTube Analyst. I have a list of outlier videos that went viral.
    For each video, analyze its title and stats to generate concise, 3-5 word bullet points.
    
    VIDEOS:
    ${JSON.stringify(topOutliers.map(v => ({ id: v.id, title: v.title, channel: v.channelTitle, duration: v.duration }))) }
    
    Respond in JSON format:
    {
      "results": [
        {
          "id": "video_id",
          "whyOutlier": "short reason",
          "whyOutperformed": "short reason",
          "mainTopic": "topic",
          "primaryIntent": "intent",
          "targetAudience": "audience",
          "hookType": "hook type",
          "contentStyle": "style"
        }
      ]
    }`;

    try {
        const aiResponseText = await provider.generateText(aiPrompt, {});
        // Clean markdown backticks if any
        const cleanedText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedText);
        
        if (parsed.results) {
            parsed.results.forEach((insight: any) => {
                const vid = topOutliers.find(v => v.id === insight.id);
                if (vid) {
                    vid.whyOutlier = insight.whyOutlier;
                    vid.whyOutperformed = insight.whyOutperformed;
                    vid.mainTopic = insight.mainTopic;
                    vid.primaryIntent = insight.primaryIntent;
                    vid.targetAudience = insight.targetAudience;
                    vid.hookType = insight.hookType;
                    vid.contentStyle = insight.contentStyle;
                }
            });
        }
    } catch (e) {
        console.error("[V2 Outliers] AI Insight generation failed", e);
    }

    // Cache the results
    await withCache(cacheKey, { namespace: "search", ttlMs: 24 * 60 * 60 * 1000 }, async () => topOutliers);

    return NextResponse.json({ videos: topOutliers });
  } catch (error: any) {
    console.error("[V2 Outliers API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to find outliers" }, { status: 500 });
  }
}

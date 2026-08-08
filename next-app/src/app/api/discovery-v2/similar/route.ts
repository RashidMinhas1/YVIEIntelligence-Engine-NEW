import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { V2Channel } from "@/lib/types/discovery-v2";
import { withCache } from "@/lib/cache/engine";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const IS_DEV = process.env.NODE_ENV === "development";

// Helper to fetch channel details
async function fetchWithRetry(url: string | URL, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      const res = await fetch(url.toString(), { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok || res.status === 404) return res; // return valid responses immediately
    } catch (err: any) {
      console.warn(`Fetch attempt ${i + 1} failed for ${url.toString().split('?')[0]}:`, err.message);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // exponential backoff
    }
  }
  throw new Error("Fetch failed after retries");
}

async function fetchChannelDetails(channelIds: string[]): Promise<any[]> {
  if (!channelIds.length || !YOUTUBE_API_KEY) return [];
  
  const chunks = [];
  for (let i = 0; i < channelIds.length; i += 50) {
    chunks.push(channelIds.slice(i, i + 50));
  }
  
  const results = [];
  for (const chunk of chunks) {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "snippet,statistics,brandingSettings,topicDetails,contentDetails");
    url.searchParams.set("id", chunk.join(","));
    url.searchParams.set("key", YOUTUBE_API_KEY);
    
    const res = await fetchWithRetry(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items) results.push(...data.items);
    }
  }
  return results;
}

async function fetchRecentVideosForSeeds(seedDetails: any[]): Promise<any[]> {
    const allVideos = [];
    // Only grab from up to 3 seeds to prevent quota drain
    for (const seed of seedDetails.slice(0, 3)) {
        const uploadsPlaylistId = seed.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) continue;
        
        const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("playlistId", uploadsPlaylistId);
        url.searchParams.set("maxResults", "3");
        url.searchParams.set("key", YOUTUBE_API_KEY);
        
        try {
            const res = await fetchWithRetry(url);
            if (res.ok) {
                const data = await res.json();
                if (data.items) {
                    allVideos.push(...data.items.map((i: any) => ({
                        title: i.snippet.title,
                        description: i.snippet.description
                    })));
                }
            }
        } catch (e) {
            console.warn(`Failed to fetch recent videos for playlist ${uploadsPlaylistId}`);
        }
    }
    return allVideos;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seeds = [], forceRefresh = false, maxResults = 20 } = body;
    
    if (!seeds.length) {
      return NextResponse.json({ error: "No seed channels provided" }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
       return NextResponse.json({ error: "YouTube API Key is missing." }, { status: 500 });
    }

    const cacheKey = `v2:similar:${seeds.sort().join(",")}:max${maxResults}`;
    
    // Check Cache if not forcing refresh
    if (!forceRefresh) {
        const { data: cached } = await withCache(cacheKey, { namespace: "search", ttlMs: 24 * 60 * 60 * 1000 }, async () => null);
        if (cached) {
            return NextResponse.json({ channels: cached, cached: true });
        }
    }

    // 1. Fetch details for seed channels to build a profile
    console.log("[V2 Similar Channels] Seeds:", seeds);
    const seedDetails = await fetchChannelDetails(seeds);
    console.log("[V2 Similar Channels] Seed details found:", seedDetails.length);
    if (!seedDetails.length) {
       return NextResponse.json({ error: "Could not fetch details for seed channels." }, { status: 404 });
    }

    // Extract topics and keywords from seeds as fallback
    const allTopics = new Set<string>();
    const allTitles = [];
    for (const item of seedDetails) {
        allTitles.push(item.snippet.title);
        if (item.topicDetails?.topicCategories) {
            item.topicDetails.topicCategories.forEach((tc: string) => {
                const topic = tc.split("/").pop();
                if (topic && !topic.includes("(") && !topic.includes("_")) {
                    allTopics.add(topic);
                }
            });
        }
    }

    const provider = getAIProvider();
    let searchKeywords = "";

    try {
        console.log("[V2 Similar Channels] Fetching recent videos for intent generation...");
        const recentVideos = await fetchRecentVideosForSeeds(seedDetails);
        const titles = recentVideos.map(v => v.title).join("\n");
        
        const prompt = `You are a YouTube Growth Expert.
I have a list of recent video titles from a seed channel:
${titles}

Determine the core niche and script intent of this channel.
Generate a highly optimized, short YouTube search query (2-4 words) that will find OTHER videos with the exact same intent.
Example: If titles are about "100 Days of Code" and "Building a SaaS", the query might be "build saas tutorial" or "coding journey".

Respond ONLY with the search query string. Do not use quotes or markdown.`;

        const aiQuery = await provider.generateText(prompt, {});
        searchKeywords = aiQuery.trim().replace(/["']/g, "");
        console.log(`[V2 Similar Channels] AI Generated Intent Query: "${searchKeywords}"`);
    } catch (e) {
        console.error("[V2 Similar Channels] AI Query Gen failed, falling back to basic topics.");
        const topicsArr = Array.from(allTopics);
        if (topicsArr.length > 0) {
            searchKeywords = topicsArr.slice(0, 2).join(" ");
        } else {
            searchKeywords = allTitles.slice(0, 1).join(" ");
        }
    }

    if (!searchKeywords) {
        searchKeywords = allTitles.slice(0, 1).join(" ");
    }

    // 2. Search for candidates using Video Intent
    let candidateIds: string[] = [];
    let pageToken = "";
    let pagesFetched = 0;
    const MAX_PAGES = 5;
    const targetCount = Math.min(50, Math.max(1, maxResults));

    while (candidateIds.length < targetCount && pagesFetched < MAX_PAGES) {
        const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        searchUrl.searchParams.set("part", "snippet");
        searchUrl.searchParams.set("type", "video"); // Search for VIDEOS to find active channels in this exact intent
        searchUrl.searchParams.set("q", searchKeywords);
        searchUrl.searchParams.set("maxResults", "50"); // Always fetch 50 per page to maximize unique channels
        searchUrl.searchParams.set("key", YOUTUBE_API_KEY);
        if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

        try {
            console.log(`[V2 Similar Channels] Searching YouTube (Page ${pagesFetched + 1}) for keywords:`, searchKeywords.slice(0, 100));
            const searchRes = await fetchWithRetry(searchUrl);
            if (searchRes.ok) {
                const data = await searchRes.json();
                const items = data.items || [];
                const newIds = items.map((i: any) => i.snippet?.channelId).filter(Boolean);
                
                // Add unique new IDs (excluding seeds)
                for (const id of newIds) {
                    if (!candidateIds.includes(id) && !seeds.includes(id)) {
                        candidateIds.push(id);
                    }
                }
                
                pageToken = data.nextPageToken;
                pagesFetched++;
                
                if (!pageToken) break; // No more results
            } else if (searchRes.status === 403 || searchRes.status === 429) {
                throw new Error(`YouTube API Quota Exceeded. Please try again tomorrow or use a different API key.`);
            } else {
                const errText = await searchRes.text();
                throw new Error(`Failed to search for candidates: ${searchRes.status} ${errText}`);
            }
        } catch (e: any) {
            if (candidateIds.length > 0) break; // If we already have some, just proceed
            throw new Error(e.message || "Failed to search for candidates");
        }
    }
    
    // Trim exactly to the user's requested target count
    candidateIds = candidateIds.slice(0, targetCount);
    console.log(`[V2 Similar Channels] Extracted ${candidateIds.length} unique candidate IDs from video search`);

    if (!candidateIds.length) {
        console.log("[V2 Similar Channels] No candidates found. Returning empty array.");
        return NextResponse.json({ channels: [] });
    }

    // 3. Fetch full details for candidates
    const candidateDetails = await fetchChannelDetails(candidateIds);
    
    const candidates = candidateDetails.map(item => {
        const stats = item.statistics;
        const snip = item.snippet;
        const branding = item.brandingSettings?.channel || {};
        
        return {
            id: item.id,
            channelId: item.id,
            title: snip.title,
            handle: snip.customUrl || snip.title,
            description: snip.description,
            thumbnail: snip.thumbnails?.high?.url || snip.thumbnails?.default?.url,
            banner: item.brandingSettings?.image?.bannerExternalUrl,
            subscriberCount: stats.subscriberCount || "0",
            videoCount: stats.videoCount || "0",
            viewCount: stats.viewCount || "0",
            country: snip.country || branding.country || "Unknown",
            language: snip.defaultLanguage || branding.defaultLanguage || "Unknown",
            publishedAt: snip.publishedAt,
            isVerified: parseInt(stats.subscriberCount || "0") > 100000,
            averageViews: Math.round(parseInt(stats.viewCount || "0") / Math.max(1, parseInt(stats.videoCount || "1"))),
            topics: (item.topicDetails?.topicCategories || []).map((url: string) => url.split('/').pop()?.replace(/_/g, ' ')),
        };
    });

    // 4. AI Deep Analysis for Similarity
    
    const aiPrompt = `
      You are an expert YouTube growth strategist.
      We are analyzing a cluster of SEED channels, and we want to evaluate a list of CANDIDATE channels to find the most similar and relevant ones.
      
      SEED CHANNELS INFO:
      ${JSON.stringify(seedDetails.map(c => ({ title: c.snippet.title, desc: c.snippet.description.slice(0, 200) })))}
      
      CORE SCRIPT INTENT / NICHE KEYWORDS:
      "${searchKeywords}"
      
      CANDIDATES TO EVALUATE:
      ${JSON.stringify(candidates.map(c => ({
        id: c.id, title: c.title, desc: c.description.slice(0, 200), topics: c.topics
      })))}
      
      CRITICAL INSTRUCTION: Do NOT compare channels using exact titles or exact keyword matching. Evaluate them semantically based on:
      - Topic Match (e.g. "Personal Finance" vs "Money Management")
      - Video Intent Match (e.g. "How I made $10k" vs "Building a $10k business")
      - Audience Match (Demographic alignment)
      - Content Style Match
      - Storytelling Style Match
      - Title Formula Match (Structure of the title, not the exact words)

      For each candidate, provide:
      1. similarityScore: Overall score (0-100)
      2. topicMatchScore: (0-100)
      3. intentMatchScore: (0-100)
      4. audienceMatchScore: (0-100)
      5. contentStyleMatchScore: (0-100)
      6. storytellingMatchScore: (0-100)
      7. titleFormulaMatchScore: (0-100)
      8. confidenceIndicator: "High", "Medium", or "Low"
      9. whyMatched: An array of 3-5 concise bullet points explaining why this channel is a good recommendation.
      10. primaryNiche: The main niche of the candidate channel.
      
      Respond STRICTLY in JSON format matching this schema:
      {
        "analyses": {
          "[channel_id]": {
            "similarityScore": 85,
            "topicMatchScore": 90,
            "intentMatchScore": 88,
            "audienceMatchScore": 85,
            "contentStyleMatchScore": 80,
            "storytellingMatchScore": 75,
            "titleFormulaMatchScore": 82,
            "confidenceIndicator": "High",
            "whyMatched": ["Matches the storytelling format.", "Same target demographic."],
            "primaryNiche": "True Crime"
          }
        }
      }
    `;

    let aiAnalysis: Record<string, any> = {};
    let aiRes = "";
    try {
        aiRes = await provider.generateText(aiPrompt, { responseFormat: "json_object" });
        const cleanJson = aiRes.replace(/```json/g, "").replace(/```/g, "").trim();
        aiAnalysis = JSON.parse(cleanJson).analyses || {};
    } catch (e) {
        console.error("[V2 Similar Channels] AI JSON Parse Error:", e);
        console.error("Raw AI Output:", aiRes);
        // Fallback: Continue without AI enrichment rather than crashing completely
    }

    // Merge AI insights with channel data
    const processedChannels: V2Channel[] = candidates.map(c => {
      const insight = aiAnalysis[c.id] || {};
      
      // Calculate derived metrics for Compare mode and advanced filters
      const subs = parseInt(c.subscriberCount || "0");
      const views = parseInt(c.viewCount || "0");
      const vids = parseInt(c.videoCount || "1");
      const avgViews = Math.round(views / Math.max(1, vids));
      const performanceRatio = subs > 0 ? Number((avgViews / subs).toFixed(2)) : 0;
      
      // Calculate Channel Age in Months
      let channelAgeMonths = 0;
      if (c.publishedAt) {
          const published = new Date(c.publishedAt);
          const now = new Date();
          channelAgeMonths = (now.getFullYear() - published.getFullYear()) * 12 + (now.getMonth() - published.getMonth());
      }

      // Calculate pseudo Upload Frequency (heuristics based on video count and age)
      let uploadFrequency = "Monthly";
      if (channelAgeMonths > 0 && vids > 0) {
          const vidsPerMonth = vids / channelAgeMonths;
          if (vidsPerMonth > 20) uploadFrequency = "Daily";
          else if (vidsPerMonth > 8) uploadFrequency = "2-3 Times per Week";
          else if (vidsPerMonth > 3) uploadFrequency = "Weekly";
          else if (vidsPerMonth > 1.5) uploadFrequency = "Biweekly";
      }

      const contentType = "Mixed Content"; // Pseudo

      return {
        ...c,
        similarityScore: insight.similarityScore || 0,
        topicMatchScore: insight.topicMatchScore || 0,
        intentMatchScore: insight.intentMatchScore || 0,
        audienceMatchScore: insight.audienceMatchScore || 0,
        contentStyleMatchScore: insight.contentStyleMatchScore || 0,
        storytellingMatchScore: insight.storytellingMatchScore || 0,
        titleFormulaMatchScore: insight.titleFormulaMatchScore || 0,
        primaryNiche: insight.primaryNiche || "Unknown",
        matchExplanation: insight.whyMatched ? JSON.stringify(insight.whyMatched) : "[]",
        evidence: [insight.confidenceIndicator || "Medium"], 
        averageViews: avgViews,
        performanceRatio,
        uploadFrequency,
        channelAgeMonths,
        contentType,
        viewsPerSubRatio: subs > 0 ? Number((views / subs).toFixed(2)) : 0
      };
    });

    // Sort by Similarity Score descending
    processedChannels.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));

    // Cache the result
    await withCache(cacheKey, { namespace: "search", ttlMs: 24 * 60 * 60 * 1000 }, async () => processedChannels);

    return NextResponse.json({ channels: processedChannels, cached: false });
  } catch (error: any) {
    console.error("[V2 Similar Channels] Error:", error);
    // Return a clean error message to the frontend UI
    return NextResponse.json({ 
        error: error.message || "An unexpected error occurred during analysis. Please check your API keys." 
    }, { status: 500 });
  }
}

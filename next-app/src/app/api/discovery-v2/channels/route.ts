import { NextRequest, NextResponse } from "next/server";
import { resolveChannelId } from "@/lib/youtube";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const pageToken = searchParams.get("pageToken") || undefined;
    
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: "YouTube API key is missing. Please configure it in Settings." }, { status: 400 });
    }

    let searchTarget = query;
    let isSpecificChannel = false;
    
    try {
      const resolvedId = await resolveChannelId(query, YOUTUBE_API_KEY);
      
      const chanUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      chanUrl.searchParams.set("part", "snippet,statistics,brandingSettings");
      chanUrl.searchParams.set("id", resolvedId);
      chanUrl.searchParams.set("key", YOUTUBE_API_KEY);
      const chanRes = await fetch(chanUrl.toString());
      
      if (!chanRes.ok) {
         if (chanRes.status === 403 || chanRes.status === 429) {
           return NextResponse.json({ error: "YouTube Quota Exceeded. Please try again later." }, { status: 429 });
         }
         return NextResponse.json({ error: `YouTube API Error: ${chanRes.statusText}` }, { status: 500 });
      }

      const chanData = await chanRes.json();
      if (chanData.items?.[0]) {
        const item = chanData.items[0];
        const stats = item.statistics;
        const snippet = item.snippet;
        
        return NextResponse.json({
          channels: [{
            id: crypto.randomUUID(),
            channelId: item.id,
            title: snippet.title,
            thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
            subscriberCount: stats.subscriberCount || "0",
            videoCount: stats.videoCount || "0",
            viewCount: stats.viewCount || "0",
            description: snippet.description,
            customUrl: snippet.customUrl,
          }],
          nextPageToken: null,
          totalResults: 1
        });
      }
    } catch {
      // Not a direct handle/URL, it's a niche search
    }

    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("q", searchTarget);
    searchUrl.searchParams.set("maxResults", "15");
    searchUrl.searchParams.set("key", YOUTUBE_API_KEY);
    if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      if (searchRes.status === 403 || searchRes.status === 429) {
        return NextResponse.json({ error: "YouTube API quota exceeded." }, { status: 429 });
      }
      return NextResponse.json({ error: `YouTube API Error: ${searchRes.statusText}` }, { status: searchRes.status });
    }
    const searchData = await searchRes.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ channels: [], nextPageToken: undefined, totalResults: 0 });
    }

    const channelIds = searchData.items.map((item: any) => item.id.channelId).join(",");
    
    const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelsUrl.searchParams.set("part", "snippet,statistics,brandingSettings");
    channelsUrl.searchParams.set("id", channelIds);
    channelsUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const channelsRes = await fetch(channelsUrl.toString());
    if (!channelsRes.ok) return NextResponse.json({ error: "Failed to fetch channel details" }, { status: 500 });
    
    const channelsData = await channelsRes.json();
    const finalChannels = channelsData.items.map((item: any) => ({
      id: crypto.randomUUID(),
      channelId: item.id,
      title: item.snippet.title,
      customUrl: item.snippet.customUrl,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      subscriberCount: item.statistics.subscriberCount || "0",
      videoCount: item.statistics.videoCount || "0",
      viewCount: item.statistics.viewCount || "0",
    }));

    return NextResponse.json({
      channels: finalChannels,
      nextPageToken: searchData.nextPageToken,
      totalResults: searchData.pageInfo?.totalResults || 0
    });
  } catch (error: any) {
    console.error("Discovery V2 API Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

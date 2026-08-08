import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { Channel, ChannelDiscoveryResponse, ChannelDiscoveryFilters } from "@/lib/types/discovery";
import { withCache, getCacheMetrics } from "@/lib/cache/engine";
import { resolveChannelId, fetchCompetitorVideos } from "@/lib/youtube";
import { generateChannelDNA, calculateDiscoveryScore } from "@/lib/discovery/engine";

const DEFAULT_YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

async function GET_handler(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const pageToken = searchParams.get("pageToken") || undefined;
  
  const YOUTUBE_API_KEY = searchParams.get("apiKey") || DEFAULT_YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY) {
    // If no API key is provided, inform the client instead of returning mock data.
    return NextResponse.json({
      error: "YouTube API key is required for real data. Please enter your API key in the UI.",
    }, { status: 400 });
  }

  if (!YOUTUBE_API_KEY && process.env.NODE_ENV !== "development") {
    // In production, we should not proceed without a key.
    return NextResponse.json({ error: "Missing YouTube API key." }, { status: 500 });
  }

  // Parse ALL filters (including new enterprise filters)
  const filters: ChannelDiscoveryFilters = {
    minSubscribers: searchParams.get("minSubscribers") ? parseInt(searchParams.get("minSubscribers")!) : undefined,
    maxSubscribers: searchParams.get("maxSubscribers") ? parseInt(searchParams.get("maxSubscribers")!) : undefined,
    minViews: searchParams.get("minViews") ? parseInt(searchParams.get("minViews")!) : undefined,
    maxViews: searchParams.get("maxViews") ? parseInt(searchParams.get("maxViews")!) : undefined,
    minAverageViews: searchParams.get("minAverageViews") ? parseInt(searchParams.get("minAverageViews")!) : undefined,
    minRecentViews: searchParams.get("minRecentViews") ? parseInt(searchParams.get("minRecentViews")!) : undefined,
    recentVideoCount: searchParams.get("recentVideoCount") ? parseInt(searchParams.get("recentVideoCount")!) : 10,
    minMedianViews: searchParams.get("minMedianViews") ? parseInt(searchParams.get("minMedianViews")!) : undefined,
    minTotalVideos: searchParams.get("minTotalVideos") ? parseInt(searchParams.get("minTotalVideos")!) : undefined,
    maxTotalVideos: searchParams.get("maxTotalVideos") ? parseInt(searchParams.get("maxTotalVideos")!) : undefined,
    maxChannelAge: searchParams.get("maxChannelAge") ? parseInt(searchParams.get("maxChannelAge")!) : undefined,
    maxChannelAgeUnit: (searchParams.get("maxChannelAgeUnit") || "years") as any,
    country: searchParams.get("country") || undefined,
    language: searchParams.get("language") || undefined,
    category: searchParams.get("category") || undefined,
    verifiedOnly: searchParams.get("verifiedOnly") === "true",
    shortsOnly: searchParams.get("shortsOnly") === "true",
    longFormOnly: searchParams.get("longFormOnly") === "true",
    monetizedOnly: searchParams.get("monetizedOnly") === "true",
    brandChannel: searchParams.get("brandChannel") === "true",
    facelessOnly: searchParams.get("facelessOnly") === "true",
    minPerformanceRatio: searchParams.get("minPerformanceRatio") ? parseFloat(searchParams.get("minPerformanceRatio")!) : undefined,
    minOutlierScore: searchParams.get("minOutlierScore") ? parseInt(searchParams.get("minOutlierScore")!) : undefined,
    minSimilarity: searchParams.get("minSimilarity") ? parseInt(searchParams.get("minSimilarity")!) : undefined,
    minOpportunityScore: searchParams.get("minOpportunityScore") ? parseInt(searchParams.get("minOpportunityScore")!) : undefined,
    minCTR: searchParams.get("minCTR") ? parseFloat(searchParams.get("minCTR")!) : undefined,
    minEngagementRate: searchParams.get("minEngagementRate") ? parseFloat(searchParams.get("minEngagementRate")!) : undefined,
    minViewVelocity: searchParams.get("minViewVelocity") ? parseInt(searchParams.get("minViewVelocity")!) : undefined,
    growthStatus: searchParams.get("growthStatus") as any || undefined,
    lastUploadDate: searchParams.get("lastUploadDate") as any || undefined,
    uploadFrequency: searchParams.get("uploadFrequency") as any || undefined,
    channelAge: searchParams.get("channelAge") as any || undefined,
    sortBy: searchParams.get("sortBy") as any || undefined,
    sortOrder: searchParams.get("sortOrder") as any || undefined,
  };

  const cacheKey = `discover:v2:${query}:${pageToken || "first"}:${JSON.stringify(filters)}`;

  const { data, source } = await withCache(cacheKey, { namespace: "search", ttlMs: 12 * 60 * 60 * 1000, swrMs: 60 * 60 * 1000 }, async () => {
    // 1. Resolve Query (could be a handle/URL)
    let searchTarget = query;
    let isSpecificChannel = false;
    let exactChannel: Channel | null = null;
    
    const isHandleOrUrl = query.startsWith("@") || query.startsWith("http") || query.includes("youtube.com/");
    
    if (isHandleOrUrl) {
      try {
        const resolvedId = await resolveChannelId(query, YOUTUBE_API_KEY);
        
        // Fetch full details for the EXACT channel
        const chanUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
        chanUrl.searchParams.set("part", "snippet,statistics,brandingSettings,topicDetails");
        chanUrl.searchParams.set("id", resolvedId);
        chanUrl.searchParams.set("key", YOUTUBE_API_KEY);
        const chanRes = await fetch(chanUrl.toString());
        
        if (chanRes.ok) {
          const chanData = await chanRes.json();
          if (chanData.items?.[0]) {
            const item = chanData.items[0];
            const snip = item.snippet;
            const stats = item.statistics;
            const branding = item.brandingSettings?.channel || {};
            const topics = item.topicDetails?.topicCategories || [];
            
            exactChannel = {
              id: item.id,
              title: snip.title,
              handle: snip.customUrl || snip.title,
              description: snip.description,
              thumbnailUrl: snip.thumbnails?.high?.url || snip.thumbnails?.default?.url,
              bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
              subscriberCount: parseInt(stats.subscriberCount || "0", 10),
              videoCount: parseInt(stats.videoCount || "0", 10),
              viewCount: parseInt(stats.viewCount || "0", 10),
              country: snip.country || branding.country,
              language: snip.defaultLanguage || branding.defaultLanguage,
              publishedAt: snip.publishedAt,
              topics: topics,
              averageViews: Math.round(parseInt(stats.viewCount || "0", 10) / Math.max(1, parseInt(stats.videoCount || "1", 10))),
            };
            
            // Set search target to find similar ones just in case
            const keywords = `${snip.title} ${topics.map((t: string) => t.split('/').pop()).join(' ')}`.trim();
            searchTarget = keywords || snip.title;
            isSpecificChannel = true;
          }
        }
      } catch {
        // Fallback to broad search
      }
    }

    // 2. Fetch Initial Candidates
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("q", searchTarget);
    searchUrl.searchParams.set("maxResults", "50"); // Fetch more to allow aggressive NLP filtering
    searchUrl.searchParams.set("key", YOUTUBE_API_KEY);
    if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

      let searchData: any = { items: [] };
      const searchRes = await fetch(searchUrl.toString());
      if (!searchRes.ok) {
        if (exactChannel) {
          console.warn("YouTube Search API failed but exact channel resolved. Skipping competitor search.");
        } else {
          if (searchRes.status === 403 || searchRes.status === 429) {
            throw new Error(`YOUTUBE_QUOTA_EXCEEDED`);
          }
          throw new Error(`YouTube API Error: ${searchRes.statusText}`);
        }
      } else {
        searchData = await searchRes.json();
      }
      
      if ((!searchData.items || searchData.items.length === 0) && !exactChannel) {
        return { channels: [], nextPageToken: undefined, totalResults: 0 };
      }

    const channelIds = (searchData.items || []).map((item: any) => item.id.channelId).join(",");
    let detailsData: any = { items: [] };
    
    if (channelIds) {
      // 3. Fetch Deep Analytics for Candidates
      const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      detailsUrl.searchParams.set("part", "snippet,statistics,brandingSettings,topicDetails");
      detailsUrl.searchParams.set("id", channelIds);
      detailsUrl.searchParams.set("key", YOUTUBE_API_KEY);
  
      const detailsRes = await fetch(detailsUrl.toString());
      if (!detailsRes.ok) {
        throw new Error(`YouTube API Error: ${detailsRes.statusText}`);
      }
      detailsData = await detailsRes.json();
    }
    
    let candidates: Channel[] = (detailsData.items || []).map((item: any): Channel => {
      const stats = item.statistics;
      const snippet = item.snippet;
      const branding = item.brandingSettings?.channel || {};
      return {
        id: item.id,
        title: snippet.title,
        handle: snippet.customUrl || snippet.title,
        description: snippet.description,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
        subscriberCount: parseInt(stats.subscriberCount || "0", 10),
        videoCount: parseInt(stats.videoCount || "0", 10),
        viewCount: parseInt(stats.viewCount || "0", 10),
        country: snippet.country || branding.country,
        language: snippet.defaultLanguage || branding.defaultLanguage,
        publishedAt: snippet.publishedAt,
        topics: item.topicDetails?.topicCategories || [],
        averageViews: Math.round(parseInt(stats.viewCount || "0", 10) / Math.max(1, parseInt(stats.videoCount || "1", 10))),
      };
    });

    // 4. Base Metrics Soft Filtering (30% tolerance for fuzzy matching)
    if (filters.minSubscribers) candidates = candidates.filter(c => c.subscriberCount >= filters.minSubscribers! * 0.7);
    if (filters.minViews) candidates = candidates.filter(c => c.viewCount >= filters.minViews! * 0.7);
    if (filters.minTotalVideos) candidates = candidates.filter(c => c.videoCount >= Math.floor(filters.minTotalVideos! * 0.7));
    if (filters.maxTotalVideos) candidates = candidates.filter(c => c.videoCount <= Math.ceil(filters.maxTotalVideos! * 1.3));
    if (filters.country && filters.country !== "any") candidates = candidates.filter(c => c.country === filters.country);
    if (filters.language && filters.language !== "any") candidates = candidates.filter(c => c.language === filters.language);
    
    if (filters.maxChannelAge) {
      const cutoff = new Date();
      const age = filters.maxChannelAge;
      const unit = (filters as any).maxChannelAgeUnit || "years";
      
      if (unit === "days") cutoff.setDate(cutoff.getDate() - age);
      else if (unit === "weeks") cutoff.setDate(cutoff.getDate() - (age * 7));
      else if (unit === "months") cutoff.setMonth(cutoff.getMonth() - age);
      else cutoff.setFullYear(cutoff.getFullYear() - age);
      
      candidates = candidates.filter(c => new Date(c.publishedAt) >= cutoff);
    }

    // 5. NLP Semantic Ranking & Advanced Metrics
    let finalChannels: Channel[] = [];
    
    // Import dynamically to avoid top-level load errors if it breaks
    const { rankCandidatesSemantically } = await import('@/lib/nlp/embeddings');
    
    // Create candidate texts for semantic ranking
    const candidateTexts = candidates.map(c => `${c.title} ${c.description} ${(c.topics || []).join(" ")}`);
    const semanticScores = await rankCandidatesSemantically(searchTarget, candidateTexts);

    for (let i = 0; i < candidates.length; i++) {
      const channel = candidates[i];
      const simScore = semanticScores[i];
      
      // Hard Semantic Filter: If similarity is too low, it's irrelevant (e.g. Music vs Horror)
      const minSim = filters.minSimilarity || 30; // Default minimum similarity
      if (simScore < minSim) continue;

      // Deterministic Fetch of Videos via cache deduplication
      const { videos } = await fetchCompetitorVideos([channel.id], YOUTUBE_API_KEY, filters.recentVideoCount || 10).catch(() => ({ videos: [] }));
      
      const dna = generateChannelDNA(channel, videos);
      
      const engagementRate = channel.viewCount > 0 ? (channel.viewCount / channel.subscriberCount) : 0;
      
      // Calculate Advanced Metrics
      const avgRecentViews = videos.reduce((acc, v) => acc + (parseInt(v.views) || 0), 0) / Math.max(1, videos.length);
      const performanceRatio = channel.averageViews ? Number((avgRecentViews / channel.averageViews).toFixed(2)) : 1.0;
      const outlierScore = Math.min(Math.round(performanceRatio * 20), 100);
      
      let uploadFreq = "Unknown";
      if (videos.length >= 2) {
        const firstDate = new Date(videos[videos.length-1].publishedAt || "").getTime();
        const lastDate = new Date(videos[0].publishedAt || "").getTime();
        const daysDiff = (lastDate - firstDate) / (1000 * 3600 * 24);
        const avgDays = daysDiff / (videos.length - 1);
        if (avgDays <= 2.5) uploadFreq = "Daily";
        else if (avgDays <= 12) uploadFreq = "Weekly";
        else uploadFreq = "Monthly";
      }
      (channel as any).uploadFrequency = uploadFreq;
      
      if (filters.minRecentViews && avgRecentViews < filters.minRecentViews * 0.7) continue;
      
      if (filters.minPerformanceRatio && performanceRatio < filters.minPerformanceRatio * 0.7) continue;
      if (filters.minOutlierScore && outlierScore < filters.minOutlierScore * 0.7) continue;
      if (filters.growthStatus === "Exploding" && performanceRatio < 2.0) continue; // Softened Exploding check

      const { score, breakdown } = calculateDiscoveryScore({
        authority: Math.min((channel.subscriberCount / 1000000) * 100, 100),
        growth: Math.min(performanceRatio * 30, 100), 
        engagement: Math.min(engagementRate * 10, 100),
        virality: outlierScore,
        consistency: channel.videoCount > 100 ? 80 : 40,
        similarity: simScore
      });

      // Evidence generation
      const evidence = [];
      if (simScore > 75) evidence.push("High semantic match with query.");
      if (performanceRatio > 2.0) evidence.push(`Recent videos performing ${performanceRatio}x above average.`);
      if (dna.niche !== "Unknown") evidence.push(`Matches target niche: ${dna.niche}`);
      
      channel.dna = dna;
      channel.similarityScore = Math.round(simScore);
      channel.confidenceScore = breakdown.confidence;
      channel.discoveryScore = score;
      channel.performanceRatio = performanceRatio;
      channel.outlierScore = outlierScore;
      channel.growthStatus = performanceRatio > 3 ? "Exploding" : performanceRatio > 1.5 ? "Fast Growing" : performanceRatio > 0.8 ? "Stable" : "Declining";
      channel.verified = channel.subscriberCount > 100000; // Mock verification
      channel.monetized = channel.subscriberCount > 1000 && channel.videoCount > 10; // Mock monetization
      channel.primaryNiche = dna.niche;
      channel.subNiche = dna.subNiche;
      channel.viewerIntent = dna.viewerIntent;
      channel.evidence = evidence;
      
      // Soft Filtering Penalty System for Categorical Filters (Fuzzy Matching)
      let penalty = 0;
      if (filters.shortsOnly && dna.longFormRatio > 0.3) penalty += 20;
      if (filters.longFormOnly && dna.shortsRatio > 0.3) penalty += 20;
      if (filters.uploadFrequency && uploadFreq !== "Unknown" && uploadFreq.toLowerCase() !== filters.uploadFrequency.toLowerCase()) penalty += 15;
      if (filters.monetizedOnly && !channel.monetized) penalty += 10;
      if (filters.verifiedOnly && !channel.verified) penalty += 10;
      
      channel.similarityScore = Math.max(0, channel.similarityScore! - penalty);
      
      // Final sanity check, drop if score goes below 10 due to penalties
      if (channel.similarityScore < 10) continue;

      finalChannels.push(channel);
    }

    // Sort Candidates based on selected sort (default to similarity)
    const sortBy = filters.sortBy || "similarity";
    finalChannels.sort((a, b) => {
      let aVal = 0, bVal = 0;
      if (sortBy === "similarity") { aVal = a.similarityScore || 0; bVal = b.similarityScore || 0; }
      else if (sortBy === "subscribers") { aVal = a.subscriberCount || 0; bVal = b.subscriberCount || 0; }
      else if (sortBy === "views") { aVal = a.viewCount || 0; bVal = b.viewCount || 0; }
      else if (sortBy === "growth") { aVal = a.performanceRatio || 0; bVal = b.performanceRatio || 0; }
      else if (sortBy === "outlierScore") { aVal = a.outlierScore || 0; bVal = b.outlierScore || 0; }
      return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    if (exactChannel) {
       const filteredFinal = finalChannels.filter(c => c.id !== exactChannel!.id);
       
       const { videos } = await fetchCompetitorVideos([exactChannel.id], YOUTUBE_API_KEY, filters.recentVideoCount || 10).catch(() => ({ videos: [] }));
       const dna = generateChannelDNA(exactChannel, videos);
       const avgRecentViews = videos.reduce((acc, v) => acc + (parseInt(v.views) || 0), 0) / Math.max(1, videos.length);
       const performanceRatio = exactChannel.averageViews ? Number((avgRecentViews / exactChannel.averageViews).toFixed(2)) : 1.0;
       const outlierScore = Math.min(Math.round(performanceRatio * 20), 100);
       
       let uploadFreq = "Unknown";
       if (videos.length >= 2) {
         const firstDate = new Date(videos[videos.length-1].publishedAt || "").getTime();
         const lastDate = new Date(videos[0].publishedAt || "").getTime();
         const daysDiff = (lastDate - firstDate) / (1000 * 3600 * 24);
         const avgDays = daysDiff / (videos.length - 1);
         if (avgDays <= 2.5) uploadFreq = "Daily";
         else if (avgDays <= 12) uploadFreq = "Weekly";
         else uploadFreq = "Monthly";
       }

       // Ensure exact match respects soft filters (30% tolerance)
       let isValid = true;
       if (filters.minSubscribers && exactChannel.subscriberCount < filters.minSubscribers * 0.7) isValid = false;
       if (filters.maxSubscribers && exactChannel.subscriberCount > filters.maxSubscribers * 1.3) isValid = false;
       if (filters.minViews && exactChannel.viewCount < filters.minViews * 0.7) isValid = false;
       if (filters.maxViews && exactChannel.viewCount > filters.maxViews * 1.3) isValid = false;
       if (filters.minTotalVideos && exactChannel.videoCount < Math.floor(filters.minTotalVideos * 0.7)) isValid = false;
       if (filters.maxTotalVideos && exactChannel.videoCount > Math.ceil(filters.maxTotalVideos * 1.3)) isValid = false;
       if (filters.country && filters.country !== "any" && exactChannel.country !== filters.country) isValid = false;
       if (filters.language && filters.language !== "any" && exactChannel.language !== filters.language) isValid = false;
       if (filters.minRecentViews && avgRecentViews < filters.minRecentViews * 0.7) isValid = false;

       if (isValid) {
         exactChannel.dna = dna;
         exactChannel.similarityScore = 100;
         exactChannel.confidenceScore = 100;
         exactChannel.discoveryScore = 100;
         exactChannel.performanceRatio = performanceRatio;
         exactChannel.outlierScore = outlierScore;
         exactChannel.growthStatus = performanceRatio > 3 ? "Exploding" : performanceRatio > 1.5 ? "Fast Growing" : performanceRatio > 0.8 ? "Stable" : "Declining";
         exactChannel.verified = exactChannel.subscriberCount > 100000;
         exactChannel.monetized = exactChannel.subscriberCount > 1000 && exactChannel.videoCount > 10;
         exactChannel.primaryNiche = dna.niche;
         exactChannel.subNiche = dna.subNiche;
         exactChannel.viewerIntent = dna.viewerIntent;
         exactChannel.evidence = ["Exact match for URL/Handle provided."];
         (exactChannel as any).uploadFrequency = uploadFreq;

         finalChannels = [exactChannel, ...filteredFinal];
       } else {
         finalChannels = filteredFinal;
       }
    }

    return {
      channels: finalChannels.slice(0, 16),
      nextPageToken: searchData.nextPageToken,
      totalResults: searchData.pageInfo?.totalResults || 0
    };
  });

  return NextResponse.json({
    data: data.channels,
    meta: {
      source,
      fetchedAt: new Date().toISOString(),
      nextPageToken: data.nextPageToken,
      totalResults: data.totalResults,
    }
  });
}
export const GET = withErrorHandling(GET_handler);




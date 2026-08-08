import { NextResponse } from 'next/server';
import { V2Video } from '@/lib/types/discovery-v2';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channelIds } = body;

    if (!channelIds || !Array.isArray(channelIds)) {
      return NextResponse.json({ error: 'Invalid input: channelIds array is required.' }, { status: 400 });
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return NextResponse.json({ error: 'YouTube API key is missing.' }, { status: 500 });
    }

    const outlierVideos: V2Video[] = [];

    for (const channelId of channelIds) {
      // 1. Fetch channel stats
      const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${youtubeApiKey}`);
      if (!channelRes.ok) continue;
      const channelData = await channelRes.json();
      
      if (!channelData.items || channelData.items.length === 0) continue;
      const channel = channelData.items[0];
      const subCount = parseInt(channel.statistics.subscriberCount || '0', 10);
      const channelTitle = channel.snippet.title;

      // 2. Fetch recent videos (max 10 for analysis)
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=15&key=${youtubeApiKey}`);
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      
      if (!searchData.items || searchData.items.length === 0) continue;
      
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      
      // 3. Fetch video statistics
      const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`);
      if (!videosRes.ok) continue;
      const videosData = await videosRes.json();
      
      if (!videosData.items) continue;

      let totalViews = 0;
      let validVideos = 0;

      const videosWithStats = videosData.items.map((v: any) => {
        const views = parseInt(v.statistics?.viewCount || '0', 10);
        totalViews += views;
        validVideos++;
        return {
          id: v.id,
          videoId: v.id,
          title: v.snippet.title,
          thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || '',
          viewCount: v.statistics?.viewCount || '0',
          publishedAt: v.snippet.publishedAt,
          duration: v.contentDetails?.duration || '',
          channelId: channelId,
          channelTitle: channelTitle,
          tags: v.snippet.tags || [],
          transcriptStatus: 'Missing' as const
        };
      });

      const averageViews = validVideos > 0 ? totalViews / validVideos : 0;

      // 4. Calculate outlier score
      for (const video of videosWithStats) {
        const views = parseInt(video.viewCount, 10);
        let score = 0;
        
        // Outlier score based on view count relative to channel average
        if (averageViews > 0) {
          score = views / averageViews; // E.g., 2.5 means 2.5x the average views
        } else if (subCount > 0) {
          score = views / subCount; // Fallback to sub count
        }
        
        outlierVideos.push({
          ...video,
          outlierScore: parseFloat(score.toFixed(2))
        });
      }
    }
    
    // Sort overall by outlier score descending
    outlierVideos.sort((a, b) => (b.outlierScore || 0) - (a.outlierScore || 0));

    return NextResponse.json({ outlierVideos });
  } catch (error) {
    console.error('Error in outliers/route.ts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

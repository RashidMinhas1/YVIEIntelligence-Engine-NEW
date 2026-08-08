import { NextResponse } from 'next/server';
import { V2Channel } from '@/lib/types/discovery-v2';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { seedChannelIds } = body;

    if (!seedChannelIds || !Array.isArray(seedChannelIds)) {
      return NextResponse.json({ error: 'Invalid input: seedChannelIds array is required.' }, { status: 400 });
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return NextResponse.json({ error: 'YouTube API key is missing.' }, { status: 500 });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'OpenRouter API key is missing.' }, { status: 500 });
    }

    // 1. Fetch seed channel details to get something to search for
    const seedChannels: V2Channel[] = [];
    for (const channelId of seedChannelIds) {
      const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`);
      if (!ytRes.ok) continue;
      const data = await ytRes.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        seedChannels.push({
          id: item.id,
          channelId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.default?.url || '',
          subscriberCount: item.statistics.subscriberCount || '0',
          videoCount: item.statistics.videoCount || '0',
          viewCount: item.statistics.viewCount || '0',
        });
      }
    }

    if (seedChannels.length === 0) {
      return NextResponse.json({ error: 'Could not fetch any seed channels.' }, { status: 400 });
    }

    // 2. Find related channels using YouTube Search API
    const foundChannels = new Map<string, V2Channel>();
    for (const seed of seedChannels) {
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(seed.title)}&maxResults=5&key=${youtubeApiKey}`);
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      
      if (searchData.items) {
        for (const item of searchData.items) {
          const cid = item.snippet.channelId;
          if (!seedChannelIds.includes(cid) && !foundChannels.has(cid)) {
            // Fetch stats for the found channel
            const statRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${cid}&key=${youtubeApiKey}`);
            let subCount = '0';
            let vidCount = '0';
            let vCount = '0';
            if (statRes.ok) {
              const statData = await statRes.json();
              if (statData.items && statData.items.length > 0) {
                subCount = statData.items[0].statistics.subscriberCount || '0';
                vidCount = statData.items[0].statistics.videoCount || '0';
                vCount = statData.items[0].statistics.viewCount || '0';
              }
            }
            
            foundChannels.set(cid, {
              id: cid,
              channelId: cid,
              title: item.snippet.channelTitle || item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails?.default?.url || '',
              subscriberCount: subCount,
              videoCount: vidCount,
              viewCount: vCount,
            });
          }
        }
      }
    }

    const candidateChannels = Array.from(foundChannels.values());
    if (candidateChannels.length === 0) {
      return NextResponse.json({ similarChannels: [] });
    }

    // 3. Evaluate similarity with OpenRouter
    const prompt = `
You are a YouTube viral intelligence engine. 
Given the following seed channels and candidate channels, evaluate how similar each candidate is to the seed channels overall.
Return a JSON array containing ONLY objects with:
- channelId (string)
- similarityScore (number 0-100)
- matchExplanation (string)

Seed Channels:
${JSON.stringify(seedChannels.map(c => ({ title: c.title, description: c.description })), null, 2)}

Candidate Channels:
${JSON.stringify(candidateChannels.map(c => ({ channelId: c.channelId, title: c.title, description: c.description })), null, 2)}
`;

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!aiRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from OpenRouter' }, { status: aiRes.status >= 500 ? 500 : aiRes.status });
    }

    const aiData = await aiRes.json();
    let evaluations;
    try {
      const content = aiData.choices[0].message.content;
      evaluations = JSON.parse(content);
      // The AI might wrap the array in an object like { "evaluations": [...] } or just return an array.
      if (!Array.isArray(evaluations) && evaluations.channels) evaluations = evaluations.channels;
      if (!Array.isArray(evaluations) && evaluations.evaluations) evaluations = evaluations.evaluations;
      if (!Array.isArray(evaluations) && evaluations.results) evaluations = evaluations.results;
      if (!Array.isArray(evaluations)) {
          // Attempt to extract the first array value from the object
          const firstArray = Object.values(evaluations).find(val => Array.isArray(val));
          if (firstArray) evaluations = firstArray;
          else throw new Error("Not an array");
      }
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse LLM response as JSON.' }, { status: 500 });
    }

    // Map evaluations back to candidates
    const finalChannels = candidateChannels.map(cand => {
      const evalData = evaluations.find((e: any) => e.channelId === cand.channelId);
      return {
        ...cand,
        similarityScore: evalData ? evalData.similarityScore : 0,
        matchExplanation: evalData ? evalData.matchExplanation : 'No explanation provided.',
      };
    }).sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));

    return NextResponse.json({ similarChannels: finalChannels });
  } catch (error) {
    console.error('Error in similar/route.ts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

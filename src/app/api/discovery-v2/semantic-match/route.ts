import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { videos } = body;

    if (!videos || !Array.isArray(videos)) {
      return NextResponse.json({ error: 'Invalid input: videos array is required.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key is missing.' }, { status: 500 });
    }

    const prompt = `
You are a YouTube viral intelligence engine. 
Given the following outlier video titles/descriptions, find or conceptualize YouTube videos with the *same concept* but different titles.
Respond in JSON format ONLY, containing an array of objects. 
Each object must have the following fields:
- originalTitle (string)
- conceptualTitle (string)
- similarityScore (number 0-100)
- matchExplanation (string)

Videos:
${JSON.stringify(videos, null, 2)}
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Defaulting to a standard openrouter model that supports json
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from OpenRouter' }, { status: response.status >= 500 ? 500 : response.status });
    }

    const data = await response.json();
    let result;
    try {
      const content = data.choices[0].message.content;
      result = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse LLM response as JSON.' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

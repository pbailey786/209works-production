import { NextRequest, NextResponse } from 'next/server';


export const runtime = 'edge';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `
You are an expert job search assistant for a job board focused on the 209 area (Central California, area code 209).
Extract the following from this job search query, but only include locations, companies, and jobs that are in the 209 area or exist in our database:
- Keywords
- Location (must be in the 209 area)
- Salary range (min and max, in USD/year if possible)
- Job type (full-time, part-time, contract, internship, etc.)
- Remote/onsite
- Any other relevant filters

Return your answer as a JSON object with these fields:
{
  "keywords": [],
  "location": "",
  "salaryMin": null,
  "salaryMax": null,
  "jobType": "",
  "remote": null
}
`;

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not set.' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { query } = body;
  if (!query || typeof query !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid "query" field.' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Query: "${query}"` },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'OpenAI API error', details: error },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse LLM response', raw: content },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: e instanceof Error ? e.message : e,
      },
      { status: 500 }
    );
  }
}

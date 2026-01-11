import { NextRequest, NextResponse } from 'next/server';
import { DataSnapshot, EventType, PredictionCategory, AiOpinions } from '@/types';
import { generateDataHash } from '@/lib/data';
import { randomUUID } from 'crypto';

function generateOpinionsPrompt(
  eventType: string,
  category: string,
  snapshot: DataSnapshot
): string {
  return `You are a macroeconomic analyst. Generate 3 different perspectives on the upcoming ${eventType}.

Current Market Data:
${JSON.stringify(snapshot, null, 2)}

Category: ${category === 'rate' ? 'Interest Rate Decision' : 'S&P 500 Direction'}

CRITICAL GUIDELINES:
1. Consider the LATEST U.S. economic trends and news that could impact the decision
   - Include recent policy announcements, Fed statements, economic reports, geopolitical events
   - Research or recall relevant current events and their potential impact
   - Consider both domestic and international factors affecting the U.S. economy

2. Look at the COMPLETE picture, not narrow or biased data
   - Do NOT cherry-pick data that only supports a particular viewpoint
   - Analyze ALL available indicators comprehensively
   - Consider interconnections between different economic indicators
   - Acknowledge conflicting signals and explain how they balance out

3. Be DETAILED and COMPREHENSIVE in your reasoning
   - Length is not a concern - provide thorough analysis
   - Explain the logic chain: how each data point leads to the conclusion
   - Discuss multiple factors and their relative weights
   - Include historical context and patterns when relevant
   - Address potential counterarguments and why they may be outweighed

Generate exactly 3 opinions representing different viewpoints:
${category === 'rate' ? `
1. BULLISH (Rate Hike): Arguments for raising rates
2. NEUTRAL (Hold): Arguments for keeping rates unchanged  
3. BEARISH (Rate Cut): Arguments for cutting rates
` : `
1. BULLISH (Up): Arguments for market going up
2. NEUTRAL: Arguments for sideways movement
3. BEARISH (Down): Arguments for market going down
`}

For each opinion provide:
- title: Short title (Korean)
- summary: 2-3 sentence summary (Korean)
- reasoning: DETAILED and COMPREHENSIVE reasoning with specific data references, latest trends, and news considerations (Korean). Be thorough - length is encouraged.
- keyIndicators: Array of 2-3 key indicators used (format: "Name: Value")

Respond in JSON format:
{
  "bullish": { "title": "", "summary": "", "reasoning": "", "keyIndicators": [] },
  "neutral": { "title": "", "summary": "", "reasoning": "", "keyIndicators": [] },
  "bearish": { "title": "", "summary": "", "reasoning": "", "keyIndicators": [] }
}

Be objective and balanced. Each opinion should be plausible based on comprehensive analysis of all data, not selective cherry-picking.`;
}

export async function POST(request: NextRequest) {
  try {
    const { eventType, category, snapshot } = await request.json();

    if (!eventType || !category || !snapshot) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, category, snapshot' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const prompt = generateOpinionsPrompt(eventType, category, snapshot);
    const dataHash = generateDataHash(snapshot);

    // 모델 선택
    let modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const apiVersion = 'v1beta';
    const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage = 'Failed to generate AI opinions';
      
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        console.error('AI opinions API error:', errorData);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    let content: string | undefined;

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content?.parts && candidate.content.parts.length > 0) {
        content = candidate.content.parts[0].text;
      }
    }

    if (!content) {
      return NextResponse.json(
        { error: 'No content in response' },
        { status: 500 }
      );
    }

    // JSON 파싱 시도
    let opinionsData;
    try {
      // 코드 블록 제거
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      opinionsData = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: content },
        { status: 500 }
      );
    }

    // AiOpinions 형식으로 변환
    const aiOpinions: AiOpinions = {
      generatedAt: new Date().toISOString(),
      dataHash,
      opinions: {
        bullish: {
          id: randomUUID(),
          stance: 'bullish',
          title: opinionsData.bullish?.title || '',
          summary: opinionsData.bullish?.summary || '',
          reasoning: opinionsData.bullish?.reasoning || '',
          keyIndicators: opinionsData.bullish?.keyIndicators || [],
        },
        neutral: {
          id: randomUUID(),
          stance: 'neutral',
          title: opinionsData.neutral?.title || '',
          summary: opinionsData.neutral?.summary || '',
          reasoning: opinionsData.neutral?.reasoning || '',
          keyIndicators: opinionsData.neutral?.keyIndicators || [],
        },
        bearish: {
          id: randomUUID(),
          stance: 'bearish',
          title: opinionsData.bearish?.title || '',
          summary: opinionsData.bearish?.summary || '',
          reasoning: opinionsData.bearish?.reasoning || '',
          keyIndicators: opinionsData.bearish?.keyIndicators || [],
        },
      },
    };

    return NextResponse.json(aiOpinions);
  } catch (error) {
    console.error('AI opinions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

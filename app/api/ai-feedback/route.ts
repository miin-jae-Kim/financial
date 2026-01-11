import { NextRequest, NextResponse } from 'next/server';
import { JournalEntry, DataSnapshot } from '@/types';

function generateFeedbackPrompt(
  entry: JournalEntry,
  actualResult: string,
  currentSnapshot: DataSnapshot
): string {
  return `You are a macroeconomic mentor reviewing a student's prediction.

Event: ${entry.eventTitle}
Category: ${entry.category === 'rate' ? 'Interest Rate' : 'S&P 500'}

Student's Prediction: ${entry.prediction}
Actual Result: ${actualResult}
Prediction Correct: ${entry.prediction === actualResult ? 'Yes' : 'No'}

Student's Memo:
${entry.memo}

Data at Prediction Time (${entry.snapshot.timestamp}):
${JSON.stringify(entry.snapshot, null, 2)}

Data After Result (${currentSnapshot.timestamp}):
${JSON.stringify(currentSnapshot, null, 2)}

Provide feedback in Korean:
1. Whether the prediction was correct
2. What the student did well (specific points)
3. What could be improved (specific points)
4. Suggestions for next similar event

Be constructive and educational. Reference specific data points.
Keep the feedback concise but actionable.`;
}

export async function POST(request: NextRequest) {
  try {
    const { entry, actualResult, currentSnapshot } = await request.json();

    if (!entry || !actualResult || !currentSnapshot) {
      return NextResponse.json(
        { error: 'Missing required fields: entry, actualResult, currentSnapshot' },
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

    const prompt = generateFeedbackPrompt(entry, actualResult, currentSnapshot);

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
      let errorMessage = 'Failed to generate AI feedback';
      
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        console.error('AI feedback API error:', errorData);
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

    return NextResponse.json({ feedback: content });
  } catch (error) {
    console.error('AI feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

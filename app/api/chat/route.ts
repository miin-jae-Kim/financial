import { NextRequest, NextResponse } from 'next/server';
import { ChatContext } from '@/lib/chatContext';

const SYSTEM_PROMPT = `You are a macroeconomic investment advisor assistant specializing in data-driven analysis.

Your role is to provide investment advice based on numerical data interpretation, prioritizing objective analysis over user intent. When making decisions, you should present multiple scenarios based on different numerical interpretations rather than following the user's subjective intentions.

You have access to the following real-time market data:
{CONTEXT}

CRITICAL GUIDELINES:
1. NEVER refuse to answer questions - always provide analysis based on available data and research
2. Base your analysis on:
   a) The provided numerical data (currentData and derived indicators)
   b) Important political and economic information you can research or recall
   c) Comprehensive judgment combining the above
3. ALWAYS cite specific numbers and sources as evidence for your analysis
4. When answering questions:
   - Use the provided JSON data as the primary foundation
   - Research or recall relevant political, economic, and market information when needed
   - Combine data analysis with contextual knowledge
   - Present multiple scenarios based on different interpretations when appropriate
5. Do NOT make specific buy/sell recommendations
6. Use Korean language for responses
7. Keep responses informative but concise (max 800 words)
8. Always include specific numbers from the data as evidence
9. Explain what indicators typically suggest
10. Note any unusual patterns or divergences
11. Consider multiple scenarios based on different data interpretations

When analyzing:
- ALWAYS cite specific numbers from the data (e.g., "10Y Treasury: 4.19%", "Yield Spread: 0.70%")
- Reference the data structure: currentData (treasury2y, treasury10y, fedFundsRate, cpi, cpiYoY, nonfarmPayroll, vix, sp500, hySpread, sahmRule, unemployment) and derived (yieldSpread, realRate)
- Explain what the indicators typically suggest based on historical patterns
- Present multiple scenarios if data can be interpreted differently
- Note any unusual patterns or divergences
- Consider both bullish and bearish interpretations when relevant
- When discussing future outlooks, base predictions on current trends and historical patterns from the data

Example response format:
"현재 데이터를 보면:
- [구체적 수치와 지표명]
- [추가 수치]

이러한 수치들은 [해석]을 시사합니다. 
[관련 정치/경제 맥락]

따라서 [종합적 판단]을 제시할 수 있습니다:
- 시나리오 1: [수치 기반 해석]
- 시나리오 2: [다른 수치 기반 해석]"`;

function buildSystemPrompt(context: ChatContext): string {
  const contextString = JSON.stringify(context, null, 2);
  return SYSTEM_PROMPT.replace('{CONTEXT}', contextString);
}

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    // 환경변수에서 Gemini API 키 가져오기
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your .env.local file.',
          details: 'See README.md for setup instructions.'
        },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(context as ChatContext);

    // Gemini API 호출
    // 메시지 형식 변환: 첫 번째 메시지가 user여야 함
    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // 사용 가능한 모델 목록 확인 (ListModels API 호출)
    let availableModels: string[] = [];
    try {
      const modelsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        availableModels = (modelsData.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name?.replace('models/', '') || '')
          .filter((name: string) => name);
      } else {
        console.warn('Failed to fetch models list:', await modelsResponse.text());
      }
    } catch (e) {
      console.warn('Failed to fetch available models:', e);
    }

    // 모델 선택 로직
    let modelName = process.env.GEMINI_MODEL;
    
    // 사용 가능한 모델 목록이 있으면 우선순위에 따라 선택
    if (availableModels.length > 0) {
      const preferredModels = [
        'gemini-2.5-flash', // 기본 모델
        'gemini-2.5-flash-latest',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
      ];
      
      // 환경변수로 지정된 모델이 사용 가능한지 확인
      if (modelName && availableModels.includes(modelName)) {
        // 사용자가 지정한 모델이 사용 가능하면 사용
      } else {
        // 우선순위에 따라 사용 가능한 모델 찾기
        modelName = undefined;
        for (const preferred of preferredModels) {
          if (availableModels.includes(preferred)) {
            modelName = preferred;
            break;
          }
        }
        // 사용 가능한 모델이 없으면 첫 번째 모델 사용
        if (!modelName && availableModels.length > 0) {
          modelName = availableModels[0];
        }
      }
    } else {
      // 모델 목록을 가져오지 못한 경우 기본값 사용
      modelName = modelName || 'gemini-2.5-flash';
    }
    
    if (!modelName) {
      return NextResponse.json(
        { error: 'No available models found. Please check your API key and try again.' },
        { status: 500 }
      );
    }
    
    console.log(`Using Gemini model: ${modelName}`);
    
    // API 버전 및 엔드포인트
    // v1beta는 최신 모델, v1은 구버전 모델 지원
    const apiVersion = 'v1beta';
    let apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;
    
    let response = await fetch(apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: formattedMessages,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            // maxOutputTokens 제거 - 모델 기본값 사용 (더 긴 답변 가능)
          },
        }),
      }
    );

    // 404 에러인 경우 다른 모델 시도
    if (!response.ok && response.status === 404) {
      const errorData = await response.text();
      console.warn(`Model "${modelName}" not found in ${apiVersion}, trying alternative models...`);
      
      // 대체 모델 및 API 버전 시도
      const attempts = [
        { version: 'v1beta', model: 'gemini-1.5-flash' },
        { version: 'v1beta', model: 'gemini-1.5-pro' },
        { version: 'v1beta', model: 'gemini-pro' },
        { version: 'v1', model: 'gemini-pro' },
      ];
      
      for (const attempt of attempts) {
        if (attempt.model === modelName && attempt.version === apiVersion) continue;
        
        apiUrl = `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${apiKey}`;
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: formattedMessages,
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              // maxOutputTokens 제거 - 모델 기본값 사용 (더 긴 답변 가능)
            },
          }),
        });
        
        if (response.ok) {
          console.log(`Successfully using model: ${attempt.model} (${attempt.version})`);
          modelName = attempt.model;
          break;
        }
      }
    }
    
    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage = 'Failed to get response from AI';
      
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
          console.error('Gemini API error:', errorJson.error);
          
          // 모델을 찾을 수 없는 경우 안내
          if (errorJson.error.code === 404 && errorJson.error.message.includes('not found')) {
            errorMessage = `Model "${modelName}" not found. Please check available models at https://ai.google.dev/models or set GEMINI_MODEL environment variable.`;
          }
        }
      } catch (e) {
        console.error('Gemini API error (raw):', errorData);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 로그: 전체 API 응답 확인
    console.log('=== Gemini API Response ===');
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(data));
    console.log('Full response:', JSON.stringify(data, null, 2));
    
    // Gemini API 응답 구조 확인 및 처리
    let content: string | undefined;
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      console.log('Candidate structure:', JSON.stringify(candidate, null, 2));
      
      if (candidate.content?.parts && candidate.content.parts.length > 0) {
        content = candidate.content.parts[0].text;
        console.log('Content extracted from parts[0].text, length:', content?.length);
      } else if (candidate.content?.text) {
        content = candidate.content.text;
        console.log('Content extracted from content.text, length:', content?.length);
      } else {
        console.warn('Unexpected candidate structure:', candidate);
      }
      
      // finishReason 확인
      if (candidate.finishReason) {
        console.log('Finish reason:', candidate.finishReason);
        if (candidate.finishReason === 'MAX_TOKENS') {
          console.warn('Response was truncated due to MAX_TOKENS limit');
        }
      }
    }

    if (!content) {
      console.error('Unexpected Gemini API response:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { 
          error: 'No content in response',
          details: 'The AI service returned an unexpected response format.'
        },
        { status: 500 }
      );
    }

    console.log('Final content length:', content.length);
    console.log('Content preview (first 200 chars):', content.substring(0, 200));
    console.log('=== End Response Log ===');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

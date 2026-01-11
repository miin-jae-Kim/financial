'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { CombinedData } from '@/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { buildChatContext } from '@/lib/chatContext';

interface ChatTabProps {
  data: CombinedData;
}

export function ChatTab({ data }: ChatTabProps) {
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요. 현재 대시보드 데이터를 기반으로 매크로 투자 관련 질문에 답변해 드립니다.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 대시보드 데이터를 컨텍스트로 변환
  const context = useMemo(() => buildChatContext(data), [data]);

  // 메시지 추가 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const result = await response.json();
      
      // 로그: 클라이언트에서 받은 응답 확인
      console.log('=== ChatTab Response ===');
      console.log('Response result:', result);
      console.log('Content type:', typeof result.content);
      console.log('Content length:', result.content?.length);
      console.log('Content preview:', result.content?.substring(0, 200));
      
      if (result.error) {
        console.error('Error in response:', result.error);
        throw new Error(result.error);
      }

      const content = result.content || '응답을 생성할 수 없습니다.';
      console.log('Final content to display, length:', content.length);
      console.log('=== End ChatTab Log ===');

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-terminal-muted text-sm">
            <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
            <span>답변을 생성하고 있습니다...</span>
          </div>
        )}
        {error && (
          <div className="bg-terminal-surface border border-terminal-red rounded-lg p-3">
            <p className="text-terminal-red text-sm">{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-terminal-border p-4">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

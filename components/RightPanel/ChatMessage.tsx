'use client';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          isUser
            ? 'bg-terminal-green/10 border border-terminal-green/30 rounded-tr-sm'
            : 'bg-terminal-blue/10 border border-terminal-blue/30 rounded-tl-sm'
        }`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <span className="text-lg flex-shrink-0">🤖</span>
          )}
          <div className="flex-1">
            <p className="text-sm text-white whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          {isUser && (
            <span className="text-lg flex-shrink-0">👤</span>
          )}
        </div>
      </div>
    </div>
  );
}

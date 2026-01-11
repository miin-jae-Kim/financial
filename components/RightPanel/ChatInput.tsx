'use client';

import { KeyboardEvent } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="flex gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요..."
        disabled={disabled}
        rows={2}
        className="flex-1 bg-terminal-surface/50 border border-terminal-border rounded-lg px-3 py-2 text-sm text-white placeholder-terminal-muted resize-none focus:outline-none focus:border-terminal-green transition-colors disabled:opacity-50"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="px-4 py-2 bg-terminal-green text-terminal-bg rounded-lg font-medium text-sm hover:bg-terminal-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        전송
      </button>
    </div>
  );
}

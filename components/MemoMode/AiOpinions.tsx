'use client';

import { AiOpinions as AiOpinionsType } from '@/types';

interface AiOpinionsProps {
  opinions: AiOpinionsType;
  onSelect: (opinionId: string) => void;
  selectedId: string | null;
  onRegenerate: () => void;
  isLoading: boolean;
}

export function AiOpinions({ opinions, onSelect, selectedId, onRegenerate, isLoading }: AiOpinionsProps) {
  const opinionCards = [
    { key: 'bullish' as const, emoji: '🔴', color: 'text-terminal-red' },
    { key: 'neutral' as const, emoji: '🟡', color: 'text-terminal-yellow' },
    { key: 'bearish' as const, emoji: '🟢', color: 'text-terminal-green' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">AI 의견 (3가지 관점)</h3>
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="text-xs text-terminal-muted hover:text-terminal-green transition-colors disabled:opacity-50"
        >
          {isLoading ? '생성 중...' : '🔄 새로고침'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {opinionCards.map(({ key, emoji, color }) => {
          const opinion = opinions.opinions[key];
          const isSelected = selectedId === opinion.id;
          
          return (
            <div
              key={key}
              className={`bg-terminal-surface border rounded-lg p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-terminal-green bg-terminal-green/10'
                  : 'border-terminal-border hover:border-terminal-green/50'
              }`}
              onClick={() => onSelect(opinion.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{emoji}</span>
                <h4 className={`text-sm font-medium ${color}`}>{opinion.title}</h4>
              </div>
              <p className="text-xs text-terminal-muted mb-3 line-clamp-3">
                {opinion.summary}
              </p>
              <div className="space-y-1 mb-3">
                {opinion.keyIndicators.map((indicator, idx) => (
                  <div key={idx} className="text-xs text-terminal-muted">
                    • {indicator}
                  </div>
                ))}
              </div>
              <button
                className={`w-full py-1.5 text-xs rounded border transition-colors ${
                  isSelected
                    ? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
                    : 'border-terminal-border text-terminal-muted hover:border-terminal-green/50'
                }`}
              >
                {isSelected ? '선택됨' : '선택'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

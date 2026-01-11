'use client';

import { useState } from 'react';
import { CombinedData } from '@/types';
import { MarketTab } from './MarketTab';
import { ChatTab } from './ChatTab';

type RightPanelTab = 'market' | 'chat';

interface RightPanelProps {
  data: CombinedData;
  isOpen: boolean;
  onClose: () => void;
}

export function RightPanel({ data, isOpen, onClose }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('market');

  if (!isOpen) return null;

  return (
    <aside className="w-80 flex-shrink-0 border-l border-terminal-border bg-terminal-surface/50 transition-all duration-300 flex flex-col justify-start items-start">
      <div className="sticky top-[80px] w-full flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Tab Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-terminal-border">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('market')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors relative -mb-px ${
                activeTab === 'market'
                  ? 'text-terminal-green border-b-2 border-terminal-green'
                  : 'text-terminal-muted hover:text-white'
              }`}
            >
              증시 발표
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors relative -mb-px ${
                activeTab === 'chat'
                  ? 'text-terminal-green border-b-2 border-terminal-green'
                  : 'text-terminal-muted hover:text-white'
              }`}
            >
              AI Chat
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-terminal-muted hover:text-white transition-colors -mb-px"
            aria-label="Close panel"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'market' && <MarketTab data={data} />}
          {activeTab === 'chat' && <ChatTab data={data} />}
        </div>
      </div>
    </aside>
  );
}

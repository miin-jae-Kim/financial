'use client';

import { TabId, TABS } from '@/types';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 px-4 py-4 border-b border-terminal-border bg-terminal-bg/80 backdrop-blur-sm max-w-7xl mx-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-display font-medium rounded-md transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-terminal-green/10 border border-terminal-green text-terminal-green shadow-[0_0_10px_rgba(0,255,159,0.3)]'
              : 'bg-transparent border border-terminal-border/20 text-terminal-muted hover:text-white hover:border-terminal-border'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

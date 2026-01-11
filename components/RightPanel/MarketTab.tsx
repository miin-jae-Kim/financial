'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { CombinedData, EventType } from '@/types';
import { IndicatorReleaseDate, getAllNextReleaseDates } from '@/lib/releaseDates';
import { ReleaseResults } from '../ReleaseResults';
import { fetchAllEntries } from '@/lib/journal';
import { JournalEntry } from '@/types';

interface MarketTabProps {
  data: CombinedData;
  onOpenMemoMode?: (eventId: string, eventType: EventType, eventDate: string, eventTitle: string) => void;
  onOpenReviewMode?: (entryId: string) => void;
}

function getEventType(key: string): EventType | null {
  if (key === 'fedFundsRate') return 'FOMC';
  if (key === 'cpi') return 'CPI';
  if (key === 'nonfarmPayroll') return 'NFP';
  return null;
}

function getEventId(eventType: EventType, eventDate: string): string {
  return `${eventType.toLowerCase()}-${eventDate}`;
}

function getEventTitle(eventType: EventType, eventDate: string, name: string): string {
  const date = new Date(eventDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (eventType === 'FOMC') {
    return `${year}년 ${month}월 FOMC 금리 결정`;
  }
  if (eventType === 'CPI') {
    return `${year}년 ${month}월 CPI 발표`;
  }
  if (eventType === 'NFP') {
    return `${year}년 ${month}월 Nonfarm Payroll 발표`;
  }
  return name;
}

type TabType = 'schedule' | 'results';

export function MarketTab({ data, onOpenMemoMode, onOpenReviewMode }: MarketTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [releaseDates, setReleaseDates] = useState<IndicatorReleaseDate[]>([]);
  const [releaseDatesData, setReleaseDatesData] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // 발표 일정 가져오기
        const dates = await getAllNextReleaseDates();
        setReleaseDates(dates);

        // 발표 일정 전체 데이터 가져오기 (발표 결과용)
        const response = await fetch('/api/release-results');
        if (response.ok) {
          const data = await response.json();
          setReleaseDatesData(data);
        }

        // Journal 엔트리 가져오기
        const entries = await fetchAllEntries();
        setJournalEntries(entries);
      } catch (error) {
        console.error('Error fetching release data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getDaysUntil = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(targetDate, today);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    return format(new Date(dateStr), 'MM/dd');
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <p className="text-terminal-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub Tab Selector */}
      <div className="flex gap-2 px-4 pt-4 pb-2 border-b border-terminal-border">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative -mb-px ${
            activeTab === 'schedule'
              ? 'text-terminal-green border-b-2 border-terminal-green'
              : 'text-terminal-muted hover:text-white'
          }`}
        >
          발표 일정
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative -mb-px ${
            activeTab === 'results'
              ? 'text-terminal-green border-b-2 border-terminal-green'
              : 'text-terminal-muted hover:text-white'
          }`}
        >
          발표 결과
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'schedule' && (
          <div className="space-y-2">
            {releaseDates.length === 0 ? (
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
                <p className="text-terminal-muted text-sm">No release dates available</p>
              </div>
            ) : (
              releaseDates.map((item) => {
                const daysUntil = getDaysUntil(item.nextReleaseDate);
                const isToday = daysUntil === 0;
                const isSoon = daysUntil !== null && daysUntil <= 3;
                const eventType = getEventType(item.key);
                const hasEntry = eventType && item.nextReleaseDate
                  ? journalEntries.some(e => e.eventId === getEventId(eventType, item.nextReleaseDate!))
                  : false;

                const handleClick = () => {
                  if (!eventType || !item.nextReleaseDate || !onOpenMemoMode) return;
                  
                  const eventId = getEventId(eventType, item.nextReleaseDate);
                  const eventTitle = getEventTitle(eventType, item.nextReleaseDate, item.name);
                  onOpenMemoMode(eventId, eventType, item.nextReleaseDate, eventTitle);
                };

                return (
                  <div
                    key={item.key}
                    onClick={handleClick}
                    className={`bg-terminal-surface border border-terminal-border rounded-lg p-3 cursor-pointer hover:border-terminal-green/50 transition-colors ${
                      hasEntry ? 'border-terminal-green/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-medium text-white">{item.name}</span>
                          {hasEntry && (
                            <span className="text-xs text-terminal-green">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-terminal-muted">{item.releaseName}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            isToday
                              ? 'text-terminal-green'
                              : isSoon
                              ? 'text-terminal-yellow'
                              : 'text-white'
                          }`}
                        >
                          {formatDate(item.nextReleaseDate)}
                        </p>
                        {daysUntil !== null && (
                          <p className="text-xs text-terminal-muted">
                            {isToday
                              ? 'Today'
                              : daysUntil === 1
                              ? 'Tomorrow'
                              : `${daysUntil}d`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <ReleaseResults
            data={data}
            releaseDates={releaseDatesData}
            journalEntries={journalEntries}
            onOpenReviewMode={onOpenReviewMode}
          />
        )}
      </div>
    </div>
  );
}

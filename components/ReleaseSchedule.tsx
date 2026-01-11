'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { CombinedData } from '@/types';
import { IndicatorReleaseDate, getAllNextReleaseDates } from '@/lib/releaseDates';
import { ReleaseResults } from './ReleaseResults';

interface ReleaseScheduleProps {
  data: CombinedData;
}

type TabType = 'schedule' | 'results';

export function ReleaseSchedule({ data }: ReleaseScheduleProps) {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [releaseDates, setReleaseDates] = useState<IndicatorReleaseDate[]>([]);
  const [releaseDatesData, setReleaseDatesData] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

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
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
        <p className="text-terminal-muted text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Selector */}
      <div className="flex gap-2 mb-4 border-b border-terminal-border">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'schedule'
              ? 'text-terminal-green border-b-2 border-terminal-green'
              : 'text-terminal-muted hover:text-white'
          }`}
        >
          발표 일정
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'results'
              ? 'text-terminal-green border-b-2 border-terminal-green'
              : 'text-terminal-muted hover:text-white'
          }`}
        >
          발표 결과
        </button>
      </div>

      {/* Tab Content */}
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

              return (
                <div
                  key={item.key}
                  className="bg-terminal-surface border border-terminal-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-white">{item.name}</span>
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
        <ReleaseResults data={data} releaseDates={releaseDatesData} />
      )}
    </div>
  );
}

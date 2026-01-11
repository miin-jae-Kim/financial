'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { CombinedData, INDICATOR_CONFIGS, EventType, JournalEntry } from '@/types';
import { getLatestValue, formatValue } from '@/lib/data';

function getEventType(key: string): EventType | null {
  if (key === 'fedFundsRate') return 'FOMC';
  if (key === 'cpi') return 'CPI';
  if (key === 'nonfarmPayroll') return 'NFP';
  return null;
}

function getEventId(eventType: EventType, eventDate: string): string {
  return `${eventType.toLowerCase()}-${eventDate}`;
}

interface ReleaseResult {
  key: string;
  name: string;
  releaseDate: string;
  previousValue: number | null;
  currentValue: number | null;
  change: number | null;
  changePercent: number | null;
  color: string;
  unit: string;
}

interface ReleaseResultsProps {
  data: CombinedData;
  releaseDates: Record<string, string[]>;
  journalEntries?: JournalEntry[];
  onOpenReviewMode?: (entryId: string) => void;
}

export function ReleaseResults({ data, releaseDates, journalEntries = [], onOpenReviewMode }: ReleaseResultsProps) {
  const results = useMemo(() => {
    const today = new Date();
    const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1); // 지난달 1일
    const lastMonthFirstStr = lastMonthFirst.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    const results: ReleaseResult[] = [];
    const indicatorResults = new Map<string, ReleaseResult>(); // 같은 지표의 가장 최신 발표만 저장

    for (const config of INDICATOR_CONFIGS) {
      if (!config.releaseId) continue;

      const indicatorData = data.indicators[config.key as keyof typeof data.indicators] || [];
      const releases = releaseDates[config.key] || [];

      if (indicatorData.length === 0 || releases.length === 0) continue;

      // 지난달 1일부터 오늘까지의 발표 일정만 찾기
      for (const releaseDate of releases) {
        if (releaseDate >= todayStr) break; // 미래 발표는 제외
        if (releaseDate < lastMonthFirstStr) continue; // 지난달 1일 이전 발표는 제외

        // 발표 날짜와 같은 월의 데이터 찾기 (월간 데이터는 발표일과 다를 수 있음)
        // 예: 1월 10일 발표지만 데이터는 1월 1일로 저장됨
        const releaseYearMonth = releaseDate.substring(0, 7); // YYYY-MM
        
        // 발표 날짜와 같은 년월의 데이터 찾기
        let releaseDataPoint = indicatorData
          .filter((dp) => dp.date.startsWith(releaseYearMonth))
          .sort((a, b) => a.date.localeCompare(b.date))[0];
        
        // 같은 년월 데이터가 없으면 발표 날짜 이전의 가장 가까운 데이터 찾기
        // (발표 후 데이터가 아직 업데이트되지 않았을 수 있음)
        if (!releaseDataPoint) {
          releaseDataPoint = indicatorData
            .filter((dp) => dp.date <= releaseDate)
            .sort((a, b) => b.date.localeCompare(a.date))[0];
        }
        
        // 여전히 없으면 발표 날짜 이후의 첫 번째 데이터 찾기
        if (!releaseDataPoint) {
          releaseDataPoint = indicatorData
            .filter((dp) => dp.date > releaseDate)
            .sort((a, b) => a.date.localeCompare(b.date))[0];
        }
        
        if (!releaseDataPoint) continue;

        // 이전 데이터 찾기 (발표 데이터 날짜 이전의 마지막 데이터)
        const previousDataPoint = indicatorData
          .filter((dp) => dp.date < releaseDataPoint.date)
          .sort((a, b) => b.date.localeCompare(a.date))[0];

        if (previousDataPoint) {
          const change = releaseDataPoint.value - previousDataPoint.value;
          const changePercent = (change / previousDataPoint.value) * 100;

          const result: ReleaseResult = {
            key: config.key,
            name: config.name,
            releaseDate,
            previousValue: previousDataPoint.value,
            currentValue: releaseDataPoint.value,
            change,
            changePercent,
            color: config.color,
            unit: config.unit,
          };

          // 같은 지표의 기존 결과가 있으면 발표 날짜가 더 최신인 것만 저장
          const existing = indicatorResults.get(config.key);
          if (!existing || releaseDate > existing.releaseDate) {
            indicatorResults.set(config.key, result);
          }
        }
      }
    }

    // Map에서 배열로 변환하고 발표 날짜가 최근 순으로 정렬
    return Array.from(indicatorResults.values()).sort((a, b) => 
      b.releaseDate.localeCompare(a.releaseDate)
    );
  }, [data, releaseDates]);

  if (results.length === 0) {
    return (
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
        <p className="text-terminal-muted text-sm">No recent release results</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result, index) => {
        const isPositive = result.change !== null && result.change >= 0;
        const changeColor = isPositive ? 'text-terminal-green' : 'text-terminal-red';
        const changeSymbol = isPositive ? '+' : '';
        const eventType = getEventType(result.key);
        const entry = eventType
          ? journalEntries.find(e => e.eventId === getEventId(eventType, result.releaseDate))
          : null;
        const hasEntry = !!entry;
        const hasResult = !!entry?.result;

        const handleClick = () => {
          if (entry && onOpenReviewMode) {
            onOpenReviewMode(entry.id);
          }
        };

        return (
          <div
            key={`${result.key}-${result.releaseDate}-${index}`}
            onClick={hasEntry ? handleClick : undefined}
            className={`bg-terminal-surface border border-terminal-border rounded-lg p-3 ${
              hasEntry ? 'cursor-pointer hover:border-terminal-green/50 transition-colors' : ''
            } ${hasResult ? 'border-terminal-green/30' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: result.color }}
                />
                <span className="text-sm font-medium text-white">{result.name}</span>
                {hasEntry && (
                  <span className="text-xs text-terminal-green">
                    {hasResult ? '✓' : '📝'}
                  </span>
                )}
              </div>
              <span className="text-xs text-terminal-muted">
                {format(new Date(result.releaseDate), 'yyyy.MM.dd')}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-terminal-muted">이전:</span>
                <span className="text-white">
                  {result.previousValue !== null
                    ? formatValue(result.previousValue, result.unit, result.key)
                    : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-terminal-muted">발표:</span>
                <span className="text-white font-medium">
                  {result.currentValue !== null
                    ? formatValue(result.currentValue, result.unit, result.key)
                    : '--'}
                </span>
              </div>
              {result.change !== null && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-terminal-border">
                  <span className="text-terminal-muted">변화:</span>
                  <span className={`font-bold ${changeColor}`}>
                    {changeSymbol}
                    {formatValue(result.change, result.unit, result.key)}
                    {result.changePercent !== null && (
                      <span className="ml-1">
                        ({changeSymbol}
                        {result.changePercent.toFixed(2)}%)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

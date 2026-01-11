'use client';

import { useMemo } from 'react';
import { CombinedData } from '@/types';
import { filterByDateRange, calculateYieldSpread } from '@/lib/data';
import { CompositeChart } from '../charts/CompositeChart';
import { DateRangeSelector } from '../DateRangeSelector';

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

interface RecessionViewProps {
  data: CombinedData;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function RecessionView({ data, dateRange, onDateRangeChange }: RecessionViewProps) {
  // Calculate yield spread
  const spread = useMemo(() => {
    return calculateYieldSpread(
      data.indicators.treasury10y || [],
      data.indicators.treasury2y || []
    );
  }, [data]);

  // Prepare chart series
  const chartSeries = useMemo(() => {
    const spreadData = filterByDateRange(spread, dateRange);
    const sahmRule = filterByDateRange(data.indicators.sahmRule || [], dateRange);
    const unemployment = filterByDateRange(data.indicators.unemployment || [], dateRange);

    return [
      {
        data: spreadData,
        name: 'Yield Spread (10Y - 2Y)',
        color: '#00ff9f',
        strokeWidth: 3,
        type: 'line' as const,
      },
      {
        data: sahmRule,
        name: 'Sahm Rule',
        color: '#ff3366',
        strokeWidth: 2,
        type: 'line' as const,
      },
      {
        data: unemployment,
        name: 'Unemployment Rate',
        color: '#6366f1',
        strokeWidth: 2,
        type: 'line' as const,
      },
    ];
  }, [data, dateRange, spread]);

  return (
    <>
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-white mb-2">
              Yield Spread (10Y - 2Y)
            </h2>
            <p className="text-sm text-terminal-muted">
              침체 신호 지표: 역전된 수익률 곡선과 실업률 분석
            </p>
          </div>
          <DateRangeSelector dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
        </div>
        <CompositeChart
          series={chartSeries}
          dateRange={dateRange}
          height={400}
          leftAxisLabel="%"
          referenceLines={[
            {
              value: 0,
              label: '0% 기준선',
              color: '#666',
              strokeDasharray: '5 5',
            },
            {
              value: 0.5,
              label: 'Sahm Rule 임계값',
              color: '#ff3366',
              strokeDasharray: '5 5',
            },
          ]}
        />
      </div>
    </>
  );
}

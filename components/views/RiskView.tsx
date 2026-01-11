'use client';

import { useMemo } from 'react';
import { CombinedData } from '@/types';
import { filterByDateRange } from '@/lib/data';
import { CompositeChart } from '../charts/CompositeChart';
import { DateRangeSelector } from '../DateRangeSelector';

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

interface RiskViewProps {
  data: CombinedData;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function RiskView({ data, dateRange, onDateRangeChange }: RiskViewProps) {
  // Prepare chart series
  const chartSeries = useMemo(() => {
    const sp500 = filterByDateRange(data.indicators.sp500 || [], dateRange);
    const vix = filterByDateRange(data.indicators.vix || [], dateRange);
    const hySpread = filterByDateRange(data.indicators.hySpread || [], dateRange);

    return [
      {
        data: sp500,
        name: 'S&P 500',
        color: '#00ff9f',
        strokeWidth: 2,
        type: 'area' as const,
        yAxisId: 'left' as const,
      },
      {
        data: vix,
        name: 'VIX',
        color: '#ff3366',
        strokeWidth: 2,
        type: 'line' as const,
        yAxisId: 'right' as const,
      },
      {
        data: hySpread,
        name: 'HY Spread',
        color: '#ffd93d',
        strokeWidth: 2,
        strokeDasharray: '5 5',
        type: 'line' as const,
        yAxisId: 'right' as const,
      },
    ];
  }, [data, dateRange]);

  return (
    <>
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-white mb-2">
              리스크 센티먼트 Risk Sentiment
            </h2>
            <p className="text-sm text-terminal-muted">
              주식시장과 신용시장의 리스크 센티먼트 비교
            </p>
          </div>
          <DateRangeSelector dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
        </div>
        <CompositeChart
          series={chartSeries}
          dateRange={dateRange}
          height={400}
          leftAxisLabel="S&P 500"
          rightAxisLabel="VIX / HY Spread"
          referenceLines={[]}
        />
      </div>
    </>
  );
}

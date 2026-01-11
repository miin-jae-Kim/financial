'use client';

import { useMemo } from 'react';
import { CombinedData } from '@/types';
import { filterByDateRange, calculateYieldSpread } from '@/lib/data';
import { CompositeChart } from '../charts/CompositeChart';
import { DateRangeSelector } from '../DateRangeSelector';

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

interface RatesViewProps {
  data: CombinedData;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function RatesView({ data, dateRange, onDateRangeChange }: RatesViewProps) {
  // Calculate yield spread
  const spread = useMemo(() => {
    return calculateYieldSpread(
      data.indicators.treasury10y || [],
      data.indicators.treasury2y || []
    );
  }, [data]);

  // Prepare chart series
  const chartSeries = useMemo(() => {
    const fedFunds = filterByDateRange(data.indicators.fedFundsRate || [], dateRange);
    const treasury2y = filterByDateRange(data.indicators.treasury2y || [], dateRange);
    const treasury10y = filterByDateRange(data.indicators.treasury10y || [], dateRange);
    const spreadData = filterByDateRange(spread, dateRange);

    return [
      {
        data: fedFunds,
        name: 'Fed Funds Rate',
        color: '#ffd93d',
        strokeWidth: 3,
        type: 'line' as const,
      },
      {
        data: treasury2y,
        name: '2Y Treasury',
        color: '#00ff9f',
        strokeWidth: 2,
        type: 'line' as const,
      },
      {
        data: treasury10y,
        name: '10Y Treasury',
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
              금리환경 Interest Rate Regime
            </h2>
            <p className="text-sm text-terminal-muted">
              Fed 정책과 시장 금리 기대 간의 관계 분석
            </p>
          </div>
          <DateRangeSelector dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
        </div>
        <CompositeChart
          series={chartSeries}
          dateRange={dateRange}
          height={400}
          leftAxisLabel="금리 (%)"
          referenceLines={[]}
        />
      </div>
    </>
  );
}

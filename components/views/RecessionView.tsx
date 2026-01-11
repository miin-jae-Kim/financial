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
  // Calculate yield spread (10Y - 2Y)
  const yieldSpread = useMemo(() => {
    return calculateYieldSpread(
      data.indicators.treasury10y || [],
      data.indicators.treasury2y || []
    );
  }, [data]);

  // Prepare chart series for yield spread
  const spreadSeries = useMemo(() => {
    const spreadData = filterByDateRange(yieldSpread, dateRange);
    return [
      {
        data: spreadData,
        name: '10Y-2Y Spread',
        color: '#6366f1',
        strokeWidth: 2,
        type: 'line' as const,
      },
    ];
  }, [yieldSpread, dateRange]);

  // Prepare chart series for Sahm Rule
  const sahmSeries = useMemo(() => {
    const sahmData = filterByDateRange(data.indicators.sahmRule || [], dateRange);
    return [
      {
        data: sahmData,
        name: 'Sahm Rule',
        color: '#ff3366',
        strokeWidth: 2,
        type: 'line' as const,
      },
    ];
  }, [data, dateRange]);

  return (
    <>
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-white mb-2">
              Yield Spread (10Y - 2Y)
            </h2>
            <p className="text-sm text-terminal-muted">
              장단기 금리차 역전은 경기침체의 선행지표로 간주됩니다
            </p>
          </div>
          <DateRangeSelector dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
        </div>
        <CompositeChart
          series={spreadSeries}
          dateRange={dateRange}
          height={400}
          leftAxisLabel="%"
          referenceLines={[
            {
              value: 0,
              label: '0% 기준선 (역전)',
              color: '#666',
              strokeDasharray: '5 5',
            },
          ]}
        />
      </div>

      {/* Sahm Rule Chart */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-white mb-2">
              Sahm Rule
            </h2>
            <p className="text-sm text-terminal-muted">
              실업률의 3개월 이동평균이 12개월 최저치보다 0.5%p 이상 상승하면 경기침체 신호
            </p>
          </div>
        </div>
        <CompositeChart
          series={sahmSeries}
          dateRange={dateRange}
          height={400}
          leftAxisLabel="%p"
          referenceLines={[
            {
              value: 0.5,
              label: '0.5%p 기준선 (침체 신호)',
              color: '#ff3366',
              strokeDasharray: '5 5',
            },
          ]}
        />
      </div>
    </>
  );
}

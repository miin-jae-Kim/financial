'use client';

import { useMemo } from 'react';
import { CombinedData } from '@/types';
import { filterByDateRange, calculateYoY } from '@/lib/data';
import { CompositeChart } from '../charts/CompositeChart';
import { DateRangeSelector } from '../DateRangeSelector';

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

interface InflationViewProps {
  data: CombinedData;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function InflationView({ data, dateRange, onDateRangeChange }: InflationViewProps) {
  // Calculate CPI YoY
  const cpiYoY = useMemo(() => {
    return calculateYoY(data.indicators.cpi || []);
  }, [data]);

  // Calculate Real Rate (Fed Funds Rate - CPI YoY)
  const realRate = useMemo(() => {
    const fedFunds = data.indicators.fedFundsRate || [];
    const cpiYoYData = cpiYoY;
    
    if (fedFunds.length === 0 || cpiYoYData.length === 0) return [];

    // Create a map of dates to values
    const fedMap = new Map<string, number>();
    fedFunds.forEach((dp) => fedMap.set(dp.date, dp.value));
    
    const cpiMap = new Map<string, number>();
    cpiYoYData.forEach((dp) => cpiMap.set(dp.date, dp.value));

    // Get all dates
    const dates = new Set([...fedMap.keys(), ...cpiMap.keys()]);
    const result: Array<{ date: string; value: number }> = [];

    dates.forEach((date) => {
      const fed = fedMap.get(date);
      const cpi = cpiMap.get(date);
      if (fed !== undefined && cpi !== undefined) {
        result.push({
          date,
          value: fed - cpi,
        });
      }
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [data, cpiYoY]);

  // Prepare chart series
  const chartSeries = useMemo(() => {
    const cpiYoYData = filterByDateRange(cpiYoY, dateRange);
    const fedFunds = filterByDateRange(data.indicators.fedFundsRate || [], dateRange);
    const realRateData = filterByDateRange(realRate, dateRange);

    return [
      {
        data: cpiYoYData,
        name: 'CPI YoY',
        color: '#ff3366',
        strokeWidth: 3,
        type: 'line' as const,
      },
      {
        data: fedFunds,
        name: 'Fed Funds Rate',
        color: '#ffd93d',
        strokeWidth: 2,
        type: 'line' as const,
      },
      {
        data: realRateData,
        name: 'Real Rate',
        color: realRateData.length > 0 && realRateData[realRateData.length - 1].value >= 0 ? '#00ff9f' : '#ff3366',
        strokeWidth: 1,
        type: 'area' as const,
      },
    ];
  }, [data, dateRange, cpiYoY, realRate]);

  return (
    <>
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-white mb-2">
              인플레이션 & 실질금리 Inflation Dynamics
            </h2>
            <p className="text-sm text-terminal-muted">
              실제 인플레이션과 통화정책의 긴축 강도 분석
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
          ]}
        />
      </div>
    </>
  );
}

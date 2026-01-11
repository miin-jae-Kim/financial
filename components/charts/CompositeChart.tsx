'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { DataPoint } from '@/types';
import { filterByDateRange } from '@/lib/data';
import { format } from 'date-fns';

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

interface ChartSeries {
  data: DataPoint[];
  name: string;
  color: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  type?: 'line' | 'area';
  yAxisId?: 'left' | 'right';
}

interface CompositeChartProps {
  series: ChartSeries[];
  dateRange: DateRange;
  height?: number;
  leftAxisLabel?: string;
  rightAxisLabel?: string;
  referenceLines?: Array<{
    value: number;
    label?: string;
    color?: string;
    strokeDasharray?: string;
  }>;
  showLegend?: boolean;
}

export function CompositeChart({
  series,
  dateRange,
  height = 400,
  leftAxisLabel,
  rightAxisLabel,
  referenceLines = [],
  showLegend = true,
}: CompositeChartProps) {
  // Combine and filter data
  const chartData = useMemo(() => {
    if (series.length === 0) return [];

    // Get all unique dates from all series
    const dateSet = new Set<string>();
    series.forEach((s) => {
      s.data.forEach((dp) => dateSet.add(dp.date));
    });

    // Create a map of date -> values for each series
    const seriesMaps = series.map((s) => {
      const map = new Map<string, number>();
      s.data.forEach((dp) => map.set(dp.date, dp.value));
      return map;
    });

    // Combine data
    const combined: Array<Record<string, any>> = [];
    const sortedDates = Array.from(dateSet).sort();

    sortedDates.forEach((date) => {
      const entry: Record<string, any> = { date };
      series.forEach((s, idx) => {
        const value = seriesMaps[idx].get(date);
        entry[s.name] = value !== undefined ? value : null;
      });
      combined.push(entry);
    });

    // Filter by date range (series data is already filtered, but we need to filter combined data)
    if (dateRange === 'ALL') return combined;
    
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case '1M': {
        const date = new Date(now);
        date.setMonth(date.getMonth() - 1);
        startDate = date;
        break;
      }
      case '3M': {
        const date = new Date(now);
        date.setMonth(date.getMonth() - 3);
        startDate = date;
        break;
      }
      case '6M': {
        const date = new Date(now);
        date.setMonth(date.getMonth() - 6);
        startDate = date;
        break;
      }
      case '1Y': {
        const date = new Date(now);
        date.setFullYear(date.getFullYear() - 1);
        startDate = date;
        break;
      }
      case '2Y': {
        const date = new Date(now);
        date.setFullYear(date.getFullYear() - 2);
        startDate = date;
        break;
      }
      default:
        return combined;
    }
    
    const startStr = startDate.toISOString().split('T')[0];
    return combined.filter((d) => d.date >= startStr);
  }, [series, dateRange]);

  const hasRightAxis = series.some((s) => s.yAxisId === 'right');

  // Format tooltip
  const formatTooltipValue = (value: number | null, name: string) => {
    if (value === null || value === undefined) return '--';
    const seriesConfig = series.find((s) => s.name === name);
    // You can add custom formatting here based on series config
    return value.toFixed(2);
  };

  const formatXAxis = (tickItem: string) => {
    try {
      return format(new Date(tickItem), 'MMM d');
    } catch {
      return tickItem;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxis}
          stroke="#666"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          yAxisId="left"
          stroke="#666"
          style={{ fontSize: '12px' }}
          label={leftAxisLabel ? { value: leftAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        {hasRightAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#666"
            style={{ fontSize: '12px' }}
            label={rightAxisLabel ? { value: rightAxisLabel, angle: 90, position: 'insideRight' } : undefined}
          />
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: '#fff',
          }}
          labelFormatter={(label) => format(new Date(label), 'yyyy-MM-dd')}
          formatter={formatTooltipValue}
        />
        {showLegend && <Legend />}
        {referenceLines.map((ref, idx) => (
          <ReferenceLine
            key={idx}
            y={ref.value}
            yAxisId="left"
            stroke={ref.color || '#666'}
            strokeDasharray={ref.strokeDasharray || '5 5'}
            label={ref.label}
          />
        ))}
        {series.map((s, idx) => {
          const commonProps = {
            key: idx,
            dataKey: s.name,
            stroke: s.color,
            strokeWidth: s.strokeWidth || 2,
            strokeDasharray: s.strokeDasharray,
            yAxisId: s.yAxisId || 'left',
            dot: false,
            activeDot: { r: 4 },
          };

          if (s.type === 'area') {
            return (
              <Area
                {...commonProps}
                fill={s.color}
                fillOpacity={0.2}
                type="monotone"
              />
            );
          }

          return <Line {...commonProps} type="monotone" />;
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { DataPoint } from '@/types';
import { format, parseISO } from 'date-fns';

interface ChartProps {
  data: DataPoint[];
  color: string;
  unit?: string;
  showArea?: boolean;
  referenceValue?: number;
  height?: number;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded px-3 py-2">
      <p className="text-terminal-muted text-xs mb-1">
        {format(parseISO(label), 'yyyy.MM.dd')}
      </p>
      <p className="text-white font-medium">
        {payload[0].value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        {unit}
      </p>
    </div>
  );
};

export function IndicatorChart({
  data,
  color,
  unit = '',
  showArea = false,
  referenceValue,
  height = 200,
}: ChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-terminal-muted"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(parseISO(date), 'MM/yy')}
          stroke="#6b7280"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={50}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.toLocaleString()}
          width={45}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {referenceValue !== undefined && (
          <ReferenceLine
            y={referenceValue}
            stroke="#6b7280"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
        )}
        {showArea ? (
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${color})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

interface MiniChartProps {
  data: DataPoint[];
  color: string;
  height?: number;
}

export function MiniChart({ data, color, height = 40 }: MiniChartProps) {
  if (!data.length) return null;

  // Take last 30 data points for mini chart
  const chartData = data.slice(-30);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`mini-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#mini-gradient-${color})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

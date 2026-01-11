'use client';

import { DataPoint, IndicatorConfig } from '@/types';
import { getLatestValue, getChange, formatValue } from '@/lib/data';
import { MiniChart } from './Chart';

interface IndicatorCardProps {
  config: IndicatorConfig;
  data: DataPoint[];
  onClick: () => void;
  isSelected: boolean;
}

export function IndicatorCard({
  config,
  data,
  onClick,
  isSelected,
}: IndicatorCardProps) {
  const latest = getLatestValue(data);
  const change = getChange(data);

  const isPositive = change && change.value >= 0;
  const changeColor = isPositive ? 'text-terminal-green' : 'text-terminal-red';

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left p-4 rounded-lg border transition-all duration-200
        ${isSelected
          ? 'bg-terminal-surface border-terminal-green/50 glow-green'
          : 'bg-terminal-surface/50 border-terminal-border hover:border-terminal-border/80 hover:bg-terminal-surface'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-white">{config.name}</h3>
          <p className="text-xs text-terminal-muted">{config.description}</p>
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
      </div>

      {/* Value */}
      <div className="mb-3">
        {latest ? (
          <>
            <span className="text-2xl font-bold text-white">
              {formatValue(latest.value, config.unit, config.key)}
            </span>
            {change && (
              <span className={`ml-2 text-sm ${changeColor}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(change.percent).toFixed(2)}%
              </span>
            )}
          </>
        ) : (
          <span className="text-terminal-muted">No data</span>
        )}
      </div>

      {/* Mini Chart */}
      <div className="h-10">
        <MiniChart data={data} color={config.color} />
      </div>

      {/* Last Update */}
      {latest && (
        <p className="mt-2 text-xs text-terminal-muted">
          {latest.date}
        </p>
      )}
    </button>
  );
}

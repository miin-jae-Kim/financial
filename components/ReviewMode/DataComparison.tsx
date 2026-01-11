'use client';

import { DataSnapshot } from '@/types';

interface DataComparisonProps {
  snapshotBefore: DataSnapshot;
  snapshotAfter: DataSnapshot;
}

export function DataComparison({ snapshotBefore, snapshotAfter }: DataComparisonProps) {
  const indicators = [
    { key: 'treasury2y', label: '2Y', format: (v: number) => `${v.toFixed(2)}%` },
    { key: 'treasury10y', label: '10Y', format: (v: number) => `${v.toFixed(2)}%` },
    { key: 'yieldSpread', label: 'Spread', format: (v: number) => `${v.toFixed(2)}%` },
    { key: 'vix', label: 'VIX', format: (v: number) => v.toFixed(2) },
    { key: 'sp500', label: 'S&P 500', format: (v: number) => v.toLocaleString() },
  ];

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-white mb-3">데이터 비교</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-terminal-border">
              <th className="text-left py-2 text-terminal-muted">지표</th>
              <th className="text-right py-2 text-terminal-muted">판단 시점</th>
              <th className="text-right py-2 text-terminal-muted">발표 후</th>
              <th className="text-right py-2 text-terminal-muted">변화</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map(({ key, label, format }) => {
              const before = snapshotBefore[key as keyof DataSnapshot] as number;
              const after = snapshotAfter[key as keyof DataSnapshot] as number;
              const change = after - before;
              const changePercent = before !== 0 ? (change / before) * 100 : 0;
              const isPositive = change >= 0;

              return (
                <tr key={key} className="border-b border-terminal-border/50">
                  <td className="py-2 text-terminal-muted">{label}</td>
                  <td className="text-right py-2 text-white">{format(before)}</td>
                  <td className="text-right py-2 text-white">{format(after)}</td>
                  <td className={`text-right py-2 ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
                    {isPositive ? '+' : ''}
                    {key === 'sp500' ? change.toFixed(0) : format(change)}
                    {key !== 'sp500' && changePercent !== 0 && (
                      <span className="ml-1 text-terminal-muted">
                        ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

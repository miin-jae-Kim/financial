'use client';

import { DataSnapshot } from '@/types';
import { format } from 'date-fns';

interface DataSnapshotProps {
  snapshot: DataSnapshot;
}

export function DataSnapshotDisplay({ snapshot }: DataSnapshotProps) {
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">현재 데이터 스냅샷</h3>
        <span className="text-xs text-terminal-muted">
          {format(new Date(snapshot.timestamp), 'yyyy-MM-dd')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex justify-between">
          <span className="text-terminal-muted">2Y:</span>
          <span className="text-white">{snapshot.treasury2y.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-terminal-muted">10Y:</span>
          <span className="text-white">{snapshot.treasury10y.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-terminal-muted">Spread:</span>
          <span className="text-white">{snapshot.yieldSpread.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-terminal-muted">Fed Funds:</span>
          <span className="text-white">{snapshot.fedFundsRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-terminal-muted">CPI YoY:</span>
          <span className="text-white">{snapshot.cpiYoY.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-terminal-muted">Real Rate:</span>
          <span className="text-white">{snapshot.realRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-terminal-muted">VIX:</span>
          <span className="text-white">{snapshot.vix.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-terminal-muted">S&P:</span>
          <span className="text-white">{snapshot.sp500.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

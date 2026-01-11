'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { CombinedData, INDICATOR_CONFIGS, IndicatorConfig } from '@/types';
import {
  filterByDateRange,
  calculateYoY,
  calculateYieldSpread,
  getLatestValue,
  formatValue,
} from '@/lib/data';
import { IndicatorChart } from './Chart';
import { IndicatorCard } from './IndicatorCard';
import { RightPanel } from './RightPanel/RightPanel';

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

interface DashboardProps {
  data: CombinedData;
}

const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // 30분

export function Dashboard({ data }: DashboardProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<string>('treasury10y');
  const [dateRange, setDateRange] = useState<DateRange>('1Y');
  const [showYieldSpread, setShowYieldSpread] = useState(false);
  const [showCpiYoY, setShowCpiYoY] = useState(false);
  const [showReleaseSchedule, setShowReleaseSchedule] = useState(true);

  // 자동 데이터 업데이트 체크
  useEffect(() => {
    const checkAndUpdateData = async () => {
      try {
        const response = await fetch('/api/update-data');
        if (response.ok) {
          const result = await response.json();
          if (result.updated) {
            console.log('Data update started:', result.message);
            // 업데이트가 시작되면 페이지를 새로고침하여 최신 데이터 표시
            // 하지만 사용자 경험을 위해 약간의 지연 후 새로고침
            setTimeout(() => {
              window.location.reload();
            }, 5000); // 5초 후 새로고침
          }
        }
      } catch (error) {
        console.error('Error checking for data update:', error);
      }
    };

    // 첫 실행 시 즉시 체크
    checkAndUpdateData();

    // 이후 30분마다 체크
    const interval = setInterval(checkAndUpdateData, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const selectedConfig = INDICATOR_CONFIGS.find(c => c.key === selectedIndicator);

  // Get chart data based on selection
  const chartData = useMemo(() => {
    if (showYieldSpread && selectedIndicator === 'treasury10y') {
      const spread = calculateYieldSpread(
        data.indicators.treasury10y || [],
        data.indicators.treasury2y || []
      );
      return filterByDateRange(spread, dateRange);
    }

    if (showCpiYoY && selectedIndicator === 'cpi') {
      const yoy = calculateYoY(data.indicators.cpi || []);
      return filterByDateRange(yoy, dateRange);
    }

    const indicatorData = data.indicators[selectedIndicator as keyof typeof data.indicators] || [];
    return filterByDateRange(indicatorData, dateRange);
  }, [data, selectedIndicator, dateRange, showYieldSpread, showCpiYoY]);

  const dateRanges: DateRange[] = ['1M', '3M', '6M', '1Y', '2Y', 'ALL'];

  // Calculate summary stats
  const yieldSpread = useMemo(() => {
    const t10y = getLatestValue(data.indicators.treasury10y || []);
    const t2y = getLatestValue(data.indicators.treasury2y || []);
    if (t10y && t2y) {
      return (t10y.value - t2y.value).toFixed(2);
    }
    return null;
  }, [data]);

  const realRate = useMemo(() => {
    const fed = getLatestValue(data.indicators.fedFundsRate || []);
    const cpiData = data.indicators.cpi || [];
    const cpiYoY = calculateYoY(cpiData);
    const latestCpiYoY = getLatestValue(cpiYoY);
    
    if (fed && latestCpiYoY) {
      return (fed.value - latestCpiYoY.value).toFixed(2);
    }
    return null;
  }, [data]);

  return (
    <div className="min-h-screen bg-terminal-bg terminal-grid">
      {/* Header */}
      <header className="border-b border-terminal-border bg-terminal-bg/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-terminal-green animate-pulse" />
              <h1 className="text-xl font-display font-bold text-white">
                MACRO<span className="text-terminal-green">_</span>DASHBOARD
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-terminal-muted">
                Last Update: {format(new Date(data.lastUpdated), 'yyyy. M. d.')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-terminal-muted">Status:</span>
                <span className="text-terminal-green">● LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        <main className="flex-1 px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <p className="text-xs text-terminal-muted mb-1">Yield Spread (10Y-2Y)</p>
            <p className={`text-xl font-bold ${
              yieldSpread && parseFloat(yieldSpread) < 0 
                ? 'text-terminal-red text-glow-red' 
                : 'text-terminal-green text-glow-green'
            }`}>
              {yieldSpread ? `${yieldSpread}%` : '--'}
            </p>
            <p className="text-xs text-terminal-muted mt-1">
              {yieldSpread && parseFloat(yieldSpread) < 0 ? 'Inverted' : 'Normal'}
            </p>
          </div>
          
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <p className="text-xs text-terminal-muted mb-1">Real Interest Rate</p>
            <p className={`text-xl font-bold ${
              realRate && parseFloat(realRate) > 0 
                ? 'text-terminal-green' 
                : 'text-terminal-red'
            }`}>
              {realRate ? `${realRate}%` : '--'}
            </p>
            <p className="text-xs text-terminal-muted mt-1">Fed Rate - CPI YoY</p>
          </div>

          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <p className="text-xs text-terminal-muted mb-1">VIX (Fear Index)</p>
            {(() => {
              const vix = getLatestValue(data.indicators.vix || []);
              const vixLevel = vix ? (vix.value < 15 ? 'Low' : vix.value < 25 ? 'Normal' : 'High') : '';
              return (
                <>
                  <p className={`text-xl font-bold ${
                    vix && vix.value > 25 ? 'text-terminal-red' : 'text-white'
                  }`}>
                    {vix ? vix.value.toFixed(2) : '--'}
                  </p>
                  <p className="text-xs text-terminal-muted mt-1">{vixLevel}</p>
                </>
              );
            })()}
          </div>

          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <p className="text-xs text-terminal-muted mb-1">S&P 500</p>
            {(() => {
              const sp = getLatestValue(data.indicators.sp500 || []);
              return (
                <p className="text-xl font-bold text-white">
                  {sp ? sp.value.toLocaleString() : '--'}
                </p>
              );
            })()}
            <p className="text-xs text-terminal-muted mt-1">Index Level</p>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-display font-bold text-white">
                {showYieldSpread && selectedIndicator === 'treasury10y'
                  ? 'Yield Spread (10Y - 2Y)'
                  : showCpiYoY && selectedIndicator === 'cpi'
                  ? 'CPI YoY Change'
                  : selectedConfig?.name}
              </h2>
              <p className="text-sm text-terminal-muted">
                {showYieldSpread && selectedIndicator === 'treasury10y'
                  ? '장단기 금리차'
                  : showCpiYoY && selectedIndicator === 'cpi'
                  ? '전년 동기 대비 물가상승률'
                  : selectedConfig?.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Toggle buttons for special views */}
              {selectedIndicator === 'treasury10y' && (
                <button
                  onClick={() => setShowYieldSpread(!showYieldSpread)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    showYieldSpread
                      ? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
                      : 'border-terminal-border text-terminal-muted hover:border-terminal-green/50'
                  }`}
                >
                  Spread
                </button>
              )}
              {selectedIndicator === 'cpi' && (
                <button
                  onClick={() => setShowCpiYoY(!showCpiYoY)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    showCpiYoY
                      ? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
                      : 'border-terminal-border text-terminal-muted hover:border-terminal-green/50'
                  }`}
                >
                  YoY
                </button>
              )}
              
              {/* Date range selector */}
              <div className="flex rounded border border-terminal-border overflow-hidden">
                {dateRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      dateRange === range
                        ? 'bg-terminal-green text-terminal-bg font-medium'
                        : 'text-terminal-muted hover:bg-terminal-border'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <IndicatorChart
            data={chartData}
            color={selectedConfig?.color || '#00ff9f'}
            unit={
              showYieldSpread && selectedIndicator === 'treasury10y'
                ? '%'
                : showCpiYoY && selectedIndicator === 'cpi'
                ? '%'
                : selectedConfig?.unit
            }
            showArea
            referenceValue={
              showYieldSpread && selectedIndicator === 'treasury10y' ? 0 : undefined
            }
            height={350}
          />
        </div>

        {/* Indicator Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {INDICATOR_CONFIGS.map((config) => (
            <IndicatorCard
              key={config.key}
              config={config}
              data={data.indicators[config.key as keyof typeof data.indicators] || []}
              onClick={() => setSelectedIndicator(config.key)}
              isSelected={selectedIndicator === config.key}
            />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-terminal-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-terminal-muted">
            <p>
              Data Source: FRED (Federal Reserve Economic Data)
            </p>
            <p>
              Update Frequency: Daily (Market Data) / Monthly (Economic Indicators)
            </p>
          </div>
        </footer>
        </main>

        {/* Right Panel */}
        <RightPanel
          data={data}
          isOpen={showReleaseSchedule}
          onClose={() => setShowReleaseSchedule(false)}
        />
      </div>

      {/* Toggle Button (when sidebar is hidden) */}
      {!showReleaseSchedule && (
        <button
          onClick={() => setShowReleaseSchedule(true)}
          className="fixed right-4 top-24 bg-terminal-surface border border-terminal-border rounded-lg p-2 text-terminal-green hover:bg-terminal-surface/80 transition-colors z-40"
          aria-label="Show release schedule"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CombinedData, TabId } from '@/types';
import { ReleaseSchedule } from './ReleaseSchedule';
import { TabNavigation } from './TabNavigation';
import { DefaultView } from './views/DefaultView';
import { RatesView } from './views/RatesView';
import { InflationView } from './views/InflationView';
import { RiskView } from './views/RiskView';
import { RecessionView } from './views/RecessionView';

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

interface DashboardProps {
  data: CombinedData;
}

const UPDATE_INTERVAL_MS = 10 * 60 * 1000; // 10분

export function Dashboard({ data }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('default');
  const [dateRange, setDateRange] = useState<DateRange>('1Y');
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

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'default':
        return <DefaultView data={data} dateRange={dateRange} onDateRangeChange={setDateRange} />;
      case 'rates':
        return <RatesView data={data} dateRange={dateRange} onDateRangeChange={setDateRange} />;
      case 'inflation':
        return <InflationView data={data} dateRange={dateRange} onDateRangeChange={setDateRange} />;
      case 'risk':
        return <RiskView data={data} dateRange={dateRange} onDateRangeChange={setDateRange} />;
      case 'recession':
        return <RecessionView data={data} dateRange={dateRange} onDateRangeChange={setDateRange} />;
      default:
        return <DefaultView data={data} dateRange={dateRange} onDateRangeChange={setDateRange} />;
    }
  };

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

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex max-w-7xl mx-auto px-4 overflow-x-hidden">
        <main className="flex-1 min-w-0 py-6 pr-4">
          {renderTabContent()}
        </main>

        {/* Right Sidebar - Release Schedule */}
        <aside
          className={`w-80 flex-shrink-0 border-l border-terminal-border bg-terminal-surface/50 transition-all duration-300 ${
            showReleaseSchedule ? 'block' : 'hidden'
          }`}
        >
          <div className="sticky top-[80px] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-display font-bold text-white">
                발표 일정
              </h3>
              <button
                onClick={() => setShowReleaseSchedule(!showReleaseSchedule)}
                className="text-terminal-muted hover:text-white transition-colors"
                aria-label="Toggle release schedule"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ReleaseSchedule data={data} />
          </div>
        </aside>
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

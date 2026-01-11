export interface DataPoint {
  date: string;
  value: number;
}

export interface IndicatorData {
  data: DataPoint[];
  lastUpdated: string | null;
}

export interface CombinedData {
  indicators: {
    treasury2y: DataPoint[];
    treasury10y: DataPoint[];
    fedFundsRate: DataPoint[];
    cpi: DataPoint[];
    nonfarmPayroll: DataPoint[];
    vix: DataPoint[];
    sp500: DataPoint[];
    hySpread: DataPoint[];
    sahmRule: DataPoint[];
    unemployment: DataPoint[];
  };
  lastUpdated: string;
}

export type TabId = 'default' | 'rates' | 'inflation' | 'risk' | 'recession';

export interface Tab {
  id: TabId;
  label: string;
  labelEn: string;
}

export const TABS: Tab[] = [
  { id: 'default', label: '기본', labelEn: 'Default' },
  { id: 'rates', label: '금리환경', labelEn: 'Interest Rates' },
  { id: 'inflation', label: '인플레이션', labelEn: 'Inflation' },
  { id: 'risk', label: '리스크', labelEn: 'Risk Sentiment' },
  { id: 'recession', label: '침체신호', labelEn: 'Recession Watch' },
];

export interface IndicatorConfig {
  key: keyof CombinedData['indicators'];
  name: string;
  description: string;
  unit: string;
  color: string;
  source: 'fred';
  sourceId: string;
  frequency: 'daily' | 'monthly';
  releaseId?: number; // FRED Release ID for release dates
}

export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  {
    key: 'treasury2y',
    name: '2Y Treasury',
    description: '2년물 국채 금리',
    unit: '%',
    color: '#22d3ee',
    source: 'fred',
    sourceId: 'DGS2',
    frequency: 'daily',
    releaseId: 18, // H.15 Selected Interest Rates
  },
  {
    key: 'treasury10y',
    name: '10Y Treasury',
    description: '10년물 국채 금리',
    unit: '%',
    color: '#6366f1',
    source: 'fred',
    sourceId: 'DGS10',
    frequency: 'daily',
    releaseId: 18, // H.15 Selected Interest Rates
  },
  {
    key: 'fedFundsRate',
    name: 'Fed Funds Rate',
    description: '기준금리',
    unit: '%',
    color: '#ffd93d',
    source: 'fred',
    sourceId: 'FEDFUNDS',
    frequency: 'monthly',
    releaseId: 18, // H.15 Selected Interest Rates
  },
  {
    key: 'cpi',
    name: 'CPI',
    description: '소비자물가지수',
    unit: '',
    color: '#ff3366',
    source: 'fred',
    sourceId: 'CPIAUCSL',
    frequency: 'monthly',
    releaseId: 10, // Consumer Price Index
  },
  {
    key: 'nonfarmPayroll',
    name: 'Nonfarm Payroll',
    description: '비농업고용지수',
    unit: 'K',
    color: '#00ff9f',
    source: 'fred',
    sourceId: 'PAYEMS',
    frequency: 'monthly',
    releaseId: 50, // Employment Situation
  },
  {
    key: 'vix',
    name: 'VIX',
    description: '변동성지수',
    unit: '',
    color: '#f472b6',
    source: 'fred',
    sourceId: 'VIXCLS',
    frequency: 'daily',
  },
  {
    key: 'sp500',
    name: 'S&P 500',
    description: 'S&P 500 지수',
    unit: '',
    color: '#a78bfa',
    source: 'fred',
    sourceId: 'SP500',
    frequency: 'daily',
  },
  {
    key: 'hySpread',
    name: 'HY Spread',
    description: 'ICE BofA 하이일드 스프레드',
    unit: '%',
    color: '#ffd93d',
    source: 'fred',
    sourceId: 'BAMLH0A0HYM2',
    frequency: 'daily',
  },
  {
    key: 'sahmRule',
    name: 'Sahm Rule',
    description: '실시간 Sahm Rule 침체 지표',
    unit: '%p',
    color: '#ff3366',
    source: 'fred',
    sourceId: 'SAHMREALTIME',
    frequency: 'monthly',
  },
  {
    key: 'unemployment',
    name: 'Unemployment Rate',
    description: '실업률',
    unit: '%',
    color: '#6366f1',
    source: 'fred',
    sourceId: 'UNRATE',
    frequency: 'monthly',
    releaseId: 50, // Employment Situation
  },
];

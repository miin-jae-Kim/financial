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
  };
  lastUpdated: string;
}

export interface IndicatorConfig {
  key: keyof CombinedData['indicators'];
  name: string;
  description: string;
  unit: string;
  color: string;
  source: 'fred';
  sourceId: string;
  frequency: 'daily' | 'monthly';
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
];

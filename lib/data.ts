import { DataPoint } from '@/types';

export function formatValue(value: number, unit: string, key: string): string {
  if (key === 'sp500' || key === 'nonfarmPayroll') {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (unit === '%') {
    return value.toFixed(2) + '%';
  }
  return value.toFixed(2);
}

export function getLatestValue(data: DataPoint[]): DataPoint | null {
  if (!data || data.length === 0) return null;
  return data[data.length - 1];
}

export function getChange(data: DataPoint[]): { value: number; percent: number } | null {
  if (!data || data.length < 2) return null;
  
  const current = data[data.length - 1].value;
  const previous = data[data.length - 2].value;
  
  return {
    value: current - previous,
    percent: ((current - previous) / previous) * 100,
  };
}

export function filterByDateRange(
  data: DataPoint[],
  range: '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL'
): DataPoint[] {
  if (range === 'ALL' || !data.length) return data;
  
  const now = new Date();
  let startDate: Date;
  
  switch (range) {
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
      return data;
  }
  
  const startStr = startDate.toISOString().split('T')[0];
  return data.filter(d => d.date >= startStr);
}

export function calculateYoY(data: DataPoint[]): DataPoint[] {
  // For CPI, calculate Year-over-Year change
  if (data.length < 13) return [];
  
  const result: DataPoint[] = [];
  for (let i = 12; i < data.length; i++) {
    const current = data[i].value;
    const yearAgo = data[i - 12].value;
    const yoyChange = ((current - yearAgo) / yearAgo) * 100;
    
    result.push({
      date: data[i].date,
      value: Math.round(yoyChange * 100) / 100,
    });
  }
  
  return result;
}

export function calculateYieldSpread(
  treasury10y: DataPoint[],
  treasury2y: DataPoint[]
): DataPoint[] {
  const dateMap2y = new Map(treasury2y.map(d => [d.date, d.value]));
  
  return treasury10y
    .filter(d => dateMap2y.has(d.date))
    .map(d => ({
      date: d.date,
      value: Math.round((d.value - dateMap2y.get(d.date)!) * 100) / 100,
    }));
}

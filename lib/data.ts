import { DataPoint, CombinedData, DataSnapshot } from '@/types';

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

export function createDataSnapshot(data: CombinedData): DataSnapshot {
  const treasury2y = getLatestValue(data.indicators.treasury2y);
  const treasury10y = getLatestValue(data.indicators.treasury10y);
  const fedFundsRate = getLatestValue(data.indicators.fedFundsRate);
  const cpi = getLatestValue(data.indicators.cpi);
  const cpiYoYData = calculateYoY(data.indicators.cpi);
  const cpiYoY = getLatestValue(cpiYoYData);
  const nonfarmPayroll = getLatestValue(data.indicators.nonfarmPayroll);
  const vix = getLatestValue(data.indicators.vix);
  const sp500 = getLatestValue(data.indicators.sp500);
  const hySpread = getLatestValue(data.indicators.hySpread);
  const sahmRule = getLatestValue(data.indicators.sahmRule);
  const unemployment = getLatestValue(data.indicators.unemployment);
  
  const yieldSpreadData = calculateYieldSpread(data.indicators.treasury10y, data.indicators.treasury2y);
  const yieldSpread = getLatestValue(yieldSpreadData);
  
  // Real Rate = Fed Funds Rate - CPI YoY
  const realRate = fedFundsRate && cpiYoY 
    ? Math.round((fedFundsRate.value - cpiYoY.value) * 100) / 100 
    : 0;
  
  return {
    timestamp: new Date().toISOString(),
    treasury2y: treasury2y?.value ?? 0,
    treasury10y: treasury10y?.value ?? 0,
    fedFundsRate: fedFundsRate?.value ?? 0,
    cpi: cpi?.value ?? 0,
    cpiYoY: cpiYoY?.value ?? 0,
    nonfarmPayroll: nonfarmPayroll?.value ?? 0,
    vix: vix?.value ?? 0,
    sp500: sp500?.value ?? 0,
    hySpread: hySpread?.value ?? 0,
    sahmRule: sahmRule?.value ?? 0,
    unemployment: unemployment?.value ?? 0,
    yieldSpread: yieldSpread?.value ?? 0,
    realRate,
  };
}

export function generateDataHash(snapshot: DataSnapshot): string {
  // 주요 지표만 해시에 포함 (소수점 1자리로 반올림하여 미세 변동 무시)
  const key = [
    Math.round(snapshot.treasury2y * 10),
    Math.round(snapshot.treasury10y * 10),
    Math.round(snapshot.fedFundsRate * 10),
    Math.round(snapshot.cpiYoY * 10),
    Math.round(snapshot.vix),
    Math.round(snapshot.sp500 / 100),
  ].join('-');
  
  // 간단한 해시 함수
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

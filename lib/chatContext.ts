import { CombinedData } from '@/types';
import { getLatestValue, calculateYoY } from './data';

export interface ChatContext {
  currentData: {
    treasury2y: number | null;
    treasury10y: number | null;
    fedFundsRate: number | null;
    cpi: number | null;
    cpiYoY: number | null;
    nonfarmPayroll: number | null;
    vix: number | null;
    sp500: number | null;
    hySpread: number | null;
    sahmRule: number | null;
    unemployment: number | null;
  };
  derived: {
    yieldSpread: number | null;
    realRate: number | null;
  };
}

export function buildChatContext(data: CombinedData): ChatContext {
  const treasury2y = getLatestValue(data.indicators.treasury2y || []);
  const treasury10y = getLatestValue(data.indicators.treasury10y || []);
  const fedFundsRate = getLatestValue(data.indicators.fedFundsRate || []);
  const cpi = getLatestValue(data.indicators.cpi || []);
  const nonfarmPayroll = getLatestValue(data.indicators.nonfarmPayroll || []);
  const vix = getLatestValue(data.indicators.vix || []);
  const sp500 = getLatestValue(data.indicators.sp500 || []);
  const hySpread = getLatestValue(data.indicators.hySpread || []);
  const sahmRule = getLatestValue(data.indicators.sahmRule || []);
  const unemployment = getLatestValue(data.indicators.unemployment || []);

  // CPI YoY 계산
  const cpiYoYData = calculateYoY(data.indicators.cpi || []);
  const cpiYoY = getLatestValue(cpiYoYData);

  // Yield Spread 계산
  const yieldSpread =
    treasury10y && treasury2y ? treasury10y.value - treasury2y.value : null;

  // Real Rate 계산
  const realRate =
    fedFundsRate && cpiYoY ? fedFundsRate.value - cpiYoY.value : null;

  return {
    currentData: {
      treasury2y: treasury2y?.value ?? null,
      treasury10y: treasury10y?.value ?? null,
      fedFundsRate: fedFundsRate?.value ?? null,
      cpi: cpi?.value ?? null,
      cpiYoY: cpiYoY?.value ?? null,
      nonfarmPayroll: nonfarmPayroll?.value ?? null,
      vix: vix?.value ?? null,
      sp500: sp500?.value ?? null,
      hySpread: hySpread?.value ?? null,
      sahmRule: sahmRule?.value ?? null,
      unemployment: unemployment?.value ?? null,
    },
    derived: {
      yieldSpread,
      realRate,
    },
  };
}

/**
 * Macro Economic Dashboard - Data Updater
 * Fetches economic data from FRED API
 * Run with: npm run update-data
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const FRED_API_KEY = '27f5e33ab8a1e27f06efbb5f00303962';
const DATA_DIR = path.join(__dirname, '..', 'data');
const START_DATE = '2020-01-01';

interface DataPoint {
  date: string;
  value: number;
}

interface StoredData {
  data: DataPoint[];
  lastUpdated: string | null;
}

interface FredResponse {
  observations?: Array<{
    date: string;
    value: string;
  }>;
}

// 모든 지표를 FRED에서 가져옴
const FRED_SERIES: Record<string, string> = {
  treasury2y: 'DGS2',
  treasury10y: 'DGS10',
  fedFundsRate: 'FEDFUNDS',
  cpi: 'CPIAUCSL',
  nonfarmPayroll: 'PAYEMS',
  vix: 'VIXCLS',        // FRED에서 제공
  sp500: 'SP500',       // FRED에서 제공
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function deleteExistingData(filename: string): void {
  const filepath = path.join(DATA_DIR, `${filename}.json`);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log(`  Deleted existing ${filename}.json`);
  }
}

function resetAllData(): void {
  console.log('Resetting all data files...\n');
  for (const name of Object.keys(FRED_SERIES)) {
    deleteExistingData(name);
  }
  // combined.json도 삭제
  const combinedPath = path.join(DATA_DIR, 'combined.json');
  if (fs.existsSync(combinedPath)) {
    fs.unlinkSync(combinedPath);
    console.log('  Deleted existing combined.json\n');
  }
}

function loadExistingData(filename: string): StoredData {
  const filepath = path.join(DATA_DIR, `${filename}.json`);
  if (fs.existsSync(filepath)) {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
  return { data: [], lastUpdated: null };
}

function saveData(filename: string, data: StoredData): void {
  const filepath = path.join(DATA_DIR, `${filename}.json`);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function getLastDate(data: StoredData): string {
  if (data.data.length > 0) {
    return data.data[data.data.length - 1].date;
  }
  return START_DATE;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

async function fetchFredData(seriesId: string, startDate: string): Promise<DataPoint[]> {
  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.append('series_id', seriesId);
  url.searchParams.append('api_key', FRED_API_KEY);
  url.searchParams.append('file_type', 'json');
  url.searchParams.append('observation_start', startDate);
  url.searchParams.append('sort_order', 'asc');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const json = (await response.json()) as FredResponse;
    const observations = json.observations || [];
    
    return observations
      .filter((obs) => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
      .map((obs) => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }))
      .filter((dp) => dp.date >= START_DATE); // 2020-01-01 이후 데이터만 필터링
  } catch (error) {
    console.error(`Error fetching FRED ${seriesId}:`, error);
    return [];
  }
}


async function updateIndicator(
  name: string,
  fetchFn: (startDate: string) => Promise<DataPoint[]>,
  reset: boolean = false
): Promise<void> {
  const startDate = reset ? START_DATE : (() => {
    const existing = loadExistingData(name);
    const lastDate = getLastDate(existing);
    return addDays(lastDate, 1);
  })();
  
  console.log(`Fetching ${name} from ${startDate}...`);
  
  const fetchedData = await fetchFn(startDate);
  
  if (fetchedData.length === 0) {
    console.log(`  No data available for ${name}`);
    return;
  }
  
  // 2020-01-01 이후 데이터만 필터링 (추가 안전장치)
  const filteredData = fetchedData.filter((dp) => dp.date >= START_DATE);
  
  if (reset) {
    // 처음부터 다시 쌓기: 기존 데이터를 무시하고 새로 가져온 데이터로 저장
    const newData: StoredData = {
      data: filteredData,
      lastUpdated: new Date().toISOString(),
    };
    saveData(name, newData);
    console.log(`  Fetched ${filteredData.length} records for ${name} (reset mode, from ${START_DATE})`);
  } else {
    // 기존 데이터에 추가 (기존 데이터도 2020-01-01 이후만 유지)
    const existing = loadExistingData(name);
    // 기존 데이터도 2020-01-01 이후만 유지
    existing.data = existing.data.filter((dp) => dp.date >= START_DATE);
    
    const existingDates = new Set(existing.data.map(d => d.date));
    const uniqueNewData = filteredData.filter(d => !existingDates.has(d.date));
    
    if (uniqueNewData.length === 0) {
      console.log(`  No new records for ${name}`);
      return;
    }
    
    existing.data.push(...uniqueNewData);
    existing.data.sort((a, b) => a.date.localeCompare(b.date));
    existing.lastUpdated = new Date().toISOString();
    
    saveData(name, existing);
    console.log(`  Added ${uniqueNewData.length} new records to ${name}`);
  }
}

function createCombinedData(): void {
  const indicators: Record<string, DataPoint[]> = {};
  
  for (const name of Object.keys(FRED_SERIES)) {
    const filepath = path.join(DATA_DIR, `${name}.json`);
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf-8');
      const parsed = JSON.parse(content) as StoredData;
      indicators[name] = parsed.data;
    }
  }
  
  const combined = {
    indicators,
    lastUpdated: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'combined.json'),
    JSON.stringify(combined, null, 2)
  );
  
  console.log('Created combined.json');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset') || args.includes('-r');
  
  console.log('=== Macro Dashboard Data Updater ===');
  if (reset) {
    console.log('Mode: RESET (초기화하고 처음부터 다시 수집)\n');
  } else {
    console.log('Mode: UPDATE (기존 데이터에 추가)\n');
  }
  
  ensureDataDir();
  
  // Reset mode: 기존 데이터 삭제
  if (reset) {
    resetAllData();
  }
  
  // Update all indicators from FRED
  for (const [name, seriesId] of Object.entries(FRED_SERIES)) {
    await updateIndicator(name, (startDate) => fetchFredData(seriesId, startDate), reset);
  }
  
  // Create combined file
  createCombinedData();
  
  console.log('\n✓ Data update complete!');
}

main().catch(console.error);

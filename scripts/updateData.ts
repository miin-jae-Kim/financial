/**
 * Macro Economic Dashboard - Data Updater
 * Fetches economic data from FRED API
 * Run with: npm run update-data
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

// Configuration
const FRED_API_KEY = process.env.FRED_API_KEY || '';
const DATA_DIR = path.join(__dirname, '..', 'data');
const START_DATE = '2020-01-01';

// Validate API key
if (!FRED_API_KEY) {
  console.error('Error: FRED_API_KEY environment variable is not set.');
  console.error('Please create a .env file with FRED_API_KEY=your_api_key');
  console.error('See .env.example for reference.');
  process.exit(1);
}

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
  // observation_end를 설정하지 않으면 최신 데이터까지 모두 가져옴
  // 스크립트 실행 날짜 기준으로 최신 데이터까지 자동으로 가져옴
  
  url.searchParams.append('series_id', seriesId);
  url.searchParams.append('api_key', FRED_API_KEY);
  url.searchParams.append('file_type', 'json');
  url.searchParams.append('observation_start', startDate);
  // observation_end를 명시하지 않으면 FRED가 자동으로 최신 데이터까지 반환
  url.searchParams.append('sort_order', 'asc');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const json = (await response.json()) as FredResponse;
    const observations = json.observations || [];
    
    // 디버깅: 전체 응답 정보 출력
    console.log(`  Total observations from FRED: ${observations.length}`);
    if (observations.length > 0) {
      const lastObs = observations[observations.length - 1];
      console.log(`  Last observation from FRED: ${lastObs.date} = ${lastObs.value}`);
    }
    
    const dataPoints = observations
      .filter((obs) => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
      .map((obs) => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }))
      .filter((dp) => dp.date >= START_DATE); // 2020-01-01 이후 데이터만 필터링
    
    // 디버깅: 가져온 데이터의 첫 번째와 마지막 날짜 출력
    if (dataPoints.length > 0) {
      console.log(`  Valid data points: ${dataPoints.length} records: ${dataPoints[0].date} to ${dataPoints[dataPoints.length - 1].date}`);
      // 최근 5개 데이터 출력
      const recentData = dataPoints.slice(-5);
      console.log(`  Recent 5 dates: ${recentData.map(d => d.date).join(', ')}`);
    } else {
      console.log(`  Warning: No valid data points found after filtering`);
    }
    
    return dataPoints;
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
  // 항상 START_DATE부터 오늘까지 모든 데이터를 가져옴
  const startDate = START_DATE;
  
  console.log(`Fetching ${name} from ${startDate} to today...`);
  
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
    // 기존 데이터와 병합하여 최신 데이터로 업데이트
    const existing = loadExistingData(name);
    // 기존 데이터도 2020-01-01 이후만 유지
    existing.data = existing.data.filter((dp) => dp.date >= START_DATE);
    
    // 기존 데이터의 마지막 날짜 확인
    const existingLastDate = existing.data.length > 0 
      ? existing.data[existing.data.length - 1].date 
      : null;
    const fetchedLastDate = filteredData.length > 0 
      ? filteredData[filteredData.length - 1].date 
      : null;
    
    if (existingLastDate && fetchedLastDate) {
      console.log(`  Existing last date: ${existingLastDate}, Fetched last date: ${fetchedLastDate}`);
    }
    
    // 날짜를 키로 하는 Map을 사용하여 최신 데이터로 덮어쓰기
    const dataMap = new Map<string, DataPoint>();
    
    // 기존 데이터 먼저 추가
    existing.data.forEach(dp => {
      dataMap.set(dp.date, dp);
    });
    
    // 새로 가져온 데이터로 덮어쓰기 (최신 데이터 우선)
    filteredData.forEach(dp => {
      dataMap.set(dp.date, dp);
    });
    
    // 날짜순으로 정렬
    const mergedData = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    // 새로 추가된 레코드 찾기
    const existingDates = new Set(existing.data.map(d => d.date));
    const newRecords = filteredData.filter(d => !existingDates.has(d.date));
    
    const updatedData: StoredData = {
      data: mergedData,
      lastUpdated: new Date().toISOString(),
    };
    
    saveData(name, updatedData);
    
    if (newRecords.length > 0) {
      console.log(`  Updated ${name}: ${newRecords.length} new records (${newRecords.map(r => r.date).join(', ')}), total ${mergedData.length} records`);
    } else {
      console.log(`  Updated ${name}: No new records, refreshed ${mergedData.length} existing records`);
    }
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

/**
 * Update Release Dates from FRED API
 * Saves release dates to data/releaseDates.json
 * Run with: npm run update-release-dates
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const FRED_API_KEY = process.env.FRED_API_KEY || '';
const DATA_DIR = path.join(__dirname, '..', 'data');

interface ReleaseDate {
  date: string;
  release_name: string;
}

interface FredReleaseDatesResponse {
  release_dates?: ReleaseDate[];
}

interface IndicatorReleaseDate {
  key: string;
  name: string;
  releaseId: number;
  releaseDates: string[];
}

interface StoredReleaseDates {
  indicators: Record<string, IndicatorReleaseDate>;
  lastUpdated: string;
}

const INDICATOR_CONFIGS = [
  { key: 'nonfarmPayroll', name: 'Nonfarm Payroll', releaseId: 50 },
  { key: 'cpi', name: 'CPI', releaseId: 10 },
  { key: 'fedFundsRate', name: 'Fed Funds Rate', releaseId: 18 },
  { key: 'treasury2y', name: '2Y Treasury', releaseId: 18 },
  { key: 'treasury10y', name: '10Y Treasury', releaseId: 18 },
];

async function getReleaseDates(releaseId: number): Promise<string[]> {
  if (!FRED_API_KEY) {
    console.error('FRED_API_KEY not set');
    return [];
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const url = new URL('https://api.stlouisfed.org/fred/release/dates');
    url.searchParams.append('release_id', releaseId.toString());
    url.searchParams.append('api_key', FRED_API_KEY);
    url.searchParams.append('file_type', 'json');
    url.searchParams.append('include_release_dates_with_no_data', 'true');
    url.searchParams.append('realtime_start', '2020-01-01');
    url.searchParams.append('sort_order', 'asc');
    url.searchParams.append('limit', '100');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json()) as FredReleaseDatesResponse;
    const releaseDates = json.release_dates || [];

    return releaseDates.map((rd) => rd.date).filter((date) => date >= '2020-01-01');
  } catch (error) {
    console.error(`Error fetching release dates for release ${releaseId}:`, error);
    return [];
  }
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadExistingReleaseDates(): StoredReleaseDates {
  const filepath = path.join(DATA_DIR, 'releaseDates.json');
  if (fs.existsSync(filepath)) {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
  return {
    indicators: {},
    lastUpdated: new Date().toISOString(),
  };
}

function saveReleaseDates(data: StoredReleaseDates): void {
  const filepath = path.join(DATA_DIR, 'releaseDates.json');
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

async function main(): Promise<void> {
  console.log('=== Updating Release Dates ===\n');

  if (!FRED_API_KEY) {
    console.error('Error: FRED_API_KEY environment variable is not set.');
    process.exit(1);
  }

  ensureDataDir();

  const stored = loadExistingReleaseDates();
  const updated: StoredReleaseDates = {
    indicators: {},
    lastUpdated: new Date().toISOString(),
  };

  for (const config of INDICATOR_CONFIGS) {
    console.log(`Fetching release dates for ${config.name}...`);
    const dates = await getReleaseDates(config.releaseId);
    
    updated.indicators[config.key] = {
      key: config.key,
      name: config.name,
      releaseId: config.releaseId,
      releaseDates: dates,
    };
    
    console.log(`  Found ${dates.length} release dates`);
  }

  saveReleaseDates(updated);
  console.log('\n✓ Release dates update complete!');
  console.log(`Saved to ${path.join(DATA_DIR, 'releaseDates.json')}`);
}

main().catch(console.error);

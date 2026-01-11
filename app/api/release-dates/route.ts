import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { INDICATOR_CONFIGS } from '@/types';

interface StoredReleaseDates {
  indicators: Record<string, {
    key: string;
    name: string;
    releaseId: number;
    releaseDates: string[];
  }>;
  lastUpdated: string;
}

export interface IndicatorReleaseDate {
  key: string;
  name: string;
  nextReleaseDate: string | null;
  releaseName: string;
  color: string;
}

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'releaseDates.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const stored: StoredReleaseDates = JSON.parse(fileContents);

    const today = new Date().toISOString().split('T')[0];
    const releaseDates: IndicatorReleaseDate[] = [];

    for (const config of INDICATOR_CONFIGS) {
      if (!config.releaseId) continue;

      const storedData = stored.indicators[config.key];
      if (!storedData) continue;

      // 오늘 이후의 첫 번째 발표 일정 찾기
      const nextDate = storedData.releaseDates.find((date) => date >= today);
      
      if (nextDate) {
        releaseDates.push({
          key: config.key,
          name: config.name,
          nextReleaseDate: nextDate,
          releaseName: config.description,
          color: config.color,
        });
      }
    }

    // 발표 날짜가 가까운 순으로 정렬
    const sorted = releaseDates.sort((a, b) => {
      if (!a.nextReleaseDate) return 1;
      if (!b.nextReleaseDate) return -1;
      return a.nextReleaseDate.localeCompare(b.nextReleaseDate);
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error reading release dates:', error);
    return NextResponse.json([], { status: 500 });
  }
}

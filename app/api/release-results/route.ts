import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface StoredReleaseDates {
  indicators: Record<string, {
    key: string;
    name: string;
    releaseId: number;
    releaseDates: string[];
  }>;
  lastUpdated: string;
}

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'releaseDates.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const stored: StoredReleaseDates = JSON.parse(fileContents);

    // 각 지표의 발표 일정만 반환
    const releaseDates: Record<string, string[]> = {};
    
    for (const [key, data] of Object.entries(stored.indicators)) {
      releaseDates[key] = data.releaseDates;
    }

    return NextResponse.json(releaseDates);
  } catch (error) {
    console.error('Error reading release dates:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CombinedData } from '@/types';

const execAsync = promisify(exec);

const UPDATE_INTERVAL_MS = 10 * 60 * 1000; // 10분

function getLastUpdatedTime(): number | null {
  try {
    const filePath = join(process.cwd(), 'data', 'combined.json');
    if (!existsSync(filePath)) {
      return null;
    }
    const fileContents = readFileSync(filePath, 'utf8');
    const combinedData = JSON.parse(fileContents) as CombinedData;
    return combinedData.lastUpdated ? new Date(combinedData.lastUpdated).getTime() : null;
  } catch (error) {
    console.error('Error reading lastUpdated:', error);
    return null;
  }
}

function shouldUpdate(): boolean {
  const lastUpdated = getLastUpdatedTime();
  if (!lastUpdated) {
    return true; // 데이터가 없으면 업데이트 필요
  }
  const now = Date.now();
  const timeSinceUpdate = now - lastUpdated;
  return timeSinceUpdate >= UPDATE_INTERVAL_MS;
}

export async function GET() {
  try {
    // 업데이트가 필요한지 확인
    if (!shouldUpdate()) {
      const lastUpdated = getLastUpdatedTime();
      const lastUpdatedDate = lastUpdated ? new Date(lastUpdated).toISOString() : 'Never';
      return NextResponse.json({
        updated: false,
        message: 'Data is up to date',
        lastUpdated: lastUpdatedDate,
      });
    }

    // 백그라운드에서 업데이트 실행 (non-blocking)
    // 프로젝트 루트에서 실행
    const projectRoot = process.cwd();
    const command = `cd ${projectRoot} && npm run update-data`;
    
    exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.error('Data update failed:', error);
        console.error('stderr:', stderr);
        return;
      }
      console.log('Data update completed successfully');
      console.log('stdout:', stdout);
    });

    return NextResponse.json({
      updated: true,
      message: 'Data update started in background',
    });
  } catch (error) {
    console.error('Error checking/updating data:', error);
    return NextResponse.json(
      {
        error: 'Failed to check/update data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

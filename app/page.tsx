import { Dashboard } from '@/components/Dashboard';
import { CombinedData } from '@/types';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function Home() {
  // 서버 컴포넌트에서 파일 시스템을 통해 데이터 읽기
  const filePath = join(process.cwd(), 'data', 'combined.json');
  const fileContents = readFileSync(filePath, 'utf8');
  const combinedData = JSON.parse(fileContents) as CombinedData;

  return <Dashboard data={combinedData} />;
}

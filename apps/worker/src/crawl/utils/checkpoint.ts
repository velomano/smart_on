// apps/worker/src/crawl/utils/checkpoint.ts
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface CheckpointData {
  period: string;
  cropKey: string;
  offset: number;
  timestamp: number;
  collected: number;
  errors: number;
}

const CHECKPOINT_FILE = join(process.cwd(), 'crawl_checkpoint.json');

// 체크포인트 저장
export function saveCheckpoint(data: CheckpointData): void {
  try {
    writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 체크포인트 저장: ${data.period} - ${data.cropKey} (${data.offset})`);
  } catch (error) {
    console.warn('⚠️ 체크포인트 저장 실패:', error);
  }
}

// 체크포인트 로드
export function loadCheckpoint(): CheckpointData | null {
  try {
    if (!existsSync(CHECKPOINT_FILE)) return null;
    const data = readFileSync(CHECKPOINT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('⚠️ 체크포인트 로드 실패:', error);
    return null;
  }
}

// 체크포인트 삭제 (완료 시)
export function clearCheckpoint(): void {
  try {
    if (existsSync(CHECKPOINT_FILE)) {
      require('fs').unlinkSync(CHECKPOINT_FILE);
      console.log('🗑️ 체크포인트 삭제됨');
    }
  } catch (error) {
    console.warn('⚠️ 체크포인트 삭제 실패:', error);
  }
}

// 방문/파싱 실패 URL 캐시
const failedUrls = new Map<string, number>();
const FAILED_CACHE_HOURS = 24;

export function isUrlFailed(url: string): boolean {
  const failedAt = failedUrls.get(url);
  if (!failedAt) return false;
  
  const hoursSinceFailure = (Date.now() - failedAt) / (1000 * 60 * 60);
  if (hoursSinceFailure > FAILED_CACHE_HOURS) {
    failedUrls.delete(url);
    return false;
  }
  
  return true;
}

export function markUrlFailed(url: string): void {
  failedUrls.set(url, Date.now());
  console.log(`❌ URL 실패 캐시: ${url}`);
}

export function getFailedUrlCount(): number {
  return failedUrls.size;
}

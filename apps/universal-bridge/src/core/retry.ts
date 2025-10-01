/**
 * Retry Logic
 * 
 * 명령 재시도 로직 (지수 백오프)
 * TODO: Dead Letter Queue 연동
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;  // ms
  maxDelay: number;      // ms
  factor: number;        // 지수 백오프 계수
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
};

/**
 * 지수 백오프로 재시도
 * 
 * @param fn - 재시도할 함수
 * @param options - 재시도 옵션
 * @returns Promise<T>
 * 
 * TODO:
 * - [ ] 재시도 메트릭 수집
 * - [ ] Dead Letter Queue 연동
 * - [ ] Circuit Breaker 패턴
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === opts.maxRetries) {
        console.error('[Retry] Max retries reached:', {
          attempt,
          error: lastError.message,
        });
        break;
      }

      // 지수 백오프 계산
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.factor, attempt),
        opts.maxDelay
      );

      console.warn('[Retry] Attempt failed, retrying...', {
        attempt: attempt + 1,
        nextDelay: delay,
        error: lastError.message,
      });

      await sleep(delay);
    }
  }

  throw new RetryError(
    `Failed after ${opts.maxRetries} retries`,
    lastError
  );
}

/**
 * Sleep 유틸리티
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RetryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'RetryError';
  }
}


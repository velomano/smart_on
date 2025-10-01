/**
 * Message Validation
 * 
 * Zod 기반 스키마 검증
 * TODO: 실제 스키마 정의 및 검증 로직 구현
 */

import { z } from 'zod';

/**
 * 메시지 검증
 * 
 * @param data - 검증할 데이터
 * @param schema - Zod 스키마
 * @returns 검증된 데이터
 * 
 * TODO:
 * - [ ] 스키마별 검증 로직
 * - [ ] 에러 메시지 한글화
 * - [ ] 검증 실패 메트릭 수집
 */
export function validateMessage<T>(
  data: unknown,
  schema: z.ZodType<T>
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Validation] Schema validation failed:', error.errors);
      throw new ValidationError('Schema validation failed', error.errors);
    }
    throw error;
  }
}

/**
 * 단위 정규화
 * 
 * @param value - 원본 값
 * @param unit - 원본 단위
 * @returns 정규화된 값과 단위
 * 
 * TODO:
 * - [ ] 모든 단위 변환 규칙 구현
 * - [ ] 변환 테이블 외부화
 */
export function normalizeUnit(value: number, unit: string): { value: number; unit: string } {
  // TODO: 단위 변환 로직 구현
  const conversions: Record<string, (v: number) => { value: number; unit: string }> = {
    'fahrenheit': (f) => ({ value: (f - 32) * 5 / 9, unit: 'celsius' }),
    'kelvin': (k) => ({ value: k - 273.15, unit: 'celsius' }),
    'us_cm': (us) => ({ value: us / 1000, unit: 'ms_cm' }),
  };

  const converter = conversions[unit];
  if (converter) {
    return converter(value);
  }

  return { value, unit };
}

export class ValidationError extends Error {
  constructor(message: string, public errors: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}


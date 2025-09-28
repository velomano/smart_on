/**
 * 베드 이름 규칙 및 변환 유틸리티
 */

export interface BedNamingOptions {
  // 베드 이름 표시 방식
  displayFormat: 'simple' | 'numbered' | 'farm-prefixed' | 'auto-generated';
  // 자동 번호 생성 방식
  autoNumbering: boolean;
  // 최대 베드 수
  maxBeds: number;
}

/**
 * 베드 이름을 표준화된 형태로 변환 (단순 숫자 방식)
 * 
 * 변환 규칙:
 * - "베드2" → "베드-2"
 * - "2" → "베드-2"
 * - "베드-2" → "베드-2"
 * - "특별한베드" → "베드-특별한베드"
 */
export function normalizeBedName(
  userInput: string,
  farmName?: string,
  bedNumber?: number
): string {
  // 1. 빈 문자열 처리 - 자동 번호 생성
  if (!userInput || userInput.trim() === '') {
    return bedNumber ? `베드-${bedNumber}` : '베드-1';
  }

  const input = userInput.trim();

  // 2. 이미 표준 형태인 경우 (베드-숫자)
  if (/^베드-\d+$/.test(input)) {
    return input;
  }

  // 3. 베드 뒤에 숫자가 있는 경우 (베드2, 베드-2)
  const bedWithNumber = input.match(/^베드-?(\d+)$/i);
  if (bedWithNumber) {
    return `베드-${bedWithNumber[1]}`;
  }

  // 4. 숫자만 있는 경우 (2 → 베드-2)
  if (/^\d+$/.test(input)) {
    return `베드-${input}`;
  }

  // 5. 기타 형태는 그대로 사용하되 베드- 접두사 추가
  return `베드-${input}`;
}

/**
 * 베드 이름에서 번호 추출 (정렬용)
 */
export function extractBedNumber(bedName: string): number {
  const match = bedName.match(/베드-?(\d+)/);
  return match ? parseInt(match[1], 10) : 999999; // 숫자가 없으면 맨 뒤로
}

/**
 * 다음 베드 번호 자동 생성
 */
export function generateNextBedNumber(existingBeds: string[]): number {
  const numbers = existingBeds
    .map(bed => extractBedNumber(bed))
    .filter(num => num < 999999) // 유효한 숫자만
    .sort((a, b) => a - b);

  // 연속된 번호 중 가장 큰 것 + 1
  let nextNumber = 1;
  for (const num of numbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }

  return nextNumber;
}

/**
 * 베드 이름 표시용 변환 (UI에서 보여줄 때)
 */
export function formatBedDisplayName(
  storedName: string,
  options: BedNamingOptions = {
    displayFormat: 'simple',
    autoNumbering: false,
    maxBeds: 99
  }
): string {
  switch (options.displayFormat) {
    case 'simple':
      return storedName;
    
    case 'numbered':
      const number = extractBedNumber(storedName);
      return number < 999999 ? `베드-${number}` : storedName;
    
    case 'farm-prefixed':
      // 농장별 접두사 방식은 별도 구현 필요
      return storedName;
    
    case 'auto-generated':
      // 자동 생성 방식
      return storedName;
    
    default:
      return storedName;
  }
}

/**
 * 베드 이름 검증
 */
export function validateBedName(name: string): {
  isValid: boolean;
  error?: string;
  normalized?: string;
} {
  if (!name || name.trim() === '') {
    return { isValid: false, error: '베드 이름을 입력해주세요.' };
  }

  if (name.length > 20) {
    return { isValid: false, error: '베드 이름은 20자 이하로 입력해주세요.' };
  }

  const normalized = normalizeBedName(name);
  return { isValid: true, normalized };
}

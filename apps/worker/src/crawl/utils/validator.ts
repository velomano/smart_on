// apps/worker/src/crawl/utils/validator.ts

// 값 검역(Validator)
export function validateRecipe(r: any): { ok: boolean; errs: string[]; warnings: string[] } {
  const errs: string[] = [];
  const warnings: string[] = [];

  // 필수 필드 검사
  if (!r.crop_key || r.crop_key === 'unknown') errs.push('crop_key');
  if (!r.stage) errs.push('stage');
  
  // pH 범위 검사 (3-9 범위)
  if (r.target_ph != null && (r.target_ph < 3 || r.target_ph > 9)) {
    errs.push('ph_range');
  }
  
  // EC 범위 검사 (0.2-10 범위)
  if (r.target_ec != null && (r.target_ec < 0.2 || r.target_ec > 10)) {
    errs.push('ec_range');
  }
  
  // NPK 매크로 영양소 검사
  if (r.macro) {
    for (const k of ['N', 'P', 'K']) {
      if ((r.macro[k] ?? 0) <= 0) {
        errs.push(`macro_${k}`);
      }
    }
  }
  
  // 경고사항 (오류는 아니지만 주의)
  if (r.target_ph == null) warnings.push('missing_ph');
  if (r.target_ec == null) warnings.push('missing_ec');
  if (!r.macro || Object.keys(r.macro).length === 0) warnings.push('missing_macro');
  
  return { 
    ok: errs.length === 0, 
    errs, 
    warnings 
  };
}

// 단위 정규화 함수들
export function normalizeEC(v: number, unit: 'mS/cm' | 'dS/m' = 'mS/cm'): number {
  return unit === 'dS/m' ? v * 10 : v;
}

export function normalizeNPK(n: number, p: number, k: number, unit: 'ppm' | 'percent' = 'ppm') {
  return unit === 'percent' 
    ? { N: n * 10_000, P: p * 10_000, K: k * 10_000 } 
    : { N: n, P: p, K: k };
}

// 신뢰도 점수 계산
export function calculateReliability(recipe: any): number {
  let score = 0.5; // 기본 점수
  
  // 소스 타입별 가중치
  const sourceType = recipe.source?.org_type || 'unknown';
  switch (sourceType) {
    case 'government': score += 0.5; break;
    case 'academic': score += 0.4; break;
    case 'repository': score += 0.3; break;
    case 'blog': score += 0.0; break;
    default: score += 0.2; break;
  }
  
  // 완전성 보너스 (EC+pH+NPK 모두 있음)
  if (recipe.target_ec && recipe.target_ph && recipe.macro) {
    score += 0.1;
  }
  
  // 표 기반 추출 보너스 (표가 있었다는 표시)
  if (recipe.source?.has_table) {
    score += 0.1;
  }
  
  // 모호 표현 패널티
  const text = (recipe.title || '') + (recipe.description || '');
  if (text.includes('about') || text.includes('~') || text.includes('approximately')) {
    score -= 0.1;
  }
  
  return Math.max(0, Math.min(1, score)); // 0-1 범위로 클램프
}

// 한국어 작물명 매핑 시스템
export const CROP_MAPPING = {
  // 상추류
  'lettuce': { ko: '상추', variants: ['상추', '양상추', '적상추', '로메인상추'] },
  'romaine': { ko: '로메인상추', variants: ['로메인상추', '로메인', '로메인상추'] },
  'iceberg': { ko: '양상추', variants: ['양상추', '아이스버그상추', '양상추'] },
  
  // 토마토류
  'tomato': { ko: '토마토', variants: ['토마토', '방울토마토', '대형토마토', '체리토마토'] },
  'cherry_tomato': { ko: '방울토마토', variants: ['방울토마토', '체리토마토', '작은토마토'] },
  
  // 오이류
  'cucumber': { ko: '오이', variants: ['오이', '다다기오이', '백오이', '청오이'] },
  'pickling_cucumber': { ko: '다다기오이', variants: ['다다기오이', '피클오이'] },
  
  // 딸기류
  'strawberry': { ko: '딸기', variants: ['딸기', '설향딸기', '금실딸기', '메리퀸딸기'] },
  'seolhyang': { ko: '설향딸기', variants: ['설향딸기', '설향'] },
  
  // 고추류
  'pepper': { ko: '고추', variants: ['고추', '청고추', '홍고추', '매운고추'] },
  'bell_pepper': { ko: '피망', variants: ['피망', '파프리카', '색고추'] },
  'chili_pepper': { ko: '고추', variants: ['고추', '청고추', '홍고추'] },
  
  // 허브류
  'basil': { ko: '바질', variants: ['바질', '스위트바질', '제노바바질'] },
  'mint': { ko: '민트', variants: ['민트', '스피어민트', '페퍼민트'] },
  'parsley': { ko: '파슬리', variants: ['파슬리', '이탈리안파슬리'] },
  'cilantro': { ko: '고수', variants: ['고수', '실란트로', '중국고수'] },
  
  // 엽채류
  'spinach': { ko: '시금치', variants: ['시금치', '수경시금치'] },
  'kale': { ko: '케일', variants: ['케일', '컬리케일', '토스카나케일'] },
  'arugula': { ko: '루콜라', variants: ['루콜라', '로켓샐러드'] },
  
  // 기타
  'celery': { ko: '셀러리', variants: ['셀러리', '서양미나리'] },
  'bok_choy': { ko: '청경채', variants: ['청경채', '작은배추'] },
  'pak_choi': { ko: '청경채', variants: ['청경채', '작은배추'] }
};

// 생장 단계 매핑
export const STAGE_MAPPING = {
  'seedling': { ko: '발아기', description: '씨앗 발아 후 첫 잎이 나오는 단계' },
  'vegetative': { ko: '생장기', description: '잎과 줄기가 활발히 자라는 단계' },
  'flowering': { ko: '개화기', description: '꽃이 피기 시작하는 단계' },
  'fruiting': { ko: '결실기', description: '열매가 맺히고 자라는 단계' },
  'ripening': { ko: '성숙기', description: '열매가 익어가는 단계' }
};

// 작물명 변환 함수들
export function getKoreanCropName(englishName: string): string {
  const normalized = englishName.toLowerCase().trim();
  
  // 직접 매핑 확인
  if (CROP_MAPPING[normalized]) {
    return CROP_MAPPING[normalized].ko;
  }
  
  // 변형명으로 검색
  for (const [key, value] of Object.entries(CROP_MAPPING)) {
    if (value.variants.some(variant => 
      variant.toLowerCase().includes(normalized) || 
      normalized.includes(variant.toLowerCase())
    )) {
      return value.ko;
    }
  }
  
  // 매핑되지 않은 경우 원본 반환
  return englishName;
}

export function getEnglishCropName(koreanName: string): string {
  const normalized = koreanName.trim();
  
  // 변형명으로 검색하여 영어명 찾기
  for (const [key, value] of Object.entries(CROP_MAPPING)) {
    if (value.variants.some(variant => 
      variant.includes(normalized) || 
      normalized.includes(variant)
    )) {
      return key;
    }
  }
  
  // 매핑되지 않은 경우 원본 반환
  return koreanName;
}

export function getKoreanStageName(englishStage: string): string {
  const normalized = englishStage.toLowerCase().trim();
  return STAGE_MAPPING[normalized]?.ko || englishStage;
}

export function getEnglishStageName(koreanStage: string): string {
  for (const [key, value] of Object.entries(STAGE_MAPPING)) {
    if (value.ko === koreanStage) {
      return key;
    }
  }
  return koreanStage;
}

// 작물별 권장 환경 조건
export const CROP_ENVIRONMENT = {
  'lettuce': {
    temp_range: [18, 22],
    humidity_range: [60, 80],
    lux_range: [12000, 18000],
    ph_range: [5.5, 6.5],
    ec_range: [1.2, 2.0]
  },
  'tomato': {
    temp_range: [20, 25],
    humidity_range: [50, 70],
    lux_range: [20000, 30000],
    ph_range: [5.8, 6.8],
    ec_range: [1.8, 2.5]
  },
  'cucumber': {
    temp_range: [20, 25],
    humidity_range: [60, 80],
    lux_range: [15000, 25000],
    ph_range: [5.5, 6.5],
    ec_range: [1.5, 2.2]
  },
  'strawberry': {
    temp_range: [15, 22],
    humidity_range: [60, 80],
    lux_range: [10000, 18000],
    ph_range: [5.5, 6.5],
    ec_range: [1.0, 1.8]
  },
  'pepper': {
    temp_range: [20, 28],
    humidity_range: [50, 70],
    lux_range: [20000, 30000],
    ph_range: [5.8, 6.8],
    ec_range: [1.8, 2.5]
  }
};

// 환경 조건 검증 함수
export function validateEnvironment(cropKey: string, env: any): { valid: boolean; warnings: string[] } {
  const cropEnv = CROP_ENVIRONMENT[cropKey];
  if (!cropEnv) {
    return { valid: true, warnings: [`${cropKey}의 환경 조건 정보가 없습니다`] };
  }
  
  const warnings = [];
  
  if (env.temp && (env.temp < cropEnv.temp_range[0] || env.temp > cropEnv.temp_range[1])) {
    warnings.push(`온도 ${env.temp}°C는 권장 범위(${cropEnv.temp_range[0]}-${cropEnv.temp_range[1]}°C)를 벗어났습니다`);
  }
  
  if (env.humidity && (env.humidity < cropEnv.humidity_range[0] || env.humidity > cropEnv.humidity_range[1])) {
    warnings.push(`습도 ${env.humidity}%는 권장 범위(${cropEnv.humidity_range[0]}-${cropEnv.humidity_range[1]}%)를 벗어났습니다`);
  }
  
  if (env.lux && (env.lux < cropEnv.lux_range[0] || env.lux > cropEnv.lux_range[1])) {
    warnings.push(`조도 ${env.lux}lux는 권장 범위(${cropEnv.lux_range[0]}-${cropEnv.lux_range[1]}lux)를 벗어났습니다`);
  }
  
  return { valid: warnings.length === 0, warnings };
}

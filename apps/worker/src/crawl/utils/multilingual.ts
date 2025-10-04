// apps/worker/src/crawl/utils/multilingual.ts
// 한글 감지용
export const hasKorean = (s: string) => /[가-힣]/.test(s);

// 작물 정규화(표시명)
export function normalizeCropName(key: string) {
  const ko: Record<string,string> = {
    tomato:"토마토", lettuce:"상추", strawberry:"딸기", cucumber:"오이", pepper:"고추", basil:"바질",
    spinach:"시금치", kale:"케일", chinese_cabbage:"배추", radish:"무", carrot:"당근",
    cabbage:"양배추", broccoli:"브로콜리", onion:"양파", garlic:"마늘", chive:"부추",
    yamazaki:"야마자키",
  };
  return ko[key] ?? key;
}

// 생육 단계 정규화
export function normalizeStage(stage: string) {
  const map: Record<string,string> = {
    "vegetative":"vegetative","생장기":"vegetative",
    "flowering":"flowering","개화기":"flowering",
    "fruiting":"fruiting","결실기":"fruiting",
    "seedling":"seedling","유묘기":"seedling",
    "ripening":"ripening","성숙기":"ripening",
  };
  return map[stage] ?? stage ?? "vegetative";
}

// 작물별 동의어(영문)
const EN_SYNONYMS: Record<string, string[]> = {
  pepper: ["capsicum", "bell pepper", "hot pepper"],
  chinese_cabbage: ["napa cabbage", "brassica rapa pekinensis"],
  chive: ["allium tuberosum", "garlic chives"],
  basil: ["ocimum basilicum"],
  kale: ["brassica oleracea var. sabellica"],
};

// 공통 한글 키워드(요청한 목록 포함)
const BASE_KO = [
  "배양액 제조","수경재배액","양액 조성","양분 용액",
  "수경재배 배양액","양액 조제","수경재배 영양액",
  "배양액 조성법","양액 제조법","수경재배용 배양액",
];

// 공통 영문 키워드(요청한 목록 포함)
const BASE_EN = [
  "hydroponic nutrient solution","liquid fertilizer","soilless culture nutrients",
  "hydroponic EC solution","nutrient film technique","deep water culture nutrients",
  "hydroponic growing medium",
];

// 작물명 변주(ko/en) 생성
function cropVariants(cropKey: string) {
  const koName = normalizeCropName(cropKey);
  const en = [cropKey.replace("_"," "), ...(EN_SYNONYMS[cropKey] ?? [])];
  return { koName, en: [...new Set(en.map(s=>s.toLowerCase()))] };
}

// 일반 키워드(작물명 없이) - 표/레시피 힌트 포함
export const GENERIC_KO = [
  "수경재배 배양액 조성표","양액 조성표 EC pH","배양액 제조법 EC pH",
  "수경 영양액 레시피","수경재배 전기전도도 mS/cm 표 1","수경 pH 관리 표 2",
  "야마자키 배양액", "야마자키 양액", "야마자키 수경재배액",
  // 과수 전용 키워드
  "과수 양액 EC pH", "베리류 양액 조성표", "포도 점적 관비 EC pH",
  "사과 코코피트 배지 양액", "감귤 점적 관비 EC", "과수 배지 재배 양액 조성"
];

export const GENERIC_EN = [
  `"nutrient solution" hydroponic (EC OR "electrical conductivity") pH (Table OR formulation OR recipe)`,
  `"soilless culture" nutrient solution EC pH table`,
  `"deep water culture" nutrient solution EC pH`,
  "yamazaki nutrient solution", "yamazaki hydroponic solution",
  "yamazaki nutrient formula", "yamazaki hydroponic formula",
  // 과수 전용 키워드
  "blueberry fertigation EC pH", "small fruit nutrient solution table",
  "citrus fertigation EC pH nutrient", "berry nutrient solution table",
  "fruit tree fertigation EC pH", "stone fruit nutrient solution"
];

export const GENERIC_ES_PT = [
  `"solución nutritiva" hidropónica EC pH tabla`,
  `"solução nutritiva" hidropônica EC pH tabela`
];

// ✅ 외부에서 이 함수 하나만 쓰면 됨
export function generateMultilingualKeywords(cropKey: string): string[] {
  const { koName, en } = cropVariants(cropKey);

  // 작물명 + 기술 키워드(EC|pH|NPK) 강제
  const enQueries = [
    `${cropKey} hydroponic (EC OR "electrical conductivity") (pH OR acidity) (NPK OR "nutrient solution")`,
    `${cropKey} soilless nutrient solution EC pH`,
    `${cropKey} "nutrient solution" (Table OR formulation OR recipe)`,
  ];

  // 한글/스페인어/포르투갈어(국제 OA 저널 대비)
  const koQueries = [
    `${koName} 수경재배 양액 EC pH`,
    `${koName} 배양액 조성 NPK`,
    `${koName} 수경 배양액 레시피`
  ];
  
  const extraIntl = [
    `${cropKey} "solución nutritiva" hidropónica EC pH`,      // ES
    `${cropKey} "solução nutritiva" hidropônica EC pH`,       // PT-BR
  ];

  // 한글 쿼리(작물명+공통 키워드)
  const koQueriesBasic = [
    `${koName} 수경재배`,
    `${koName} 배양액`,
    `${koName} 양액`,
    ...BASE_KO.map(k => `${koName} ${k}`),
  ];

  // 영문 쿼리(작물명/동의어 × 공통 키워드)
  const enStem = [
    "hydroponic nutrient solution",
    "nutrient solution EC pH",
    "hydroponic fertilizer",
    ...BASE_EN,
  ];
  const enQueriesBasic = en.flatMap(crop =>
    enStem.map(stem => `${crop} ${stem}`)
  );

  // 중복 제거해서 반환
  return [...new Set([...koQueries, ...enQueries, ...extraIntl, ...koQueriesBasic, ...enQueriesBasic])];
}
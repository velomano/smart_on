// apps/worker/src/crawl/utils/cropLexicon.ts
// 작물 사전 확장 - 과수 카테고리 포함

export const CROP_ALIASES = {
  // 기존 작물들
  lettuce: ['상추', 'lettuce', 'lactuca sativa'],
  tomato: ['토마토', 'tomato', 'solanum lycopersicum'],
  cucumber: ['오이', 'cucumber', 'cucumis sativus'],
  pepper: ['고추', 'pepper', 'capsicum'],
  basil: ['바질', 'basil', 'ocimum basilicum'],
  spinach: ['시금치', 'spinach', 'spinacia oleracea'],
  kale: ['케일', 'kale'],
  chinese_cabbage: ['배추', 'napa cabbage', 'brassica rapa'],
  radish: ['무', 'radish'],
  carrot: ['당근', 'carrot'],
  cabbage: ['양배추', 'cabbage'],
  broccoli: ['브로콜리', 'broccoli'],
  onion: ['양파', 'onion'],
  garlic: ['마늘', 'garlic'],
  chive: ['부추', 'chive', 'allium tuberosum'],
  strawberry: ['딸기', 'strawberry', 'fragaria × ananassa'],
  
  // ===== 과수 작물 추가 =====
  blueberry: [
    '블루베리', '하이부시 블루베리', '로우부시 블루베리',
    'highbush blueberry', 'lowbush blueberry', 'vaccinium corymbosum', 'vaccinium angustifolium'
  ],
  grape: ['포도', 'grape', 'vitis vinifera'],
  apple: ['사과', 'apple', 'malus domestica'],
  pear: ['배', 'pear', 'pyrus pyrifolia', 'pyrus communis'],
  peach: ['복숭아', 'peach', 'prunus persica'],
  plum: ['자두', 'plum', 'prunus salicina', 'prunus domestica'],
  apricot: ['살구', 'apricot', 'prunus armeniaca'],
  cherry: ['체리', 'sweet cherry', 'tart cherry', 'prunus avium', 'prunus cerasus'],
  citrus: ['감귤', '온주밀감', 'citrus', 'mandarin', 'orange', 'lemon', 'lime', 'yuzu', 'kumquat', 'citrus reticulata', 'citrus sinensis', 'citrus limon'],
  banana: ['바나나', 'banana', 'musa acuminata'],
  avocado: ['아보카도', 'avocado', 'persea americana'],
  fig: ['무화과', 'fig', 'ficus carica'],
};

export const CROP_GROUP_HINTS = {
  berry: ['베리', '장과류', 'berries', 'berry crops', 'small fruit'],
  pome: ['핵과', 'pome fruit'],
  stone: ['핵과류', 'stone fruit'],
  citrusGroup: ['감귤류', 'citrus fruit', 'citrus crops'],
  fruitTree: ['과수', '유실수', 'fruit tree', 'tree fruit', '果樹'],
};

// 작물 그룹 감지
export function detectCropGroup(text: string): string[] {
  const groups: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [group, hints] of Object.entries(CROP_GROUP_HINTS)) {
    for (const hint of hints) {
      if (lowerText.includes(hint.toLowerCase())) {
        groups.push(group);
        break;
      }
    }
  }
  
  return groups;
}

// 작물명 추출 (과수 포함)
export function extractCropFromText(text: string): { crop_key: string; crop_name: string } {
  const lowerText = text.toLowerCase();
  
  // 직접 매칭
  for (const [cropKey, aliases] of Object.entries(CROP_ALIASES)) {
    for (const alias of aliases) {
      if (lowerText.includes(alias.toLowerCase())) {
        return {
          crop_key: cropKey,
          crop_name: aliases[0] // 첫 번째가 기본명
        };
      }
    }
  }
  
  // 그룹 힌트 기반 추정
  const groups = detectCropGroup(text);
  if (groups.length > 0) {
    // 가장 일반적인 과수 작물로 매핑
    if (groups.includes('berry')) return { crop_key: 'blueberry', crop_name: '블루베리' };
    if (groups.includes('citrusGroup')) return { crop_key: 'citrus', crop_name: '감귤' };
    if (groups.includes('fruitTree')) return { crop_key: 'apple', crop_name: '사과' };
  }
  
  return { crop_key: 'unknown', crop_name: 'unknown' };
}

// 과수 작물 여부 확인
export function isFruitCrop(cropKey: string): boolean {
  const fruitCrops = ['blueberry', 'grape', 'apple', 'pear', 'peach', 'plum', 'apricot', 'cherry', 'citrus', 'banana', 'avocado', 'fig'];
  return fruitCrops.includes(cropKey);
}

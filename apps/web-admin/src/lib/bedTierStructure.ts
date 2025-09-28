/**
 * 베드 다단 구조 관리 유틸리티
 */

export interface BedTier {
  tierNumber: number; // 1-5
  isActive: boolean;  // 해당 단이 활성화되어 있는지
  plantCount?: number; // 해당 단에 심어진 식물 수
  lastWatered?: Date;  // 마지막 관수 시간
  notes?: string;      // 단별 메모
}

export interface BedTierConfig {
  bedId: string;
  totalTiers: number;      // 총 단 수 (1-5)
  activeTiers: number;     // 현재 활성화된 단 수
  tiers: BedTier[];        // 각 단별 정보
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 베드 단 구조 초기화
 */
export function initializeBedTiers(bedId: string, totalTiers: number = 1): BedTierConfig {
  const tiers: BedTier[] = [];
  
  for (let i = 1; i <= 5; i++) {
    tiers.push({
      tierNumber: i,
      isActive: i <= totalTiers,
      plantCount: 0,
      notes: ''
    });
  }

  return {
    bedId,
    totalTiers,
    activeTiers: totalTiers,
    tiers,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * 베드 단 수 변경
 */
export function updateBedTierCount(config: BedTierConfig, newTotalTiers: number): BedTierConfig {
  if (newTotalTiers < 1 || newTotalTiers > 5) {
    throw new Error('단 수는 1-5 사이여야 합니다.');
  }

  const updatedTiers = config.tiers.map(tier => ({
    ...tier,
    isActive: tier.tierNumber <= newTotalTiers
  }));

  return {
    ...config,
    totalTiers: newTotalTiers,
    activeTiers: newTotalTiers,
    tiers: updatedTiers,
    updatedAt: new Date()
  };
}

/**
 * 특정 단 활성화/비활성화
 */
export function toggleTierStatus(config: BedTierConfig, tierNumber: number): BedTierConfig {
  if (tierNumber < 1 || tierNumber > 5) {
    throw new Error('단 번호는 1-5 사이여야 합니다.');
  }

  const updatedTiers = config.tiers.map(tier => 
    tier.tierNumber === tierNumber 
      ? { ...tier, isActive: !tier.isActive }
      : tier
  );

  const activeTiers = updatedTiers.filter(tier => tier.isActive).length;

  return {
    ...config,
    activeTiers,
    tiers: updatedTiers,
    updatedAt: new Date()
  };
}

/**
 * 단별 정보 업데이트
 */
export function updateTierInfo(
  config: BedTierConfig, 
  tierNumber: number, 
  updates: Partial<BedTier>
): BedTierConfig {
  const updatedTiers = config.tiers.map(tier => 
    tier.tierNumber === tierNumber 
      ? { ...tier, ...updates }
      : tier
  );

  return {
    ...config,
    tiers: updatedTiers,
    updatedAt: new Date()
  };
}

/**
 * 베드 단 구조 시각화용 데이터 생성
 */
export function getTierVisualizationData(config: BedTierConfig) {
  return {
    totalTiers: config.totalTiers,
    activeTiers: config.activeTiers,
    tierStatuses: config.tiers.map(tier => ({
      tierNumber: tier.tierNumber,
      isActive: tier.isActive,
      status: tier.isActive ? 'active' : 'inactive',
      plantCount: tier.plantCount || 0,
      hasPlants: (tier.plantCount || 0) > 0
    }))
  };
}

/**
 * 단 구조 표시용 텍스트 생성
 */
export function getTierDisplayText(config: BedTierConfig): string {
  const activeTiers = config.tiers.filter(tier => tier.isActive);
  
  if (activeTiers.length === 0) {
    return '단 구조 없음';
  }
  
  if (activeTiers.length === 1) {
    return `1단 (${activeTiers[0].tierNumber}단)`;
  }
  
  const tierNumbers = activeTiers.map(tier => tier.tierNumber).sort();
  const minTier = tierNumbers[0];
  const maxTier = tierNumbers[tierNumbers.length - 1];
  
  if (tierNumbers.length === maxTier - minTier + 1) {
    // 연속된 단인 경우
    return minTier === maxTier ? `${minTier}단` : `${minTier}-${maxTier}단`;
  } else {
    // 불연속 단인 경우
    return `${activeTiers.length}단 (${tierNumbers.join(', ')}단)`;
  }
}

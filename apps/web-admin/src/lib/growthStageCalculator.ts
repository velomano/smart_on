// 생육 단계 계산 로직

export interface GrowthStage {
  stage: string;
  label: string;
  color: string;
  progress: number; // 0-100
}

export interface GrowthStageInfo {
  currentStage: string;
  currentStageLabel: string;
  progress: number; // 전체 진행률 0-100
  stages: GrowthStage[];
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
}

/**
 * 생육 단계 계산 함수
 * @param plantType 'seed' (파종) 또는 'seedling' (육묘)
 * @param startDate 정식 시작일자
 * @param harvestDate 수확 예정일자
 * @param customBoundaries 커스텀 단계 경계 (선택)
 * @returns 생육 단계 정보
 */
export function calculateGrowthStage(
  plantType: 'seed' | 'seedling',
  startDate: string,
  harvestDate: string,
  customBoundaries?: number[]
): GrowthStageInfo | null {
  if (!startDate || !harvestDate) {
    return null;
  }

  const start = new Date(startDate);
  const harvest = new Date(harvestDate);
  const today = new Date();
  
  // 날짜 유효성 검사
  if (isNaN(start.getTime()) || isNaN(harvest.getTime())) {
    return null;
  }
  
  // 총 재배 기간 (일)
  const totalDays = Math.ceil((harvest.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // 경과 일수
  const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // 남은 일수
  const daysRemaining = totalDays - daysElapsed;
  
  // 전체 진행률 (0-100%)
  const overallProgress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  
  // 파종 단계: 발아 → 생식생장 → 영양생장 → 수확시기
  // 육묘 단계: 생식생장 → 영양생장 → 수확시기
  
  let stages: GrowthStage[];
  let currentStage: string;
  let currentStageLabel: string;
  
  if (plantType === 'seed') {
    // 파종: 4단계
    // 커스텀 경계 또는 기본값 사용
    const boundaries = customBoundaries || [15, 45, 85];
    
    // 발아 (0-boundaries[0]%), 생식생장 (boundaries[0]-boundaries[1]%), 
    // 영양생장 (boundaries[1]-boundaries[2]%), 수확시기 (boundaries[2]-100%)
    stages = [
      {
        stage: 'germination',
        label: '발아',
        color: '#FCD34D', // 노란색
        progress: 0
      },
      {
        stage: 'reproductive',
        label: '생식생장',
        color: '#60A5FA', // 하늘색
        progress: 0
      },
      {
        stage: 'vegetative',
        label: '영양생장',
        color: '#34D399', // 녹색
        progress: 0
      },
      {
        stage: 'harvest',
        label: '수확시기',
        color: '#F87171', // 빨간색
        progress: 0
      }
    ];
    
    if (overallProgress < boundaries[0]) {
      currentStage = 'germination';
      currentStageLabel = '발아';
      stages[0].progress = (overallProgress / boundaries[0]) * 100;
    } else if (overallProgress < boundaries[1]) {
      currentStage = 'reproductive';
      currentStageLabel = '생식생장';
      stages[0].progress = 100;
      stages[1].progress = ((overallProgress - boundaries[0]) / (boundaries[1] - boundaries[0])) * 100;
    } else if (overallProgress < boundaries[2]) {
      currentStage = 'vegetative';
      currentStageLabel = '영양생장';
      stages[0].progress = 100;
      stages[1].progress = 100;
      stages[2].progress = ((overallProgress - boundaries[1]) / (boundaries[2] - boundaries[1])) * 100;
    } else {
      currentStage = 'harvest';
      currentStageLabel = '수확시기';
      stages[0].progress = 100;
      stages[1].progress = 100;
      stages[2].progress = 100;
      stages[3].progress = ((overallProgress - boundaries[2]) / (100 - boundaries[2])) * 100;
    }
  } else {
    // 육묘: 3단계
    // 커스텀 경계 또는 기본값 사용
    const boundaries = customBoundaries || [40, 80];
    
    // 생식생장 (0-boundaries[0]%), 영양생장 (boundaries[0]-boundaries[1]%), 수확시기 (boundaries[1]-100%)
    stages = [
      {
        stage: 'reproductive',
        label: '생식생장',
        color: '#60A5FA', // 하늘색
        progress: 0
      },
      {
        stage: 'vegetative',
        label: '영양생장',
        color: '#34D399', // 녹색
        progress: 0
      },
      {
        stage: 'harvest',
        label: '수확시기',
        color: '#F87171', // 빨간색
        progress: 0
      }
    ];
    
    if (overallProgress < boundaries[0]) {
      currentStage = 'reproductive';
      currentStageLabel = '생식생장';
      stages[0].progress = (overallProgress / boundaries[0]) * 100;
    } else if (overallProgress < boundaries[1]) {
      currentStage = 'vegetative';
      currentStageLabel = '영양생장';
      stages[0].progress = 100;
      stages[1].progress = ((overallProgress - boundaries[0]) / (boundaries[1] - boundaries[0])) * 100;
    } else {
      currentStage = 'harvest';
      currentStageLabel = '수확시기';
      stages[0].progress = 100;
      stages[1].progress = 100;
      stages[2].progress = ((overallProgress - boundaries[1]) / (100 - boundaries[1])) * 100;
    }
  }
  
  return {
    currentStage,
    currentStageLabel,
    progress: overallProgress,
    stages,
    daysElapsed,
    totalDays,
    daysRemaining
  };
}

/**
 * 생육 단계 색상 가져오기
 */
export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    germination: '#FCD34D', // 노란색
    reproductive: '#60A5FA', // 하늘색
    vegetative: '#34D399', // 녹색
    harvest: '#F87171' // 빨간색
  };
  return colors[stage] || '#9CA3AF';
}

/**
 * 생장단계 변경 감지 및 알림 발송
 * @param location 농장/베드 위치
 * @param cropName 작물명
 * @param plantType 작물 타입
 * @param startDate 시작일
 * @param harvestDate 수확일
 * @param lastKnownStage 마지막으로 알려진 단계
 * @param customBoundaries 커스텀 경계
 * @returns 현재 단계 정보
 */
export async function checkGrowthStageAndNotify(
  location: string,
  cropName: string,
  plantType: 'seed' | 'seedling',
  startDate: string,
  harvestDate: string,
  lastKnownStage?: string,
  customBoundaries?: number[]
): Promise<GrowthStageInfo | null> {
  try {
    const currentGrowthInfo = calculateGrowthStage(plantType, startDate, harvestDate, customBoundaries);
    
    if (!currentGrowthInfo) {
      return null;
    }

    // 생장단계 변경 감지
    if (lastKnownStage && lastKnownStage !== currentGrowthInfo.currentStage) {
      console.log(`🌱 생장단계 변경 감지: ${location} - ${lastKnownStage} → ${currentGrowthInfo.currentStage}`);
      
      // 알림 서비스 동적 import (순환 의존성 방지)
      const { notifyGrowthStageChange } = await import('./notificationService');
      
      await notifyGrowthStageChange(
        location,
        cropName,
        lastKnownStage,
        currentGrowthInfo.currentStage,
        currentGrowthInfo.daysRemaining
      );
    }

    return currentGrowthInfo;
  } catch (error) {
    console.error('❌ 생장단계 변경 감지 실패:', error);
    return null;
  }
}

/**
 * 수확 알림 체크
 * @param location 농장/베드 위치
 * @param cropName 작물명
 * @param harvestDate 수확일
 * @param daysUntilHarvest 수확까지 남은 일수
 */
export async function checkHarvestAndNotify(
  location: string,
  cropName: string,
  harvestDate: string,
  daysUntilHarvest: number
): Promise<void> {
  try {
    // 수확 3일 전, 1일 전, 당일 알림
    if (daysUntilHarvest <= 3 && daysUntilHarvest >= 0) {
      console.log(`🍅 수확 알림 체크: ${location} - ${daysUntilHarvest}일 남음`);
      
      // 알림 서비스 동적 import
      const { notifyHarvestReminder } = await import('./notificationService');
      
      await notifyHarvestReminder(
        location,
        cropName,
        harvestDate,
        daysUntilHarvest
      );
    }
  } catch (error) {
    console.error('❌ 수확 알림 체크 실패:', error);
  }
}

/**
 * 생육 단계 라벨 가져오기
 */
export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    germination: '발아',
    reproductive: '생식생장',
    vegetative: '영양생장',
    harvest: '수확시기'
  };
  return labels[stage] || '알 수 없음';
}


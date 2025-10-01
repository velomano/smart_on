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
 * @returns 생육 단계 정보
 */
export function calculateGrowthStage(
  plantType: 'seed' | 'seedling',
  startDate: string,
  harvestDate: string
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
    // 발아 (0-15%), 생식생장 (15-45%), 영양생장 (45-85%), 수확시기 (85-100%)
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
    
    if (overallProgress < 15) {
      currentStage = 'germination';
      currentStageLabel = '발아';
      stages[0].progress = (overallProgress / 15) * 100;
    } else if (overallProgress < 45) {
      currentStage = 'reproductive';
      currentStageLabel = '생식생장';
      stages[0].progress = 100;
      stages[1].progress = ((overallProgress - 15) / 30) * 100;
    } else if (overallProgress < 85) {
      currentStage = 'vegetative';
      currentStageLabel = '영양생장';
      stages[0].progress = 100;
      stages[1].progress = 100;
      stages[2].progress = ((overallProgress - 45) / 40) * 100;
    } else {
      currentStage = 'harvest';
      currentStageLabel = '수확시기';
      stages[0].progress = 100;
      stages[1].progress = 100;
      stages[2].progress = 100;
      stages[3].progress = ((overallProgress - 85) / 15) * 100;
    }
  } else {
    // 육묘: 3단계
    // 생식생장 (0-40%), 영양생장 (40-80%), 수확시기 (80-100%)
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
    
    if (overallProgress < 40) {
      currentStage = 'reproductive';
      currentStageLabel = '생식생장';
      stages[0].progress = (overallProgress / 40) * 100;
    } else if (overallProgress < 80) {
      currentStage = 'vegetative';
      currentStageLabel = '영양생장';
      stages[0].progress = 100;
      stages[1].progress = ((overallProgress - 40) / 40) * 100;
    } else {
      currentStage = 'harvest';
      currentStageLabel = '수확시기';
      stages[0].progress = 100;
      stages[1].progress = 100;
      stages[2].progress = ((overallProgress - 80) / 20) * 100;
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


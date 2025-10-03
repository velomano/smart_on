import React from 'react';
import { calculateGrowthStage, GrowthStageInfo } from '@/lib/growthStageCalculator';

interface BedTierShelfVisualizationProps {
  activeTiers: number; // 1~3 중 활성화할 단수
  tierStatuses: Array<{
    tierNumber: number; // 1, 2, 3
    hasPlants: boolean;
    cropName?: string;
    growingMethod?: string;
    plantType?: 'seed' | 'seedling'; // 파종/육묘
    startDate?: string; // 정식 시작일자
    harvestDate?: string; // 수확 예정일자
    stageBoundaries?: {
      seed: number[];
      seedling: number[];
    };
  }>;
  waterLevelStatus?: 'high' | 'low' | 'normal' | 'disconnected';
  onTierClick?: (tierNumber: number) => void;
  compact?: boolean;
}

export default function BedTierShelfVisualization({
  activeTiers,
  tierStatuses,
  waterLevelStatus = 'normal',
  onTierClick,
  compact = false
}: BedTierShelfVisualizationProps) {
  
  // 생육 단계 프로그레스 바 컴포넌트 (사용 안 함 - SVG 내부로 이동)
  const GrowthProgressBar = ({ tierNumber }: { tierNumber: number }) => {
    const tier = tierStatuses.find(t => t.tierNumber === tierNumber);
    
    if (!tier || !tier.hasPlants || !tier.startDate || !tier.harvestDate || !tier.plantType) {
      return null;
    }
    
    const growthInfo = calculateGrowthStage(tier.plantType, tier.startDate, tier.harvestDate);
    
    if (!growthInfo) {
      return null;
    }
    
    return (
      <div className="w-full mt-2 px-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-600">
            {growthInfo.currentStageLabel}
          </span>
          <span className="text-xs text-gray-500">
            {growthInfo.daysElapsed}일 / {growthInfo.totalDays}일
          </span>
        </div>
        
        {/* 프로그레스 바 */}
        <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full flex">
            {growthInfo.stages.map((stage, index) => {
              const stageWidth = tier.plantType === 'seed' 
                ? (index === 0 ? 15 : index === 1 ? 30 : index === 2 ? 40 : 15)
                : (index === 0 ? 40 : index === 1 ? 40 : 20);
              
              return (
                <div
                  key={stage.stage}
                  className="relative transition-all duration-500"
                  style={{
                    width: `${stageWidth}%`,
                    backgroundColor: '#E5E7EB'
                  }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${stage.progress}%`,
                      backgroundColor: stage.color
                    }}
                  />
                  {/* 단계 라벨 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700 drop-shadow-sm">
                      {stage.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 남은 일수 표시 */}
        {growthInfo.daysRemaining > 0 && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            수확까지 {growthInfo.daysRemaining}일 남음
          </div>
        )}
        {growthInfo.daysRemaining <= 0 && (
          <div className="text-xs text-red-500 font-semibold mt-1 text-right">
            수확 시기입니다!
          </div>
        )}
      </div>
    );
  };
  
  // SVG용 프로그레스 바 렌더링 함수
  const renderSVGProgressBar = (tierNumber: number, yPosition: number) => {
    const tier = tierStatuses.find(t => t.tierNumber === tierNumber);
    
    if (!tier || !tier.hasPlants || !tier.startDate || !tier.harvestDate || !tier.plantType) {
      return null;
    }
    
    // 커스텀 경계 사용
    const customBoundaries = tier.stageBoundaries
      ? (tier.plantType === 'seed' ? tier.stageBoundaries.seed : tier.stageBoundaries.seedling)
      : undefined;
    
    const growthInfo = calculateGrowthStage(tier.plantType, tier.startDate, tier.harvestDate, customBoundaries);
    
    if (!growthInfo) {
      return null;
    }
    
    const barWidth = 280;
    const barHeight = 20;
    const barX = 47;
    
    // 각 단계의 날짜 계산
    const startDate = new Date(tier.startDate);
    const calculateStageDate = (percentage: number) => {
      const days = Math.round((growthInfo.totalDays * percentage) / 100);
      const date = new Date(startDate);
      date.setDate(date.getDate() + days);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
    
    return (
      <g>
        {/* 단계별 프로그레스 */}
        {growthInfo.stages.map((stage, index) => {
          const stageWidth = tier.plantType === 'seed' 
            ? (index === 0 ? 15 : index === 1 ? 30 : index === 2 ? 40 : 15)
            : (index === 0 ? 40 : index === 1 ? 40 : 20);
          
          const segmentWidth = (barWidth * stageWidth) / 100;
          const segmentX = barX + growthInfo.stages.slice(0, index).reduce((sum, s) => {
            const w = tier.plantType === 'seed' 
              ? (growthInfo.stages.indexOf(s) === 0 ? 15 : growthInfo.stages.indexOf(s) === 1 ? 30 : growthInfo.stages.indexOf(s) === 2 ? 40 : 15)
              : (growthInfo.stages.indexOf(s) === 0 ? 40 : growthInfo.stages.indexOf(s) === 1 ? 40 : 20);
            return sum + (barWidth * w / 100);
          }, 0);
          
          // 각 단계의 시작 퍼센트 계산
          const stageStartPercent = tier.plantType === 'seed'
            ? (index === 0 ? 0 : index === 1 ? 15 : index === 2 ? 45 : 85)
            : (index === 0 ? 0 : index === 1 ? 40 : 80);
          
          return (
            <g key={stage.stage}>
              {/* 단계 배경 (회색) */}
              <rect
                x={segmentX}
                y={yPosition}
                width={segmentWidth}
                height={barHeight}
                fill="#E5E7EB"
              />
              
              {/* 단계 진행 바 */}
              <rect
                x={segmentX}
                y={yPosition}
                width={(segmentWidth * stage.progress) / 100}
                height={barHeight}
                fill={stage.color}
              />
              
              {/* 단계 구분선 (마지막 단계 제외) */}
              {index < growthInfo.stages.length - 1 && (
                <line
                  x1={segmentX + segmentWidth}
                  y1={yPosition}
                  x2={segmentX + segmentWidth}
                  y2={yPosition + barHeight}
                  stroke="#9CA3AF"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
              )}
              
              {/* 단계 라벨 */}
              <text
                x={segmentX + segmentWidth / 2}
                y={yPosition + barHeight / 2 + 3}
                fontSize="9"
                fill="#374151"
                fontWeight="bold"
                textAnchor="middle"
              >
                {stage.label}
              </text>
              
              {/* 단계 시작 날짜 (위쪽에서 살짝 아래로) */}
              {index > 0 && (
                <text
                  x={segmentX}
                  y={yPosition - 1}
                  fontSize="7"
                  fill="#9CA3AF"
                  textAnchor="middle"
                >
                  {calculateStageDate(stageStartPercent)}
                </text>
              )}
            </g>
          );
        })}
        
        {/* 현재 단계 및 진행 정보 - 게이지 아래로 이동 */}
        <text
          x={barX}
          y={yPosition + barHeight + 14}
          fontSize="9"
          fill="#6B7280"
          fontWeight="600"
        >
          {growthInfo.currentStageLabel} ({growthInfo.daysElapsed}/{growthInfo.totalDays}일)
        </text>
      </g>
    );
  };
  
  // 고정된 3단 + 저수조 SVG 컴포넌트
  const FixedBedSVG = () => {
    const shelfHeight = 90;  // 선반 높이 증가
    const waterTankHeight = 110;  // 저수조 높이 증가
    const shelfWidth = 320;  // 선반 너비 증가
    const shelfSpacing = 90; // 선반 간격 증가
    const progressBarSpace = 30; // 프로그레스 바 공간
    const totalHeight = (3 * shelfHeight) + (2 * shelfSpacing) + waterTankHeight + shelfSpacing + 40;
    
    // 저수조 색상 결정
    const getWaterTankColor = () => {
      switch (waterLevelStatus) {
        case 'high': return '#EF4444'; // 빨간색
        case 'low': return '#F59E0B';  // 노란색
        case 'normal': return '#0EA5E9'; // 파란색
        case 'disconnected': return '#6B7280'; // 회색
        default: return '#0EA5E9';
      }
    };
    
    // 단별 색상 결정 (미색 계열로 통일)
    const getTierColor = (tierNumber: number) => {
      const isActive = tierNumber <= activeTiers;
      
      if (!isActive) return '#F9FAFB'; // 비활성 - 연한 회색
      return '#FEFEFE'; // 모든 활성 단은 미색 계열로 통일
    };

    // 단별 테두리 색상 결정 (미색 계열로 통일)
    const getTierBorderColor = (tierNumber: number) => {
      const isActive = tierNumber <= activeTiers;
      
      if (!isActive) return '#E5E7EB'; // 비활성
      return '#D1D5DB'; // 모든 활성 단은 회색 테두리로 통일
    };
    
    return (
      <div className="relative inline-block">
        <svg 
          width={shelfWidth + 60} 
          height={totalHeight} 
          viewBox={`0 0 ${shelfWidth + 60} ${totalHeight}`}
          className="drop-shadow-xl filter"
        >
          {/* 베드 프레임 (좌우 지지대) - 진한 회색 계열 */}
          <defs>
            <linearGradient id="frameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6B7280" />
              <stop offset="100%" stopColor="#4B5563" />
            </linearGradient>
          </defs>
          
          <rect 
            x="15" 
            y="15" 
            width="12" 
            height={totalHeight - 30} 
            fill="url(#frameGradient)" 
            rx="6"
          />
          <rect 
            x={shelfWidth + 27} 
            y="15" 
            width="12" 
            height={totalHeight - 30} 
            fill="url(#frameGradient)" 
            rx="6"
          />
          
          {/* 1단 (맨 위) */}
          <g 
            className={onTierClick ? 'cursor-pointer' : ''}
            onClick={() => onTierClick?.(1)}
          >
            <rect 
              x="27" 
              y="15" 
              width={shelfWidth} 
              height={shelfHeight} 
              fill={getTierColor(1)} 
              stroke={getTierBorderColor(1)} 
              strokeWidth="3"
              rx="8"
            />
            
            {/* 1단 앞쪽 가장자리 */}
            <rect 
              x="27" 
              y={15 + shelfHeight - 8} 
              width={shelfWidth} 
              height="8" 
              fill={getTierBorderColor(1)} 
              rx="4"
            />
            
            {/* 1단 라벨 */}
            <text 
              x="45" 
              y={15 + shelfHeight - 15} 
              fontSize="18" 
              fill="#374151" 
              fontWeight="bold"
            >
              1단
            </text>
            
            {/* 작물 정보 표시 또는 클릭 안내 */}
            {(() => {
              const tier = tierStatuses.find(t => t.tierNumber === 1);
              const isActive = 1 <= activeTiers;
              
              if (tier?.hasPlants && tier.cropName) {
                return (
                  <g>
                    {/* 작물 이름 (중앙) */}
                    <text 
                      x="120" 
                      y={15 + shelfHeight / 2 - 5} 
                      fontSize="16" 
                      fill="#374151" 
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {tier.cropName}
                    </text>
                    {/* 재배 방법 (중앙) */}
                    {tier.growingMethod && (
                      <text 
                        x="120" 
                        y={15 + shelfHeight / 2 + 15} 
                        fontSize="12" 
                        fill="#6B7280"
                        textAnchor="middle"
                      >
                        {tier.growingMethod}
                      </text>
                    )}
                    {/* 작물 유형과 시작일자 (오른쪽) */}
                    <text 
                      x={shelfWidth - 20} 
                      y={15 + shelfHeight / 2 - 5} 
                      fontSize="12" 
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {tier.plantType === 'seed' ? '파종' : '육묘'}
                    </text>
                    {tier.startDate && (
                      <text 
                        x={shelfWidth - 20} 
                        y={15 + shelfHeight / 2 + 15} 
                        fontSize="11" 
                        fill="#9CA3AF"
                        textAnchor="end"
                      >
                        {tier.startDate}
                      </text>
                    )}
                  </g>
                );
              } else if (isActive && onTierClick) {
                // 작물이 없고 활성화된 단일 때 클릭 안내 표시 (단 중앙에 배치)
                return (
                  <g>
                    {/* 클릭 안내 배경 - 단의 중앙에 배치 */}
                    <rect 
                      x={27 + shelfWidth / 2 - 50} 
                      y={15 + shelfHeight / 2 - 15} 
                      width="100" 
                      height="30" 
                      fill="#F9FAFB" 
                      stroke="#E5E7EB" 
                      strokeWidth="1.5"
                      rx="15"
                      opacity="0.95"
                    />
                    {/* 작물 등록 버튼 텍스트 */}
                    <text 
                      x={27 + shelfWidth / 2} 
                      y={15 + shelfHeight / 2 + 4} 
                      fontSize="14" 
                      fill="#374151"
                      textAnchor="middle"
                      fontWeight="600"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      🌱 작물 등록
                    </text>
                  </g>
                );
              }
              return null;
            })()}
          </g>
          
          {/* 1단 프로그레스 바 */}
          {renderSVGProgressBar(1, 15 + shelfHeight + 8)}

          {/* 2단 */}
          <g 
            className={onTierClick ? 'cursor-pointer' : ''}
            onClick={() => onTierClick?.(2)}
          >
            <rect 
              x="27" 
              y={15 + shelfHeight + shelfSpacing} 
              width={shelfWidth} 
              height={shelfHeight} 
              fill={getTierColor(2)} 
              stroke={getTierBorderColor(2)} 
              strokeWidth="3"
              rx="8"
            />
            
            {/* 2단 앞쪽 가장자리 */}
            <rect 
              x="27" 
              y={15 + shelfHeight + shelfSpacing + shelfHeight - 8} 
              width={shelfWidth} 
              height="8" 
              fill={getTierBorderColor(2)} 
              rx="4"
            />
            
            {/* 2단 라벨 */}
            <text 
              x="45" 
              y={15 + shelfHeight + shelfSpacing + shelfHeight - 15} 
              fontSize="18" 
              fill="#374151" 
              fontWeight="bold"
            >
              2단
            </text>
            
            {/* 작물 정보 표시 또는 클릭 안내 */}
            {(() => {
              const tier = tierStatuses.find(t => t.tierNumber === 2);
              const isActive = 2 <= activeTiers;
              
              if (tier?.hasPlants && tier.cropName) {
                return (
                  <g>
                    {/* 작물 이름 (중앙) */}
                    <text 
                      x="120" 
                      y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 - 5} 
                      fontSize="16" 
                      fill="#374151" 
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {tier.cropName}
                    </text>
                    {/* 재배 방법 (중앙) */}
                    {tier.growingMethod && (
                      <text 
                        x="120" 
                        y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 + 15} 
                        fontSize="12" 
                        fill="#6B7280"
                        textAnchor="middle"
                      >
                        {tier.growingMethod}
                      </text>
                    )}
                    {/* 작물 유형과 시작일자 (오른쪽) */}
                    <text 
                      x={shelfWidth - 20} 
                      y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 - 5} 
                      fontSize="12" 
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {tier.plantType === 'seed' ? '파종' : '육묘'}
                    </text>
                    {tier.startDate && (
                      <text 
                        x={shelfWidth - 20} 
                        y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 + 15} 
                        fontSize="11" 
                        fill="#9CA3AF"
                        textAnchor="end"
                      >
                        {tier.startDate}
                      </text>
                    )}
                  </g>
                );
              } else if (isActive && onTierClick) {
                // 작물이 없고 활성화된 단일 때 클릭 안내 표시 (단 중앙에 배치)
                return (
                  <g>
                    {/* 클릭 안내 배경 - 단의 중앙에 배치 */}
                    <rect 
                      x={27 + shelfWidth / 2 - 50} 
                      y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 - 15} 
                      width="100" 
                      height="30" 
                      fill="#F9FAFB" 
                      stroke="#E5E7EB" 
                      strokeWidth="1.5"
                      rx="15"
                      opacity="0.95"
                    />
                    {/* 작물 등록 버튼 텍스트 */}
                    <text 
                      x={27 + shelfWidth / 2} 
                      y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 + 4} 
                      fontSize="14" 
                      fill="#374151"
                      textAnchor="middle"
                      fontWeight="600"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      🌱 작물 등록
                    </text>
                  </g>
                );
              }
              return null;
            })()}
          </g>
          
          {/* 2단 프로그레스 바 */}
          {renderSVGProgressBar(2, 15 + shelfHeight + shelfSpacing + shelfHeight + 8)}

          {/* 3단 */}
          <g 
            className={onTierClick ? 'cursor-pointer' : ''}
            onClick={() => onTierClick?.(3)}
          >
            <rect 
              x="27" 
              y={15 + (2 * shelfHeight) + (2 * shelfSpacing)} 
              width={shelfWidth} 
              height={shelfHeight} 
              fill={getTierColor(3)} 
              stroke={getTierBorderColor(3)} 
              strokeWidth="3"
              rx="8"
            />
            
            {/* 3단 앞쪽 가장자리 */}
            <rect 
              x="27" 
              y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight - 8} 
              width={shelfWidth} 
              height="8" 
              fill={getTierBorderColor(3)} 
              rx="4"
            />
            
            {/* 3단 라벨 */}
            <text 
              x="45" 
              y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight - 15} 
              fontSize="18" 
              fill="#374151" 
              fontWeight="bold"
            >
              3단
            </text>
            
            {/* 작물 정보 표시 또는 클릭 안내 */}
            {(() => {
              const tier = tierStatuses.find(t => t.tierNumber === 3);
              const isActive = 3 <= activeTiers;
              
              if (tier?.hasPlants && tier.cropName) {
                return (
                  <g>
                    {/* 작물 이름 (중앙) */}
                    <text 
                      x="120" 
                      y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 - 5} 
                      fontSize="16" 
                      fill="#374151" 
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {tier.cropName}
                    </text>
                    {/* 재배 방법 (중앙) */}
                    {tier.growingMethod && (
                      <text 
                        x="120" 
                        y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 + 15} 
                        fontSize="12" 
                        fill="#6B7280"
                        textAnchor="middle"
                      >
                        {tier.growingMethod}
                      </text>
                    )}
                    {/* 작물 유형과 시작일자 (오른쪽) */}
                    <text 
                      x={shelfWidth - 20} 
                      y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 - 5} 
                      fontSize="12" 
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {tier.plantType === 'seed' ? '파종' : '육묘'}
                    </text>
                    {tier.startDate && (
                      <text 
                        x={shelfWidth - 20} 
                        y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 + 15} 
                        fontSize="11" 
                        fill="#9CA3AF"
                        textAnchor="end"
                      >
                        {tier.startDate}
                      </text>
                    )}
                  </g>
                );
              } else if (isActive && onTierClick) {
                // 작물이 없고 활성화된 단일 때 클릭 안내 표시 (단 중앙에 배치)
                return (
                  <g>
                    {/* 클릭 안내 배경 - 단의 중앙에 배치 */}
                    <rect 
                      x={27 + shelfWidth / 2 - 50} 
                      y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 - 15} 
                      width="100" 
                      height="30" 
                      fill="#F9FAFB" 
                      stroke="#E5E7EB" 
                      strokeWidth="1.5"
                      rx="15"
                      opacity="0.95"
                    />
                    {/* 작물 등록 버튼 텍스트 */}
                    <text 
                      x={27 + shelfWidth / 2} 
                      y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 + 4} 
                      fontSize="14" 
                      fill="#374151"
                      textAnchor="middle"
                      fontWeight="600"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      🌱 작물 등록
                    </text>
                  </g>
                );
              }
              return null;
            })()}
          </g>
          
          {/* 3단 프로그레스 바 */}
          {renderSVGProgressBar(3, 15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight + 8)}

          {/* 저수조 (맨 아래, 항상 표시) - 개선된 디자인 */}
          <g>
            {/* 저수조 그림자 효과 */}
            <rect 
              x="30" 
              y={15 + (3 * shelfHeight) + (3 * shelfSpacing) + 3} 
              width={shelfWidth} 
              height={waterTankHeight} 
              fill="rgba(0,0,0,0.1)" 
              rx="8"
            />
            
            <rect 
              x="27" 
              y={15 + (3 * shelfHeight) + (3 * shelfSpacing)} 
              width={shelfWidth} 
              height={waterTankHeight} 
              fill={getWaterTankColor()} 
              stroke={getWaterTankColor()} 
              strokeWidth="3"
              rx="8"
            />
            
            {/* 물탱크 아이콘 */}
            <text 
              x="45" 
              y={15 + (3 * shelfHeight) + (3 * shelfSpacing) + 40} 
              fontSize="32" 
              fill="white" 
              textAnchor="middle"
              fontWeight="bold"
            >
              💧
            </text>
            
            {/* 물탱크 라벨 */}
            <text 
              x={shelfWidth / 2 + 27} 
              y={15 + (3 * shelfHeight) + (3 * shelfSpacing) + 65} 
              fontSize="18" 
              fill="white" 
              fontWeight="bold"
              textAnchor="middle"
            >
              저수조
            </text>
            
            {/* 물탱크 상태 표시 */}
            <text 
              x={shelfWidth / 2 + 27} 
              y={15 + (3 * shelfHeight) + (3 * shelfSpacing) + 85} 
              fontSize="12" 
              fill="white" 
              textAnchor="middle"
              opacity="0.8"
            >
              {waterLevelStatus === 'normal' ? '정상' : 
               waterLevelStatus === 'high' ? '수위 높음' :
               waterLevelStatus === 'low' ? '수위 낮음' : '연결 안됨'}
            </text>
          </g>
          
        </svg>
      </div>
    );
  };

  if (compact) {
    const activeCropCount = tierStatuses.filter(tier => tier.hasPlants).length;
    return (
      <div className="flex items-center space-x-2">
        <FixedBedSVG />
        <div className="text-xs text-gray-600">
          {activeCropCount > 0 && (
            <span className="font-semibold">🌱 {activeCropCount}개 작물</span>
          )}
        </div>
      </div>
    );
  }

  const activeCropCount = tierStatuses.filter(tier => tier.hasPlants).length;
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-xl font-bold text-gray-800 mb-2">🏗️ 베드 단 구조</h4>
          {onTierClick && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                💡 작물이 없는 단을 클릭하여 작물 정보를 등록하세요
              </p>
            </div>
          )}
        </div>
        {activeCropCount > 0 && (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-3 rounded-full border border-green-200">
            <span className="text-sm text-green-700 font-bold">
              🌱 {activeCropCount}개 작물 활성
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <FixedBedSVG />
      </div>
      
      {/* 단별 상세 정보 - 개선된 디자인 */}
      <div className="space-y-4">
        {[1, 2, 3].map((tierNumber) => {
          const tier = tierStatuses.find(t => t.tierNumber === tierNumber);
          const isActive = tierNumber <= activeTiers;
          
          return (
            <div
              key={tierNumber}
              className={`p-5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? tier?.hasPlants 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-md' 
                    : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 shadow-md hover:shadow-lg'
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300'
              } ${onTierClick && !tier?.hasPlants ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
              onClick={() => !tier?.hasPlants && onTierClick?.(tierNumber)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    isActive 
                      ? tier?.hasPlants 
                        ? 'bg-green-500 border-green-600' 
                        : 'bg-amber-400 border-amber-500'
                      : 'bg-gray-300 border-gray-400'
                  }`} />
                  <div>
                    <span className={`text-lg font-bold ${
                      isActive ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                      {tierNumber}단
                    </span>
                    {tier?.cropName && (
                      <span className="text-sm text-gray-600 ml-2">({tier.cropName})</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {isActive && (
                    <span className={`text-sm font-medium px-3 py-2 rounded-full ${
                      tier?.hasPlants 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {tier?.hasPlants ? '🌱 작물 있음' : (onTierClick ? '➕ 작물 등록하기' : '🔄 대기')}
                    </span>
                  )}
                  <span className={`text-sm px-4 py-2 rounded-full font-bold ${
                    isActive 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
                      : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-500 border border-gray-200'
                  }`}>
                    {isActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}

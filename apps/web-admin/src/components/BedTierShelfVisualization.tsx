import React from 'react';

interface BedTierShelfVisualizationProps {
  activeTiers: number; // 1~3 중 활성화할 단수
  tierStatuses: Array<{
    tierNumber: number; // 1, 2, 3
    hasPlants: boolean;
    cropName?: string;
    growingMethod?: string;
    plantType?: 'seed' | 'seedling'; // 파종/육묘
    startDate?: string; // 생육 시작일자
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
  
  // 고정된 3단 + 저수조 SVG 컴포넌트
  const FixedBedSVG = () => {
    const shelfHeight = 90;  // 선반 높이 증가
    const waterTankHeight = 110;  // 저수조 높이 증가
    const shelfWidth = 320;  // 선반 너비 증가
    const shelfSpacing = 90; // 선반 간격 증가
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
    
    // 단별 색상 결정 (개선된 색상 팔레트)
    const getTierColor = (tierNumber: number) => {
      const tier = tierStatuses.find(t => t.tierNumber === tierNumber);
      const isActive = tierNumber <= activeTiers;
      
      if (!isActive) return '#F3F4F6'; // 비활성 - 연한 회색
      if (tier?.hasPlants) return '#D1FAE5'; // 작물 있음 - 연한 녹색
      return '#FEF3C7'; // 기본 - 연한 노란색 (클릭 대기 상태)
    };

    // 단별 테두리 색상 결정
    const getTierBorderColor = (tierNumber: number) => {
      const tier = tierStatuses.find(t => t.tierNumber === tierNumber);
      const isActive = tierNumber <= activeTiers;
      
      if (!isActive) return '#E5E7EB'; // 비활성
      if (tier?.hasPlants) return '#10B981'; // 작물 있음 - 녹색
      return '#F59E0B'; // 기본 - 노란색 (클릭 가능)
    };
    
    return (
      <div className="relative inline-block">
        <svg 
          width={shelfWidth + 60} 
          height={totalHeight} 
          viewBox={`0 0 ${shelfWidth + 60} ${totalHeight}`}
          className="drop-shadow-xl filter"
        >
          {/* 베드 프레임 (좌우 지지대) - 개선된 디자인 */}
          <defs>
            <linearGradient id="frameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4F46E5" />
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
                      x={27 + shelfWidth / 2 - 70} 
                      y={15 + shelfHeight / 2 - 18} 
                      width="140" 
                      height="36" 
                      fill="#FFFFFF" 
                      stroke="#3B82F6" 
                      strokeWidth="2"
                      rx="18"
                      opacity="0.95"
                    />
                    {/* 클릭 안내 텍스트 (한 줄) */}
                    <text 
                      x={27 + shelfWidth / 2} 
                      y={15 + shelfHeight / 2 + 5} 
                      fontSize="14" 
                      fill="#1E40AF"
                      textAnchor="middle"
                      fontWeight="bold"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      style={{ fontWeight: 'bold' }}
                    >
                      + 작물 등록
                    </text>
                  </g>
                );
              }
              return null;
            })()}
          </g>

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
                      x={27 + shelfWidth / 2 - 70} 
                      y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 - 18} 
                      width="140" 
                      height="36" 
                      fill="#FFFFFF" 
                      stroke="#3B82F6" 
                      strokeWidth="2"
                      rx="18"
                      opacity="0.95"
                    />
                    {/* 클릭 안내 텍스트 (한 줄) */}
                    <text 
                      x={27 + shelfWidth / 2} 
                      y={15 + shelfHeight + shelfSpacing + shelfHeight / 2 + 5} 
                      fontSize="14" 
                      fill="#1E40AF"
                      textAnchor="middle"
                      fontWeight="bold"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      style={{ fontWeight: 'bold' }}
                    >
                      + 작물 등록
                    </text>
                  </g>
                );
              }
              return null;
            })()}
          </g>

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
                      x={27 + shelfWidth / 2 - 70} 
                      y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 - 18} 
                      width="140" 
                      height="36" 
                      fill="#FFFFFF" 
                      stroke="#3B82F6" 
                      strokeWidth="2"
                      rx="18"
                      opacity="0.95"
                    />
                    {/* 클릭 안내 텍스트 (한 줄) */}
                    <text 
                      x={27 + shelfWidth / 2} 
                      y={15 + (2 * shelfHeight) + (2 * shelfSpacing) + shelfHeight / 2 + 5} 
                      fontSize="14" 
                      fill="#1E40AF"
                      textAnchor="middle"
                      fontWeight="bold"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      style={{ fontWeight: 'bold' }}
                    >
                      + 작물 등록
                    </text>
                  </g>
                );
              }
              return null;
            })()}
          </g>

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
              className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? tier?.hasPlants 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-md' 
                    : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 shadow-md hover:shadow-lg'
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300'
              } ${onTierClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
              onClick={() => onTierClick?.(tierNumber)}
            >
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
          );
        })}
      </div>
      
    </div>
  );
}

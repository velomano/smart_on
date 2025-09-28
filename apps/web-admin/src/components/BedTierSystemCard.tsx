import React, { useState } from 'react';
import { BedTierSystem, TierSensor, ControlSwitch } from '../lib/bedSystemArchitecture';

interface BedTierSystemCardProps {
  bedSystem: BedTierSystem;
  onSensorClick?: (tierNumber: number, sensor: TierSensor) => void;
  onSwitchToggle?: (switch: ControlSwitch) => void;
  onAddSensor?: (tierNumber: number) => void;
  onAddSwitch?: () => void;
  onEditBed?: () => void;
}

export default function BedTierSystemCard({
  bedSystem,
  onSensorClick,
  onSwitchToggle,
  onAddSensor,
  onAddSwitch,
  onEditBed
}: BedTierSystemCardProps) {
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set());

  const toggleTierExpansion = (tierNumber: number) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(tierNumber)) {
      newExpanded.delete(tierNumber);
    } else {
      newExpanded.add(tierNumber);
    }
    setExpandedTiers(newExpanded);
  };

  const getSensorIcon = (sensorType: string) => {
    const icons = {
      temperature: '🌡️',
      humidity: '💧',
      ec: '⚡',
      ph: '🧪',
      lux: '☀️',
      water_temp: '🌊'
    };
    return icons[sensorType as keyof typeof icons] || '📊';
  };

  const getSwitchIcon = (switchType: string) => {
    const icons = {
      pump: '💧',
      led: '💡',
      fan: '🌀',
      heater: '🔥',
      nutrient: '🧪',
      custom: '⚙️'
    };
    return icons[switchType as keyof typeof icons] || '🔘';
  };

  return (
    <div className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
      {/* 베드 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🏗️</span>
          </div>
          <div>
            <h6 className="font-bold text-xl text-gray-900">{bedSystem.bedName}</h6>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>🏗️ {bedSystem.activeTiers}/{bedSystem.totalTiers}단</span>
              <span>📊 센서 {Object.values(bedSystem.tiers).reduce((acc, tier) => acc + tier.sensors.length, 0)}개</span>
              <span>🔘 스위치 {bedSystem.controlSwitches.length}개</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onEditBed}
            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            ✏️ 편집
          </button>
        </div>
      </div>

      {/* 단별 센서 섹션 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h6 className="text-lg font-bold text-gray-800 flex items-center">
            <span className="text-xl mr-2">📊</span>
            단별 센서 데이터
          </h6>
          <button
            onClick={onAddSensor}
            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            + 센서 추가
          </button>
        </div>

        <div className="space-y-3">
          {Object.values(bedSystem.tiers)
            .filter(tier => tier.isActive)
            .map((tier) => (
              <div key={tier.tierNumber} className="bg-white/80 border border-gray-200 rounded-lg">
                {/* 단 헤더 */}
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleTierExpansion(tier.tierNumber)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{tier.tierNumber}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{tier.tierNumber}단</span>
                      <span className="text-sm text-gray-600 ml-2">
                        센서 {tier.sensors.length}개
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {tier.hasSensors && (
                      <div className="flex space-x-1">
                        {tier.sensors.map((sensor) => (
                          <span key={sensor.sensorId} className="text-lg">
                            {getSensorIcon(sensor.sensorType)}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-gray-400">
                      {expandedTiers.has(tier.tierNumber) ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* 센서 상세 (확장 시) */}
                {expandedTiers.has(tier.tierNumber) && (
                  <div className="px-3 pb-3 border-t border-gray-100">
                    {tier.sensors.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <span className="text-2xl block mb-2">📊</span>
                        <p>이 단에는 센서가 없습니다</p>
                        <button
                          onClick={() => onAddSensor?.(tier.tierNumber)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          센서 추가하기
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {tier.sensors.map((sensor) => (
                          <div
                            key={sensor.sensorId}
                            className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => onSensorClick?.(tier.tierNumber, sensor)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg">{getSensorIcon(sensor.sensorType)}</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {sensor.sensorType}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {sensor.lastReading ? (
                                <>
                                  <div className="font-semibold text-gray-900">
                                    {sensor.lastReading.value} {sensor.lastReading.unit}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(sensor.lastReading.timestamp).toLocaleTimeString()}
                                  </div>
                                </>
                              ) : (
                                <div className="text-gray-500">데이터 없음</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* 제어 스위치 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h6 className="text-lg font-bold text-gray-800 flex items-center">
            <span className="text-xl mr-2">🔘</span>
            원격 제어 스위치
          </h6>
          <button
            onClick={onAddSwitch}
            className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors"
          >
            + 스위치 추가
          </button>
        </div>

        {bedSystem.controlSwitches.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <span className="text-3xl block mb-2">🔘</span>
            <p className="text-gray-500 font-medium">제어 스위치가 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">원격 제어 스위치를 추가해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bedSystem.controlSwitches.map((switchItem) => (
              <div
                key={switchItem.switchId}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{getSwitchIcon(switchItem.switchType)}</span>
                  <button
                    onClick={() => onSwitchToggle?.(switchItem)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      switchItem.currentState === 'on' 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      switchItem.currentState === 'on' ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{switchItem.switchName}</div>
                  <div className="text-xs text-gray-500 capitalize">{switchItem.switchType}</div>
                  <div className={`text-xs mt-1 ${
                    switchItem.currentState === 'on' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {switchItem.currentState === 'on' ? 'ON' : 'OFF'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

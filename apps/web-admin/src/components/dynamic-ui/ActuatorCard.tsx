'use client';

import React, { useState } from 'react';

export interface ActuatorConfig {
  type: 'led' | 'pump' | 'fan' | 'heater' | 'nutrient_pump' | 'co2_injector';
  icon: string;
  color: string;
  displayName: string;
  hasBrightness?: boolean;
  hasSpeed?: boolean;
  hasSchedule?: boolean;
  hasDualTime?: boolean;
}

export interface ActuatorData {
  status: 'on' | 'off';
  mode: 'manual' | 'auto' | 'schedule';
  value: number; // 0-100% (밝기, 속도 등)
  schedule?: ActuatorSchedule;
  dualTime?: DualTimeSchedule;
}

export interface ActuatorSchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: number[]; // 0-6 (일-토)
}

export interface DualTimeSchedule {
  enabled: boolean;
  time1: { start: string; end: string };
  time2: { start: string; end: string };
  days: number[];
}

export interface ActuatorCardProps {
  config: ActuatorConfig;
  data: ActuatorData;
  deviceId: string;
  onStatusChange?: (deviceId: string, actuatorType: string, status: 'on' | 'off') => void;
  onModeChange?: (deviceId: string, actuatorType: string, mode: 'manual' | 'auto' | 'schedule') => void;
  onValueChange?: (deviceId: string, actuatorType: string, value: number) => void;
  onScheduleChange?: (deviceId: string, actuatorType: string, schedule: ActuatorSchedule) => void;
  onDualTimeChange?: (deviceId: string, actuatorType: string, dualTime: DualTimeSchedule) => void;
}

const ACTUATOR_CONFIGS: Record<string, ActuatorConfig> = {
  led: {
    type: 'led',
    icon: '💡',
    color: 'yellow',
    displayName: 'LED 조명',
    hasBrightness: true,
    hasSchedule: true
  },
  pump: {
    type: 'pump',
    icon: '💧',
    color: 'blue',
    displayName: '순환 펌프',
    hasSpeed: true,
    hasDualTime: true
  },
  fan: {
    type: 'fan',
    icon: '🌀',
    color: 'gray',
    displayName: '환기 팬',
    hasSpeed: true,
    hasSchedule: true
  },
  heater: {
    type: 'heater',
    icon: '🔥',
    color: 'red',
    displayName: '히터',
    hasSchedule: true
  },
  nutrient_pump: {
    type: 'nutrient_pump',
    icon: '🧪',
    color: 'green',
    displayName: '양액기',
    hasSpeed: true,
    hasSchedule: true
  },
  co2_injector: {
    type: 'co2_injector',
    icon: '🌫️',
    color: 'purple',
    displayName: 'CO₂ 주입기',
    hasSchedule: true
  }
};

export default function ActuatorCard({ 
  config, 
  data, 
  deviceId, 
  onStatusChange, 
  onModeChange, 
  onValueChange,
  onScheduleChange,
  onDualTimeChange
}: ActuatorCardProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDualTimeModal, setShowDualTimeModal] = useState(false);
  const [schedule, setSchedule] = useState<ActuatorSchedule>(data.schedule || {
    enabled: false,
    startTime: '09:00',
    endTime: '17:00',
    days: [1, 2, 3, 4, 5]
  });
  const [dualTime, setDualTime] = useState<DualTimeSchedule>(data.dualTime || {
    enabled: false,
    time1: { start: '09:00', end: '12:00' },
    time2: { start: '14:00', end: '17:00' },
    days: [1, 2, 3, 4, 5]
  });

  const handleStatusToggle = () => {
    const newStatus = data.status === 'on' ? 'off' : 'on';
    onStatusChange?.(deviceId, config.type, newStatus);
  };

  const handleModeChange = (newMode: 'manual' | 'auto' | 'schedule') => {
    onModeChange?.(deviceId, config.type, newMode);
  };

  const handleValueChange = (newValue: number) => {
    onValueChange?.(deviceId, config.type, newValue);
  };

  const handleScheduleSave = () => {
    onScheduleChange?.(deviceId, config.type, schedule);
    setShowScheduleModal(false);
  };

  const handleDualTimeSave = () => {
    onDualTimeChange?.(deviceId, config.type, dualTime);
    setShowDualTimeModal(false);
  };

  const getStatusColor = (status: string): string => {
    return status === 'on' ? 'text-green-600' : 'text-gray-400';
  };

  const getModeColor = (mode: string): string => {
    switch (mode) {
      case 'auto': return 'text-green-600';
      case 'schedule': return 'text-blue-600';
      case 'manual': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getModeText = (mode: string): string => {
    switch (mode) {
      case 'auto': return '자동';
      case 'schedule': return '스케줄';
      case 'manual': return '수동';
      default: return '알 수 없음';
    }
  };

  const getScheduleStatus = (): string => {
    if (config.hasSchedule && data.schedule?.enabled) {
      return '스케줄 설정됨';
    }
    if (config.hasDualTime && data.dualTime?.enabled) {
      return '듀얼타임 설정됨';
    }
    if (config.hasSchedule) {
      return '스케줄 미설정';
    }
    if (config.hasDualTime) {
      return '듀얼타임 미설정';
    }
    return '';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="font-bold text-gray-800">{config.displayName}</h3>
              <p className="text-xs text-gray-500">액추에이터</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${getStatusColor(data.status)}`}>
              {data.status.toUpperCase()}
            </div>
            <div className={`text-xs ${getModeColor(data.mode)}`}>
              {getModeText(data.mode)}
            </div>
          </div>
        </div>

        {/* 상태 및 모드 제어 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleStatusToggle}
            className={`w-12 h-6 rounded-full transition-colors ${
              data.status === 'on' 
                ? 'bg-green-500' 
                : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              data.status === 'on' ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>

          <div className="flex space-x-1">
            <button
              onClick={() => handleModeChange('manual')}
              className={`px-2 py-1 text-xs rounded ${
                data.mode === 'manual' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              수동
            </button>
            <button
              onClick={() => handleModeChange('auto')}
              className={`px-2 py-1 text-xs rounded ${
                data.mode === 'auto' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              자동
            </button>
            {(config.hasSchedule || config.hasDualTime) && (
              <button
                onClick={() => handleModeChange('schedule')}
                className={`px-2 py-1 text-xs rounded ${
                  data.mode === 'schedule' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                스케줄
              </button>
            )}
          </div>
        </div>

        {/* 밝기/속도 슬라이더 */}
        {(config.hasBrightness || config.hasSpeed) && (
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{config.hasBrightness ? '밝기' : '속도'}</span>
              <span>{data.value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={data.value}
              onChange={(e) => handleValueChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}

        {/* 스케줄/듀얼타임 상태 */}
        {(config.hasSchedule || config.hasDualTime) && (
          <div className="bg-gray-50 rounded-lg p-2 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">{getScheduleStatus()}</span>
              <div className="flex space-x-1">
                {config.hasSchedule && (
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                  >
                    설정
                  </button>
                )}
                {config.hasDualTime && (
                  <button
                    onClick={() => setShowDualTimeModal(true)}
                    className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50"
                  >
                    듀얼타임
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 현재 값 표시 */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {data.value}%
          </div>
          <div className="text-xs text-gray-500">
            {config.hasBrightness ? '밝기' : config.hasSpeed ? '속도' : '값'}
          </div>
        </div>
      </div>

      {/* 스케줄 설정 모달 */}
      {showScheduleModal && config.hasSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {config.displayName} 스케줄 설정
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={(e) => setSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">스케줄 활성화</label>
              </div>

              {schedule.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">시작 시간</label>
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => setSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">종료 시간</label>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => setSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">운영 요일</label>
                    <div className="grid grid-cols-7 gap-1">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const newDays = schedule.days.includes(index)
                              ? schedule.days.filter(d => d !== index)
                              : [...schedule.days, index];
                            setSchedule(prev => ({ ...prev, days: newDays }));
                          }}
                          className={`p-2 text-xs rounded ${
                            schedule.days.includes(index)
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleScheduleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 듀얼타임 설정 모달 */}
      {showDualTimeModal && config.hasDualTime && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {config.displayName} 듀얼타임 설정
              </h3>
              <button
                onClick={() => setShowDualTimeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={dualTime.enabled}
                  onChange={(e) => setDualTime(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">듀얼타임 활성화</label>
              </div>

              {dualTime.enabled && (
                <>
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">1차 운영 시간</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="time"
                        value={dualTime.time1.start}
                        onChange={(e) => setDualTime(prev => ({ 
                          ...prev, 
                          time1: { ...prev.time1, start: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="time"
                        value={dualTime.time1.end}
                        onChange={(e) => setDualTime(prev => ({ 
                          ...prev, 
                          time1: { ...prev.time1, end: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">2차 운영 시간</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="time"
                        value={dualTime.time2.start}
                        onChange={(e) => setDualTime(prev => ({ 
                          ...prev, 
                          time2: { ...prev.time2, start: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="time"
                        value={dualTime.time2.end}
                        onChange={(e) => setDualTime(prev => ({ 
                          ...prev, 
                          time2: { ...prev.time2, end: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">운영 요일</label>
                    <div className="grid grid-cols-7 gap-1">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const newDays = dualTime.days.includes(index)
                              ? dualTime.days.filter(d => d !== index)
                              : [...dualTime.days, index];
                            setDualTime(prev => ({ ...prev, days: newDays }));
                          }}
                          className={`p-2 text-xs rounded ${
                            dualTime.days.includes(index)
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDualTimeModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDualTimeSave}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { ACTUATOR_CONFIGS };

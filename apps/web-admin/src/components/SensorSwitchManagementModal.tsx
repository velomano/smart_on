import React, { useState } from 'react';
import { TierSensor, ControlSwitch } from '../lib/bedSystemArchitecture';

interface SensorSwitchManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'sensor' | 'switch';
  tierNumber?: number;
  onAddSensor?: (sensor: Omit<TierSensor, 'lastReading'>) => void;
  onAddSwitch?: (switch: Omit<ControlSwitch, 'lastCommand'>) => void;
}

export default function SensorSwitchManagementModal({
  isOpen,
  onClose,
  mode,
  tierNumber,
  onAddSensor,
  onAddSwitch
}: SensorSwitchManagementModalProps) {
  const [sensorData, setSensorData] = useState({
    sensorId: '',
    sensorType: 'temperature' as TierSensor['sensorType'],
    isActive: true
  });

  const [switchData, setSwitchData] = useState({
    switchId: '',
    switchName: '',
    switchType: 'pump' as ControlSwitch['switchType'],
    isActive: true
  });

  const sensorTypes = [
    { value: 'temperature', label: '온도', icon: '🌡️' },
    { value: 'humidity', label: '습도', icon: '💧' },
    { value: 'ec', label: 'EC', icon: '⚡' },
    { value: 'ph', label: 'pH', icon: '🧪' },
    { value: 'lux', label: '조도', icon: '☀️' },
    { value: 'water_temp', label: '수온', icon: '🌊' }
  ];

  const switchTypes = [
    { value: 'pump', label: '펌프', icon: '💧' },
    { value: 'led', label: 'LED', icon: '💡' },
    { value: 'fan', label: '팬', icon: '🌀' },
    { value: 'heater', label: '히터', icon: '🔥' },
    { value: 'nutrient', label: '양액기', icon: '🧪' },
    { value: 'custom', label: '사용자 정의', icon: '⚙️' }
  ];

  const handleSubmit = () => {
    if (mode === 'sensor') {
      if (!sensorData.sensorId.trim()) {
        alert('센서 ID를 입력해주세요.');
        return;
      }
      
      onAddSensor?.({
        tierNumber: tierNumber || 1,
        sensorId: sensorData.sensorId,
        sensorType: sensorData.sensorType,
        mqttTopic: '', // 실제로는 생성 함수에서 처리
        isActive: sensorData.isActive
      });
    } else {
      if (!switchData.switchId.trim() || !switchData.switchName.trim()) {
        alert('스위치 ID와 이름을 입력해주세요.');
        return;
      }
      
      onAddSwitch?.({
        switchId: switchData.switchId,
        switchName: switchData.switchName,
        switchType: switchData.switchType,
        mqttTopic: '', // 실제로는 생성 함수에서 처리
        isActive: switchData.isActive,
        currentState: 'off'
      });
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* 모달창 */}
      <div className="relative bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {mode === 'sensor' ? '센서 추가' : '제어 스위치 추가'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {mode === 'sensor' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  단 번호
                </label>
                <div className="bg-gray-100 rounded-lg p-3 text-gray-700">
                  {tierNumber}단
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  센서 ID *
                </label>
                <input
                  type="text"
                  value={sensorData.sensorId}
                  onChange={(e) => setSensorData(prev => ({ ...prev, sensorId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="예: temp_001, hum_001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  센서 유형 *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sensorTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSensorData(prev => ({ ...prev, sensorType: type.value as TierSensor['sensorType'] }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        sensorData.sensorType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl block mb-1">{type.icon}</span>
                        <span className="text-sm font-medium text-gray-800">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'switch' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  스위치 ID *
                </label>
                <input
                  type="text"
                  value={switchData.switchId}
                  onChange={(e) => setSwitchData(prev => ({ ...prev, switchId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="예: pump_001, led_001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  스위치 이름 *
                </label>
                <input
                  type="text"
                  value={switchData.switchName}
                  onChange={(e) => setSwitchData(prev => ({ ...prev, switchName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="예: 양액 펌프, LED 조명"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  스위치 유형 *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {switchTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSwitchData(prev => ({ ...prev, switchType: type.value as ControlSwitch['switchType'] }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        switchData.switchType === type.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl block mb-1">{type.icon}</span>
                        <span className="text-sm font-medium text-gray-800">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 활성화 상태 */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={mode === 'sensor' ? sensorData.isActive : switchData.isActive}
              onChange={(e) => {
                if (mode === 'sensor') {
                  setSensorData(prev => ({ ...prev, isActive: e.target.checked }));
                } else {
                  setSwitchData(prev => ({ ...prev, isActive: e.target.checked }));
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              즉시 활성화
            </label>
          </div>

          {/* MQTT 토픽 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">MQTT 토픽 미리보기</h4>
            <div className="text-xs text-gray-600 font-mono bg-white rounded p-2 border">
              {mode === 'sensor' 
                ? `farm_a/bed_1/tier_${tierNumber}/${sensorData.sensorType}`
                : `farm_a/bed_1/control/${switchData.switchId}`
              }
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 pt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors ${
              mode === 'sensor' 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

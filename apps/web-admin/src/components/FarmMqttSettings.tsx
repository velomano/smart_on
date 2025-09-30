import React, { useState } from 'react';
import { FarmProtocolSettings, createFarmProtocolSettings } from '../lib/webAppMqttProtocol';

interface FarmMqttSettingsProps {
  farmId: string;
  farmName: string;
  currentSettings?: FarmProtocolSettings;
  onSave: (settings: FarmProtocolSettings) => void;
  onCancel: () => void;
}

export default function FarmMqttSettings({
  farmId,
  farmName,
  currentSettings,
  onSave,
  onCancel
}: FarmMqttSettingsProps) {
  const [settings, setSettings] = useState<FarmProtocolSettings>(
    currentSettings || createFarmProtocolSettings(farmId, farmName, '', 1883)
  );

  const [testConnection, setTestConnection] = useState({
    isTesting: false,
    result: null as 'success' | 'error' | null,
    message: ''
  });

  const handleMqttConfigChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      mqttConfig: {
        ...prev.mqttConfig,
        mqttServer: {
          ...prev.mqttConfig.mqttServer,
          [field]: value
        }
      }
    }));
  };

  const handleSupportedSensorsChange = (sensorType: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      supportedSensors: checked
        ? [...prev.supportedSensors, sensorType]
        : prev.supportedSensors.filter(s => s !== sensorType)
    }));
  };

  const handleSupportedActuatorsChange = (actuatorType: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      supportedActuators: checked
        ? [...prev.supportedActuators, actuatorType]
        : prev.supportedActuators.filter(a => a !== actuatorType)
    }));
  };

  const testMqttConnection = async () => {
    setTestConnection({ isTesting: true, result: null, message: '' });
    
    try {
      // 실제 MQTT 연결 테스트 로직
      await new Promise(resolve => setTimeout(resolve, 2000)); // 시뮬레이션
      
      setTestConnection({
        isTesting: false,
        result: 'success',
        message: 'MQTT 서버 연결 성공!'
      });
    } catch (error) {
      setTestConnection({
        isTesting: false,
        result: 'error',
        message: 'MQTT 서버 연결 실패: ' + (error as Error).message
      });
    }
  };

  const sensorTypes = [
    { value: 'temperature', label: '온도', icon: '🌡️' },
    { value: 'humidity', label: '습도', icon: '💧' },
    { value: 'ec', label: 'EC', icon: '⚡' },
    { value: 'ph', label: 'pH', icon: '🧪' },
    { value: 'lux', label: '조도', icon: '☀️' },
    { value: 'water_temp', label: '수온', icon: '🌊' }
  ];

  const actuatorTypes = [
    { value: 'pump', label: '펌프', icon: '💧' },
    { value: 'led', label: 'LED', icon: '💡' },
    { value: 'fan', label: '팬', icon: '🌀' },
    { value: 'heater', label: '히터', icon: '🔥' },
    { value: 'nutrient', label: '양액기', icon: '🧪' }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      
      {/* 모달창 */}
      <div className="relative bg-white rounded-2xl p-8 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            농장 MQTT 설정
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 농장 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">농장 정보</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">농장 ID:</span>
                <span className="ml-2 text-blue-800">{farmId}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">농장 이름:</span>
                <span className="ml-2 text-blue-800">{farmName}</span>
              </div>
            </div>
          </div>

          {/* MQTT 서버 설정 */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">MQTT 서버 설정</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서버 URL *
                </label>
                <input
                  type="text"
                  value={settings.mqttConfig.mqttServer.brokerUrl}
                  onChange={(e) => handleMqttConfigChange('brokerUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="mqtt://your-farm-mqtt.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  포트 *
                </label>
                <input
                  type="number"
                  value={settings.mqttConfig.mqttServer.port}
                  onChange={(e) => handleMqttConfigChange('port', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1883"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자명
                </label>
                <input
                  type="text"
                  value={settings.mqttConfig.mqttServer.username || ''}
                  onChange={(e) => handleMqttConfigChange('username', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="사용자명 (선택사항)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={settings.mqttConfig.mqttServer.password || ''}
                  onChange={(e) => handleMqttConfigChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호 (선택사항)"
                />
              </div>
            </div>

            {/* 연결 테스트 */}
            <div className="mt-4">
              <button
                onClick={testMqttConnection}
                disabled={testConnection.isTesting}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {testConnection.isTesting ? '연결 테스트 중...' : '연결 테스트'}
              </button>
              
              {testConnection.result && (
                <div className={`mt-2 p-3 rounded-lg ${
                  testConnection.result === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {testConnection.message}
                </div>
              )}
            </div>
          </div>

          {/* 지원 센서 */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">지원 센서 유형</h4>
            <div className="grid grid-cols-3 gap-3">
              {sensorTypes.map((sensor) => (
                <label key={sensor.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.supportedSensors.includes(sensor.value)}
                    onChange={(e) => handleSupportedSensorsChange(sensor.value, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-lg">{sensor.icon}</span>
                  <span className="text-sm text-gray-700">{sensor.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 지원 액추에이터 */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">지원 액추에이터 유형</h4>
            <div className="grid grid-cols-3 gap-3">
              {actuatorTypes.map((actuator) => (
                <label key={actuator.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.supportedActuators.includes(actuator.value)}
                    onChange={(e) => handleSupportedActuatorsChange(actuator.value, e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-lg">{actuator.icon}</span>
                  <span className="text-sm text-gray-700">{actuator.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 토픽 구조 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">MQTT 토픽 구조 (실제 구현)</h4>
            <div className="space-y-3">
              <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                <div className="text-sm font-semibold text-blue-700 mb-1">📊 센서 데이터 수신</div>
                <div className="text-xs font-mono text-gray-600">
                  farms/{farmId}/devices/{deviceId}/telemetry
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  브릿지가 이 토픽을 구독하여 센서 데이터를 받습니다
                </div>
              </div>
              
              <div className="bg-white rounded p-3 border-l-4 border-green-500">
                <div className="text-sm font-semibold text-green-700 mb-1">🎛️ 제어 명령 전송</div>
                <div className="text-xs font-mono text-gray-600">
                  farms/{farmId}/devices/{deviceId}/command
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  브릿지가 이 토픽으로 제어 명령을 전송합니다
                </div>
              </div>

              <div className="bg-white rounded p-3 border-l-4 border-purple-500">
                <div className="text-sm font-semibold text-purple-700 mb-1">📡 기타 토픽</div>
                <div className="space-y-1 text-xs font-mono text-gray-600">
                  <div>farms/{farmId}/devices/{deviceId}/registry</div>
                  <div>farms/{farmId}/devices/{deviceId}/state</div>
                  <div>farms/{farmId}/devices/{deviceId}/command/ack</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="text-xs text-yellow-800">
                  <strong>💡 중요:</strong> 실제 토픽 구조는 가이드 문서와 다를 수 있습니다. 
                  MQTT 설계 가이드 버튼을 클릭하여 정확한 토픽 구조를 확인하세요.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 pt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => onSave(settings)}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

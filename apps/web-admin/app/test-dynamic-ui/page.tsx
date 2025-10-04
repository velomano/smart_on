'use client';

import React, { useState, useEffect } from 'react';
import { 
  DynamicDevicePanel, 
  DeviceInfo, 
  SensorData, 
  ActuatorData,
  createMockDevice,
  createMockSensorData,
  createMockActuatorData
} from '@/components/dynamic-ui';

export default function TestDynamicUIPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [sensorData, setSensorData] = useState<Record<string, SensorData>>({});
  const [actuatorData, setActuatorData] = useState<Record<string, ActuatorData>>({});

  // 목 디바이스 생성
  useEffect(() => {
    const mockDevices = [
      createMockDevice('device-1', '베드-1 센서 게이트웨이', 'sensor_gateway'),
      createMockDevice('device-2', '베드-2 액추에이터 컨트롤러', 'actuator_controller'),
      createMockDevice('device-3', '베드-3 통합 디바이스', 'mixed'),
    ];

    setDevices(mockDevices);

    // 목 센서 데이터 생성
    const mockSensorData: Record<string, SensorData> = {};
    const mockActuatorData: Record<string, ActuatorData> = {};

    mockDevices.forEach(device => {
      device.sensors?.forEach(sensor => {
        mockSensorData[sensor.id] = createMockSensorData(sensor.type);
      });
      device.actuators?.forEach(actuator => {
        mockActuatorData[actuator.id] = createMockActuatorData(actuator.type);
      });
    });

    setSensorData(mockSensorData);
    setActuatorData(mockActuatorData);
  }, []);

  // 실시간 데이터 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => {
        const newData = { ...prev };
        Object.keys(newData).forEach(sensorId => {
          // 센서 타입 찾기
          const sensorType = Object.keys(newData).find(id => id === sensorId)?.split('_')[2] || 'temperature';
          newData[sensorId] = createMockSensorData(sensorType);
        });
        return newData;
      });

      setActuatorData(prev => {
        const newData = { ...prev };
        Object.keys(newData).forEach(actuatorId => {
          // 액추에이터 타입 찾기
          const actuatorType = Object.keys(newData).find(id => id === actuatorId)?.split('_')[2] || 'led';
          newData[actuatorId] = createMockActuatorData(actuatorType);
        });
        return newData;
      });
    }, 3000); // 3초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 이벤트 핸들러들
  const handleSensorTargetChange = (deviceId: string, sensorType: string, targetRange: { min: number; max: number }) => {
    console.log('센서 목표값 변경:', { deviceId, sensorType, targetRange });
    // 실제 구현에서는 API 호출
  };

  const handleActuatorStatusChange = (deviceId: string, actuatorType: string, status: 'on' | 'off') => {
    console.log('액추에이터 상태 변경:', { deviceId, actuatorType, status });
    // 실제 구현에서는 API 호출
  };

  const handleActuatorModeChange = (deviceId: string, actuatorType: string, mode: 'manual' | 'auto' | 'schedule') => {
    console.log('액추에이터 모드 변경:', { deviceId, actuatorType, mode });
    // 실제 구현에서는 API 호출
  };

  const handleActuatorValueChange = (deviceId: string, actuatorType: string, value: number) => {
    console.log('액추에이터 값 변경:', { deviceId, actuatorType, value });
    // 실제 구현에서는 API 호출
  };

  const handleActuatorScheduleChange = (deviceId: string, actuatorType: string, schedule: any) => {
    console.log('액추에이터 스케줄 변경:', { deviceId, actuatorType, schedule });
    // 실제 구현에서는 API 호출
  };

  const handleActuatorDualTimeChange = (deviceId: string, actuatorType: string, dualTime: any) => {
    console.log('액추에이터 듀얼타임 변경:', { deviceId, actuatorType, dualTime });
    // 실제 구현에서는 API 호출
  };

  const handleSensorChartClick = (deviceId: string, sensorType: string) => {
    console.log('센서 차트 클릭:', { deviceId, sensorType });
    // 실제 구현에서는 차트 모달 열기
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 다이나믹 UI 테스트 페이지
          </h1>
          <p className="text-gray-600">
            공용 센서/액추에이터 컴포넌트의 동적 렌더링을 테스트합니다.
          </p>
        </div>

        {/* 디바이스 목록 */}
        <div className="space-y-6">
          {devices.map(device => (
            <DynamicDevicePanel
              key={device.id}
              device={device}
              sensorData={sensorData}
              actuatorData={actuatorData}
              onSensorTargetChange={handleSensorTargetChange}
              onActuatorStatusChange={handleActuatorStatusChange}
              onActuatorModeChange={handleActuatorModeChange}
              onActuatorValueChange={handleActuatorValueChange}
              onActuatorScheduleChange={handleActuatorScheduleChange}
              onActuatorDualTimeChange={handleActuatorDualTimeChange}
              onSensorChartClick={handleSensorChartClick}
            />
          ))}
        </div>

        {/* 정보 패널 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 테스트 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">디바이스 정보</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 총 {devices.length}개 디바이스</li>
                <li>• 센서 게이트웨이: {devices.filter(d => d.type === 'sensor_gateway').length}개</li>
                <li>• 액추에이터 컨트롤러: {devices.filter(d => d.type === 'actuator_controller').length}개</li>
                <li>• 통합 디바이스: {devices.filter(d => d.type === 'mixed').length}개</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">데이터 정보</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 센서 데이터: {Object.keys(sensorData).length}개</li>
                <li>• 액추에이터 데이터: {Object.keys(actuatorData).length}개</li>
                <li>• 실시간 업데이트: 3초 간격</li>
                <li>• 목 데이터 자동 생성</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 사용법 가이드 */}
        <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 사용법</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• 디바이스 헤더를 클릭하여 센서/액추에이터 패널을 확장/축소할 수 있습니다.</p>
            <p>• 센서 카드의 "목표값 설정" 버튼으로 목표 범위를 조정할 수 있습니다.</p>
            <p>• 액추에이터 카드에서 ON/OFF, 모드 변경, 밝기/속도 조절이 가능합니다.</p>
            <p>• 스케줄 및 듀얼타임 설정 기능을 테스트할 수 있습니다.</p>
            <p>• 모든 변경사항은 콘솔에 로그로 출력됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

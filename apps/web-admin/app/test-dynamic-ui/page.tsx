'use client';

import React, { useState, useEffect } from 'react';
import { 
  DynamicDevicePanel, 
  DeviceInfo, 
  SensorData, 
  ActuatorData,
  createMockDevice,
  createDynamicDevice,
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
      // 알 수 없는 디바이스 타입 예시 (이름 기반 추론 테스트)
      createDynamicDevice(
        'device-4', 
        '베드-4 커스텀 디바이스', 
        'custom_sensor_controller',
        [
          { type: 'soil_moisture', unit: '%', name: '토양 수분 센서' },
          { type: 'air_quality', unit: 'ppm', name: '공기질 측정기' },
          { type: 'wind_speed', unit: 'm/s', name: '풍속 측정기' },
          { type: 'unknown_sensor', unit: 'unit', name: '온도 측정기' }, // 이름으로 추론
          { type: 'custom_ph', unit: 'pH', name: '산성도 센서' } // 이름으로 추론
        ],
        [
          { type: 'sprinkler', name: '스프링클러 시스템' },
          { type: 'ventilation_fan', name: '환기팬 컨트롤러' },
          { type: 'unknown_actuator', name: 'LED 조명 시스템' }, // 이름으로 추론
          { type: 'custom_pump', name: '급수 펌프' } // 이름으로 추론
        ]
      )
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

  const handleActuatorStatusChange = async (deviceId: string, actuatorType: string, status: 'on' | 'off') => {
    console.log('액추에이터 상태 변경:', { deviceId, actuatorType, status });
    
    try {
      // 실제 API 호출
      const response = await fetch(`/api/farms/test-dynamic-ui/actuators/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          actuatorType: actuatorType,
          action: status,
          value: status === 'on' ? 100 : 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('액추에이터 제어 성공:', result);
        
        // 로컬 상태 업데이트
        setActuatorData(prev => ({
          ...prev,
          [actuatorType]: { ...prev[actuatorType], status: status }
        }));
      } else {
        console.error('액추에이터 제어 실패:', response.status);
      }
    } catch (error) {
      console.error('액추에이터 제어 오류:', error);
    }
  };

  const handleActuatorModeChange = async (deviceId: string, actuatorType: string, mode: 'manual' | 'auto' | 'schedule') => {
    console.log('액추에이터 모드 변경:', { deviceId, actuatorType, mode });
    
    try {
      // 모드 변경 API 호출
      const response = await fetch(`/api/farms/test-dynamic-ui/actuators/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          actuatorType: actuatorType,
          action: 'mode',
          mode: mode
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('액추에이터 모드 변경 성공:', result);
        
        // 로컬 상태 업데이트
        setActuatorData(prev => ({
          ...prev,
          [actuatorType]: { ...prev[actuatorType], mode: mode }
        }));
      } else {
        console.error('액추에이터 모드 변경 실패:', response.status);
      }
    } catch (error) {
      console.error('액추에이터 모드 변경 오류:', error);
    }
  };

  const handleActuatorValueChange = async (deviceId: string, actuatorType: string, value: number) => {
    console.log('액추에이터 값 변경:', { deviceId, actuatorType, value });
    
    try {
      // 값 변경 API 호출
      const response = await fetch(`/api/farms/test-dynamic-ui/actuators/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          actuatorType: actuatorType,
          action: 'set',
          value: value
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('액추에이터 값 변경 성공:', result);
        
        // 로컬 상태 업데이트
        setActuatorData(prev => ({
          ...prev,
          [actuatorType]: { ...prev[actuatorType], value: value }
        }));
      } else {
        console.error('액추에이터 값 변경 실패:', response.status);
      }
    } catch (error) {
      console.error('액추에이터 값 변경 오류:', error);
    }
  };

  const handleActuatorScheduleChange = async (deviceId: string, actuatorType: string, schedule: any) => {
    console.log('액추에이터 스케줄 변경:', { deviceId, actuatorType, schedule });
    
    try {
      // 스케줄 변경 API 호출
      const response = await fetch(`/api/farms/test-dynamic-ui/actuators/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          actuatorType: actuatorType,
          action: 'schedule',
          schedule: schedule
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('액추에이터 스케줄 변경 성공:', result);
      } else {
        console.error('액추에이터 스케줄 변경 실패:', response.status);
      }
    } catch (error) {
      console.error('액추에이터 스케줄 변경 오류:', error);
    }
  };

  const handleActuatorDualTimeChange = async (deviceId: string, actuatorType: string, dualTime: any) => {
    console.log('액추에이터 듀얼타임 변경:', { deviceId, actuatorType, dualTime });
    
    try {
      // 듀얼타임 변경 API 호출
      const response = await fetch(`/api/farms/test-dynamic-ui/actuators/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          actuatorType: actuatorType,
          action: 'dual_time',
          dualTime: dualTime
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('액추에이터 듀얼타임 변경 성공:', result);
      } else {
        console.error('액추에이터 듀얼타임 변경 실패:', response.status);
      }
    } catch (error) {
      console.error('액추에이터 듀얼타임 변경 오류:', error);
    }
  };

  const handleSensorChartClick = (deviceId: string, sensorType: string) => {
    console.log('센서 차트 클릭:', { deviceId, sensorType });
    
    // 차트 모달 열기 (간단한 구현)
    const chartData = {
      deviceId,
      sensorType,
      title: `${sensorType} 상세 차트`,
      data: Array.from({ length: 24 }, (_, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        value: 20 + Math.sin(i * 0.5) * 10 + Math.random() * 5
      }))
    };
    
    console.log('차트 데이터:', chartData);
    alert(`📊 ${sensorType} 차트 모달\n\n24시간 데이터:\n${chartData.data.slice(0, 5).map(d => `${d.time}: ${d.value.toFixed(1)}`).join('\n')}\n...`);
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
                <li>• 커스텀 디바이스: {devices.filter(d => d.sensors?.some(s => !['temperature', 'humidity', 'ec', 'ph'].includes(s.type)) || d.actuators?.some(a => !['led', 'pump', 'fan'].includes(a.type))).length}개</li>
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
            <p>• <strong>베드-4 커스텀 디바이스</strong>에서 이름 기반 센서/액추에이터 타입 추론 확인 가능</p>
            <p>• <strong>예시:</strong> "온도 측정기" → 온도 센서, "LED 조명 시스템" → LED 액추에이터</p>
            <p>• <strong>실제 API 연동:</strong> 액추에이터 ON/OFF, 모드 변경, 값 조절이 실제 API를 호출합니다</p>
            <p>• <strong>스케줄/듀얼타임:</strong> 설정 가능하지만 현재는 로그만 출력됩니다</p>
            <p>• <strong>슬라이더 제어:</strong> LED(밝기), 펌프/팬(속도)만 지원됩니다</p>
            <p>• <strong>차트 기능:</strong> 센서 카드의 "상세 차트 보기" 버튼으로 테스트 가능</p>
            <p>• 모든 변경사항은 콘솔에 로그로 출력됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

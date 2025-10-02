// IoT Designer 메인 페이지
'use client';

import { useState, useEffect, useMemo } from 'react';
import { allocatePins } from '@/components/iot-designer/PinAllocator';
import { calculatePowerRequirements, suggestPowerSupplies } from '@/components/iot-designer/PowerEstimator';
import SchematicSVG from '@/components/iot-designer/SchematicSVG';
import CodePreview from '@/components/iot-designer/CodePreview';
import { QRCodeCard } from '@/components/connect/QRCodeCard';
import { LiveLog } from '@/components/connect/LiveLog';
import toast, { Toaster } from 'react-hot-toast';

interface SystemSpec {
  device: string;
  protocol: 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
}

type DesignStep = 'design' | 'connect' | 'monitor';

export default function IoTDesignerPage() {
  const [currentStep, setCurrentStep] = useState<DesignStep>('design');
  const [spec, setSpec] = useState<SystemSpec>({
    device: 'esp32',
    protocol: 'http',
    sensors: [],
    controls: [],
    wifi: {
      ssid: '',
      password: ''
    }
  });
  
  const [generatedCode, setGeneratedCode] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // 핀 할당 및 전원 계산 (동적으로 업데이트)
  const allocation = useMemo(() => {
    console.log('🔄 핀 할당 재계산:', spec);
    return allocatePins({
      device: spec.device,
      sensors: spec.sensors,
      controls: spec.controls
    });
  }, [spec.device, spec.sensors, spec.controls]);
  
  const powerRequirements = useMemo(() => {
    console.log('⚡ 전원 요구사항 재계산:', spec);
    return calculatePowerRequirements(spec);
  }, [spec.sensors, spec.controls]);
  
  const powerSuggestions = useMemo(() => {
    return suggestPowerSupplies(powerRequirements);
  }, [powerRequirements]);
  
  
  // 통합된 코드 생성 및 연결 시작
  const generateCodeAndConnect = async () => {
    try {
      // 1. Universal Bridge에서 Setup Token 발급
      const tokenResponse = await fetch('http://localhost:3001/api/provisioning/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: '00000000-0000-0000-0000-000000000001', // 기본 테넌트 ID
          farm_id: null,
          ttl: 3600, // 1시간
          device_type: `${spec.device}-${spec.protocol}`,
          capabilities: [...spec.sensors.map(s => s.type), ...spec.controls.map(c => c.type)]
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Setup Token 발급 실패');
      }
      
      const tokenData = await tokenResponse.json();
      const token = tokenData.setup_token;
      setSetupToken(token);
      
      // 2. 통합된 코드 생성 API 사용
      const response = await fetch('/api/iot/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: spec.device,
          protocol: spec.protocol,
          sensors: spec.sensors,
          controls: spec.controls,
          wifi: spec.wifi,
          allocation: allocation,
          bridgeIntegration: true,
          setupToken: token // Setup Token 포함
        })
      });
      
      if (response.ok) {
        const code = await response.text();
        setGeneratedCode(code);
        
        // 3. 연결 단계로 이동 (다운로드 없이)
        setCurrentStep('connect');
        toast.success('코드 생성 완료! 이제 디바이스를 연결하세요.');
      } else {
        throw new Error('코드 생성 API 호출 실패');
      }
      
    } catch (error) {
      console.error('코드 생성 오류:', error);
      toast.error('코드 생성 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // 코드 다운로드
  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iot_system.ino';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Container */}
        <Toaster position="top-center" />
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚡ 빠른 IoT 빌더</h1>
          <p className="text-gray-900 font-medium">빠르고 간편하게 IoT 시스템을 설계하고 자동으로 연결하세요</p>
          
          {/* 단계 표시기 - 클릭 가능 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentStep('design')}
                className={`flex items-center ${currentStep === 'design' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'design' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}>
                  1
                </div>
                <span className="ml-2 font-medium">디자인</span>
              </button>
              <div className="flex-1 h-1 bg-gray-200 mx-4" />
              <button 
                onClick={() => setCurrentStep('connect')}
                className={`flex items-center ${currentStep === 'connect' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                disabled={!generatedCode && currentStep !== 'connect'}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'connect' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} transition-colors ${!generatedCode && currentStep !== 'connect' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  2
                </div>
                <span className="ml-2 font-medium">연결</span>
              </button>
              <div className="flex-1 h-1 bg-gray-200 mx-4" />
              <button 
                onClick={() => setCurrentStep('monitor')}
                className={`flex items-center ${currentStep === 'monitor' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                disabled={!generatedCode && currentStep !== 'monitor'}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'monitor' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} transition-colors ${!generatedCode && currentStep !== 'monitor' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  3
                </div>
                <span className="ml-2 font-medium">모니터링</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 단계별 컨텐츠 */}
        {currentStep === 'design' && (
          <>
        
        {/* 2. 시스템 설정 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">⚙️ 시스템 설정</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">디바이스</label>
              <select
                value={spec.device}
                onChange={(e) => setSpec(prev => ({ ...prev, device: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="esp32">ESP32</option>
                <option value="esp8266">ESP8266</option>
                <option value="arduino_uno">Arduino Uno</option>
                <option value="arduino_r4">Arduino R4</option>
                <option value="raspberry_pi5">Raspberry Pi 5</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">통신 프로토콜</label>
              <select
                value={spec.protocol}
                onChange={(e) => setSpec(prev => ({ ...prev, protocol: e.target.value as 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485' }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="http">HTTP</option>
                <option value="mqtt">MQTT</option>
                <option value="websocket">WebSocket</option>
                <option value="webhook">Webhook</option>
                <option value="serial">Serial</option>
                <option value="ble">Bluetooth LE</option>
                <option value="rs485">RS-485 (Modbus RTU)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* 2.5. WiFi 설정 안내 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">📶 WiFi 설정</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-blue-600 mr-3 text-xl">🔒</span>
            <div>
                <h4 className="font-semibold text-blue-800 mb-2">보안을 위한 WiFi 설정 안내</h4>
                <p className="text-blue-700 text-sm mb-3">
                  WiFi 비밀번호는 보안상 코드에 포함되지 않습니다. 
                  생성된 코드를 다운로드한 후 다음 부분을 직접 수정해주세요:
                </p>
                <div className="bg-gray-100 p-3 rounded border-l-4 border-blue-500">
                  <code className="text-sm text-gray-800">
                    const char* ssid = "YOUR_WIFI_SSID";<br/>
                    const char* password = "YOUR_WIFI_PASSWORD";
                  </code>
            </div>
                <p className="text-blue-700 text-xs mt-2">
                  💡 <strong>예시:</strong> ssid = "MyHomeWiFi", password = "mypassword123"
                </p>
                      </div>
                    </div>
              </div>
            </div>
        
        {/* 3. 센서/제어 선택 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">📊 센서 및 제어 장치</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">센서</h4>
              
              {/* 센서 추가 버튼 */}
              <div className="mb-4">
                <select
                  value="" // 항상 빈 값으로 초기화
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    if (selectedValue && selectedValue.trim() !== '') {
                      console.log(`➕ 센서 추가: "${selectedValue}"`);
                      setSpec(prev => {
                        const newSpec = {
                        ...prev,
                          sensors: [...prev.sensors, { type: selectedValue, count: 1 }]
                        };
                        console.log('🔄 새로운 센서 목록:', newSpec.sensors);
                        return newSpec;
                      });
                      // select 값을 강제로 빈 값으로 리셋
                      setTimeout(() => {
                        e.target.value = '';
                      }, 0);
                    }
                  }}
                  className="w-full p-2 border rounded-lg mb-2"
                >
                  <option value="">센서 선택...</option>
                  <option value="dht22">DHT22 (온도/습도)</option>
                  <option value="ds18b20">DS18B20 (온도)</option>
                  <option value="bh1750">BH1750 (조도)</option>
                  <option value="soil_moisture">토양 수분</option>
                  <option value="ph_sensor">pH 센서</option>
                  <option value="co2_sensor">CO2 센서</option>
                  <option value="pressure_sensor">압력 센서</option>
                  <option value="motion_sensor">PIR 모션 센서</option>
                  <option value="water_level">수위 센서</option>
                  <option value="camera">카메라 모듈</option>
                </select>
              </div>
              
              {/* 센서 목록 */}
              <div className="space-y-2">
                {spec.sensors.map((sensor, idx) => {
                  console.log(`🔍 센서 목록 렌더링: ${sensor.type} (${sensor.count}개)`, sensor);
                  const sensorNames: Record<string, string> = {
                    'dht22': 'DHT22 (온도/습도)',
                    'ds18b20': 'DS18B20 (온도)',
                    'bh1750': 'BH1750 (조도)',
                    'soil_moisture': '토양 수분 센서',
                    'ph_sensor': 'pH 센서',
                    'co2_sensor': 'CO2 센서',
                    'pressure_sensor': '압력 센서',
                    'motion_sensor': 'PIR 모션 센서',
                    'water_level': '수위 센서',
                    'camera': '카메라 모듈'
                  };
                  
                  return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">{sensorNames[sensor.type] || sensor.type}</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={sensor.count}
                        onChange={(e) => setSpec(prev => ({
                          ...prev,
                          sensors: prev.sensors.map((s, i) => 
                            i === idx ? { ...s, count: parseInt(e.target.value) || 1 } : s
                          )
                        }))}
                          className="w-16 p-1 border rounded text-center"
                      />
                      <span className="text-sm text-gray-900">개</span>
                    </div>
                    <button
                      onClick={() => setSpec(prev => ({
                        ...prev,
                        sensors: prev.sensors.filter((_, i) => i !== idx)
                      }))}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      ✕
                    </button>
                  </div>
                  );
                })}
                {spec.sensors.length === 0 && (
                  <div className="text-gray-900 text-sm text-center py-4">
                    센서를 선택해주세요
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">제어 장치</h4>
              
              {/* 제어장치 추가 버튼 */}
              <div className="mb-4">
                <select
                  value="" // 항상 빈 값으로 초기화
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    if (selectedValue && selectedValue.trim() !== '') {
                      console.log(`➕ 제어장치 추가: "${selectedValue}"`);
                      setSpec(prev => {
                        const newSpec = {
                        ...prev,
                          controls: [...prev.controls, { type: selectedValue, count: 1 }]
                        };
                        console.log('🔄 새로운 제어장치 목록:', newSpec.controls);
                        return newSpec;
                      });
                      // select 값을 강제로 빈 값으로 리셋
                      setTimeout(() => {
                        e.target.value = '';
                      }, 0);
                    }
                  }}
                  className="w-full p-2 border rounded-lg mb-2"
                >
                  <option value="">제어장치 선택...</option>
                  <option value="relay">릴레이</option>
                  <option value="dc_fan_pwm">DC 팬 (PWM)</option>
                  <option value="servo">서보</option>
                  <option value="led_strip">LED 스트립</option>
                  <option value="solenoid_valve">솔레노이드 밸브</option>
                  <option value="stepper_motor">스테퍼 모터</option>
                  <option value="water_pump">워터 펌프</option>
                  <option value="heater">히터</option>
                  <option value="buzzer">부저</option>
                  <option value="lcd_display">LCD 디스플레이</option>
                </select>
              </div>
              
              {/* 제어장치 목록 */}
              <div className="space-y-2">
                {spec.controls.map((control, idx) => {
                  const controlNames: Record<string, string> = {
                    'relay': '릴레이',
                    'dc_fan_pwm': 'DC 팬 (PWM)',
                    'servo': '서보 모터',
                    'led_strip': 'LED 스트립',
                    'solenoid_valve': '솔레노이드 밸브',
                    'stepper_motor': '스테퍼 모터',
                    'water_pump': '워터 펌프',
                    'heater': '히터',
                    'buzzer': '부저',
                    'lcd_display': 'LCD 디스플레이'
                  };
                  
                  return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">{controlNames[control.type] || control.type}</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={control.count}
                        onChange={(e) => setSpec(prev => ({
                          ...prev,
                          controls: prev.controls.map((c, i) => 
                            i === idx ? { ...c, count: parseInt(e.target.value) || 1 } : c
                          )
                        }))}
                          className="w-16 p-1 border rounded text-center"
                      />
                      <span className="text-sm text-gray-900">개</span>
                    </div>
                    <button
                      onClick={() => setSpec(prev => ({
                        ...prev,
                        controls: prev.controls.filter((_, i) => i !== idx)
                      }))}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      ✕
                    </button>
                  </div>
                  );
                })}
                {spec.controls.length === 0 && (
                  <div className="text-gray-900 text-sm text-center py-4">
                    제어장치를 선택해주세요
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 4. 핀 할당 및 충돌 검사 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">🔌 핀 할당</h3>
          
          {allocation.conflicts.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">⚠️ 핀 충돌</h4>
              <ul className="list-disc list-inside text-red-700">
                {allocation.conflicts.map((conflict, idx) => (
                  <li key={idx}>{conflict}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">할당된 핀</h4>
              <div className="space-y-2">
                {Object.entries(allocation.assigned).map(([device, pins]) => (
                  <div key={device} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">{device}</div>
                    <div className="text-sm text-gray-600">
                      {pins.map((pin, idx) => (
                        <span key={idx}>{pin.role}: {pin.pin}{idx < pins.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">사용 가능한 핀</h4>
              <div className="flex flex-wrap gap-2">
                {allocation.sparePins.map(pin => (
                  <span key={pin} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {pin}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 5. 전원 요구사항 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">⚡ 전원 요구사항</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">전원 요구량</h4>
              <div className="space-y-2">
                {powerRequirements.map((req, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium">{req.voltage}V</div>
                    <div className="text-sm text-gray-600">최소 {req.minCurrentA}A</div>
                    <div className="text-xs text-gray-900">
                      {req.devices.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">전원 공급 제안</h4>
              <div className="space-y-2">
                {powerSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-2 bg-yellow-50 rounded text-sm">
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 6. 회로도 */}
        <SchematicSVG model={{ spec, allocation, power: powerRequirements }} />
        
        {/* 7. 코드 생성 버튼 */}
        <div className="bg-white border rounded-lg p-6 mb-8">
          <button
            onClick={generateCodeAndConnect}
            className="w-full px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            🔧 코드 생성 및 연결 시작
          </button>
        </div>
          </>
        )}

        {/* 연결 단계 */}
        {currentStep === 'connect' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">🔗 디바이스 연결</h3>
              <p className="text-gray-600 mb-4">
                생성된 코드를 디바이스에 업로드하고 연결하세요.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">📋 생성된 {spec.device.toUpperCase()} 코드</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <CodePreview code={generatedCode} onDownload={downloadCode} deviceType={spec.device.toUpperCase()} />
                  </div>
          </div>
          
                <div>
                  <h4 className="font-semibold mb-2">📱 QR 코드 연결</h4>
                  <QRCodeCard 
                    qrData={`${window.location.origin}/connect?token=${setupToken}`}
                    setupToken={setupToken}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep('design')}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  ← 이전 단계
                </button>
                <button
                  onClick={() => setCurrentStep('monitor')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  모니터링 시작 →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 모니터링 단계 */}
        {currentStep === 'monitor' && (
          <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">📊 실시간 모니터링</h3>
              <p className="text-gray-600 mb-4">
                디바이스가 연결되면 실시간 데이터를 확인할 수 있습니다.
              </p>
              
              <LiveLog setupToken={setupToken} />
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep('connect')}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  ← 연결 단계
                </button>
            <button
                  onClick={() => {
                    setCurrentStep('design');
                    setGeneratedCode('');
                    setSetupToken('');
                    setIsConnected(false);
                  }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
                  새 프로젝트 시작
            </button>
          </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

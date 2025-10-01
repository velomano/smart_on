// IoT Designer 메인 페이지
'use client';

import { useState } from 'react';
import { allocatePins } from '@/components/iot-designer/PinAllocator';
import { calculatePowerRequirements, suggestPowerSupplies } from '@/components/iot-designer/PowerEstimator';
import SchematicSVG from '@/components/iot-designer/SchematicSVG';
import CodePreview from '@/components/iot-designer/CodePreview';
import NaturalLanguageBar from '@/components/iot-designer/NaturalLanguageBar';

interface SystemSpec {
  device: string;
  protocol: 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp';
  sensors: Array<{ type: string; count: number }>;
  controls: Array<{ type: string; count: number }>;
  wifi: {
    ssid: string;
    password: string;
  };
  modbusConfig?: {
    host: string;
    port: number;
    unitId: number;
    registerMappings: Record<string, number>;
    dataTypes: Record<string, 'U16' | 'S16' | 'U32' | 'S32' | 'float'>;
    safeLimits: Record<string, { min: number; max: number }>;
  };
}

export default function IoTDesignerPage() {
  const [spec, setSpec] = useState<SystemSpec>({
    device: 'esp32',
    protocol: 'http',
    sensors: [],
    controls: [],
    wifi: {
      ssid: '',
      password: ''
    },
    modbusConfig: {
      host: '192.168.1.100',
      port: 502,
      unitId: 1,
      registerMappings: {},
      dataTypes: {},
      safeLimits: {}
    }
  });
  
  const [generatedCode, setGeneratedCode] = useState('');
  
  // 핀 할당 및 전원 계산
  const allocation = allocatePins(spec);
  const powerRequirements = calculatePowerRequirements(spec);
  const powerSuggestions = suggestPowerSupplies(powerRequirements);
  
  // 자연어 파싱 결과 적용
  const handleNaturalLanguageParse = (result: { sensors: Array<{ type: string; count: number }>; controls: Array<{ type: string; count: number }> }) => {
    setSpec(prev => ({
      ...prev,
      sensors: result.sensors,
      controls: result.controls
    }));
  };
  
  // 코드 생성
  const generateCode = async () => {
    try {
      const response = await fetch('/api/iot/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spec)
      });
      
      if (response.ok) {
        const code = await response.text();
        setGeneratedCode(code);
      }
    } catch (error) {
      console.error('코드 생성 오류:', error);
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 IoT Designer</h1>
          <p className="text-gray-600">자연어로 IoT 시스템을 설계하고 완벽한 코드를 생성하세요</p>
        </div>
        
        {/* 1. 자연어 입력 */}
        <NaturalLanguageBar onParse={handleNaturalLanguageParse} />
        
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
                onChange={(e) => setSpec(prev => ({ ...prev, protocol: e.target.value as 'http' | 'mqtt' | 'websocket' | 'webhook' | 'serial' | 'ble' | 'rs485' | 'modbus-tcp' }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="http">HTTP</option>
                <option value="mqtt">MQTT</option>
                <option value="websocket">WebSocket</option>
                <option value="webhook">Webhook</option>
                <option value="serial">Serial (USB)</option>
                <option value="ble">Bluetooth LE</option>
                <option value="rs485">RS-485 (Modbus RTU)</option>
                <option value="modbus-tcp">Modbus TCP</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* 2.5. WiFi 설정 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">📶 WiFi 설정</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">WiFi 네트워크 이름 (SSID)</label>
              <input
                type="text"
                value={spec.wifi.ssid}
                onChange={(e) => setSpec(prev => ({ 
                  ...prev, 
                  wifi: { ...prev.wifi, ssid: e.target.value }
                }))}
                placeholder="예: MyHomeWiFi"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">ESP32가 연결할 WiFi 네트워크 이름</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">WiFi 비밀번호</label>
              <input
                type="password"
                value={spec.wifi.password}
                onChange={(e) => setSpec(prev => ({ 
                  ...prev, 
                  wifi: { ...prev.wifi, password: e.target.value }
                }))}
                placeholder="WiFi 비밀번호 입력"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">WiFi 네트워크의 비밀번호</p>
            </div>
          </div>
          
          {spec.wifi.ssid && spec.wifi.password && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span className="text-sm text-green-800">
                  WiFi 설정 완료: <strong>{spec.wifi.ssid}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2.6. Modbus TCP 설정 */}
        {(spec.protocol === 'modbus-tcp' || spec.protocol === 'rs485') && spec.modbusConfig ? (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">🔌 Modbus 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">호스트 주소</label>
                <input
                  type="text"
                  value={spec.modbusConfig.host}
                  onChange={(e) => setSpec(prev => ({ 
                    ...prev, 
                    modbusConfig: { ...prev.modbusConfig!, host: e.target.value }
                  }))}
                  placeholder="192.168.1.100"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">포트</label>
                <input
                  type="number"
                  value={spec.modbusConfig.port}
                  onChange={(e) => setSpec(prev => ({ 
                    ...prev, 
                    modbusConfig: { ...prev.modbusConfig!, port: parseInt(e.target.value) }
                  }))}
                  placeholder="502"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit ID</label>
                <input
                  type="number"
                  value={spec.modbusConfig.unitId}
                  onChange={(e) => setSpec(prev => ({ 
                    ...prev, 
                    modbusConfig: { ...prev.modbusConfig!, unitId: parseInt(e.target.value) }
                  }))}
                  placeholder="1"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            {/* 레지스터 매핑 */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">📋 레지스터 매핑</h4>
              <div className="space-y-2">
                {[...spec.sensors, ...spec.controls].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{item.type} ({item.count}개)</span>
                    <input
                      type="number"
                      placeholder="레지스터 주소"
                      value={spec.modbusConfig.registerMappings[item.type] || ''}
                      onChange={(e) => setSpec(prev => ({
                        ...prev,
                        modbusConfig: {
                          ...prev.modbusConfig!,
                          registerMappings: {
                            ...prev.modbusConfig!.registerMappings,
                            [item.type]: parseInt(e.target.value) || 0
                          }
                        }
                      }))}
                      className="w-32 p-2 border rounded"
                    />
                    <select
                      value={spec.modbusConfig.dataTypes[item.type] || 'U16'}
                      onChange={(e) => setSpec(prev => ({
                        ...prev,
                        modbusConfig: {
                          ...prev.modbusConfig!,
                          dataTypes: {
                            ...prev.modbusConfig!.dataTypes,
                            [item.type]: e.target.value as 'U16' | 'S16' | 'U32' | 'S32' | 'float'
                          }
                        }
                      }))}
                      className="w-24 p-2 border rounded"
                    >
                      <option value="U16">U16</option>
                      <option value="S16">S16</option>
                      <option value="U32">U32</option>
                      <option value="S32">S32</option>
                      <option value="float">Float</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 안전 한계값 */}
            <div>
              <h4 className="font-semibold mb-3">⚠️ 안전 한계값</h4>
              <div className="space-y-2">
                {spec.controls.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium">{item.type}</span>
                    <input
                      type="number"
                      placeholder="최소값"
                      value={spec.modbusConfig.safeLimits[item.type]?.min || ''}
                      onChange={(e) => setSpec(prev => ({
                        ...prev,
                        modbusConfig: {
                          ...prev.modbusConfig!,
                          safeLimits: {
                            ...prev.modbusConfig!.safeLimits,
                            [item.type]: {
                              ...prev.modbusConfig!.safeLimits[item.type],
                              min: parseInt(e.target.value) || 0
                            }
                          }
                        }
                      }))}
                      className="w-24 p-2 border rounded"
                    />
                    <span>~</span>
                    <input
                      type="number"
                      placeholder="최대값"
                      value={spec.modbusConfig.safeLimits[item.type]?.max || ''}
                      onChange={(e) => setSpec(prev => ({
                        ...prev,
                        modbusConfig: {
                          ...prev.modbusConfig!,
                          safeLimits: {
                            ...prev.modbusConfig!.safeLimits,
                            [item.type]: {
                              ...prev.modbusConfig!.safeLimits[item.type],
                              max: parseInt(e.target.value) || 100
                            }
                          }
                        }
                      }))}
                      className="w-24 p-2 border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        
        {/* 3. 센서/제어 선택 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">📊 센서 및 제어 장치</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">센서</h4>
              
              {/* 센서 추가 버튼 */}
              <div className="mb-4">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setSpec(prev => ({
                        ...prev,
                        sensors: [...prev.sensors, { type: e.target.value, count: 1 }]
                      }));
                      e.target.value = ''; // 선택 초기화
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
                {spec.sensors.map((sensor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{sensor.type}</span>
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
                      <span className="text-sm text-gray-500">개</span>
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
                ))}
                {spec.sensors.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4">
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
                  onChange={(e) => {
                    if (e.target.value) {
                      setSpec(prev => ({
                        ...prev,
                        controls: [...prev.controls, { type: e.target.value, count: 1 }]
                      }));
                      e.target.value = ''; // 선택 초기화
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
                {spec.controls.map((control, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{control.type}</span>
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
                      <span className="text-sm text-gray-500">개</span>
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
                ))}
                {spec.controls.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4">
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
                    <div className="text-xs text-gray-500">
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
        
        {/* 7. 코드 생성 및 미리보기 */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">💻 코드 생성</h3>
            <button
              onClick={generateCode}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              🔧 코드 생성
            </button>
          </div>
          
          {generatedCode && (
            <CodePreview code={generatedCode} onDownload={downloadCode} />
          )}
        </div>
      </div>
    </div>
  );
}

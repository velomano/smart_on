'use client';

interface SchematicProps {
  model: {
    spec: {
      device: string;
      protocol: string;
      sensors: Array<{ type: string; count: number }>;
      controls: Array<{ type: string; count: number }>;
    };
    allocation: {
      assigned: Record<string, Array<{ role: string; pin: number | string }>>;
      conflicts: string[];
    };
    power: Array<{ voltage: number; minCurrentA: number; devices: string[] }>;
  };
}

export default function SchematicSVG({ model }: SchematicProps) {
  const { spec, allocation, power } = model;
<<<<<<< HEAD
  const deviceInfo = getDeviceInfo(spec.device);

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-6 text-gray-800">🔌 IoT 디바이스 연결 정보</h3>
      
      {/* 디바이스 정보 */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-800 mb-2">📱 선택된 디바이스</h4>
          <p className="text-blue-700 font-medium">{deviceInfo.name}</p>
        </div>
      </div>

      {/* 컴포넌트 카드들 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">🔧 연결된 컴포넌트</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generateComponentCards(spec, allocation)}
        </div>
      </div>

      {/* 핀 할당 테이블 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">📋 핀 할당 현황</h4>
        {generatePinTable(spec, allocation)}
      </div>

      {/* 배선 가이드 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">🔌 배선 가이드</h4>
        {generateWiringGuide(spec, allocation)}
      </div>

      {/* 전원 공급 정보 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">⚡ 전원 공급</h4>
        {generatePowerInfo(power)}
      </div>

      {/* 충돌 경고 */}
      {allocation.conflicts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-red-800 mb-4">⚠️ 충돌 경고</h4>
          {generateConflictWarnings(allocation.conflicts)}
        </div>
      )}
    </div>
  );
}

// 디바이스 정보 가져오기
function getDeviceInfo(device: string) {
  const deviceMap: Record<string, { name: string }> = {
    'esp32': { name: 'ESP32' },
    'esp8266': { name: 'ESP8266' },
    'arduino_uno': { name: 'Arduino Uno' },
    'arduino_r4': { name: 'Arduino R4' },
    'raspberry_pi5': { name: 'Raspberry Pi 5' }
  };
  return deviceMap[device] || deviceMap['esp32'];
}

// 컴포넌트 카드 생성
function generateComponentCards(spec: any, allocation: any) {
  const cards = [];
  
  // 센서 이름 매핑
  const sensorNames: Record<string, string> = {
    'dht22': 'DHT22 (온습도)',
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

  // 제어장치 이름 매핑
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

  // 센서 카드들
  spec.sensors.forEach((sensor: any) => {
    const sensorName = sensorNames[sensor.type] || sensor.type.toUpperCase();
    
    for (let instance = 0; instance < sensor.count; instance++) {
      const instanceKey = `sensor_${sensor.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      
      cards.push(
        <div key={instanceKey} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <h5 className="font-semibold text-blue-800">{sensorName}</h5>
            <span className="ml-2 text-sm text-blue-600">#{instance + 1}</span>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-700">📍 연결 정보:</span>
            </div>
            {assignedPins.map((pin: any, idx: number) => (
              <div key={idx} className="ml-4 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                <span className="text-sm text-gray-600">
                  {pin.role}: <span className="font-mono font-medium">{pin.pin}</span>
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">⚡ 전원: 3.3V/5V</span>
              <span className="text-green-600 font-medium">✅ 연결됨</span>
            </div>
          </div>
        </div>
      );
    }
  });

  // 제어 장치 카드들
  spec.controls.forEach((control: any) => {
    const controlName = controlNames[control.type] || control.type.toUpperCase();
    
    for (let instance = 0; instance < control.count; instance++) {
      const instanceKey = `control_${control.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      
      cards.push(
        <div key={instanceKey} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <h5 className="font-semibold text-orange-800">{controlName}</h5>
            <span className="ml-2 text-sm text-orange-600">#{instance + 1}</span>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-700">📍 연결 정보:</span>
            </div>
            {assignedPins.map((pin: any, idx: number) => (
              <div key={idx} className="ml-4 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                <span className="text-sm text-gray-600">
                  {pin.role}: <span className="font-mono font-medium">{pin.pin}</span>
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">⚡ 전원: 5V/12V</span>
              <span className="text-green-600 font-medium">✅ 연결됨</span>
            </div>
          </div>
        </div>
      );
    }
  });

  return cards;
}

// 핀 할당 테이블 생성
function generatePinTable(spec: any, allocation: any) {
  const pinData: Array<{ pin: string | number; role: string; component: string; color: string }> = [];
  
  // 센서 이름 매핑
  const sensorNames: Record<string, string> = {
    'dht22': 'DHT22 (온습도)',
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

  // 센서 핀 정보 수집
  spec.sensors.forEach((sensor: any) => {
    const sensorName = sensorNames[sensor.type] || sensor.type.toUpperCase();
    
    for (let instance = 0; instance < sensor.count; instance++) {
      const instanceKey = `sensor_${sensor.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      
      assignedPins.forEach((pin: any) => {
        pinData.push({
          pin: pin.pin,
          role: pin.role,
          component: `${sensorName} #${instance + 1}`,
          color: 'blue'
        });
      });
    }
  });

  // 제어 장치 핀 정보 수집
  spec.controls.forEach((control: any) => {
    const controlName = controlNames[control.type] || control.type.toUpperCase();
    
    for (let instance = 0; instance < control.count; instance++) {
      const instanceKey = `control_${control.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      
      assignedPins.forEach((pin: any) => {
        pinData.push({
          pin: pin.pin,
          role: pin.role,
          component: `${controlName} #${instance + 1}`,
          color: 'orange'
        });
      });
    }
  });

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">핀번호</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">역할</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">컴포넌트</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pinData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                  {row.pin}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    row.role === 'VCC' ? 'bg-red-100 text-red-800' :
                    row.role === 'GND' ? 'bg-gray-100 text-gray-800' :
                    row.role === 'DATA' || row.role === 'SIG' ? 'bg-green-100 text-green-800' :
                    row.role === 'OUT' || row.role === 'Control' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {row.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{row.component}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="text-green-600 font-medium">✅ 할당됨</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 배선 가이드 생성
function generateWiringGuide(spec: any, allocation: any) {
  const guides = [];
  
  const sensorNames: Record<string, string> = {
    'dht22': 'DHT22 (온습도)',
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

  // 센서 배선 가이드
  spec.sensors.forEach((sensor: any) => {
    const sensorName = sensorNames[sensor.type] || sensor.type.toUpperCase();
    
    for (let instance = 0; instance < sensor.count; instance++) {
      const instanceKey = `sensor_${sensor.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      
      guides.push(
        <div key={instanceKey} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h5 className="font-semibold text-blue-800 mb-3 flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            {sensorName} #{instance + 1}
          </h5>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-16 text-gray-600">VCC:</span>
              <span className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded text-xs">ESP32 VCC</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-16 text-gray-600">GND:</span>
              <span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">ESP32 GND</span>
            </div>
            {assignedPins.map((pin: any, idx: number) => (
              <div key={idx} className="flex items-center text-sm">
                <span className="w-16 text-gray-600">{pin.role}:</span>
                <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  ESP32 핀 {pin.pin}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  });

  // 제어 장치 배선 가이드
  spec.controls.forEach((control: any) => {
    const controlName = controlNames[control.type] || control.type.toUpperCase();
    
    for (let instance = 0; instance < control.count; instance++) {
      const instanceKey = `control_${control.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      
      guides.push(
        <div key={instanceKey} className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <h5 className="font-semibold text-orange-800 mb-3 flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            {controlName} #{instance + 1}
          </h5>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-16 text-gray-600">VCC:</span>
              <span className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded text-xs">ESP32 VCC</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-16 text-gray-600">GND:</span>
              <span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">ESP32 GND</span>
            </div>
            {assignedPins.map((pin: any, idx: number) => (
              <div key={idx} className="flex items-center text-sm">
                <span className="w-16 text-gray-600">{pin.role}:</span>
                <span className="font-mono bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                  ESP32 핀 {pin.pin}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  });

  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{guides}</div>;
}

// 전원 공급 정보 생성
function generatePowerInfo(power: any[]) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="space-y-3">
        {power.map((pwr, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span className="font-medium text-green-800">{pwr.voltage}V</span>
              <span className="ml-2 text-sm text-green-700">{pwr.minCurrentA}A</span>
            </div>
            <div className="text-sm text-green-600">
              {pwr.devices.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 충돌 경고 생성
function generateConflictWarnings(conflicts: string[]) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="space-y-2">
        {conflicts.map((conflict, idx) => (
          <div key={idx} className="flex items-center text-sm text-red-700">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {conflict}
          </div>
        ))}
=======
  
  // 핀 할당 정보를 기반으로 실제 연결 생성
  const generateConnections = () => {
    const connections: Array<{
      from: { x: number; y: number; pin: number | string };
      to: { x: number; y: number; device: string };
      type: 'sensor' | 'control';
    }> = [];
    
    let deviceY = 100;
    
    // 센서 연결
    spec.sensors.forEach((sensor, sensorIdx) => {
      const sensorPins = allocation.assigned[`sensor_${sensor.type}`] || [];
      sensorPins.forEach((pinInfo, pinIdx) => {
        if (typeof pinInfo.pin === 'number') {
          const pinY = 90 + (pinInfo.pin - 4) * 20; // 핀 번호에 따른 Y 위치
          connections.push({
            from: { x: 260, y: pinY, pin: pinInfo.pin },
            to: { x: 320, y: deviceY + 30, device: `${sensor.type} ${pinIdx + 1}` },
            type: 'sensor'
          });
        }
      });
      deviceY += 80;
    });
    
    // 제어 연결
    spec.controls.forEach((control, controlIdx) => {
      const controlPins = allocation.assigned[`control_${control.type}`] || [];
      controlPins.forEach((pinInfo, pinIdx) => {
        if (typeof pinInfo.pin === 'number') {
          const pinY = 90 + (pinInfo.pin - 4) * 20;
          connections.push({
            from: { x: 260, y: pinY, pin: pinInfo.pin },
            to: { x: 320, y: deviceY + 30, device: `${control.type} ${pinIdx + 1}` },
            type: 'control'
          });
        }
      });
      deviceY += 80;
    });
    
    return connections;
  };
  
  const connections = generateConnections();
  
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">🔌 회로도</h3>
      
      <div className="overflow-x-auto">
        <svg width="1000" height="600" className="border border-gray-300">
          {/* 배경 그리드 */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* ESP32 본체 */}
          <rect x={40} y={40} width={200} height={520} rx={12} fill="#f8f9fa" stroke="#333" strokeWidth="2"/>
          <text x={50} y={60} fontSize="16" fontWeight="bold" fill="#333">ESP32</text>
          
          {/* ESP32 핀들 */}
          {[4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33].map((pin, idx) => {
            const y = 90 + idx * 20;
            const isUsed = connections.some(conn => conn.from.pin === pin);
            return (
              <g key={pin}>
                <circle cx={240} cy={y} r={4} fill={isUsed ? "#4caf50" : "#ccc"} stroke="#333" strokeWidth="1"/>
                <text x={50} y={y + 4} fontSize="11" fill={isUsed ? "#2e7d32" : "#666"}>
                  Pin {pin}
                </text>
              </g>
            );
          })}
          
          {/* 센서 박스들 */}
          {spec.sensors.map((sensor, idx) => {
            const y = 100 + idx * 80;
            const sensorPins = allocation.assigned[`sensor_${sensor.type}`] || [];
            return (
              <g key={`sensor_${sensor.type}_${idx}`}>
                <rect x={320} y={y} width={140} height={60} rx={6} fill="#e3f2fd" stroke="#1976d2" strokeWidth="2"/>
                <text x={330} y={y + 20} fontSize="12" fontWeight="bold" fill="#1976d2">
                  {sensor.type.toUpperCase()}
                </text>
                <text x={330} y={y + 35} fontSize="10" fill="#666">× {sensor.count}</text>
                <text x={330} y={y + 50} fontSize="9" fill="#666">
                  {sensorPins.map(p => p.pin).join(', ')}
                </text>
              </g>
            );
          })}
          
          {/* 제어 박스들 */}
          {spec.controls.map((control, idx) => {
            const y = 100 + (spec.sensors.length + idx) * 80;
            const controlPins = allocation.assigned[`control_${control.type}`] || [];
            return (
              <g key={`control_${control.type}_${idx}`}>
                <rect x={320} y={y} width={140} height={60} rx={6} fill="#fff3e0" stroke="#f57c00" strokeWidth="2"/>
                <text x={330} y={y + 20} fontSize="12" fontWeight="bold" fill="#f57c00">
                  {control.type.toUpperCase()}
                </text>
                <text x={330} y={y + 35} fontSize="10" fill="#666">× {control.count}</text>
                <text x={330} y={y + 50} fontSize="9" fill="#666">
                  {controlPins.map(p => p.pin).join(', ')}
                </text>
              </g>
            );
          })}
          
          {/* 연결선들 */}
          {connections.map((conn, idx) => (
            <line
              key={idx}
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke={conn.type === 'sensor' ? "#1976d2" : "#f57c00"}
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          ))}
          
          {/* 화살표 마커 */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
            </marker>
          </defs>
          
          {/* 전원 공급 표시 */}
          <rect x={520} y={40} width={160} height={120} rx={6} fill="#f1f8e9" stroke="#388e3c" strokeWidth="2"/>
          <text x={530} y={60} fontSize="14" fontWeight="bold" fill="#388e3c">⚡ 전원 공급</text>
          {power.map((pwr, idx) => (
            <text key={idx} x={530} y={80 + idx * 20} fontSize="11" fill="#2e7d32">
              {pwr.voltage}V: {pwr.minCurrentA}A
            </text>
          ))}
          
          {/* 통신 프로토콜 표시 */}
          <rect x={520} y={180} width={160} height={80} rx={6} fill="#f3e5f5" stroke="#7b1fa2" strokeWidth="2"/>
          <text x={530} y={200} fontSize="14" fontWeight="bold" fill="#7b1fa2">📡 통신</text>
          <text x={530} y={220} fontSize="11" fill="#4a148c">{spec.protocol.toUpperCase()}</text>
          <text x={530} y={240} fontSize="10" fill="#666">
            {spec.protocol === 'rs485' ? 'RS-485 트랜시버 필요' : 
             spec.protocol === 'mqtt' ? 'WiFi + MQTT' :
             spec.protocol === 'http' ? 'WiFi + HTTP' : '직접 연결'}
          </text>
          
          {/* 충돌 경고 */}
          {allocation.conflicts.length > 0 && (
            <rect x={520} y={280} width={200} height={120} rx={6} fill="#ffebee" stroke="#d32f2f" strokeWidth="2"/>
          )}
          <text x={530} y={300} fontSize="14" fontWeight="bold" fill="#d32f2f">⚠️ 핀 충돌</text>
          {allocation.conflicts.map((conflict, idx) => (
            <text key={idx} x={530} y={320 + idx * 15} fontSize="10" fill="#d32f2f">
              • {conflict}
            </text>
          ))}
          
          {/* 범례 */}
          <rect x={520} y={420} width={200} height={140} rx={6} fill="#fafafa" stroke="#666" strokeWidth="1"/>
          <text x={530} y={440} fontSize="12" fontWeight="bold" fill="#333">📋 범례</text>
          <circle cx={540} cy={460} r={4} fill="#4caf50"/>
          <text x={550} y={465} fontSize="10" fill="#333">사용된 핀</text>
          <circle cx={540} cy={480} r={4} fill="#ccc"/>
          <text x={550} y={485} fontSize="10" fill="#333">사용 가능한 핀</text>
          <line x1={530} y1={500} x2={560} y2={500} stroke="#1976d2" strokeWidth="2"/>
          <text x={570} y={505} fontSize="10" fill="#333">센서 연결</text>
          <line x1={530} y1={520} x2={560} y2={520} stroke="#f57c00" strokeWidth="2"/>
          <text x={570} y={525} fontSize="10" fill="#333">제어 연결</text>
        </svg>
      </div>
      
      <div className="mt-4 text-sm text-gray-800">
        <p>📋 회로도 설명:</p>
        <ul className="list-disc list-inside ml-4">
          <li>ESP32와 센서/제어 장치 간 핀 연결</li>
          <li>전원 공급 요구사항 표시</li>
          <li>핀 충돌 시 경고 표시</li>
        </ul>
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
      </div>
    </div>
  );
}

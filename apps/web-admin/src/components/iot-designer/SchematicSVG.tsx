'use client';

interface SchematicProps {
  model: {
    spec: {
      device: string;
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
      </div>
    </div>
  );
}

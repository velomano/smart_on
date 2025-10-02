// 회로도 SVG 생성 컴포넌트
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
  
  // 실제 핀 연결 정보 생성
  const pinConnections = generatePinConnections(spec, allocation);
  
  // 디바이스별 핀맵과 정보 가져오기
  const deviceInfo = getDeviceInfo(spec.device);
  
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">🔌 회로도</h3>
      
      <svg width="1200" height="800" className="border">
        {/* 디바이스 본체 */}
        <rect x={40} y={40} width={200} height={500} rx={12} fill="#f0f0f0" stroke="#333" strokeWidth="2"/>
        <text x={50} y={60} fontSize="16" fontWeight="bold">{deviceInfo.name}</text>
        
        {/* 디바이스 핀들 */}
        {generateDevicePins(spec.device)}
        
        {/* 센서/제어 장치들 */}
        {generateComponents(spec, allocation)}
        
        {/* 실제 핀 연결선들 */}
        {generateConnectionLines(pinConnections, spec.device)}
        
        {/* 정보 박스들을 동적으로 배치 */}
        {generateInfoBoxes(power, allocation, pinConnections)}
      </svg>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>📋 회로도 설명:</p>
        <ul className="list-disc list-inside ml-4">
          <li>{deviceInfo.name}와 센서/제어 장치 간 실제 핀 연결</li>
          <li>전원 공급 요구사항 및 부품 목록</li>
          <li>핀 충돌 시 경고 및 해결 방안</li>
          <li>연결 정보 테이블로 정확한 배선 가이드</li>
        </ul>
      </div>
    </div>
  );
}

// 디바이스 정보 가져오기
function getDeviceInfo(device: string) {
  const deviceMap: Record<string, { name: string; pins: Array<{ num: number | string; x: number; y: number }> }> = {
    'esp32': {
      name: 'ESP32',
      pins: [
        { num: 2, x: 43, y: 80 },
        { num: 4, x: 43, y: 100 },
        { num: 5, x: 43, y: 120 },
        { num: 12, x: 43, y: 140 },
        { num: 13, x: 43, y: 160 },
        { num: 14, x: 43, y: 180 },
        { num: 15, x: 43, y: 200 },
        { num: 16, x: 43, y: 220 },
        { num: 17, x: 43, y: 240 },
        { num: 18, x: 43, y: 260 },
        { num: 19, x: 43, y: 280 },
        { num: 21, x: 43, y: 300 },
        { num: 22, x: 43, y: 320 },
        { num: 23, x: 43, y: 340 },
        { num: 25, x: 43, y: 360 },
        { num: 26, x: 43, y: 380 },
        { num: 27, x: 43, y: 400 },
        { num: 32, x: 43, y: 420 },
        { num: 33, x: 43, y: 440 },
        { num: 36, x: 43, y: 460 },
        { num: 39, x: 43, y: 480 }
      ]
    },
    'esp8266': {
      name: 'ESP8266',
      pins: [
        { num: 'D0', x: 43, y: 80 },
        { num: 'D1', x: 43, y: 100 },
        { num: 'D2', x: 43, y: 120 },
        { num: 'D3', x: 43, y: 140 },
        { num: 'D4', x: 43, y: 160 },
        { num: 'D5', x: 43, y: 180 },
        { num: 'D6', x: 43, y: 200 },
        { num: 'D7', x: 43, y: 220 },
        { num: 'D8', x: 43, y: 240 },
        { num: 'A0', x: 43, y: 260 },
        { num: '3V3', x: 43, y: 280 },
        { num: 'GND', x: 43, y: 300 },
        { num: 'VIN', x: 43, y: 320 }
      ]
    },
    'arduino_uno': {
      name: 'Arduino Uno',
      pins: [
        { num: 'D2', x: 43, y: 80 },
        { num: 'D3', x: 43, y: 100 },
        { num: 'D4', x: 43, y: 120 },
        { num: 'D5', x: 43, y: 140 },
        { num: 'D6', x: 43, y: 160 },
        { num: 'D7', x: 43, y: 180 },
        { num: 'D8', x: 43, y: 200 },
        { num: 'D9', x: 43, y: 220 },
        { num: 'D10', x: 43, y: 240 },
        { num: 'D11', x: 43, y: 260 },
        { num: 'D12', x: 43, y: 280 },
        { num: 'D13', x: 43, y: 300 },
        { num: 'A0', x: 43, y: 320 },
        { num: 'A1', x: 43, y: 340 },
        { num: 'A2', x: 43, y: 360 },
        { num: 'A3', x: 43, y: 380 },
        { num: 'A4', x: 43, y: 400 },
        { num: 'A5', x: 43, y: 420 },
        { num: '5V', x: 43, y: 440 },
        { num: '3V3', x: 43, y: 460 },
        { num: 'GND', x: 43, y: 480 }
      ]
    },
    'arduino_r4': {
      name: 'Arduino R4',
      pins: [
        { num: 'D2', x: 43, y: 80 },
        { num: 'D3', x: 43, y: 100 },
        { num: 'D4', x: 43, y: 120 },
        { num: 'D5', x: 43, y: 140 },
        { num: 'D6', x: 43, y: 160 },
        { num: 'D7', x: 43, y: 180 },
        { num: 'D8', x: 43, y: 200 },
        { num: 'D9', x: 43, y: 220 },
        { num: 'D10', x: 43, y: 240 },
        { num: 'D11', x: 43, y: 260 },
        { num: 'D12', x: 43, y: 280 },
        { num: 'D13', x: 43, y: 300 },
        { num: 'A0', x: 43, y: 320 },
        { num: 'A1', x: 43, y: 340 },
        { num: 'A2', x: 43, y: 360 },
        { num: 'A3', x: 43, y: 380 },
        { num: 'A4', x: 43, y: 400 },
        { num: 'A5', x: 43, y: 420 },
        { num: 'A6', x: 43, y: 440 },
        { num: '5V', x: 43, y: 460 },
        { num: '3V3', x: 43, y: 480 }
      ]
    },
    'raspberry_pi5': {
      name: 'Raspberry Pi 5',
      pins: [
        { num: 'GPIO2', x: 43, y: 80 },
        { num: 'GPIO3', x: 43, y: 100 },
        { num: 'GPIO4', x: 43, y: 120 },
        { num: 'GPIO5', x: 43, y: 140 },
        { num: 'GPIO6', x: 43, y: 160 },
        { num: 'GPIO7', x: 43, y: 180 },
        { num: 'GPIO8', x: 43, y: 200 },
        { num: 'GPIO9', x: 43, y: 220 },
        { num: 'GPIO10', x: 43, y: 240 },
        { num: 'GPIO11', x: 43, y: 260 },
        { num: 'GPIO12', x: 43, y: 280 },
        { num: 'GPIO13', x: 43, y: 300 },
        { num: 'GPIO14', x: 43, y: 320 },
        { num: 'GPIO15', x: 43, y: 340 },
        { num: 'GPIO16', x: 43, y: 360 },
        { num: 'GPIO17', x: 43, y: 380 },
        { num: 'GPIO18', x: 43, y: 400 },
        { num: 'GPIO19', x: 43, y: 420 },
        { num: 'GPIO20', x: 43, y: 440 },
        { num: 'GPIO21', x: 43, y: 460 },
        { num: 'GPIO22', x: 43, y: 480 }
      ]
    }
  };
  
  return deviceMap[device] || deviceMap['esp32']; // 기본값은 ESP32
}

// 디바이스별 핀 생성
function generateDevicePins(device: string) {
  const deviceInfo = getDeviceInfo(device);
  
  return deviceInfo.pins.map(pin => (
    <g key={pin.num}>
      <circle cx={pin.x} cy={pin.y} r="4" fill="#333" stroke="#fff" strokeWidth="1"/>
      <text x={pin.x + 8} y={pin.y + 3} fontSize="10" fontWeight="bold">{pin.num}</text>
    </g>
  ));
}

// ESP32 핀 생성 (레거시 함수, 호환성을 위해 유지)
function generateESP32Pins() {
  const pins = [
    { num: 2, x: 43, y: 80 },
    { num: 4, x: 43, y: 100 },
    { num: 5, x: 43, y: 120 },
    { num: 12, x: 43, y: 140 },
    { num: 13, x: 43, y: 160 },
    { num: 14, x: 43, y: 180 },
    { num: 15, x: 43, y: 200 },
    { num: 16, x: 43, y: 220 },
    { num: 17, x: 43, y: 240 },
    { num: 18, x: 43, y: 260 },
    { num: 19, x: 43, y: 280 },
    { num: 21, x: 43, y: 300 },
    { num: 22, x: 43, y: 320 },
    { num: 23, x: 43, y: 340 },
    { num: 25, x: 43, y: 360 },
    { num: 26, x: 43, y: 380 },
    { num: 27, x: 43, y: 400 },
    { num: 32, x: 43, y: 420 },
    { num: 33, x: 43, y: 440 },
    { num: 36, x: 43, y: 460 },
    { num: 39, x: 43, y: 480 }
  ];
  
  return pins.map(pin => (
    <g key={pin.num}>
      <circle cx={pin.x} cy={pin.y} r="4" fill="#333" stroke="#fff" strokeWidth="1"/>
      <text x={pin.x + 8} y={pin.y + 3} fontSize="10" fontWeight="bold">{pin.num}</text>
    </g>
  ));
}

// 센서/제어 장치 생성 (각 인스턴스마다 별도 컴포넌트)
function generateComponents(spec: any, allocation: any) {
  const components = [];
  let yOffset = 100;
  
  // 센서 이름 매핑
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
  
  // 센서들 (각 인스턴스마다 별도 컴포넌트)
  spec.sensors.forEach((sensor: any, sensorIdx: number) => {
    const sensorName = sensorNames[sensor.type] || sensor.type.toUpperCase();
    
    for (let instance = 0; instance < sensor.count; instance++) {
      const instanceKey = `sensor_${sensor.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      
      // 연결 정보를 더 명확하게 표시
      const connectionInfo = assignedPins.map((p: any) => `${p.role}: ${p.pin}`).join(', ');
      
      components.push(
        <g key={`sensor_${sensor.type}_${instance}`}>
          <rect x={300} y={yOffset} width={160} height={90} rx={4} fill="#e3f2fd" stroke="#1976d2" strokeWidth="1"/>
          <text x={310} y={yOffset + 20} fontSize="12" fontWeight="bold">{sensorName}</text>
          <text x={310} y={yOffset + 35} fontSize="10">#{instance + 1}</text>
          <text x={310} y={yOffset + 50} fontSize="9" fill="#666">
            연결: {connectionInfo}
          </text>
          <text x={310} y={yOffset + 65} fontSize="9" fill="#666">
            전원: 3.3V/5V
          </text>
          <text x={310} y={yOffset + 80} fontSize="8" fill="#999">
            VCC, GND, Data 연결됨
          </text>
        </g>
      );
      yOffset += 100;
    }
  });
  
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
  
  // 제어 장치들 (각 인스턴스마다 별도 컴포넌트)
  spec.controls.forEach((control: any, controlIdx: number) => {
    const controlName = controlNames[control.type] || control.type.toUpperCase();
    
    for (let instance = 0; instance < control.count; instance++) {
      const instanceKey = `control_${control.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      
      // 연결 정보를 더 명확하게 표시
      const connectionInfo = assignedPins.map((p: any) => `${p.role}: ${p.pin}`).join(', ');
      
      components.push(
        <g key={`control_${control.type}_${instance}`}>
          <rect x={300} y={yOffset} width={160} height={90} rx={4} fill="#fff3e0" stroke="#f57c00" strokeWidth="1"/>
          <text x={310} y={yOffset + 20} fontSize="12" fontWeight="bold">{controlName}</text>
          <text x={310} y={yOffset + 35} fontSize="10">#{instance + 1}</text>
          <text x={310} y={yOffset + 50} fontSize="9" fill="#666">
            연결: {connectionInfo}
          </text>
          <text x={310} y={yOffset + 65} fontSize="9" fill="#666">
            전원: 5V/12V
          </text>
          <text x={310} y={yOffset + 80} fontSize="8" fill="#999">
            VCC, GND, Control 연결됨
          </text>
        </g>
      );
      yOffset += 100;
    }
  });
  
  return components;
}

// 정보 박스들 생성 (동적 배치)
function generateInfoBoxes(power: any[], allocation: any, pinConnections: any[]) {
  const boxes = [];
  let yOffset = 40;
  
  // 전원 공급 박스
  const powerBoxHeight = Math.max(120, 60 + power.length * 25);
  boxes.push(
    <g key="power-box">
      <rect x={500} y={yOffset} width={200} height={powerBoxHeight} rx={4} fill="#f1f8e9" stroke="#388e3c" strokeWidth="1"/>
      <text x={510} y={yOffset + 20} fontSize="14" fontWeight="bold">⚡ 전원 공급</text>
      {power.map((pwr, idx) => (
        <g key={idx}>
          <text x={510} y={yOffset + 40 + idx * 25} fontSize="12" fontWeight="bold">
            {pwr.voltage}V: {pwr.minCurrentA}A
          </text>
          <text x={510} y={yOffset + 55 + idx * 25} fontSize="10" fill="#666">
            {pwr.devices.join(', ')}
          </text>
        </g>
      ))}
    </g>
  );
  yOffset += powerBoxHeight + 20;
  
  // 충돌 경고 박스
  if (allocation.conflicts.length > 0) {
    const conflictBoxHeight = Math.max(80, 40 + allocation.conflicts.length * 15);
    boxes.push(
      <g key="conflict-box">
        <rect x={500} y={yOffset} width={200} height={conflictBoxHeight} rx={4} fill="#ffebee" stroke="#d32f2f" strokeWidth="1"/>
        <text x={510} y={yOffset + 20} fontSize="14" fontWeight="bold">⚠️ 충돌 경고</text>
        {allocation.conflicts.map((conflict, idx) => (
          <text key={idx} x={510} y={yOffset + 40 + idx * 15} fontSize="10" fill="#d32f2f">
            {conflict}
          </text>
        ))}
      </g>
    );
    yOffset += conflictBoxHeight + 20;
  }
  
  // 핀 연결 정보 박스 (스크롤 가능하도록 높이 제한)
  const maxConnections = Math.min(pinConnections.length, 15); // 최대 15개만 표시
  const connectionBoxHeight = Math.max(120, 40 + maxConnections * 15);
  boxes.push(
    <g key="connection-box">
      <rect x={500} y={yOffset} width={200} height={connectionBoxHeight} rx={4} fill="#f8f9fa" stroke="#6c757d" strokeWidth="1"/>
      <text x={510} y={yOffset + 20} fontSize="14" fontWeight="bold">📋 핀 연결 정보</text>
      {pinConnections.slice(0, maxConnections).map((conn, idx) => (
        <text key={idx} x={510} y={yOffset + 40 + idx * 15} fontSize="10">
          {conn.pin} → {conn.component.length > 20 ? conn.component.substring(0, 20) + '...' : conn.component}
        </text>
      ))}
      {pinConnections.length > maxConnections && (
        <text x={510} y={yOffset + 40 + maxConnections * 15} fontSize="10" fill="#666">
          ... 외 {pinConnections.length - maxConnections}개 더
        </text>
      )}
    </g>
  );
  
  return boxes;
}

// 핀 연결선 생성
function generateConnectionLines(pinConnections: any[], device: string) {
  const allLines: any[] = [];

  pinConnections.forEach((conn, idx) => {
    const deviceInfo = getDeviceInfo(device);
    const devicePins = deviceInfo.pins;
    
    // 핀 번호가 숫자인 경우와 문자열인 경우 모두 처리
    const pinInfo = devicePins.find(p => 
      p.num === conn.pin || 
      p.num === String(conn.pin) ||
      (typeof conn.pin === 'number' && p.num === conn.pin) ||
      (typeof conn.pin === 'string' && p.num === conn.pin)
    );
    
    // VCC, GND 같은 문자열 핀은 특별한 위치에 표시
    if (!pinInfo) {
      if (conn.pin === 'VCC') {
        allLines.push(
          <g key={idx}>
            <line 
              x1={43} y1={50} 
              x2={300} y2={100 + conn.deviceIndex * 80} 
              stroke="#ff4444" 
              strokeWidth="3"
              strokeDasharray="8,4"
              opacity="0.8"
            />
            <circle cx={43} cy={50} r="3" fill="#ff4444" stroke="#fff" strokeWidth="1"/>
            <text x={47} y={53} fontSize="9" fontWeight="bold" fill="#ff4444">VCC</text>
            <circle cx={300} cy={100 + conn.deviceIndex * 80} r="2" fill="#ff4444" />
          </g>
        );
      } else if (conn.pin === 'GND') {
        allLines.push(
          <g key={idx}>
            <line 
              x1={43} y1={520} 
              x2={300} y2={100 + conn.deviceIndex * 80} 
              stroke="#444444" 
              strokeWidth="3"
              strokeDasharray="8,4"
              opacity="0.8"
            />
            <circle cx={43} cy={520} r="3" fill="#444444" stroke="#fff" strokeWidth="1"/>
            <text x={47} y={523} fontSize="9" fontWeight="bold" fill="#444444">GND</text>
            <circle cx={300} cy={100 + conn.deviceIndex * 80} r="2" fill="#444444" />
          </g>
        );
      }
      return;
    }
    
    const startX = pinInfo.x;
    const startY = pinInfo.y;
    const endX = 300; // 컴포넌트 위치
    const endY = 100 + conn.deviceIndex * 80; // 컴포넌트 Y 위치 (각 인스턴스별로 배치)
    
    // 연결선 색상 (센서는 파란색, 제어는 주황색)
    const lineColor = conn.type === 'sensor' ? '#1976d2' : '#f57c00';
    
    // 연결 타입별 색상 변화
    const connectionColors: Record<string, string> = {
      'VCC': '#ff4444',    // 빨간색 (전원)
      'GND': '#444444',    // 검은색 (그라운드)
      'Data': '#00aa00',   // 초록색 (데이터)
      'SDA': '#0066cc',    // 파란색 (I2C 데이터)
      'SCL': '#0066cc',    // 파란색 (I2C 클럭)
      'Analog': '#aa6600', // 갈색 (아날로그)
      'Digital': '#aa00aa', // 보라색 (디지털)
      'Control': '#ff6600', // 주황색 (제어)
      'PWM': '#ff0066',    // 분홍색 (PWM)
      'Step': '#00ff66',   // 연두색 (스테퍼 스텝)
      'Dir': '#66ff00'     // 연두색 (스테퍼 방향)
    };
    
    const finalColor = connectionColors[conn.connectionType] || lineColor;
    
    allLines.push(
      <g key={idx}>
        {/* 연결선 */}
        <line 
          x1={startX} y1={startY} 
          x2={endX} y2={endY} 
          stroke={finalColor} 
          strokeWidth="3"
          strokeDasharray="8,4"
          opacity="0.8"
        />
        {/* 핀 번호 라벨 */}
        <circle cx={startX} cy={startY} r="3" fill={finalColor} stroke="#fff" strokeWidth="1"/>
        <text x={startX + 6} y={startY + 2} fontSize="9" fontWeight="bold" fill={finalColor}>
          {conn.pin}
        </text>
        {/* 컴포넌트 연결점 */}
        <circle cx={endX} cy={endY} r="2" fill={finalColor} />
      </g>
    );
  });

  return allLines;
}

// 핀 연결 정보 생성 (단순화된 버전)
function generatePinConnections(spec: any, allocation: any) {
  const connections = [];
  
  console.log('🔍 generatePinConnections 호출됨:', { spec, allocation });
  
  // 센서 이름 매핑
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
  
  // 센서 연결 (새로운 키 형식 사용)
  spec.sensors.forEach((sensor: any, sensorIdx: number) => {
    const sensorName = sensorNames[sensor.type] || sensor.type.toUpperCase();
    
    // 각 센서 인스턴스마다 기본 연결선 생성
    for (let instance = 0; instance < sensor.count; instance++) {
      const instanceKey = `sensor_${sensor.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      const assignedPin = assignedPins[0] || { pin: 2 }; // 기본 핀
      
      console.log(`📡 센서 ${sensor.type} 인스턴스 ${instance + 1}:`, { instanceKey, assignedPins, assignedPin });
      
      // VCC, GND, Data 연결선 생성
      // 전체 인덱스 계산 (센서들 먼저, 그 다음 제어장치들)
      let globalIndex = 0;
      for (let i = 0; i < sensorIdx; i++) {
        globalIndex += spec.sensors[i].count;
      }
      globalIndex += instance;
      
      connections.push({
        pin: 'VCC',
        component: `${sensorName} #${instance + 1} (VCC)`,
        type: 'sensor',
        connectionType: 'VCC',
        deviceIndex: globalIndex
      });
      
      connections.push({
        pin: 'GND',
        component: `${sensorName} #${instance + 1} (GND)`,
        type: 'sensor',
        connectionType: 'GND',
        deviceIndex: globalIndex
      });
      
      connections.push({
        pin: assignedPin.pin,
        component: `${sensorName} #${instance + 1} (Data)`,
        type: 'sensor',
        connectionType: 'Data',
        deviceIndex: globalIndex
      });
    }
  });
  
  // 제어 연결 (새로운 키 형식 사용)
  spec.controls.forEach((control: any, controlIdx: number) => {
    const controlName = controlNames[control.type] || control.type.toUpperCase();
    
    // 각 제어장치 인스턴스마다 기본 연결선 생성
    for (let instance = 0; instance < control.count; instance++) {
      const instanceKey = `control_${control.type}_${instance}`;
      const assignedPins = allocation.assigned[instanceKey] || [];
      const assignedPin = assignedPins[0] || { pin: 4 }; // 기본 핀
      
      console.log(`🎛️ 제어장치 ${control.type} 인스턴스 ${instance + 1}:`, { instanceKey, assignedPins, assignedPin });
      
      // VCC, GND, Control 연결선 생성
      // 전체 인덱스 계산 (센서들 먼저, 그 다음 제어장치들)
      let globalIndex = 0;
      // 센서들 개수 합산
      for (let i = 0; i < spec.sensors.length; i++) {
        globalIndex += spec.sensors[i].count;
      }
      // 제어장치들 개수 합산
      for (let i = 0; i < controlIdx; i++) {
        globalIndex += spec.controls[i].count;
      }
      globalIndex += instance;
      
      connections.push({
        pin: 'VCC',
        component: `${controlName} #${instance + 1} (VCC)`,
        type: 'control',
        connectionType: 'VCC',
        deviceIndex: globalIndex
      });
      
      connections.push({
        pin: 'GND',
        component: `${controlName} #${instance + 1} (GND)`,
        type: 'control',
        connectionType: 'GND',
        deviceIndex: globalIndex
      });
      
      connections.push({
        pin: assignedPin.pin,
        component: `${controlName} #${instance + 1} (Control)`,
        type: 'control',
        connectionType: 'Control',
        deviceIndex: globalIndex
      });
    }
  });
  
  console.log('🔗 생성된 연결선:', connections);
  return connections;
}

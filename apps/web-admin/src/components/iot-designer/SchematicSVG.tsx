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
      
      <div className="mt-4 text-sm text-gray-600">
        <p>📋 회로도 설명:</p>
        <ul className="list-disc list-inside ml-4">
          <li>ESP32와 센서/제어 장치 간 핀 연결</li>
          <li>전원 공급 요구사항 표시</li>
          <li>핀 충돌 시 경고 표시</li>
        </ul>
      </div>
    </div>
  );
}

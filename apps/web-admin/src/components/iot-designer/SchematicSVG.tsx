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
  
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">회로도</h3>
      
      <svg width="920" height="520" className="border">
        {/* ESP32 본체 */}
        <rect x={40} y={40} width={220} height={440} rx={12} fill="#f0f0f0" stroke="#333" strokeWidth="2"/>
        <text x={50} y={60} fontSize="16" fontWeight="bold">ESP32</text>
        
        {/* 핀 라벨들 */}
        <text x={50} y={90} fontSize="12">핀 4</text>
        <text x={50} y={110} fontSize="12">핀 5</text>
        <text x={50} y={130} fontSize="12">핀 12</text>
        <text x={50} y={150} fontSize="12">핀 13</text>
        <text x={50} y={170} fontSize="12">핀 14</text>
        <text x={50} y={190} fontSize="12">핀 15</text>
        <text x={50} y={210} fontSize="12">핀 16</text>
        <text x={50} y={230} fontSize="12">핀 17</text>
        <text x={50} y={250} fontSize="12">핀 18</text>
        <text x={50} y={270} fontSize="12">핀 19</text>
        <text x={50} y={290} fontSize="12">핀 21</text>
        <text x={50} y={310} fontSize="12">핀 22</text>
        <text x={50} y={330} fontSize="12">핀 23</text>
        
        {/* 센서 박스들 */}
        {spec.sensors.map((sensor, idx) => {
          const y = 100 + idx * 80;
          return (
            <g key={`sensor_${sensor.type}_${idx}`}>
              <rect x={320} y={y} width={120} height={60} rx={4} fill="#e3f2fd" stroke="#1976d2" strokeWidth="1"/>
              <text x={330} y={y + 20} fontSize="12" fontWeight="bold">{sensor.type.toUpperCase()}</text>
              <text x={330} y={y + 35} fontSize="10">× {sensor.count}</text>
              <text x={330} y={y + 50} fontSize="10">핀 연결</text>
            </g>
          );
        })}
        
        {/* 제어 박스들 */}
        {spec.controls.map((control, idx) => {
          const y = 100 + (spec.sensors.length + idx) * 80;
          return (
            <g key={`control_${control.type}_${idx}`}>
              <rect x={320} y={y} width={120} height={60} rx={4} fill="#fff3e0" stroke="#f57c00" strokeWidth="1"/>
              <text x={330} y={y + 20} fontSize="12" fontWeight="bold">{control.type.toUpperCase()}</text>
              <text x={330} y={y + 35} fontSize="10">× {control.count}</text>
              <text x={330} y={y + 50} fontSize="10">핀 연결</text>
            </g>
          );
        })}
        
        {/* 연결선들 (예시) */}
        <line x1={260} y1={90} x2={320} y2={130} stroke="#333" strokeWidth="2"/>
        <line x1={260} y1={110} x2={320} y2={170} stroke="#333" strokeWidth="2"/>
        
        {/* 전원 공급 표시 */}
        <rect x={500} y={40} width={120} height={100} rx={4} fill="#f1f8e9" stroke="#388e3c" strokeWidth="1"/>
        <text x={510} y={60} fontSize="12" fontWeight="bold">전원 공급</text>
        {power.map((pwr, idx) => (
          <text key={idx} x={510} y={80 + idx * 15} fontSize="10">
            {pwr.voltage}V: {pwr.minCurrentA}A
          </text>
        ))}
        
        {/* 충돌 경고 */}
        {allocation.conflicts.length > 0 && (
          <rect x={500} y={200} width={200} height={100} rx={4} fill="#ffebee" stroke="#d32f2f" strokeWidth="1"/>
        )}
        {allocation.conflicts.map((conflict, idx) => (
          <text key={idx} x={510} y={220 + idx * 15} fontSize="10" fill="#d32f2f">
            ⚠️ {conflict}
          </text>
        ))}
      </svg>
      
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

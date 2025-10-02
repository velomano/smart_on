import React, { useState, useEffect } from 'react';

interface MqttDesignGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFarmId?: string;
  currentFarmName?: string;
}


interface FarmBed {
  id: string;
  name: string;
  farm_id: string;
}

export default function MqttDesignGuideModal({ 
  isOpen, 
  onClose, 
  currentFarmId, 
  currentFarmName 
}: MqttDesignGuideModalProps) {
  const [loading, setLoading] = useState(false);
  const [existingBeds, setExistingBeds] = useState<FarmBed[]>([]);
  const [selectedBed, setSelectedBed] = useState<string>('');
  const [generatedDeviceId, setGeneratedDeviceId] = useState<string>('');
  const [generatedCustomId, setGeneratedCustomId] = useState<string>('');

  const loadExistingBeds = async () => {
    if (!currentFarmId) return;
    
    setLoading(true);
    try {
      // 농장관리 페이지에서 생성된 베드들을 조회
      const response = await fetch(`/api/farms/${currentFarmId}/beds`);
      const data = await response.json();
      if (data.success) {
        setExistingBeds(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedBed(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load existing beds:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentFarmId) {
      loadExistingBeds();
    }
  }, [isOpen, currentFarmId]);

  const generateDeviceId = async () => {
    try {
      const response = await fetch('/api/generate-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'device_id' })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedDeviceId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to generate device ID:', error);
    }
  };

  const generateCustomDeviceId = async () => {
    try {
      const response = await fetch('/api/generate-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'custom_device_id' })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedCustomId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to generate custom device ID:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // 간단한 알림 (실제로는 토스트 메시지 사용 권장)
    alert('클립보드에 복사되었습니다!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">MQTT 설계 가이드</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <div className="prose max-w-none">
            
            {/* 개요 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 개요</h3>
              <p className="text-gray-700 mb-4">
                이 가이드는 스마트팜 시스템에 MQTT를 통합하는 방법을 설명합니다. 
                센서 데이터 수집, 디바이스 제어, 실시간 모니터링을 위한 완전한 가이드입니다.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">🏗️ 시스템 아키텍처</h4>
                <code className="text-sm text-blue-800">
                  센서/디바이스 → MQTT 브로커 → MQTT 브리지 → Supabase → 웹 대시보드
                </code>
              </div>
            </div>

            {/* MQTT 토픽 구조 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📡 MQTT 토픽 구조</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">기본 토픽 패턴</h4>
                <code className="text-sm text-gray-800 block mb-2">
                  farms/&#123;farm_id&#125;/beds/&#123;bed_id&#125;/devices/&#123;device_id&#125;/&#123;data_type&#125;
                </code>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">센서 데이터</h4>
                  <code className="text-sm text-green-800">
                    farms/&#123;farm_id&#125;/beds/&#123;bed_id&#125;/devices/&#123;device_id&#125;/sensors
                  </code>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">디바이스 제어</h4>
                  <code className="text-sm text-orange-800">
                    farms/&#123;farm_id&#125;/beds/&#123;bed_id&#125;/devices/&#123;device_id&#125;/commands
                  </code>
                </div>
              </div>
            </div>

            {/* ID 생성 규칙 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🗄️ ID 생성 규칙</h3>
              
              {/* 웹서버 구성된 데이터 활용 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  웹서버 구성 데이터 활용
                </h4>
                
                {/* 현재 농장 정보 */}
                <div className="mb-4 p-3 bg-white border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>현재 농장:</strong> {currentFarmName || '알 수 없음'}
                  </div>
                  <div className="text-xs text-green-600 font-mono">
                    ID: {currentFarmId || 'N/A'}
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-green-700">베드 목록 로딩 중...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 구성된 베드 목록 */}
                    {existingBeds.length > 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          농장관리에서 구성된 베드 선택 ({existingBeds.length}개)
                        </label>
                        <select
                          value={selectedBed}
                          onChange={(e) => setSelectedBed(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                        >
                          {existingBeds.map(bed => (
                            <option key={bed.id} value={bed.id}>
                              {bed.name} ({bed.id.slice(-8).toUpperCase()})
                            </option>
                          ))}
                        </select>
                        <div className="mt-2 text-xs text-green-600">
                          💡 이 베드들은 농장관리 페이지에서 생성된 실제 베드입니다.
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-yellow-800 text-sm">
                          <strong>⚠️ 베드가 없습니다</strong>
                        </div>
                        <div className="text-yellow-600 text-xs mt-1">
                          먼저 농장관리 페이지에서 베드를 생성해주세요.
                        </div>
                      </div>
                    )}

                    {/* 디바이스 ID 생성 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">UUID 디바이스 ID</div>
                          <div className="text-sm text-gray-500">완전한 UUID v4 형태</div>
                          {generatedDeviceId && (
                            <code className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded mt-1 inline-block">
                              {generatedDeviceId}
                            </code>
                          )}
                        </div>
                        <button
                          onClick={generateDeviceId}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          생성
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">커스텀 디바이스 ID</div>
                          <div className="text-sm text-gray-500">사용자 친화적 형태 (pi-001, esp32-002 등)</div>
                          {generatedCustomId && (
                            <code className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                              {generatedCustomId}
                            </code>
                          )}
                        </div>
                        <button
                          onClick={generateCustomDeviceId}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          생성
                        </button>
                      </div>
                    </div>

                    {/* 완성된 MQTT 토픽 표시 */}
                    {currentFarmId && selectedBed && (generatedDeviceId || generatedCustomId) && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg border">
                        <h5 className="text-gray-800 font-semibold mb-3">완성된 MQTT 토픽:</h5>
                        <div className="space-y-3">
                          <div className="text-green-600 text-sm">
                            <span className="text-gray-600 font-medium">센서 데이터:</span>
                            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                              <code className="text-xs bg-white border px-3 py-2 rounded flex-1 break-all text-gray-800">
                                farms/{currentFarmId}/beds/{selectedBed}/devices/{generatedDeviceId || generatedCustomId}/sensors
                              </code>
                              <button
                                onClick={() => copyToClipboard(`farms/${currentFarmId}/beds/${selectedBed}/devices/${generatedDeviceId || generatedCustomId}/sensors`)}
                                className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium whitespace-nowrap"
                              >
                                복사
                              </button>
                            </div>
                          </div>
                          <div className="text-blue-600 text-sm">
                            <span className="text-gray-600 font-medium">디바이스 제어:</span>
                            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                              <code className="text-xs bg-white border px-3 py-2 rounded flex-1 break-all text-gray-800">
                                farms/{currentFarmId}/beds/{selectedBed}/devices/{generatedDeviceId || generatedCustomId}/commands
                              </code>
                              <button
                                onClick={() => copyToClipboard(`farms/${currentFarmId}/beds/${selectedBed}/devices/${generatedDeviceId || generatedCustomId}/commands`)}
                                className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium whitespace-nowrap"
                              >
                                복사
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ID 규칙 테이블 */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">ID 타입</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">형식</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">예시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">농장 ID</td>
                      <td className="px-4 py-2 text-sm text-gray-600">UUID v4 (DB 연동)</td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-800">550e8400-e29b-41d4-a716-446655440002</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">베드 ID</td>
                      <td className="px-4 py-2 text-sm text-gray-600">UUID v4 (DB 연동)</td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-800">550e8400-e29b-41d4-a716-446655440003</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">디바이스 ID</td>
                      <td className="px-4 py-2 text-sm text-gray-600">UUID v4 또는 커스텀</td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-800">pi-001, esp32-001</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 센서 데이터 메시지 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 센서 데이터 메시지 구조</h3>
              <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto border">
                <pre className="text-green-300 text-sm">
{`{
  "device_id": "pi-001",
  "bed_id": "550e8400-e29b-41d4-a716-446655440003",
  "farm_id": "550e8400-e29b-41d4-a716-446655440002",
  "sensors": {
    "temp": 25.3,
    "humidity": 65.2,
    "ec": 2.1,
    "ph": 6.5,
    "water_level": 85.0,
    "light": 1200.5
  },
  "metadata": {
    "location": "베드-1",
    "crop_name": "토마토",
    "growing_method": "점적식"
  },
  "timestamp": "2025-09-28T17:35:00Z",
  "quality": 1
}`}
                </pre>
              </div>
            </div>

            {/* 지원 센서 타입 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🌡️ 지원 센서 타입</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">센서 타입</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">단위</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">범위</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr><td className="px-4 py-2 text-sm text-gray-900">temp</td><td className="px-4 py-2 text-sm text-gray-600">°C</td><td className="px-4 py-2 text-sm text-gray-600">-10 ~ 50</td></tr>
                    <tr><td className="px-4 py-2 text-sm text-gray-900">humidity</td><td className="px-4 py-2 text-sm text-gray-600">%</td><td className="px-4 py-2 text-sm text-gray-600">0 ~ 100</td></tr>
                    <tr><td className="px-4 py-2 text-sm text-gray-900">ec</td><td className="px-4 py-2 text-sm text-gray-600">mS/cm</td><td className="px-4 py-2 text-sm text-gray-600">0 ~ 5</td></tr>
                    <tr><td className="px-4 py-2 text-sm text-gray-900">ph</td><td className="px-4 py-2 text-sm text-gray-600">pH</td><td className="px-4 py-2 text-sm text-gray-600">0 ~ 14</td></tr>
                    <tr><td className="px-4 py-2 text-sm text-gray-900">water_level</td><td className="px-4 py-2 text-sm text-gray-600">%</td><td className="px-4 py-2 text-sm text-gray-600">0 ~ 100</td></tr>
                    <tr><td className="px-4 py-2 text-sm text-gray-900">light</td><td className="px-4 py-2 text-sm text-gray-600">lux</td><td className="px-4 py-2 text-sm text-gray-600">0 ~ 100000</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 디바이스 제어 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🎛️ 디바이스 제어</h3>
              <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto border">
                <pre className="text-blue-300 text-sm">
{`{
  "command_id": "cmd-12345",
  "device_id": "tuya-light-001",
  "bed_id": "550e8400-e29b-41d4-a716-446655440003",
  "farm_id": "550e8400-e29b-41d4-a716-446655440002",
  "command": "turn_on",
  "payload": {
    "brightness": 80,
    "color_temp": 4000
  },
  "timestamp": "2025-09-28T17:35:00Z"
}`}
                </pre>
              </div>
            </div>

            {/* Python 예시 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🐍 Python 클라이언트 예시</h3>
              <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto border">
                <pre className="text-green-300 text-sm">
{`import paho.mqtt.client as mqtt
import json
from datetime import datetime

# MQTT 클라이언트 설정
client = mqtt.Client()
client.username_pw_set("username", "password")
client.connect("mqtt://broker.hivemq.com", 1883, 60)

# 센서 데이터 전송
sensor_data = {
    "device_id": "pi-001",
    "bed_id": "550e8400-e29b-41d4-a716-446655440003",
    "farm_id": "550e8400-e29b-41d4-a716-446655440002",
    "sensors": {
        "temp": 25.3,
        "humidity": 65.2,
        "ec": 2.1,
        "ph": 6.5
    },
    "timestamp": datetime.utcnow().isoformat() + "Z"
}

topic = "farms/{farm_id}/beds/{bed_id}/devices/{device_id}/sensors"
client.publish(topic, json.dumps(sensor_data), qos=1)`}
                </pre>
              </div>
            </div>

            {/* 체크리스트 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 개발 체크리스트</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">개발 전</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      MQTT 브로커 설정 완료
                    </li>
                    <li className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      농장 ID, 베드 ID 확인
                    </li>
                    <li className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      디바이스 ID 규칙 정립
                    </li>
                    <li className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      센서 타입 및 단위 정의
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">개발 중</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      토픽 구조 준수
                    </li>
                    <li className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      JSON 메시지 형식 준수
                    </li>
                    <li className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      에러 처리 구현
                    </li>
                    <li className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      재연결 로직 구현
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🚨 주의사항</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-red-800">
                  <li>• <strong>ID 생성:</strong> 농장 ID와 베드 ID는 반드시 데이터베이스에 존재하는 값 사용</li>
                  <li>• <strong>메시지 크기:</strong> MQTT 메시지는 실용적으로 1KB 이하 권장</li>
                  <li>• <strong>전송 주기:</strong> 센서 데이터는 최소 30초 간격으로 전송 권장</li>
                  <li>• <strong>에러 처리:</strong> 네트워크 오류 시 재연결 및 재전송 로직 필수</li>
                  <li>• <strong>보안:</strong> 프로덕션 환경에서는 반드시 SSL/TLS 사용</li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <strong>버전:</strong> 1.0 | <strong>업데이트:</strong> 2025-09-28
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

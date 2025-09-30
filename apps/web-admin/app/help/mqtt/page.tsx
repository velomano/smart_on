'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AppHeader from '../../../src/components/AppHeader';

interface TabType {
  id: string;
  label: string;
  icon: string;
}

export default function MqttIntegrationGuidePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  // URL 파라미터에서 탭 설정
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs: TabType[] = [
    { id: 'overview', label: '개요', icon: '🏗️' },
    { id: 'broker-setup', label: '브로커 설정', icon: '🔧' },
    { id: 'device-integration', label: '디바이스 연동', icon: '💻' },
    { id: 'topics', label: '토픽 구조', icon: '📡' },
    { id: 'security', label: '보안', icon: '🔒' },
    { id: 'troubleshooting', label: '문제해결', icon: '🔍' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">🏗️ MQTT 아키텍처 개요</h2>
        <p className="text-indigo-800 mb-4">
          스마트팜 플랫폼은 MQTT 프로토콜을 통해 IoT 디바이스와 실시간 통신합니다.
        </p>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <h3 className="text-lg font-semibold text-indigo-900 mb-3">데이터 흐름</h3>
          <div className="flex flex-wrap items-center justify-center space-x-4 space-y-2">
            <div className="bg-green-100 px-4 py-2 rounded-lg text-sm font-medium">디바이스/센서</div>
            <div className="text-gray-400 text-lg">→</div>
            <div className="bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium">MQTT 브로커</div>
            <div className="text-gray-400 text-lg">→</div>
            <div className="bg-purple-100 px-4 py-2 rounded-lg text-sm font-medium">스마트팜 브리지</div>
            <div className="text-gray-400 text-lg">→</div>
            <div className="bg-orange-100 px-4 py-2 rounded-lg text-sm font-medium">웹 대시보드</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 센서 데이터 수집</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>온도/습도 센서</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>EC/pH 센서</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>수위 센서</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>조도 센서</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🎛️ 디바이스 제어</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>펌프 제어</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>밸브 제어</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>LED 제어</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>팬 제어</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">⚡ 주요 특징</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🔄</div>
            <h4 className="font-medium">실시간 통신</h4>
            <p className="text-sm text-gray-600">저지연 실시간 데이터 전송</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🔒</div>
            <h4 className="font-medium">보안 연결</h4>
            <p className="text-sm text-gray-600">TLS/SSL 암호화 지원</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-medium">확장성</h4>
            <p className="text-sm text-gray-600">수천 개 디바이스 지원</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrokerSetup = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">🔧 MQTT 브로커 설정</h2>
        <p className="text-blue-800 mb-4">
          MQTT 브로커를 선택하고 설정하여 스마트팜 플랫폼과 연동하세요.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🐛</div>
            <h3 className="text-lg font-semibold text-gray-900">Eclipse Mosquitto</h3>
            <p className="text-sm text-gray-600">오픈소스 MQTT 브로커</p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">장점</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 무료 오픈소스</li>
                <li>• 가벼운 리소스 사용</li>
                <li>• 설정 간단</li>
                <li>• Docker 지원</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">적합한 경우</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 소규모 농장</li>
                <li>• 개발/테스트 환경</li>
                <li>• 비용 절약이 중요한 경우</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900">EMQX</h3>
            <p className="text-sm text-gray-600">엔터프라이즈급 MQTT 브로커</p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">장점</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 높은 성능</li>
                <li>• 클러스터링 지원</li>
                <li>• 풍부한 기능</li>
                <li>• 웹 관리 인터페이스</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">적합한 경우</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 대규모 농장</li>
                <li>• 높은 안정성 요구</li>
                <li>• 복잡한 라우팅 필요</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">☁️</div>
            <h3 className="text-lg font-semibold text-gray-900">AWS IoT Core</h3>
            <p className="text-sm text-gray-600">클라우드 MQTT 서비스</p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">장점</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 완전 관리형 서비스</li>
                <li>• 자동 스케일링</li>
                <li>• AWS 생태계 연동</li>
                <li>• 높은 가용성</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">적합한 경우</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 클라우드 우선 전략</li>
                <li>• AWS 사용 중인 경우</li>
                <li>• 서버 관리 부담 회피</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 빠른 설정 가이드</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
            <div>
              <h4 className="font-medium text-gray-900">브로커 선택</h4>
              <p className="text-sm text-gray-600">농장 규모와 요구사항에 맞는 브로커 선택</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
            <div>
              <h4 className="font-medium text-gray-900">설치 및 설정</h4>
              <p className="text-sm text-gray-600">선택한 브로커 설치 및 기본 설정</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
            <div>
              <h4 className="font-medium text-gray-900">보안 설정</h4>
              <p className="text-sm text-gray-600">TLS/SSL, 인증, 권한 설정</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
            <div>
              <h4 className="font-medium text-gray-900">연결 테스트</h4>
              <p className="text-sm text-gray-600">MQTT 클라이언트로 연결 테스트</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeviceIntegration = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">💻 디바이스 연동 가이드</h2>
        <p className="text-green-800 mb-4">
          다양한 플랫폼과 언어로 디바이스를 스마트팜 플랫폼에 연동하세요.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🔌</div>
            <h3 className="text-lg font-semibold text-gray-900">Arduino/ESP32</h3>
            <p className="text-sm text-gray-600">마이크로컨트롤러 기반</p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">필요 라이브러리</h4>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono">
                <div>#include &lt;WiFi.h&gt;</div>
                <div>#include &lt;PubSubClient.h&gt;</div>
                <div>#include &lt;ArduinoJson.h&gt;</div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">주요 기능</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• WiFi 연결</li>
                <li>• MQTT 연결</li>
                <li>• 센서 데이터 전송</li>
                <li>• 명령 수신 및 처리</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🐍</div>
            <h3 className="text-lg font-semibold text-gray-900">Python</h3>
            <p className="text-sm text-gray-600">고급 기능 및 데이터 처리</p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">필요 패키지</h4>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono">
                <div>pip install paho-mqtt</div>
                <div>pip install requests</div>
                <div>pip install schedule</div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">주요 기능</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 비동기 처리</li>
                <li>• 데이터 전처리</li>
                <li>• 스케줄링</li>
                <li>• 로깅 시스템</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🟢</div>
            <h3 className="text-lg font-semibold text-gray-900">Node.js</h3>
            <p className="text-sm text-gray-600">웹 기반 IoT 게이트웨이</p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">필요 패키지</h4>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono">
                <div>npm install mqtt</div>
                <div>npm install express</div>
                <div>npm install ws</div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">주요 기능</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 웹 인터페이스</li>
                <li>• 실시간 통신</li>
                <li>• 프로토콜 변환</li>
                <li>• REST API 제공</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 연동 단계</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
            <div>
              <h4 className="font-medium text-gray-900">템플릿 다운로드</h4>
              <p className="text-sm text-gray-600">언어별 기본 템플릿 코드 다운로드</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
            <div>
              <h4 className="font-medium text-gray-900">설정 수정</h4>
              <p className="text-sm text-gray-600">브로커 URL, 포트, 인증 정보 입력</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
            <div>
              <h4 className="font-medium text-gray-900">센서/액추에이터 추가</h4>
              <p className="text-sm text-gray-600">실제 하드웨어와 연결하고 코드 수정</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
            <div>
              <h4 className="font-medium text-gray-900">테스트 및 배포</h4>
              <p className="text-sm text-gray-600">연동 테스트 후 실제 환경에 배포</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTopics = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">📡 MQTT 토픽 구조</h2>
        <p className="text-purple-800 mb-4">
          스마트팜 플랫폼에서 사용하는 표준화된 토픽 구조입니다.
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗️ 기본 토픽 패턴</h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
          <div className="text-gray-600 mb-2">표준 토픽 구조:</div>
          <div className="text-blue-600 text-lg font-bold mb-4">
            farms/{'{farm_id}'}/devices/{'{device_id}'}/{'{message_type}'}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-gray-600 mb-2">파라미터:</div>
              <ul className="space-y-1 text-gray-700">
                <li><span className="text-green-600 font-bold">farm_id:</span> 농장 고유 ID</li>
                <li><span className="text-blue-600 font-bold">device_id:</span> 디바이스 고유 ID</li>
                <li><span className="text-purple-600 font-bold">message_type:</span> 메시지 타입</li>
              </ul>
            </div>
            
            <div>
              <div className="text-gray-600 mb-2">예시:</div>
              <div className="bg-gray-800 text-green-400 p-3 rounded text-xs">
                <div>farms/farm_001/devices/sensor_001/telemetry</div>
                <div>farms/farm_001/devices/pump_001/command</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📤 발행 (Publish) 토픽</h3>
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">📊 telemetry</h4>
              <p className="text-sm text-green-700">센서 데이터 전송</p>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono mt-2">
                farms/farm_001/devices/sensor_001/telemetry
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">📋 registry</h4>
              <p className="text-sm text-blue-700">디바이스 등록 정보</p>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono mt-2">
                farms/farm_001/devices/device_001/registry
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-1">📈 state</h4>
              <p className="text-sm text-purple-700">디바이스 상태 정보</p>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono mt-2">
                farms/farm_001/devices/device_001/state
              </div>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-1">✅ command/ack</h4>
              <p className="text-sm text-orange-700">명령 실행 확인 응답</p>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono mt-2">
                farms/farm_001/devices/device_001/command/ack
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📥 구독 (Subscribe) 토픽</h3>
          <div className="space-y-3">
            <div className="bg-red-50 p-3 rounded-lg">
              <h4 className="font-medium text-red-900 mb-1">🎛️ command</h4>
              <p className="text-sm text-red-700">디바이스 제어 명령</p>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono mt-2">
                farms/farm_001/devices/device_001/command
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">🔄 config</h4>
              <p className="text-sm text-yellow-700">디바이스 설정 변경</p>
              <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono mt-2">
                farms/farm_001/devices/device_001/config
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 메시지 포맷</h3>
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">📊 Telemetry 메시지</h4>
            <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
              <div>{'{'}</div>
              <div>  "timestamp": "2024-01-15T10:30:00Z",</div>
              <div>  "sensor_type": "temperature",</div>
              <div>  "value": 25.5,</div>
              <div>  "unit": "celsius",</div>
              <div>  "device_id": "sensor_001"</div>
              <div>{'}'}</div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">🎛️ Command 메시지</h4>
            <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
              <div>{'{'}</div>
              <div>  "command_id": "cmd_001",</div>
              <div>  "action": "pump_on",</div>
              <div>  "parameters": {'{'} "duration": 30 {'}'},</div>
              <div>  "timestamp": "2024-01-15T10:30:00Z"</div>
              <div>{'}'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-4">🔒 MQTT 보안 설정</h2>
        <p className="text-red-800 mb-4">
          MQTT 브로커와 디바이스 간의 안전한 통신을 위한 보안 설정입니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 인증 및 권한</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">사용자 인증</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 사용자명/비밀번호</li>
                <li>• 클라이언트 인증서</li>
                <li>• JWT 토큰</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">토픽 권한</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 읽기/쓰기 권한 분리</li>
                <li>• 농장별 접근 제한</li>
                <li>• 디바이스별 권한</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ 암호화</h3>
          <div className="space-y-3">
            <div className="bg-purple-50 p-3 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-1">TLS/SSL</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• 전송 데이터 암호화</li>
                <li>• 서버 인증</li>
                <li>• 클라이언트 인증</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-1">메시지 암호화</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• 페이로드 암호화</li>
                <li>• 디지털 서명</li>
                <li>• 타임스탬프 검증</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 보안 설정 단계</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
            <div>
              <h4 className="font-medium text-gray-900">인증서 생성</h4>
              <p className="text-sm text-gray-600">CA 인증서, 서버 인증서, 클라이언트 인증서 생성</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
            <div>
              <h4 className="font-medium text-gray-900">브로커 보안 설정</h4>
              <p className="text-sm text-gray-600">TLS 포트 설정, ACL 파일 구성</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">3</div>
            <div>
              <h4 className="font-medium text-gray-900">디바이스 설정</h4>
              <p className="text-sm text-gray-600">클라이언트 인증서 및 보안 설정 적용</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
            <div>
              <h4 className="font-medium text-gray-900">테스트 및 모니터링</h4>
              <p className="text-sm text-gray-600">보안 연결 테스트 및 지속적 모니터링</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTroubleshooting = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
        <h2 className="text-2xl font-bold text-yellow-900 mb-4">🔍 문제해결 가이드</h2>
        <p className="text-yellow-800 mb-4">
          MQTT 연동 시 발생할 수 있는 일반적인 문제들과 해결 방법입니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔌 연결 문제</h3>
          <div className="space-y-3">
            <div className="bg-red-50 p-3 rounded-lg">
              <h4 className="font-medium text-red-900 mb-1">연결 실패</h4>
              <p className="text-sm text-red-700 mb-2">디바이스가 브로커에 연결되지 않음</p>
              <ul className="text-xs text-red-600 space-y-1">
                <li>• 네트워크 연결 확인</li>
                <li>• 브로커 URL/포트 확인</li>
                <li>• 방화벽 설정 확인</li>
                <li>• 인증 정보 확인</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">연결 끊김</h4>
              <p className="text-sm text-yellow-700 mb-2">주기적으로 연결이 끊어짐</p>
              <ul className="text-xs text-yellow-600 space-y-1">
                <li>• Keep Alive 설정 확인</li>
                <li>• 네트워크 안정성 확인</li>
                <li>• 브로커 리소스 확인</li>
                <li>• 재연결 로직 구현</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📡 통신 문제</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">메시지 수신 안됨</h4>
              <p className="text-sm text-blue-700 mb-2">토픽 구독 후 메시지가 오지 않음</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• 토픽 패턴 확인</li>
                <li>• QoS 레벨 확인</li>
                <li>• 권한 설정 확인</li>
                <li>• 발행자 확인</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">메시지 전송 실패</h4>
              <p className="text-sm text-green-700 mb-2">메시지 발행이 실패함</p>
              <ul className="text-xs text-green-600 space-y-1">
                <li>• 토픽 권한 확인</li>
                <li>• 메시지 크기 확인</li>
                <li>• 연결 상태 확인</li>
                <li>• 브로커 설정 확인</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛠️ 디버깅 도구</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🔍</div>
            <h4 className="font-medium">MQTT Explorer</h4>
            <p className="text-sm text-gray-600">토픽 모니터링 도구</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium">MQTT.fx</h4>
            <p className="text-sm text-gray-600">클라이언트 테스트 도구</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📝</div>
            <h4 className="font-medium">로그 분석</h4>
            <p className="text-sm text-gray-600">브로커 로그 확인</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📞 지원</h3>
        <div className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📚 문서</h4>
            <p className="text-sm text-blue-700">상세한 설정 가이드와 API 문서를 확인하세요.</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">💬 커뮤니티</h4>
            <p className="text-sm text-green-700">다른 사용자들과 문제를 공유하고 해결책을 찾아보세요.</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">🔧 기술 지원</h4>
            <p className="text-sm text-purple-700">복잡한 문제는 기술 지원팀에 문의하세요.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'broker-setup':
        return renderBrokerSetup();
      case 'device-integration':
        return renderDeviceIntegration();
      case 'topics':
        return renderTopics();
      case 'security':
        return renderSecurity();
      case 'troubleshooting':
        return renderTroubleshooting();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="MQTT 연동 가이드" subtitle="완전한 IoT 디바이스 연동 가이드" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

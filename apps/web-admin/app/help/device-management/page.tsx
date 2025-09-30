'use client';

import React, { useState } from 'react';
import AppHeader from '../../../src/components/AppHeader';

interface TabType {
  id: string;
  label: string;
  icon: string;
}

export default function DeviceManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabType[] = [
    { id: 'overview', label: '디바이스 관리 개요', icon: '🔧' },
    { id: 'sensors', label: '센서 관리', icon: '📡' },
    { id: 'actuators', label: '액추에이터 제어', icon: '🎛️' },
    { id: 'registration', label: '디바이스 등록', icon: '📝' },
    { id: 'troubleshooting', label: '문제 해결', icon: '🔧' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-900 mb-4">🔧 디바이스 관리 개요</h2>
        <p className="text-orange-800 mb-6">
          IoT 디바이스들을 효율적으로 관리하고 제어하여 스마트팜을 운영할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📡 센서 타입</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">🌡️</span>
              <div>
                <h4 className="font-medium text-gray-900">온도/습도</h4>
                <p className="text-sm text-gray-600">DHT22, SHT30 등</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-medium text-gray-900">EC/pH</h4>
                <p className="text-sm text-gray-600">DFRobot EC/pH 센서</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-2xl">💧</span>
              <div>
                <h4 className="font-medium text-gray-900">수위</h4>
                <p className="text-sm text-gray-600">초음파, 압력 센서</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <span className="text-2xl">☀️</span>
              <div>
                <h4 className="font-medium text-gray-900">조도</h4>
                <p className="text-sm text-gray-600">BH1750, TSL2561</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ 액추에이터 타입</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <span className="text-2xl">🚰</span>
              <div>
                <h4 className="font-medium text-gray-900">펌프</h4>
                <p className="text-sm text-gray-600">물 펌프, 영양액 펌프</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
              <span className="text-2xl">🔧</span>
              <div>
                <h4 className="font-medium text-gray-900">밸브</h4>
                <p className="text-sm text-gray-600">솔레노이드 밸브</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-medium text-gray-900">LED</h4>
                <p className="text-sm text-gray-600">성장용 LED 조명</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg">
              <span className="text-2xl">🌀</span>
              <div>
                <h4 className="font-medium text-gray-900">팬</h4>
                <p className="text-sm text-gray-600">환기용 팬</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 디바이스 상태 표시</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl mb-2">🔴</div>
            <h5 className="font-medium text-red-800">연결 끊김</h5>
            <p className="text-xs text-red-600">디바이스 연결 없음</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl mb-2">🟡</div>
            <h5 className="font-medium text-yellow-800">경고</h5>
            <p className="text-xs text-yellow-600">임계값 초과</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl mb-2">🟢</div>
            <h5 className="font-medium text-green-800">정상</h5>
            <p className="text-xs text-green-600">정상 작동</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl mb-2">🔵</div>
            <h5 className="font-medium text-blue-800">대기</h5>
            <p className="text-xs text-blue-600">명령 대기중</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSensors = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">📡 센서 관리</h2>
        <p className="text-green-800 mb-6">
          다양한 환경 센서들을 통해 농장의 상태를 실시간으로 모니터링할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌡️ 온도/습도 센서</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">현재 온도</span>
                <span className="text-lg font-bold text-green-600">23.5°C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">현재 습도</span>
                <span className="text-sm font-medium text-blue-600">65%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">온도 임계값</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="최소" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" placeholder="최대" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">습도 임계값</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="최소" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" placeholder="최대" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ EC/pH 센서</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">현재 EC</span>
                <span className="text-lg font-bold text-purple-600">1.8 mS/cm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">현재 pH</span>
                <span className="text-sm font-medium text-orange-600">6.2</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">EC 목표값</label>
              <input type="number" step="0.1" placeholder="1.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">pH 목표값</label>
              <input type="number" step="0.1" placeholder="6.0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 센서 데이터 히스토리</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">센서</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">값</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">상태</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">시간</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🌡️</span>
                    <span className="font-medium">온도 센서</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono">23.5°C</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    정상
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">2분 전</td>
              </tr>
              
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⚡</span>
                    <span className="font-medium">EC 센서</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono">1.8 mS/cm</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    경고
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">5분 전</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderActuators = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">🎛️ 액추에이터 제어</h2>
        <p className="text-blue-800 mb-6">
          펌프, 밸브, LED, 팬 등의 액추에이터를 원격으로 제어할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚰 펌프 제어</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">물 펌프</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  ON
                </span>
              </div>
              <div className="text-sm text-gray-600">운영 시간: 15분</div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                시작
              </button>
              <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                중지
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">운영 시간 설정</label>
              <input type="number" placeholder="분" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 LED 조명 제어</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">성장용 LED</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  75%
                </span>
              </div>
              <div className="text-sm text-gray-600">현재 밝기</div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">밝기 조절</label>
              <input type="range" min="0" max="100" defaultValue="75" className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                ON
              </button>
              <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
                OFF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ 스케줄 제어</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">펌프 스케줄</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>오전 6시</span>
                  <span className="text-green-600">15분</span>
                </div>
                <div className="flex justify-between">
                  <span>오후 2시</span>
                  <span className="text-green-600">10분</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">LED 스케줄</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>오전 7시</span>
                  <span className="text-blue-600">ON</span>
                </div>
                <div className="flex justify-between">
                  <span>오후 7시</span>
                  <span className="text-blue-600">OFF</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2">팬 스케줄</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>온도 25°C 초과시</span>
                  <span className="text-purple-600">AUTO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegistration = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">📝 디바이스 등록</h2>
        <p className="text-purple-800 mb-6">
          새로운 IoT 디바이스를 시스템에 등록하고 설정하는 과정입니다.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 1단계: 디바이스 정보 입력</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">디바이스 ID *</label>
                <input 
                  type="text" 
                  placeholder="예: sensor_001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">디바이스 타입 *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">타입을 선택하세요</option>
                  <option value="temperature">온도 센서</option>
                  <option value="humidity">습도 센서</option>
                  <option value="ec">EC 센서</option>
                  <option value="ph">pH 센서</option>
                  <option value="water_level">수위 센서</option>
                  <option value="light">조도 센서</option>
                  <option value="pump">펌프</option>
                  <option value="valve">밸브</option>
                  <option value="led">LED 조명</option>
                  <option value="fan">팬</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">설명</label>
              <textarea 
                placeholder="디바이스의 용도나 위치 등을 설명해주세요."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 2단계: 배치 위치 설정</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">베드 번호</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">베드를 선택하세요</option>
                  <option value="1">베드 1</option>
                  <option value="2">베드 2</option>
                  <option value="3">베드 3</option>
                  <option value="4">베드 4</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">층 번호</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">층을 선택하세요</option>
                  <option value="1">1층</option>
                  <option value="2">2층</option>
                  <option value="3">3층</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 3단계: 설정 완료</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-green-900">디바이스 등록 완료</h4>
                <p className="text-sm text-green-700">MQTT 브로커에 연결하여 데이터를 전송할 수 있습니다.</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">💡 다음 단계</h4>
              <p className="text-sm text-blue-700">
                디바이스가 MQTT 브로커에 연결되면 자동으로 데이터를 수집하기 시작합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTroubleshooting = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-4">🔧 문제 해결</h2>
        <p className="text-red-800 mb-6">
          디바이스 관련 문제를 진단하고 해결하는 방법을 안내합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔴 연결 문제</h3>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">디바이스가 연결되지 않음</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• WiFi 연결 상태 확인</li>
                <li>• MQTT 브로커 URL/포트 확인</li>
                <li>• 인증 정보 확인</li>
                <li>• 디바이스 전원 상태 확인</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">간헐적 연결 끊김</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 네트워크 신호 강도 확인</li>
                <li>• Keep-Alive 설정 확인</li>
                <li>• 디바이스 재시작</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 데이터 문제</h3>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-2">센서 데이터가 없음</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• 센서 연결 상태 확인</li>
                <li>• 센서 전원 공급 확인</li>
                <li>• 센서 교체 필요 여부 확인</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">이상한 센서 값</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 센서 보정 필요</li>
                <li>• 센서 노화 확인</li>
                <li>• 환경적 요인 확인</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📞 지원 요청</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">기술 지원</h4>
              <p className="text-sm text-gray-600">복잡한 문제는 기술 지원팀에 문의하세요.</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                지원 요청
              </button>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">커뮤니티</h4>
              <p className="text-sm text-gray-600">다른 사용자들과 문제를 공유하고 해결책을 찾아보세요.</p>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                커뮤니티 참여
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'sensors':
        return renderSensors();
      case 'actuators':
        return renderActuators();
      case 'registration':
        return renderRegistration();
      case 'troubleshooting':
        return renderTroubleshooting();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="디바이스 관리" subtitle="센서 및 액추에이터 관리 완전 가이드" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">목차</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-100 text-orange-900 border border-orange-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

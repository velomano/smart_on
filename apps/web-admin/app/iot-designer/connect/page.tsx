'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

interface CodeData {
  device: string;
  protocol: string;
  sensors: any[];
  controls: any[];
  pinAssignments: Record<string, string>;
  powerRequirements: any;
  generatedCode: string;
  setupToken: string;
  farmId: string;
}

function ConnectPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [codeData, setCodeData] = useState<CodeData | null>(null);
  const [loading, setLoading] = useState(true);

  const farmId = searchParams.get('farmId');

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // 코드 데이터 로드
  useEffect(() => {
    if (!authLoading) {
      // 저장된 코드 데이터 로드
      const storedData = sessionStorage.getItem('iotCodeData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setCodeData(parsedData);
        } catch (error) {
          console.error('코드 데이터 파싱 실패:', error);
        }
      }
      setLoading(false);
    }
  }, [authLoading, farmId]);

  // ZIP 파일 다운로드
  const downloadZip = async () => {
    if (!codeData) return;

    try {
      const response = await fetch('/api/iot/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device: codeData.device,
          protocol: codeData.protocol,
          sensors: codeData.sensors,
          controls: codeData.controls,
          pinAssignments: codeData.pinAssignments,
          farmId: codeData.farmId
        }),
      });

      if (!response.ok) {
        throw new Error('ZIP 파일 생성 실패');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${codeData.device}_firmware_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  // 코드 생성 및 업데이트
  const generateAndUpdateCode = async () => {
    if (!codeData) return;

    try {
      const response = await fetch('/api/iot/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device: codeData.device,
          protocol: codeData.protocol,
          sensors: codeData.sensors,
          controls: codeData.controls,
          pinAssignments: codeData.pinAssignments,
          farmId: codeData.farmId,
          returnType: 'text' // 텍스트 형태로 요청
        }),
      });

      if (!response.ok) {
        throw new Error('코드 생성 실패');
      }

      // JSON 형태로 응답 받기 (인코딩 문제 해결)
      const responseData = await response.json();
      
      console.log('📝 받은 파일 수:', Object.keys(responseData.files).length);
      console.log('📝 파일 목록:', Object.keys(responseData.files));
      
      // 파일들을 구분자로 결합하여 generatedCode에 저장
      const combinedContent = Object.entries(responseData.files)
        .map(([filename, content]) => `// === ${filename.toUpperCase()} ===\n${content}\n`)
        .join('\n');
      
      // 코드 데이터 업데이트
      const updatedCodeData = {
        ...codeData,
        generatedCode: combinedContent
      };
      
      setCodeData(updatedCodeData);
      sessionStorage.setItem('iotCodeData', JSON.stringify(updatedCodeData));
      
      console.log('✅ 코드 생성 및 업데이트 완료');
    } catch (error) {
      console.error('코드 생성 실패:', error);
      alert('코드 생성 중 오류가 발생했습니다.');
    }
  };

  // 코드 블록 컴포넌트 (고정 높이 + 스크롤)
  const CodeBlock = ({ title, code, language = 'cpp' }: { title: string; code: string; language?: string }) => (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{code.split('\n').length}줄</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              alert('코드가 클립보드에 복사되었습니다.');
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            복사
          </button>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
        <pre className="h-96 overflow-y-auto p-4 text-sm">
          <code className="text-gray-100 font-mono leading-relaxed">{code}</code>
        </pre>
      </div>
    </div>
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!codeData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={user || undefined} title="IoT 연결" subtitle="디바이스 연결 설정" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">코드 데이터를 찾을 수 없습니다</h1>
              <p className="text-gray-600 mb-6">
                IoT Designer에서 먼저 디바이스를 설계하고 코드를 생성해주세요.
              </p>
              <button
                onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                IoT Designer로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 코드 파싱 (새로운 구분자 지원)
  const parseCode = (code: string) => {
    const sections: { [key: string]: string } = {};
    
    console.log('🔍 코드 파싱 시작, 코드 길이:', code.length);
    
    // 섹션 구분자로 분할 (API에서 반환하는 새로운 형식 지원)
    const sectionMarkers = [
      { marker: '// === CONFIG.JSON ===', name: 'config.json' },
      { marker: '// === PLATFORMIO.INI ===', name: 'platformio.ini' },
      { marker: '// === MAIN.CPP ===', name: 'main.cpp' },
      { marker: '// === README.MD ===', name: 'README.md' },
      { marker: '// === IOT_ESP32_MQTT.INO ===', name: 'main.cpp' }, // ESP32 메인 파일
      { marker: '// === CALIBRATION.JSON ===', name: 'calibration.json' },
      { marker: '// === CONFIG.YAML ===', name: 'config.yaml' },
      { marker: '// === REQUIREMENTS.TXT ===', name: 'requirements.txt' },
      { marker: '// === TERAHUB-RPI.SERVICE ===', name: 'terahub-rpi.service' },
      { marker: 'PK', name: 'zip_start' } // ZIP 파일 시작 표시
    ];

    let currentContent = '';
    let currentSection = '';

    const lines = code.split('\n');
    console.log('📝 총 라인 수:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let foundMarker = false;
      
      for (const marker of sectionMarkers) {
        if (line.includes(marker.marker)) {
          // 이전 섹션 저장
          if (currentSection && currentSection !== 'zip_start') {
            sections[currentSection] = currentContent.trim();
            console.log(`✅ 섹션 저장: ${currentSection}, 길이: ${currentContent.length}`);
          }
          // 새 섹션 시작
          currentSection = marker.name;
          currentContent = '';
          foundMarker = true;
          console.log(`🎯 새 섹션 시작: ${marker.name}`);
          break;
        }
      }
      
      if (!foundMarker && currentSection && currentSection !== 'zip_start') {
        currentContent += line + '\n';
      }
    }
    
    // 마지막 섹션 저장
    if (currentSection && currentSection !== 'zip_start') {
      sections[currentSection] = currentContent.trim();
      console.log(`✅ 마지막 섹션 저장: ${currentSection}, 길이: ${currentContent.length}`);
    }

    // 만약 파싱이 안 되었다면 전체 코드를 main.cpp로 처리
    if (Object.keys(sections).length === 0) {
      console.log('⚠️ 파싱 실패, 전체 코드를 main.cpp로 처리');
      sections['main.cpp'] = code;
    }

    console.log('📊 파싱 결과:', Object.keys(sections));
    return sections;
  };

  const codeSections = parseCode(codeData.generatedCode);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user || undefined} title="⚡ 빠른 IoT 빌더" subtitle="빠르고 간편하게 IoT 시스템을 설계하고 자동으로 연결하세요" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* 단계 표시기 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
                  className="flex items-center text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white transition-colors">
                    1
                  </div>
                  <span className="ml-2 font-medium">디자인</span>
                </button>
                <div className="flex-1 h-1 bg-blue-200 mx-4" />
                <div className="flex items-center text-blue-600">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white transition-colors">
                    2
                  </div>
                  <span className="ml-2 font-medium">코드생성</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4" />
                <button 
                  onClick={() => router.push(`/iot-designer/monitor?farmId=${farmId}`)}
                  className="flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors">
                    3
                  </div>
                  <span className="ml-2 font-medium">연결</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* 1. 코드 생성 및 다운로드 섹션 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-2xl font-bold mb-2">펌웨어 패키지</h2>
              <p className="text-blue-100 mb-6">
                {codeData.device.toUpperCase()} 디바이스용 완전한 펌웨어 패키지를 다운로드 받아 수정해서 설치하세요.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={generateAndUpdateCode}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <span>👁️</span>
                  <span>코드 확인</span>
                </button>
                <button
                  onClick={downloadZip}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
                >
                  <span>⬇️</span>
                  <span>ZIP 다운로드</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. WiFi 설정 안내 */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">📶 WiFi 설정</h3>
            
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
                  <p className="text-blue-700 text-sm mt-3">
                    💡 <strong>팁:</strong> WiFi 정보를 미리 준비해두시면 코드 수정이 더욱 편리합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 디바이스 정보 카드 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📋 디바이스 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">장치 타입</h4>
                <p className="text-lg font-bold text-blue-600">{codeData.device.toUpperCase()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">통신 프로토콜</h4>
                <p className="text-lg font-bold text-green-600">{codeData.protocol.toUpperCase()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">컴포넌트 수</h4>
                <p className="text-lg font-bold text-purple-600">
                  센서 {codeData.sensors.length}개, 액추에이터 {codeData.controls.length}개
                </p>
              </div>
            </div>
          </div>

          {/* 4. 펌웨어 코드 블록들 */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">💻 펌웨어 코드</h3>
            
            {/* 파일별 탭 표시 */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(codeSections).map((fileName) => (
                  <span key={fileName} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {fileName}
                  </span>
                ))}
              </div>
              
      <div className="space-y-4">
        {codeSections['README.md'] && (
          <CodeBlock title="📖 README.md (설치 가이드)" code={codeSections['README.md']} language="markdown" />
        )}
        
        {codeSections['main.cpp'] && (
          <CodeBlock title="📄 main.cpp (메인 펌웨어)" code={codeSections['main.cpp']} language="cpp" />
        )}
        
        {codeSections['platformio.ini'] && (
          <CodeBlock title="⚙️ platformio.ini (빌드 설정)" code={codeSections['platformio.ini']} language="ini" />
        )}
        
        {codeSections['config.json'] && (
          <CodeBlock title="🔧 config.json (설정 파일)" code={codeSections['config.json']} language="json" />
        )}
        
        {codeSections['calibration.json'] && (
          <CodeBlock title="🎯 calibration.json (센서 보정)" code={codeSections['calibration.json']} language="json" />
        )}
        
        {codeSections['config.yaml'] && (
          <CodeBlock title="⚙️ config.yaml (라즈베리파이 설정)" code={codeSections['config.yaml']} language="yaml" />
        )}
        
        {codeSections['requirements.txt'] && (
          <CodeBlock title="📦 requirements.txt (Python 패키지)" code={codeSections['requirements.txt']} language="text" />
        )}
        
        {codeSections['terahub-rpi.service'] && (
          <CodeBlock title="🔧 terahub-rpi.service (시스템 서비스)" code={codeSections['terahub-rpi.service']} language="ini" />
        )}
      </div>
            </div>
          </div>

          {/* 5. 네비게이션 */}
          <div className="flex justify-between pt-6">
            <button
              onClick={() => router.push(`/iot-designer?farmId=${farmId}`)}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← 이전 단계
            </button>
            <button
              onClick={() => router.push(`/iot-designer?farmId=${farmId}&step=monitor`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다음 단계 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <ConnectPageContent />
    </Suspense>
  );
}

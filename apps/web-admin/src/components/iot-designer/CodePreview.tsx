// 코드 미리보기 컴포넌트
'use client';

import { useState } from 'react';

interface CodePreviewProps {
  code: string;
  onDownload: () => void;
  deviceType?: string;
  fileName?: string;
}

export default function CodePreview({ code, onDownload, deviceType = 'Arduino', fileName = 'iot_device.ino' }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'analysis'>('preview');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };
  
  const analyzeCode = () => {
    const lines = code.split('\n');
    const includes = lines.filter(line => line.trim().startsWith('#include')).length;
    const defines = lines.filter(line => line.trim().startsWith('#define')).length;
    const functions = lines.filter(line => line.trim().startsWith('void ') || line.trim().startsWith('String ') || line.trim().startsWith('float ')).length;
    const comments = lines.filter(line => line.trim().startsWith('//')).length;
    
    return {
      totalLines: lines.length,
      includes,
      defines,
      functions,
      comments,
      codeLines: lines.length - includes - defines - comments
    };
  };
  
  const analysis = analyzeCode();
  
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">생성된 {deviceType} 코드</h3>
        <div className="flex space-x-2">
          <button
            onClick={copyToClipboard}
            className={`px-3 py-2 rounded text-sm ${
              copySuccess 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {copySuccess ? '✅ 복사됨' : '📋 복사'}
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            📥 다운로드
          </button>
        </div>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          📄 코드 미리보기
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'analysis'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          📊 코드 분석
        </button>
      </div>
      
<<<<<<< HEAD
      <div className="bg-gray-100 text-gray-800 p-4 rounded-lg overflow-x-auto border">
        <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>📋 코드 설명:</p>
        <ul className="list-disc list-inside ml-4">
          <li>센서 읽기 및 제어 명령 처리</li>
          <li>WiFi 연결 및 서버 통신</li>
          <li>에러 처리 및 재연결 로직</li>
          <li>Universal Bridge와 호환</li>
        </ul>
      </div>
=======
      {activeTab === 'preview' ? (
        <div className="space-y-4">
          {/* 파일명 표시 */}
          <div className="flex items-center space-x-2 text-sm text-gray-800">
            <span>📁 파일명:</span>
            <code className="bg-gray-100 px-2 py-1 rounded">{fileName}</code>
          </div>
          
          {/* 코드 미리보기 */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-96">
            <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
          </div>
          
          {/* 코드 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">📋 코드 구성 요소</h4>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>라이브러리 임포트 및 상수 정의</li>
              <li>센서/제어 장치 초기화</li>
              <li>WiFi 연결 및 통신 설정</li>
              <li>센서 데이터 읽기 함수</li>
              <li>제어 명령 처리 함수</li>
              <li>메인 루프 (setup/loop)</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 코드 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.totalLines}</div>
              <div className="text-sm text-blue-800">총 라인 수</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.functions}</div>
              <div className="text-sm text-green-800">함수 개수</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{analysis.includes}</div>
              <div className="text-sm text-purple-800">라이브러리</div>
            </div>
          </div>
          
          {/* 상세 분석 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">📊 상세 분석</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>코드 라인:</span>
                <span className="font-medium">{analysis.codeLines}줄</span>
              </div>
              <div className="flex justify-between">
                <span>주석 라인:</span>
                <span className="font-medium">{analysis.comments}줄</span>
              </div>
              <div className="flex justify-between">
                <span>상수 정의:</span>
                <span className="font-medium">{analysis.defines}개</span>
              </div>
              <div className="flex justify-between">
                <span>함수 정의:</span>
                <span className="font-medium">{analysis.functions}개</span>
              </div>
            </div>
          </div>
          
          {/* 설치 가이드 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">🔧 설치 가이드</h4>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Arduino IDE에서 ESP32 보드 매니저 설치</li>
              <li>필요한 라이브러리 설치 (DHT, DallasTemperature 등)</li>
              <li>WiFi SSID와 비밀번호 수정</li>
              <li>서버 URL 수정 (필요시)</li>
              <li>ESP32에 업로드</li>
              <li>시리얼 모니터로 연결 상태 확인</li>
            </ol>
          </div>
        </div>
      )}
>>>>>>> dc17f9bdf342b9bb54af2c88a33587ba61dacf39
    </div>
  );
}

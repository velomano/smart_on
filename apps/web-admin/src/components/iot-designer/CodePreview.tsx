// 코드 미리보기 컴포넌트
'use client';

interface CodePreviewProps {
  code: string;
  onDownload: () => void;
  deviceType?: string;
}

export default function CodePreview({ code, onDownload, deviceType = 'Arduino' }: CodePreviewProps) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">생성된 {deviceType} 코드</h3>
        <button
          onClick={onDownload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          📥 다운로드
        </button>
      </div>
      
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
    </div>
  );
}

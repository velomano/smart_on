/**
 * QR Code Card
 * 
 * Setup Token QR 코드 표시
 */

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeCardProps {
  qrData: string;
  setupToken: string;
}

export function QRCodeCard({ qrData, setupToken }: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(setupToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <div className="text-2xl mr-3">📱</div>
        <div>
          <h3 className="font-bold text-lg">모바일 앱으로 연결</h3>
          <p className="text-sm text-gray-600">QR 코드를 스캔하세요</p>
        </div>
      </div>
      
      <div className="bg-white border border-gray-300 p-4 rounded-lg flex items-center justify-center mx-auto mb-4">
        <QRCodeSVG 
          value={qrData}
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>
      
      <div className="bg-gray-100 p-3 rounded mb-4">
        <p className="text-xs text-gray-600 mb-1">Setup Token:</p>
        <code className="text-xs text-blue-800 break-all font-mono">{setupToken}</code>
      </div>
      
      <button 
        onClick={handleCopy} 
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        {copied ? '✅ 복사 완료!' : '📋 토큰 복사하기'}
      </button>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📱 QR 코드 사용 방법</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">1️⃣</span>
            <span><strong>모바일 앱 사용:</strong> QR 코드를 스캔하여 자동 연결</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">2️⃣</span>
            <span><strong>웹 브라우저:</strong> QR 코드의 URL을 직접 접속</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">3️⃣</span>
            <span><strong>디바이스 코드:</strong> 생성된 코드에 URL 하드코딩</span>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-white border border-blue-300 rounded">
          <p className="text-xs text-blue-800 font-mono break-all">
            URL: {qrData}
          </p>
        </div>
        
        <p className="text-xs text-blue-600 mt-2">
          💡 <strong>팁:</strong> 디바이스에 카메라가 있다면 QR 코드를 스캔하여 자동 연결 가능합니다!
        </p>
      </div>
    </div>
  );
}

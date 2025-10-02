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
      
      <p className="text-xs text-gray-600 text-center mt-3">
        💡 모바일 앱이 없다면 수동으로 토큰을 입력하세요
      </p>
    </div>
  );
}

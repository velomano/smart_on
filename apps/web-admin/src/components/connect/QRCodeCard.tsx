/**
 * QR Code Card
 * 
 * QR 코드 생성 및 표시
 * TODO: 실제 QR 코드 생성 라이브러리 연동
 */

'use client';

export function QRCodeCard({ data }: { data: any }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">QR 코드로 빠른 설정</h3>
      
      <div className="flex flex-col items-center">
        {/* TODO: 실제 QR 코드 생성 */}
        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center mb-4">
          <span className="text-gray-500">QR Code</span>
        </div>
        
        <p className="text-sm text-gray-600 text-center mb-4">
          스마트폰으로 QR 코드를 스캔하면<br />
          WiFi 정보와 디바이스 ID가 자동으로 설정됩니다
        </p>

        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          QR 코드 다운로드
        </button>
      </div>
    </div>
  );
}


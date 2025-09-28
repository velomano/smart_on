import React from 'react';

interface LegalNoticeProps {
  compact?: boolean;
  className?: string;
}

export default function LegalNotice({ compact = false, className = '' }: LegalNoticeProps) {
  if (compact) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        <p>
          본 서비스는 Open Access 또는 공개적으로 허용된 자료만 수집·가공하며, 
          각 자료의 원문 링크와 라이선스를 명시합니다. 
          저작권자의 요청 시 신속히 수정·삭제합니다. 
          문의: <a href="mailto:ops@terahub.example" className="text-blue-600 hover:underline">ops@terahub.example</a>
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">⚖️</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            법적 고지 및 컴플라이언스
          </h3>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">자료 수집 정책</h4>
              <p className="leading-relaxed">
                본 서비스는 Open Access 또는 공개적으로 허용된 자료만 수집·가공합니다. 
                모든 수집 자료는 다음과 같은 조건을 만족합니다:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Creative Commons 라이선스 하에 배포된 자료</li>
                <li>공개 도메인 자료</li>
                <li>저작권자가 명시적으로 허용한 자료</li>
                <li>학술 연구 목적의 공개 자료</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">저작권 보호</h4>
              <p className="leading-relaxed">
                각 자료의 원문 링크와 라이선스 정보를 명시하여 저작권을 보호합니다. 
                저작권자의 요청 시 신속히 자료를 수정하거나 삭제합니다.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">DMCA 정책</h4>
              <p className="leading-relaxed">
                저작권 침해 신고가 접수되면 24시간 내에 해당 자료를 검토하고 
                필요시 즉시 삭제 조치를 취합니다.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">문의 및 신고</h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="mb-2">
                  <strong>이메일:</strong>{' '}
                  <a href="mailto:ops@terahub.example" className="text-blue-600 hover:underline">
                    ops@terahub.example
                  </a>
                </p>
                <p className="mb-2">
                  <strong>신고 양식:</strong>{' '}
                  <a href="/takedown-request" className="text-blue-600 hover:underline">
                    저작권 침해 신고
                  </a>
                </p>
                <p className="text-xs text-gray-500">
                  응답 시간: 영업일 기준 24시간 이내
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">최종 업데이트:</span>
                  <span className="text-xs text-gray-600">2024년 9월 28일</span>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="/privacy-policy" className="text-xs text-blue-600 hover:underline">
                    개인정보처리방침
                  </a>
                  <a href="/terms-of-service" className="text-xs text-blue-600 hover:underline">
                    이용약관
                  </a>
                  <a href="/license-info" className="text-xs text-blue-600 hover:underline">
                    라이선스 정보
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

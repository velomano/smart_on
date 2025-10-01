/**
 * Connect Wizard
 * 
 * 4단계 연결 마법사
 * TODO: 모든 단계 구현
 */

'use client';

import { useState } from 'react';

type Step = 'device-select' | 'protocol-select' | 'code-generate' | 'monitor';

export function ConnectWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('device-select');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <StepIndicator current={currentStep} />
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {currentStep === 'device-select' && (
          <DeviceSelectStep onNext={() => setCurrentStep('protocol-select')} />
        )}

        {currentStep === 'protocol-select' && (
          <ProtocolSelectStep
            onBack={() => setCurrentStep('device-select')}
            onNext={() => setCurrentStep('code-generate')}
          />
        )}

        {currentStep === 'code-generate' && (
          <CodeGenerateStep
            onBack={() => setCurrentStep('protocol-select')}
            onNext={() => setCurrentStep('monitor')}
          />
        )}

        {currentStep === 'monitor' && (
          <MonitorStep onBack={() => setCurrentStep('code-generate')} />
        )}
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { id: 'device-select', label: '1. 디바이스 선택' },
    { id: 'protocol-select', label: '2. 연결 방식' },
    { id: 'code-generate', label: '3. 코드 생성' },
    { id: 'monitor', label: '4. 연결 모니터링' },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${current === step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
            `}
          >
            {index + 1}
          </div>
          <div className={`ml-2 ${current === step.id ? 'font-bold' : ''}`}>
            {step.label}
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-1 bg-gray-200 mx-4" />
          )}
        </div>
      ))}
    </div>
  );
}

// TODO: 각 단계 컴포넌트 구현
function DeviceSelectStep({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">어떤 디바이스를 연결하시겠어요?</h2>
      <div className="grid grid-cols-3 gap-4 my-8">
        {['Arduino', 'ESP32', 'Raspberry Pi', '스마트플러그', 'HTTP 기기', 'MQTT 기기'].map(device => (
          <button
            key={device}
            className="p-6 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50"
            onClick={onNext}
          >
            <div className="text-4xl mb-2">📟</div>
            <div className="font-bold">{device}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProtocolSelectStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Arduino를 어떻게 연결하시겠어요?</h2>
      <div className="space-y-4 my-8">
        {[
          { id: 'http', label: 'WiFi (HTTP)', desc: '가장 쉽고 안정적', recommended: true },
          { id: 'mqtt', label: 'WiFi (MQTT)', desc: '실시간성이 중요한 경우' },
          { id: 'serial', label: 'USB Serial', desc: '컴퓨터 직접 연결' },
        ].map(protocol => (
          <button
            key={protocol.id}
            className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50"
            onClick={onNext}
          >
            <div className="flex items-center">
              <input type="radio" className="mr-4" />
              <div className="flex-1">
                <div className="font-bold">
                  {protocol.label}
                  {protocol.recommended && (
                    <span className="ml-2 text-sm text-blue-600">- 권장</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{protocol.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="text-blue-600">← 이전</button>
    </div>
  );
}

function CodeGenerateStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🎉 연결 코드가 준비되었습니다!</h2>
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <pre className="text-sm overflow-x-auto">
{`#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "내WiFi";
const char* password = "****";
const char* deviceId = "auto-id";

void setup() {
  // 자동 생성된 코드...
}`}
        </pre>
      </div>
      <div className="flex gap-4 mb-8">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">📋 복사하기</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded">📥 다운로드</button>
      </div>
      <div className="flex gap-4">
        <button onClick={onBack} className="text-blue-600">← 이전</button>
        <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded">
          다음: 업로드 가이드 →
        </button>
      </div>
    </div>
  );
}

function MonitorStep({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🔍 디바이스 연결 대기 중...</h2>
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
        <p className="font-bold">현재 상태:</p>
        <p>⏳ Arduino 업로드 대기 중</p>
        <p className="text-sm text-gray-600 mt-2">
          💡 Arduino IDE에서 코드를 업로드하고 시리얼 모니터를 확인하세요.
        </p>
      </div>
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
        <div>[Arduino 시리얼 모니터]</div>
        <div>WiFi 연결 중...</div>
        <div>WiFi 연결 성공!</div>
        <div>서버 연결 중...</div>
        <div>✅ 연결 성공!</div>
      </div>
      <button onClick={onBack} className="text-blue-600">← 이전</button>
    </div>
  );
}


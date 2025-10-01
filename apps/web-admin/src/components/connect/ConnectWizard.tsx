/**
 * Connect Wizard
 * 
 * 4단계 연결 마법사
 * TODO: 모든 단계 구현
 */

'use client';

import { useState, useEffect } from 'react';

type Step = 'device-select' | 'protocol-select' | 'code-generate' | 'monitor';

interface DeviceConfig {
  device: string;
  protocol: string;
  setupToken?: string;
  deviceKey?: string;
}

export function ConnectWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('device-select');
  const [config, setConfig] = useState<DeviceConfig>({
    device: '',
    protocol: '',
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <StepIndicator current={currentStep} />
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {currentStep === 'device-select' && (
          <DeviceSelectStep 
            onNext={(device) => {
              setConfig({ ...config, device });
              setCurrentStep('protocol-select');
            }} 
          />
        )}

        {currentStep === 'protocol-select' && (
          <ProtocolSelectStep
            device={config.device}
            onBack={() => setCurrentStep('device-select')}
            onNext={(protocol) => {
              setConfig({ ...config, protocol });
              setCurrentStep('code-generate');
            }}
          />
        )}

        {currentStep === 'code-generate' && (
          <CodeGenerateStep
            config={config}
            onBack={() => setCurrentStep('protocol-select')}
            onNext={(setupToken, deviceKey) => {
              setConfig({ ...config, setupToken, deviceKey });
              setCurrentStep('monitor');
            }}
          />
        )}

        {currentStep === 'monitor' && (
          <MonitorStep 
            config={config}
            onBack={() => setCurrentStep('code-generate')} 
          />
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

// 각 단계 컴포넌트
function DeviceSelectStep({ onNext }: { onNext: (device: string) => void }) {
  const devices = [
    { id: 'arduino', name: 'Arduino', icon: '📟' },
    { id: 'esp32', name: 'ESP32', icon: '📡' },
    { id: 'raspberry-pi', name: 'Raspberry Pi', icon: '🍓' },
    { id: 'smart-plug', name: '스마트플러그', icon: '🔌' },
    { id: 'http-device', name: 'HTTP 기기', icon: '🌐' },
    { id: 'mqtt-device', name: 'MQTT 기기', icon: '📨' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">어떤 디바이스를 연결하시겠어요?</h2>
      <div className="grid grid-cols-3 gap-4 my-8">
        {devices.map(device => (
          <button
            key={device.id}
            className="p-6 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            onClick={() => onNext(device.id)}
          >
            <div className="text-4xl mb-2">{device.icon}</div>
            <div className="font-bold">{device.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProtocolSelectStep({ device, onBack, onNext }: { device: string; onBack: () => void; onNext: (protocol: string) => void }) {
  const deviceNames: Record<string, string> = {
    'arduino': 'Arduino',
    'esp32': 'ESP32',
    'raspberry-pi': 'Raspberry Pi',
    'smart-plug': '스마트플러그',
    'http-device': 'HTTP 기기',
    'mqtt-device': 'MQTT 기기',
  };

  const protocols = [
    { id: 'http', label: 'WiFi (HTTP)', desc: '가장 쉽고 안정적 - REST API 사용', recommended: true },
    { id: 'mqtt', label: 'WiFi (MQTT)', desc: '실시간 양방향 통신 - Pub/Sub 패턴' },
    { id: 'websocket', label: 'WiFi (WebSocket)', desc: '지속적인 연결 유지 - 실시간 모니터링' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        {deviceNames[device] || '디바이스'}를 어떻게 연결하시겠어요?
      </h2>
      <div className="space-y-4 my-8">
        {protocols.map(protocol => (
          <button
            key={protocol.id}
            className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-all"
            onClick={() => onNext(protocol.id)}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 mr-4" />
              <div className="flex-1">
                <div className="font-bold">
                  {protocol.label}
                  {protocol.recommended && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">권장</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">{protocol.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
        ← 이전
      </button>
    </div>
  );
}

function CodeGenerateStep({ config, onBack, onNext }: { config: DeviceConfig; onBack: () => void; onNext: (setupToken: string, deviceKey: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    generateCode();
  }, []);

  const generateCode = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Setup Token 발급
      const claimResponse = await fetch('http://localhost:3000/api/provisioning/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: '00000000-0000-0000-0000-000000000001',
          farm_id: '1737f01f-da95-4438-bc90-4705cdfc09e8',
          ttl_seconds: 600,
        }),
      });

      if (!claimResponse.ok) {
        throw new Error('Setup Token 발급 실패');
      }

      const claimData = await claimResponse.json();
      setSetupToken(claimData.setup_token);

      // Step 2: 디바이스별 코드 생성
      const code = generateDeviceCode(config, claimData.setup_token);
      setGeneratedCode(code);

    } catch (err: any) {
      console.error('코드 생성 오류:', err);
      setError(err.message || '코드 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceCode = (cfg: DeviceConfig, token: string): string => {
    const serverUrl = 'http://localhost:3000';

    if (cfg.device === 'arduino' || cfg.device === 'esp32') {
      if (cfg.protocol === 'http') {
        return `#include <WiFi.h>
#include <HTTPClient.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// 서버 설정
const char* serverUrl = "${serverUrl}";
const char* setupToken = "${token}";
String deviceId = "";
String deviceKey = "";

void setup() {
  Serial.begin(115200);
  
  // WiFi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi 연결 완료!");
  
  // 디바이스 바인딩
  bindDevice();
  
  // 10초마다 센서 데이터 전송
  delay(10000);
}

void loop() {
  sendTelemetry();
  delay(10000);
}

void bindDevice() {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/provisioning/bind");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-setup-token", setupToken);
  
  String payload = "{\\"device_id\\":\\"ESP32-" + WiFi.macAddress() + "\\",\\"device_type\\":\\"esp32-sensor\\",\\"capabilities\\":[\\"temperature\\",\\"humidity\\"]}";
  
  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✅ 디바이스 등록 성공!");
    Serial.println(response);
    // Parse device_key from response
  } else {
    Serial.println("❌ 등록 실패: " + String(httpCode));
  }
  http.end();
}

void sendTelemetry() {
  // 센서 값 읽기 (예시)
  float temperature = 24.5;
  float humidity = 60.2;
  
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/bridge/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", deviceId);
  http.addHeader("x-tenant-id", "00000000-0000-0000-0000-000000000001");
  
  String payload = "{\\"readings\\":[{\\"key\\":\\"temperature\\",\\"value\\":" + String(temperature) + ",\\"unit\\":\\"C\\",\\"ts\\":\\"2025-10-01T12:00:00Z\\"},{\\"key\\":\\"humidity\\",\\"value\\":" + String(humidity) + ",\\"unit\\":\\"%\\",\\"ts\\":\\"2025-10-01T12:00:00Z\\"}]}";
  
  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    Serial.println("✅ 데이터 전송 성공!");
  }
  http.end();
}`;
      }
    }

    if (cfg.device === 'raspberry-pi') {
      return `# Raspberry Pi - Smart Farm Client
import requests
import time

SERVER_URL = "${serverUrl}"
SETUP_TOKEN = "${token}"
device_id = ""
device_key = ""

# 디바이스 바인딩
def bind_device():
    response = requests.post(
        f"{SERVER_URL}/api/provisioning/bind",
        headers={"x-setup-token": SETUP_TOKEN},
        json={"device_id": "RPi-001", "device_type": "raspberry-pi", "capabilities": ["temperature", "humidity"]}
    )
    if response.status_code == 200:
        data = response.json()
        print("✅ 디바이스 등록 성공!")
        return data['device_key']
    else:
        print("❌ 등록 실패")
        return None

# 센서 데이터 전송
def send_telemetry(temp, humidity):
    requests.post(
        f"{SERVER_URL}/api/bridge/telemetry",
        headers={"x-device-id": device_id, "x-tenant-id": "00000000-0000-0000-0000-000000000001"},
        json={"readings": [{"key": "temperature", "value": temp, "unit": "C"}, {"key": "humidity", "value": humidity, "unit": "%"}]}
    )

# 메인 루프
if __name__ == "__main__":
    device_key = bind_device()
    while True:
        send_telemetry(24.5, 60.2)
        time.sleep(10)`;
    }

    return '// 코드 생성 준비 중...';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('코드가 클립보드에 복사되었습니다!');
  };

  const handleDownload = () => {
    const ext = config.device === 'raspberry-pi' ? 'py' : 'ino';
    const filename = `smartfarm_device.${ext}`;
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setup Token 발급 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <button onClick={generateCode} className="px-4 py-2 bg-blue-600 text-white rounded">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🎉 연결 코드가 준비되었습니다!</h2>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
        <p className="font-bold text-blue-900">Setup Token (10분간 유효):</p>
        <code className="text-sm text-blue-700 break-all">{setupToken}</code>
      </div>

      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 max-h-96 overflow-y-auto">
        <pre className="text-xs">{generatedCode}</pre>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={handleCopy} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          📋 복사하기
        </button>
        <button onClick={handleDownload} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          📥 다운로드
        </button>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
          ← 이전
        </button>
        <button 
          onClick={() => onNext(setupToken, 'generated-key')} 
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          다음: 연결 모니터링 →
        </button>
      </div>
    </div>
  );
}

function MonitorStep({ config, onBack }: { config: DeviceConfig; onBack: () => void }) {
  const deviceNames: Record<string, string> = {
    'arduino': 'Arduino',
    'esp32': 'ESP32',
    'raspberry-pi': 'Raspberry Pi',
    'smart-plug': '스마트플러그',
    'http-device': 'HTTP 기기',
    'mqtt-device': 'MQTT 기기',
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🔍 디바이스 연결 대기 중...</h2>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
        <p className="font-bold text-blue-900">선택한 구성:</p>
        <p className="text-sm text-blue-700">
          디바이스: {deviceNames[config.device] || config.device} | 
          프로토콜: {config.protocol.toUpperCase()}
        </p>
        {config.setupToken && (
          <p className="text-xs text-blue-600 mt-2">Setup Token: {config.setupToken}</p>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
        <p className="font-bold">현재 상태:</p>
        <p>⏳ {deviceNames[config.device]} 업로드 대기 중</p>
        <p className="text-sm text-gray-600 mt-2">
          💡 생성된 코드를 디바이스에 업로드하고 시리얼 모니터를 확인하세요.
        </p>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
        <div>[시리얼 모니터]</div>
        <div>WiFi 연결 중...</div>
        <div>WiFi 연결 성공!</div>
        <div>서버 연결 중...</div>
        <div>✅ 연결 성공!</div>
        <div className="text-gray-400 mt-2">실제 디바이스에서 연결 시 여기에 실시간 로그가 표시됩니다.</div>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
          ← 이전
        </button>
        <a 
          href="/dashboard" 
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-block"
        >
          ✅ 대시보드로 이동
        </a>
      </div>
    </div>
  );
}


/**
 * Code Snippet Generator
 * 
 * 디바이스별 코드 생성
 * TODO: 모든 디바이스 타입 지원
 */

export interface SnippetParams {
  deviceType: 'arduino' | 'esp32' | 'raspberry_pi';
  protocol: 'http' | 'mqtt' | 'websocket';
  deviceId: string;
  serverUrl: string;
  deviceKey: string;
  sensors?: string[];
  actuators?: string[];
}

/**
 * 코드 스니펫 생성
 */
export function generateSnippet(params: SnippetParams): string {
  switch (params.deviceType) {
    case 'arduino':
    case 'esp32':
      return generateArduinoSnippet(params);
    case 'raspberry_pi':
      return generatePythonSnippet(params);
    default:
      return '// TODO: Implement snippet generator';
  }
}

/**
 * Arduino/ESP32 코드 생성
 */
function generateArduinoSnippet(params: SnippetParams): string {
  if (params.protocol === 'http') {
    return `
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// 디바이스 설정
const char* deviceId = "${params.deviceId}";
const char* deviceKey = "${params.deviceKey}";
const char* serverUrl = "${params.serverUrl}";

void setup() {
  Serial.begin(115200);
  
  // WiFi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi 연결 성공!");
}

void loop() {
  // TODO: 센서 데이터 수집 및 전송
  sendTelemetry();
  delay(30000);  // 30초마다
}

void sendTelemetry() {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/bridge/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", deviceId);
  http.addHeader("x-device-key", deviceKey);
  
  // TODO: 실제 센서 값 수집
  String payload = "{\\"device_id\\":\\"" + String(deviceId) + "\\",\\"readings\\":[]}";
  
  int httpCode = http.POST(payload);
  Serial.println("HTTP Response: " + String(httpCode));
  
  http.end();
}
`.trim();
  }

  // TODO: MQTT, WebSocket 등
  return '// TODO: Implement other protocols';
}

/**
 * Python (Raspberry Pi) 코드 생성
 */
function generatePythonSnippet(params: SnippetParams): string {
  return `
import requests
import time
from datetime import datetime

# 디바이스 설정
DEVICE_ID = "${params.deviceId}"
DEVICE_KEY = "${params.deviceKey}"
SERVER_URL = "${params.serverUrl}"

def send_telemetry(readings):
    """텔레메트리 전송"""
    headers = {
        "Content-Type": "application/json",
        "x-device-id": DEVICE_ID,
        "x-device-key": DEVICE_KEY,
    }
    
    payload = {
        "device_id": DEVICE_ID,
        "readings": readings,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    
    response = requests.post(
        f"{SERVER_URL}/api/bridge/telemetry",
        json=payload,
        headers=headers
    )
    
    print(f"Response: {response.status_code}")

if __name__ == "__main__":
    while True:
        # TODO: 실제 센서 값 수집
        readings = []
        send_telemetry(readings)
        time.sleep(30)  # 30초마다
`.trim();
}


/**
 * ESP32 + DHT22 테스트 코드
 * 
 * Universal Bridge와 연동하여 실제 센서 데이터 전송 테스트
 * 프로토콜: HTTP REST API
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Universal Bridge 설정
const char* deviceId = "ESP32-DHT22-TEST-001";
const char* deviceKey = "YOUR_DEVICE_KEY";  // Connect Wizard에서 생성
const char* serverUrl = "http://localhost:8080";  // 로컬 Universal Bridge

// DHT22 센서 설정
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// 상태 변수
unsigned long lastTelemetry = 0;
const unsigned long telemetryInterval = 30000; // 30초마다 전송
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 ESP32 + DHT22 테스트 시작");
  
  // DHT22 센서 초기화
  dht.begin();
  Serial.println("✅ DHT22 센서 초기화 완료");
  
  // WiFi 연결
  connectToWiFi();
  
  // 디바이스 등록
  if (wifiConnected) {
    registerDevice();
  }
}

void loop() {
  // WiFi 연결 상태 확인
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectToWiFi();
  } else if (!wifiConnected) {
    wifiConnected = true;
    registerDevice();
  }
  
  // 주기적 텔레메트리 전송
  if (wifiConnected && millis() - lastTelemetry >= telemetryInterval) {
    sendTelemetry();
    lastTelemetry = millis();
  }
  
  delay(1000);
}

void connectToWiFi() {
  Serial.print("WiFi 연결 중");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi 연결 성공!");
    Serial.print("IP 주소: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
  } else {
    Serial.println();
    Serial.println("❌ WiFi 연결 실패");
    wifiConnected = false;
  }
}

void registerDevice() {
  Serial.println("📝 디바이스 등록 중...");
  
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/bridge/registry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", deviceId);
  http.addHeader("x-device-key", deviceKey);
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["device_type"] = "esp32-dht22";
  doc["capabilities"] = {
    "sensors": ["temperature", "humidity"],
    "actuators": []
  };
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  Serial.print("등록 응답: ");
  Serial.println(httpCode);
  
  if (httpCode == 200) {
    Serial.println("✅ 디바이스 등록 완료");
  } else {
    Serial.println("❌ 디바이스 등록 실패");
  }
  
  http.end();
}

void sendTelemetry() {
  // DHT22 센서 데이터 읽기
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // 센서 데이터 유효성 검사
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("❌ DHT22 센서 읽기 실패");
    return;
  }
  
  Serial.print("📊 센서 데이터: ");
  Serial.print("온도=");
  Serial.print(temperature);
  Serial.print("°C, 습도=");
  Serial.print(humidity);
  Serial.println("%");
  
  // HTTP 요청 준비
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/bridge/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", deviceId);
  http.addHeader("x-device-key", deviceKey);
  
  // JSON 페이로드 생성
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["timestamp"] = millis();
  
  JsonArray readings = doc.createNestedArray("readings");
  
  // 온도 데이터
  JsonObject tempReading = readings.createNestedObject();
  tempReading["key"] = "temperature";
  tempReading["value"] = temperature;
  tempReading["unit"] = "°C";
  tempReading["ts"] = millis();
  
  // 습도 데이터
  JsonObject humReading = readings.createNestedObject();
  humReading["key"] = "humidity";
  humReading["value"] = humidity;
  humReading["unit"] = "%";
  humReading["ts"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  // HTTP 전송
  int httpCode = http.POST(payload);
  Serial.print("📡 텔레메트리 전송: ");
  Serial.print(httpCode);
  
  if (httpCode == 200) {
    Serial.println(" ✅");
  } else {
    Serial.println(" ❌");
    String response = http.getString();
    Serial.println("응답: " + response);
  }
  
  http.end();
}

void printStatus() {
  Serial.println("=== 디바이스 상태 ===");
  Serial.print("디바이스 ID: ");
  Serial.println(deviceId);
  Serial.print("서버 URL: ");
  Serial.println(serverUrl);
  Serial.print("WiFi 상태: ");
  Serial.println(wifiConnected ? "연결됨" : "연결 안됨");
  Serial.print("마지막 전송: ");
  Serial.println(millis() - lastTelemetry);
  Serial.println("==================");
}

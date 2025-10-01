/**
 * SmartFarm Universal Bridge - Arduino HTTP Client
 * 
 * 복사-붙여넣기만 하면 바로 작동!
 * 
 * 필요한 라이브러리:
 * - WiFi (내장)
 * - HTTPClient (내장)
 * - ArduinoJson (라이브러리 매니저에서 설치)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ========== 여기만 수정하세요! ==========

// WiFi 설정
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // WiFi 이름
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // WiFi 비밀번호

// 서버 설정 (웹 마법사에서 복사)
const char* SERVER_URL = "http://192.168.1.100:3000";  // 서버 주소
const char* DEVICE_ID = "esp32-001";                    // 디바이스 ID
const char* DEVICE_KEY = "DK_your_device_key";          // 디바이스 키

// 센서 설정 (사용하는 센서만 활성화)
#define USE_DHT22 true      // DHT22 온습도 센서
#define DHT_PIN 4           // DHT22 핀 번호

// 전송 주기 (밀리초)
const unsigned long SEND_INTERVAL = 30000;  // 30초

// ========== 이하 수정 불필요 ==========

#if USE_DHT22
#include <DHT.h>
DHT dht(DHT_PIN, DHT22);
#endif

unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n🌉 SmartFarm Universal Bridge");
  Serial.println("=====================================");
  
  // WiFi 연결
  connectWiFi();
  
  // 센서 초기화
  #if USE_DHT22
  dht.begin();
  Serial.println("✅ DHT22 센서 초기화 완료");
  #endif
  
  Serial.println("=====================================");
  Serial.println("🚀 시스템 준비 완료!");
  Serial.println("");
}

void loop() {
  // WiFi 재연결 확인
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi 연결 끊김, 재연결 중...");
    connectWiFi();
  }
  
  // 주기적으로 센서 데이터 전송
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendTelemetry();
    lastSendTime = millis();
  }
  
  delay(100);
}

// WiFi 연결
void connectWiFi() {
  Serial.print("📡 WiFi 연결 중");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" ✅");
    Serial.print("   IP 주소: ");
    Serial.println(WiFi.localIP());
    Serial.print("   신호 강도: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println(" ❌ 실패!");
    Serial.println("   WiFi SSID와 비밀번호를 확인하세요.");
  }
}

// 센서 데이터 전송
void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi 미연결, 전송 건너뜀");
    return;
  }
  
  Serial.println("📤 센서 데이터 전송 중...");
  
  // JSON 문서 생성
  StaticJsonDocument<1024> doc;
  doc["device_id"] = DEVICE_ID;
  doc["schema_version"] = "telemetry.v1";
  doc["timestamp"] = getISOTimestamp();
  
  JsonArray readings = doc.createNestedArray("readings");
  
  // DHT22 센서 데이터
  #if USE_DHT22
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (!isnan(temp)) {
    JsonObject tempReading = readings.createNestedObject();
    tempReading["key"] = "temperature";
    tempReading["value"] = temp;
    tempReading["unit"] = "celsius";
    tempReading["ts"] = getISOTimestamp();
    
    Serial.print("   🌡️  온도: ");
    Serial.print(temp);
    Serial.println(" °C");
  }
  
  if (!isnan(humidity)) {
    JsonObject humidityReading = readings.createNestedObject();
    humidityReading["key"] = "humidity";
    humidityReading["value"] = humidity;
    humidityReading["unit"] = "percent";
    humidityReading["ts"] = getISOTimestamp();
    
    Serial.print("   💧 습도: ");
    Serial.print(humidity);
    Serial.println(" %");
  }
  #endif
  
  // JSON 직렬화
  String payload;
  serializeJson(doc, payload);
  
  // HTTP 요청
  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/bridge/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", DEVICE_ID);
  http.addHeader("x-device-key", DEVICE_KEY);
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    
    if (httpCode == 200) {
      Serial.println("   ✅ 전송 성공!");
      Serial.print("   응답: ");
      Serial.println(response);
    } else {
      Serial.print("   ⚠️  HTTP 오류: ");
      Serial.println(httpCode);
      Serial.println("   " + response);
    }
  } else {
    Serial.print("   ❌ 연결 실패: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
  Serial.println("");
}

// ISO 8601 타임스탬프 생성 (간단 버전)
String getISOTimestamp() {
  unsigned long seconds = millis() / 1000;
  char timestamp[32];
  sprintf(timestamp, "2025-10-01T10:%02lu:%02lu.000Z", 
          (seconds / 60) % 60, 
          seconds % 60);
  return String(timestamp);
}


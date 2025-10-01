/**
 * SmartFarm Universal Bridge - 다중 센서/제어 예제
 * 
 * ESP32 + DHT22 + 릴레이 + 모터 + LED
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ========== 설정값 ==========
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "http://192.168.1.100:3001";
const char* DEVICE_ID = "esp32-multi-001";
const char* DEVICE_KEY = "DK_your_device_key";

// ========== 센서 핀 정의 ==========
#define DHT_PIN 4
#define RELAY1_PIN 5
#define RELAY2_PIN 6
#define MOTOR_PIN 7
#define LED_PIN 8

// ========== 센서 라이브러리 ==========
#include <DHT.h>
DHT dht(DHT_PIN, DHT22);

// ========== 전역 변수 ==========
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 30000;  // 30초

void setup() {
  Serial.begin(115200);
  Serial.println("\n🌉 SmartFarm Multi-Sensor Device");
  
  // 핀 모드 설정
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(MOTOR_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // 초기 상태
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  digitalWrite(MOTOR_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
  // WiFi 연결
  connectWiFi();
  
  // 첫 번째 명령 확인
  checkCommands();
}

void loop() {
  // 센서 데이터 전송
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendSensorData();
    lastSendTime = millis();
  }
  
  // 명령 확인 (HTTP 폴링 방식)
  checkCommands();
  
  delay(1000);
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("WiFi 연결 중...");
  }
  Serial.println("✅ WiFi 연결 성공!");
  Serial.println("📡 IP 주소: " + WiFi.localIP().toString());
}

void sendSensorData() {
  // 모든 센서 데이터 수집
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  // 센서 데이터 JSON 생성
  DynamicJsonDocument doc(1024);
  doc["temp"] = temp;
  doc["hum"] = hum;
  doc["relay1_state"] = digitalRead(RELAY1_PIN);
  doc["relay2_state"] = digitalRead(RELAY2_PIN);
  doc["motor_state"] = digitalRead(MOTOR_PIN);
  doc["led_state"] = digitalRead(LED_PIN);
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  // HTTP 전송
  HTTPClient http;
  http.begin(SERVER_URL + String("/api/bridge/telemetry"));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", DEVICE_ID);
  http.addHeader("x-tenant-id", "00000000-0000-0000-0000-000000000001");
  
  int responseCode = http.POST(payload);
  if (responseCode == 200) {
    Serial.println("✅ 센서 데이터 전송 성공");
  } else {
    Serial.println("❌ 센서 데이터 전송 실패: " + String(responseCode));
  }
  http.end();
}

void checkCommands() {
  HTTPClient http;
  http.begin(SERVER_URL + String("/api/bridge/commands/") + DEVICE_ID);
  http.addHeader("x-device-id", DEVICE_ID);
  http.addHeader("x-tenant-id", "00000000-0000-0000-0000-000000000001");
  
  int responseCode = http.GET();
  if (responseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    JsonArray commands = doc["commands"];
    for (JsonObject cmd : commands) {
      String type = cmd["type"];
      String action = cmd["action"];
      JsonObject params = cmd["params"];
      
      // 명령 실행
      if (type == "relay_control") {
        int relay = params["relay"];
        String state = params["state"];
        
        if (relay == 1) {
          digitalWrite(RELAY1_PIN, state == "on" ? HIGH : LOW);
          Serial.println("🔌 릴레이1 " + state);
        } else if (relay == 2) {
          digitalWrite(RELAY2_PIN, state == "on" ? HIGH : LOW);
          Serial.println("🔌 릴레이2 " + state);
        }
      } else if (type == "motor_control") {
        String state = params["state"];
        digitalWrite(MOTOR_PIN, state == "on" ? HIGH : LOW);
        Serial.println("⚙️ 모터 " + state);
      } else if (type == "led_control") {
        String state = params["state"];
        digitalWrite(LED_PIN, state == "on" ? HIGH : LOW);
        Serial.println("💡 LED " + state);
      }
    }
  }
  http.end();
}

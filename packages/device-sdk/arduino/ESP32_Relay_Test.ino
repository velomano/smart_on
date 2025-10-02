/**
 * ESP32 + 릴레이 제어 테스트 코드
 * 
 * Universal Bridge와 연동하여 실시간 제어 명령 수신 테스트
 * 프로토콜: WebSocket
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// WebSocket 설정
const char* wsUrl = "ws://localhost:8080";  // 로컬 Universal Bridge
const char* deviceId = "ESP32-RELAY-TEST-001";
const char* deviceKey = "YOUR_DEVICE_KEY";  // Connect Wizard에서 생성

// 릴레이 핀 설정
#define RELAY1_PIN 2
#define RELAY2_PIN 4
#define LED_PIN 5

WebSocketsClient webSocket;

// 상태 변수
bool relay1State = false;
bool relay2State = false;
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000; // 30초마다

void setup() {
  Serial.begin(115200);
  Serial.println("🔌 ESP32 + 릴레이 제어 테스트 시작");
  
  // 핀 초기화
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // 릴레이 초기 상태 (OFF)
  digitalWrite(RELAY1_PIN, HIGH);  // 릴레이 모듈은 LOW가 ON
  digitalWrite(RELAY2_PIN, HIGH);
  digitalWrite(LED_PIN, LOW);
  
  Serial.println("✅ 릴레이 핀 초기화 완료");
  
  // WiFi 연결
  connectToWiFi();
  
  // WebSocket 연결
  if (WiFi.status() == WL_CONNECTED) {
    connectToWebSocket();
  }
}

void loop() {
  webSocket.loop();
  
  // 주기적 하트비트 전송
  if (millis() - lastHeartbeat >= heartbeatInterval) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // LED 상태 표시 (릴레이 상태에 따라)
  digitalWrite(LED_PIN, relay1State || relay2State);
  
  delay(100);
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
  } else {
    Serial.println();
    Serial.println("❌ WiFi 연결 실패");
  }
}

void connectToWebSocket() {
  Serial.println("🔗 WebSocket 연결 중...");
  
  webSocket.begin(wsUrl);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  // 디바이스 등록
  registerDevice();
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("❌ WebSocket 연결 끊김");
      break;
      
    case WStype_CONNECTED:
      Serial.println("✅ WebSocket 연결 성공");
      registerDevice();
      break;
      
    case WStype_TEXT:
      Serial.print("📨 명령 수신: ");
      Serial.println((char*)payload);
      processCommand((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.println("❌ WebSocket 오류");
      break;
  }
}

void registerDevice() {
  Serial.println("📝 디바이스 등록 중...");
  
  DynamicJsonDocument doc(1024);
  doc["type"] = "registry";
  doc["device_id"] = deviceId;
  doc["device_key"] = deviceKey;
  doc["device_type"] = "esp32-relay2ch";
  doc["capabilities"] = {
    "sensors": [],
    "actuators": ["relay1", "relay2"]
  };
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  webSocket.sendTXT(payload);
  Serial.println("✅ 디바이스 등록 완료");
}

void sendHeartbeat() {
  DynamicJsonDocument doc(512);
  doc["type"] = "heartbeat";
  doc["device_id"] = deviceId;
  doc["device_key"] = deviceKey;
  doc["status"] = {
    "relay1": relay1State,
    "relay2": relay2State,
    "online": true
  };
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  webSocket.sendTXT(payload);
  Serial.println("💓 하트비트 전송");
}

void processCommand(String command) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, command);
  
  if (error) {
    Serial.println("❌ JSON 파싱 오류");
    return;
  }
  
  String commandType = doc["type"];
  
  if (commandType == "command") {
    String action = doc["action"];
    String target = doc["target"];
    
    Serial.print("🎯 명령 실행: ");
    Serial.print(action);
    Serial.print(" -> ");
    Serial.println(target);
    
    if (target == "relay1") {
      controlRelay1(action);
    } else if (target == "relay2") {
      controlRelay2(action);
    } else if (target == "all") {
      controlAllRelays(action);
    }
    
    // 명령 실행 결과 전송
    sendCommandAck(action, target, true);
  }
}

void controlRelay1(String action) {
  if (action == "on") {
    digitalWrite(RELAY1_PIN, LOW);  // 릴레이 ON
    relay1State = true;
    Serial.println("🔌 릴레이1 ON");
  } else if (action == "off") {
    digitalWrite(RELAY1_PIN, HIGH); // 릴레이 OFF
    relay1State = false;
    Serial.println("🔌 릴레이1 OFF");
  } else if (action == "toggle") {
    relay1State = !relay1State;
    digitalWrite(RELAY1_PIN, relay1State ? LOW : HIGH);
    Serial.print("🔌 릴레이1 ");
    Serial.println(relay1State ? "ON" : "OFF");
  }
}

void controlRelay2(String action) {
  if (action == "on") {
    digitalWrite(RELAY2_PIN, LOW);  // 릴레이 ON
    relay2State = true;
    Serial.println("🔌 릴레이2 ON");
  } else if (action == "off") {
    digitalWrite(RELAY2_PIN, HIGH); // 릴레이 OFF
    relay2State = false;
    Serial.println("🔌 릴레이2 OFF");
  } else if (action == "toggle") {
    relay2State = !relay2State;
    digitalWrite(RELAY2_PIN, relay2State ? LOW : HIGH);
    Serial.print("🔌 릴레이2 ");
    Serial.println(relay2State ? "ON" : "OFF");
  }
}

void controlAllRelays(String action) {
  controlRelay1(action);
  controlRelay2(action);
}

void sendCommandAck(String action, String target, bool success) {
  DynamicJsonDocument doc(512);
  doc["type"] = "command_ack";
  doc["device_id"] = deviceId;
  doc["device_key"] = deviceKey;
  doc["command"] = {
    "action": action,
    "target": target,
    "success": success
  };
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  webSocket.sendTXT(payload);
  Serial.println("✅ 명령 ACK 전송");
}

void printStatus() {
  Serial.println("=== 릴레이 상태 ===");
  Serial.print("릴레이1: ");
  Serial.println(relay1State ? "ON" : "OFF");
  Serial.print("릴레이2: ");
  Serial.println(relay2State ? "ON" : "OFF");
  Serial.print("WebSocket: ");
  Serial.println(webSocket.isConnected() ? "연결됨" : "연결 안됨");
  Serial.println("==================");
}

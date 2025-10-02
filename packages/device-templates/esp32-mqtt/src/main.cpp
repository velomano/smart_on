#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <LittleFS.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT 설정
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic_telemetry = "device/telemetry";
const char* mqtt_topic_command = "device/command";

WiFiClient espClient;
PubSubClient client(espClient);

// 디바이스 정보
String device_id = "esp32-device-001";
unsigned long lastTelemetry = 0;
const unsigned long telemetryInterval = 30000; // 30초

void setup() {
  Serial.begin(115200);
  
  // LittleFS 초기화
  if (!LittleFS.begin()) {
    Serial.println("LittleFS 마운트 실패");
    return;
  }
  
  // 설정 파일 로드
  loadConfig();
  
  // WiFi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("WiFi 연결 중...");
  }
  Serial.println("WiFi 연결됨");
  
  // MQTT 연결
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(onMqttMessage);
  
  // 센서 초기화
  initSensors();
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // 텔레메트리 전송
  if (millis() - lastTelemetry > telemetryInterval) {
    sendTelemetry();
    lastTelemetry = millis();
  }
  
  // 센서 읽기
  readSensors();
  
  delay(1000);
}

void loadConfig() {
  File configFile = LittleFS.open("/config.json", "r");
  if (configFile) {
    String config = configFile.readString();
    configFile.close();
    
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, config);
    
    device_id = doc["device_id"].as<String>();
    // 기타 설정 로드...
    
    Serial.println("설정 로드됨: " + device_id);
  }
}

void initSensors() {
  // 센서 초기화 코드
  Serial.println("센서 초기화 완료");
}

void readSensors() {
  // 센서 데이터 읽기
  // 온도, 습도, 토양 수분 등
}

void sendTelemetry() {
  DynamicJsonDocument doc(1024);
  doc["device_id"] = device_id;
  doc["ts"] = millis();
  
  JsonObject metrics = doc.createNestedObject("metrics");
  metrics["temperature"] = 25.5;
  metrics["humidity"] = 60.2;
  metrics["soil_moisture"] = 45.8;
  metrics["status"] = "ok";
  
  String payload;
  serializeJson(doc, payload);
  
  client.publish(mqtt_topic_telemetry, payload.c_str());
  Serial.println("텔레메트리 전송: " + payload);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("명령 수신: " + message);
  
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String commandType = doc["type"];
  JsonObject params = doc["params"];
  
  if (commandType == "relay_on") {
    int relayPin = params["pin"];
    digitalWrite(relayPin, HIGH);
    Serial.println("릴레이 ON: " + String(relayPin));
  } else if (commandType == "relay_off") {
    int relayPin = params["pin"];
    digitalWrite(relayPin, LOW);
    Serial.println("릴레이 OFF: " + String(relayPin));
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("MQTT 연결 시도 중...");
    if (client.connect(device_id.c_str())) {
      Serial.println("MQTT 연결됨");
      client.subscribe(mqtt_topic_command);
    } else {
      Serial.println("MQTT 연결 실패, 5초 후 재시도");
      delay(5000);
    }
  }
}

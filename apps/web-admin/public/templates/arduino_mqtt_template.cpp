/*
 * 🚀 Arduino MQTT 디바이스 템플릿
 * 스마트팜 플랫폼 연동용
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT 설정
const char* mqtt_server = "your-broker.com";
const int mqtt_port = 8883;
const char* mqtt_user = "your-username";
const char* mqtt_pass = "your-password";

// 디바이스 정보
const char* farm_id = "farm_001";
const char* device_id = "device_001";
const char* device_type = "sensor_gateway";
const char* firmware_version = "1.0.0";

// 센서 설정
#define DHT_PIN 2
#define DHT_TYPE DHT22
#define EC_PIN A0
#define PH_PIN A1
#define PUMP_PIN 3

DHT dht(DHT_PIN, DHT_TYPE);

WiFiClientSecure espClient;
PubSubClient client(espClient);

// 전역 변수
unsigned long lastTelemetry = 0;
unsigned long lastState = 0;
unsigned long lastRegistry = 0;
unsigned long batchSeq = 0;
bool pumpState = false;

// 토픽 생성 함수들
String getRegistryTopic() {
  return "farms/" + String(farm_id) + "/devices/" + String(device_id) + "/registry";
}

String getStateTopic() {
  return "farms/" + String(farm_id) + "/devices/" + String(device_id) + "/state";
}

String getTelemetryTopic() {
  return "farms/" + String(farm_id) + "/devices/" + String(device_id) + "/telemetry";
}

String getCommandTopic() {
  return "farms/" + String(farm_id) + "/devices/" + String(device_id) + "/command";
}

String getAckTopic() {
  return "farms/" + String(farm_id) + "/devices/" + String(device_id) + "/command/ack";
}

void setup() {
  Serial.begin(115200);
  
  // 핀 설정
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);
  
  // 센서 초기화
  dht.begin();
  
  // WiFi 연결
  setupWiFi();
  
  // MQTT 연결
  setupMQTT();
  
  // 디바이스 등록
  sendRegistry();
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("WiFi 연결 중: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi 연결됨");
  Serial.print("IP 주소: ");
  Serial.println(WiFi.localIP());
}

void setupMQTT() {
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  // TLS 설정 (포트 8883인 경우)
  espClient.setInsecure(); // 개발용, 프로덕션에서는 인증서 검증 필요
  
  while (!client.connected()) {
    Serial.print("MQTT 연결 중...");
    
    String clientId = "device-" + String(device_id) + "-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("연결됨");
      
      // 명령 토픽 구독
      client.subscribe(getCommandTopic().c_str());
      Serial.println("명령 토픽 구독: " + getCommandTopic());
      
    } else {
      Serial.print("연결 실패, rc=");
      Serial.print(client.state());
      Serial.println(" 5초 후 재시도");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("메시지 수신 [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);
  
  // JSON 파싱
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String command = doc["command"];
  String commandId = doc["command_id"];
  JsonObject payload_obj = doc["payload"];
  
  // 명령 처리
  if (command == "pump_on") {
    handlePumpOn(commandId, payload_obj);
  } else if (command == "pump_off") {
    handlePumpOff(commandId, payload_obj);
  } else if (command == "update_config") {
    handleConfigUpdate(commandId, payload_obj);
  }
}

void handlePumpOn(String commandId, JsonObject payload) {
  int duration = payload["duration"] | 300; // 기본 5분
  float flowRate = payload["flow_rate"] | 2.5; // 기본 2.5L/min
  
  digitalWrite(PUMP_PIN, HIGH);
  pumpState = true;
  
  // ACK 응답
  sendCommandAck(commandId, "success", "Pump turned on for " + String(duration) + " seconds");
  
  Serial.println("펌프 켜짐 - " + String(duration) + "초, 유량: " + String(flowRate));
  
  // 타이머 설정 (실제 구현에서는 타이머 라이브러리 사용)
  // setTimeout(pumpOff, duration * 1000);
}

void handlePumpOff(String commandId, JsonObject payload) {
  digitalWrite(PUMP_PIN, LOW);
  pumpState = false;
  
  sendCommandAck(commandId, "success", "Pump turned off");
  
  Serial.println("펌프 꺼짐");
}

void handleConfigUpdate(String commandId, JsonObject payload) {
  // 설정 업데이트 로직
  int samplingInterval = payload["sampling_interval"] | 30;
  
  sendCommandAck(commandId, "success", "Configuration updated");
  
  Serial.println("설정 업데이트됨 - 샘플링 간격: " + String(samplingInterval));
}

void sendRegistry() {
  DynamicJsonDocument doc(1024);
  
  doc["device_id"] = device_id;
  doc["device_type"] = device_type;
  doc["firmware_version"] = firmware_version;
  doc["hardware_version"] = "v1.0";
  
  JsonObject capabilities = doc.createNestedObject("capabilities");
  JsonArray sensors = capabilities.createNestedArray("sensors");
  sensors.add("temperature");
  sensors.add("humidity");
  sensors.add("ec");
  sensors.add("ph");
  
  JsonArray actuators = capabilities.createNestedArray("actuators");
  actuators.add("pump");
  
  JsonObject location = doc.createNestedObject("location");
  location["farm_id"] = farm_id;
  location["bed_id"] = "bed_a1";
  location["tier"] = 1;
  
  doc["timestamp"] = getCurrentTime();
  
  String message;
  serializeJson(doc, message);
  
  client.publish(getRegistryTopic().c_str(), message.c_str());
  Serial.println("디바이스 등록 전송: " + message);
}

void sendState() {
  DynamicJsonDocument doc(1024);
  
  doc["device_id"] = device_id;
  
  JsonObject status = doc.createNestedObject("status");
  status["online"] = true;
  status["battery_level"] = 85; // 실제 배터리 레벨 읽기
  status["signal_strength"] = WiFi.RSSI();
  status["uptime"] = millis() / 1000;
  status["last_restart"] = getCurrentTime();
  
  JsonObject sensors = doc.createNestedObject("sensors");
  JsonObject tempSensor = sensors.createNestedObject("temperature");
  tempSensor["connected"] = !isnan(dht.readTemperature());
  tempSensor["calibrated"] = true;
  
  JsonObject humiditySensor = sensors.createNestedObject("humidity");
  humiditySensor["connected"] = !isnan(dht.readHumidity());
  humiditySensor["calibrated"] = true;
  
  JsonObject ecSensor = sensors.createNestedObject("ec");
  ecSensor["connected"] = true;
  ecSensor["calibrated"] = false;
  
  JsonObject phSensor = sensors.createNestedObject("ph");
  phSensor["connected"] = true;
  phSensor["calibrated"] = false;
  
  JsonObject actuators = doc.createNestedObject("actuators");
  JsonObject pump = actuators.createNestedObject("pump_1");
  pump["status"] = pumpState ? "on" : "off";
  pump["last_command"] = getCurrentTime();
  
  doc["timestamp"] = getCurrentTime();
  
  String message;
  serializeJson(doc, message);
  
  client.publish(getStateTopic().c_str(), message.c_str());
  Serial.println("상태 전송: " + message);
}

void sendTelemetry() {
  DynamicJsonDocument doc(1024);
  
  doc["device_id"] = device_id;
  doc["batch_seq"] = ++batchSeq;
  doc["window_ms"] = 30000;
  
  JsonArray readings = doc.createNestedArray("readings");
  
  // 온도 센서 읽기
  float temperature = dht.readTemperature();
  if (!isnan(temperature)) {
    JsonObject tempReading = readings.createNestedObject();
    tempReading["key"] = "temperature";
    tempReading["tier"] = 1;
    tempReading["unit"] = "celsius";
    tempReading["value"] = temperature;
    tempReading["ts"] = getCurrentTime();
    tempReading["quality"] = "good";
  }
  
  // 습도 센서 읽기
  float humidity = dht.readHumidity();
  if (!isnan(humidity)) {
    JsonObject humidityReading = readings.createNestedObject();
    humidityReading["key"] = "humidity";
    humidityReading["tier"] = 1;
    humidityReading["unit"] = "percent";
    humidityReading["value"] = humidity;
    humidityReading["ts"] = getCurrentTime();
    humidityReading["quality"] = "good";
  }
  
  // EC 센서 읽기 (시뮬레이션)
  float ecValue = analogRead(EC_PIN) * (5.0 / 1023.0) * 2.0;
  JsonObject ecReading = readings.createNestedObject();
  ecReading["key"] = "ec";
  ecReading["tier"] = 1;
  ecReading["unit"] = "ms_cm";
  ecReading["value"] = ecValue;
  ecReading["ts"] = getCurrentTime();
  ecReading["quality"] = "good";
  
  // pH 센서 읽기 (시뮬레이션)
  float phValue = analogRead(PH_PIN) * (5.0 / 1023.0) * 14.0;
  JsonObject phReading = readings.createNestedObject();
  phReading["key"] = "ph";
  phReading["tier"] = 1;
  phReading["unit"] = "ph";
  phReading["value"] = phValue;
  phReading["ts"] = getCurrentTime();
  phReading["quality"] = "good";
  
  doc["timestamp"] = getCurrentTime();
  
  String message;
  serializeJson(doc, message);
  
  client.publish(getTelemetryTopic().c_str(), message.c_str());
  Serial.println("센서 데이터 전송: " + String(readings.size()) + "개 읽기값");
}

void sendCommandAck(String commandId, String status, String detail) {
  DynamicJsonDocument doc(1024);
  
  doc["command_id"] = commandId;
  doc["status"] = status;
  doc["detail"] = detail;
  
  JsonObject state = doc.createNestedObject("state");
  JsonObject pump = state.createNestedObject("pump_1");
  pump["status"] = pumpState ? "on" : "off";
  pump["flow_rate"] = pumpState ? 2.5 : 0.0;
  
  doc["timestamp"] = getCurrentTime();
  
  String message;
  serializeJson(doc, message);
  
  client.publish(getAckTopic().c_str(), message.c_str());
  Serial.println("명령 ACK 전송: " + status);
}

String getCurrentTime() {
  // 실제 구현에서는 NTP 시간 동기화 사용
  unsigned long currentTime = millis() / 1000;
  return "2024-01-15T10:30:00Z"; // 시뮬레이션
}

void loop() {
  if (!client.connected()) {
    setupMQTT();
  }
  client.loop();
  
  unsigned long currentTime = millis();
  
  // 30초마다 센서 데이터 전송
  if (currentTime - lastTelemetry >= 30000) {
    sendTelemetry();
    lastTelemetry = currentTime;
  }
  
  // 5분마다 상태 전송
  if (currentTime - lastState >= 300000) {
    sendState();
    lastState = currentTime;
  }
  
  // 1시간마다 재등록
  if (currentTime - lastRegistry >= 3600000) {
    sendRegistry();
    lastRegistry = currentTime;
  }
  
  delay(1000);
}

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
  // MQTT 전용 설정
  mqttBroker?: string;
  mqttPort?: number;
  mqttUsername?: string;
  mqttPassword?: string;
  farmId?: string;
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
    return generateArduinoHttpSnippet(params);
  } else if (params.protocol === 'mqtt') {
    return generateArduinoMqttSnippet(params);
  } else if (params.protocol === 'websocket') {
    return generateArduinoWebSocketSnippet(params);
  }
  
  return '// TODO: Implement other protocols';
}

/**
 * Arduino/ESP32 HTTP 코드 생성
 */
function generateArduinoHttpSnippet(params: SnippetParams): string {
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

/**
 * Arduino/ESP32 MQTT 코드 생성
 */
function generateArduinoMqttSnippet(params: SnippetParams): string {
  return `
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT 설정
const char* mqttBroker = "${params.mqttBroker || 'localhost'}";
const int mqttPort = ${params.mqttPort || 1883};
const char* mqttUsername = "${params.mqttUsername || ''}";
const char* mqttPassword = "${params.mqttPassword || ''}";

// 디바이스 설정
const char* deviceId = "${params.deviceId}";
const char* farmId = "${params.farmId || 'default'}";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // WiFi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi 연결 성공!");
  
  // MQTT 연결
  client.setServer(mqttBroker, mqttPort);
  client.setCallback(onMqttMessage);
  
  connectToMqtt();
  
  // 디바이스 등록
  registerDevice();
}

void loop() {
  if (!client.connected()) {
    connectToMqtt();
  }
  client.loop();
  
  // 센서 데이터 전송
  sendTelemetry();
  delay(30000);  // 30초마다
}

void connectToMqtt() {
  while (!client.connected()) {
    String clientId = "ESP32-" + String(deviceId);
    if (client.connect(clientId.c_str(), mqttUsername, mqttPassword)) {
      Serial.println("MQTT 연결 성공!");
      
      // 명령 구독
      String commandTopic = "farms/" + String(farmId) + "/devices/" + String(deviceId) + "/command";
      client.subscribe(commandTopic.c_str());
    } else {
      Serial.print("MQTT 연결 실패, rc=");
      Serial.print(client.state());
      Serial.println(" 5초 후 재시도...");
      delay(5000);
    }
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("메시지 수신 [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  // TODO: 명령 처리
  processCommand(message);
}

void registerDevice() {
  String topic = "farms/" + String(farmId) + "/devices/" + String(deviceId) + "/registry";
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["farm_id"] = farmId;
  doc["capabilities"] = {
    "sensors": ${JSON.stringify(params.sensors || [])},
    "actuators": ${JSON.stringify(params.actuators || [])}
  };
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  
  client.publish(topic.c_str(), payload.c_str());
  Serial.println("디바이스 등록 완료");
}

void sendTelemetry() {
  String topic = "farms/" + String(farmId) + "/devices/" + String(deviceId) + "/telemetry";
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["farm_id"] = farmId;
  doc["readings"] = JsonArray();
  doc["timestamp"] = millis();
  
  // TODO: 실제 센서 값 추가
  // JsonArray readings = doc["readings"];
  // readings.add(JsonObject{
  //   {"key", "temperature"},
  //   {"value", 25.5},
  //   {"unit", "°C"},
  //   {"ts", millis()}
  // });
  
  String payload;
  serializeJson(doc, payload);
  
  client.publish(topic.c_str(), payload.c_str());
  Serial.println("텔레메트리 전송 완료");
}

void processCommand(String command) {
  // TODO: 명령 처리 로직
  Serial.println("명령 처리: " + command);
}
`.trim();
}

/**
 * Arduino/ESP32 WebSocket 코드 생성
 */
function generateArduinoWebSocketSnippet(params: SnippetParams): string {
  return `
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// WebSocket 설정
const char* wsUrl = "${params.serverUrl}";
const char* deviceId = "${params.deviceId}";
const char* deviceKey = "${params.deviceKey}";

WebSocketsClient webSocket;

void setup() {
  Serial.begin(115200);
  
  // WiFi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi 연결 성공!");
  
  // WebSocket 연결
  webSocket.begin(wsUrl);
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  
  // 센서 데이터 전송
  sendTelemetry();
  delay(30000);  // 30초마다
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket 연결 끊김");
      break;
    case WStype_CONNECTED:
      Serial.println("WebSocket 연결 성공");
      break;
    case WStype_TEXT:
      Serial.print("메시지 수신: ");
      Serial.println((char*)payload);
      processCommand((char*)payload);
      break;
  }
}

void sendTelemetry() {
  DynamicJsonDocument doc(1024);
  doc["type"] = "telemetry";
  doc["device_id"] = deviceId;
  doc["device_key"] = deviceKey;
  doc["readings"] = JsonArray();
  doc["timestamp"] = millis();
  
  // TODO: 실제 센서 값 추가
  
  String payload;
  serializeJson(doc, payload);
  
  webSocket.sendTXT(payload);
  Serial.println("텔레메트리 전송 완료");
}

void processCommand(String command) {
  // TODO: 명령 처리 로직
  Serial.println("명령 처리: " + command);
}
`.trim();
}

/**
 * Python (Raspberry Pi) 코드 생성
 */
function generatePythonSnippet(params: SnippetParams): string {
  if (params.protocol === 'http') {
    return generatePythonHttpSnippet(params);
  } else if (params.protocol === 'mqtt') {
    return generatePythonMqttSnippet(params);
  } else if (params.protocol === 'websocket') {
    return generatePythonWebSocketSnippet(params);
  }
  
  return '// TODO: Implement other protocols';
}

/**
 * Python HTTP 코드 생성
 */
function generatePythonHttpSnippet(params: SnippetParams): string {
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

/**
 * Python MQTT 코드 생성
 */
function generatePythonMqttSnippet(params: SnippetParams): string {
  return `
import paho.mqtt.client as mqtt
import json
import time
from datetime import datetime

# MQTT 설정
MQTT_BROKER = "${params.mqttBroker || 'localhost'}"
MQTT_PORT = ${params.mqttPort || 1883}
MQTT_USERNAME = "${params.mqttUsername || ''}"
MQTT_PASSWORD = "${params.mqttPassword || ''}"

# 디바이스 설정
DEVICE_ID = "${params.deviceId}"
FARM_ID = "${params.farmId || 'default'}"

class SmartFarmClient:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("MQTT 연결 성공!")
            self.register_device()
            
            # 명령 구독
            command_topic = f"farms/{FARM_ID}/devices/{DEVICE_ID}/command"
            client.subscribe(command_topic)
            print(f"구독 완료: {command_topic}")
        else:
            print(f"MQTT 연결 실패, rc={rc}")
            
    def on_message(self, client, userdata, msg):
        topic = msg.topic
        payload = msg.payload.decode()
        print(f"메시지 수신 [{topic}]: {payload}")
        
        try:
            command = json.loads(payload)
            self.process_command(command)
        except json.JSONDecodeError:
            print("잘못된 JSON 형식")
            
    def on_disconnect(self, client, userdata, rc):
        print("MQTT 연결 끊김")
        
    def connect(self):
        try:
            self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"연결 오류: {e}")
            
    def register_device(self):
        topic = f"farms/{FARM_ID}/devices/{DEVICE_ID}/registry"
        
        payload = {
            "device_id": DEVICE_ID,
            "farm_id": FARM_ID,
            "capabilities": {
                "sensors": ${JSON.stringify(params.sensors || [])},
                "actuators": ${JSON.stringify(params.actuators || [])}
            },
            "timestamp": int(time.time() * 1000)
        }
        
        self.client.publish(topic, json.dumps(payload))
        print("디바이스 등록 완료")
        
    def send_telemetry(self, readings):
        topic = f"farms/{FARM_ID}/devices/{DEVICE_ID}/telemetry"
        
        payload = {
            "device_id": DEVICE_ID,
            "farm_id": FARM_ID,
            "readings": readings,
            "timestamp": int(time.time() * 1000)
        }
        
        self.client.publish(topic, json.dumps(payload))
        print("텔레메트리 전송 완료")
        
    def process_command(self, command):
        print(f"명령 처리: {command}")
        # TODO: 명령 처리 로직

if __name__ == "__main__":
    client = SmartFarmClient()
    client.connect()
    
    try:
        while True:
            # TODO: 실제 센서 값 수집
            readings = []
            client.send_telemetry(readings)
            time.sleep(30)  # 30초마다
            
    except KeyboardInterrupt:
        print("프로그램 종료")
        client.client.loop_stop()
        client.client.disconnect()
`.trim();
}

/**
 * Python WebSocket 코드 생성
 */
function generatePythonWebSocketSnippet(params: SnippetParams): string {
  return `
import websocket
import json
import time
from datetime import datetime

# WebSocket 설정
WS_URL = "${params.serverUrl}"
DEVICE_ID = "${params.deviceId}"
DEVICE_KEY = "${params.deviceKey}"

class SmartFarmWebSocketClient:
    def __init__(self):
        self.ws = None
        
    def on_message(self, ws, message):
        print(f"메시지 수신: {message}")
        try:
            data = json.loads(message)
            self.process_command(data)
        except json.JSONDecodeError:
            print("잘못된 JSON 형식")
            
    def on_error(self, ws, error):
        print(f"WebSocket 오류: {error}")
        
    def on_close(self, ws, close_status_code, close_msg):
        print("WebSocket 연결 끊김")
        
    def on_open(self, ws):
        print("WebSocket 연결 성공")
        
    def connect(self):
        websocket.enableTrace(True)
        self.ws = websocket.WebSocketApp(
            WS_URL,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        
    def send_telemetry(self, readings):
        payload = {
            "type": "telemetry",
            "device_id": DEVICE_ID,
            "device_key": DEVICE_KEY,
            "readings": readings,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        self.ws.send(json.dumps(payload))
        print("텔레메트리 전송 완료")
        
    def process_command(self, command):
        print(f"명령 처리: {command}")
        # TODO: 명령 처리 로직

if __name__ == "__main__":
    client = SmartFarmWebSocketClient()
    client.connect()
    
    try:
        client.ws.run_forever()
    except KeyboardInterrupt:
        print("프로그램 종료")
        client.ws.close()
`.trim();
}


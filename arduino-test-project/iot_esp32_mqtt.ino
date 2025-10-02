/**
 * Universal Bridge 호환 IoT 시스템 코드
 * 디바이스: ESP32
 * 생성 시간: 2025-10-02T14:24:42.881Z
 * 
 * 
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>
#include <SparkFun_ENS160.h>
#include <Adafruit_NeoPixel.h>

// WiFi 설정 (보안을 위해 직접 입력하세요)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Universal Bridge MQTT 설정 (브로커 내장)
const char* mqtt_host = "localhost";  // Universal Bridge가 실행되는 서버
const int mqtt_port = 1883;
WiFiClient esp;
PubSubClient mqtt(esp);

// 토픽 규칙: terahub/{tenant}/{deviceId}/{kind}/{name}
const char* topicBase = "terahub/demo/esp32-mlb3jf0u";

// I2C 설정 (BME280, ENS160 공통)
const int I2C_SDA = 21;
const int I2C_SCL = 22;

// 센서 객체 선언
Adafruit_BME280 bme0;
SparkFun_ENS160 ens160_1;
const int TRIG_PIN_2 = 18;
const int ECHO_PIN_2 = 19;
const int STEP_PIN_0 = 33;
const int DIR_PIN_0 = 32;
const int EN_PIN_0 = 14;
Adafruit_NeoPixel strip1(60, 27, NEO_GRB + NEO_KHZ800);
const int RELAY_PIN_2 = 26;

// 액추에이터 핀 정의
// A4988 핀: STEP=GPIO33, DIR=GPIO32, EN=GPIO14
// WS2812B 핀: DATA=GPIO27 (레벨시프터 권장)
// 릴레이 핀: GPIO26 (외부 전원 필요)

void setup() {
  Serial.begin(115200);
  
  // WiFi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("WiFi 연결 중...");
  }
  Serial.println("WiFi 연결 완료!");
  
  // I2C 초기화
  Wire.begin(I2C_SDA, I2C_SCL);
  Serial.println("I2C 초기화 완료!");
  
  // 센서 초기화
  
  // BME280 초기화 (I2C 주소 자동 감지: 0x76 또는 0x77)
  if (!bme0.begin(0x76)) {
    if (!bme0.begin(0x77)) {
      Serial.println("BME280 초기화 실패!");
    } else {
      Serial.println("BME280 초기화 성공 (주소: 0x77)");
    }
  } else {
    Serial.println("BME280 초기화 성공 (주소: 0x76)");
  }
  // ENS160 초기화 (I2C 주소 자동 감지: 0x52 또는 0x53)
  if (!ens160_1.begin(0x52)) {
    if (!ens160_1.begin(0x53)) {
      Serial.println("ENS160 초기화 실패!");
    } else {
      Serial.println("ENS160 초기화 성공 (주소: 0x53)");
    }
  } else {
    Serial.println("ENS160 초기화 성공 (주소: 0x52)");
  }
  // HC-SR04 초기화 (TRIG/ECHO 핀 설정)
  pinMode(TRIG_PIN_2, OUTPUT);
  pinMode(ECHO_PIN_2, INPUT);
  Serial.println("HC-SR04 초기화 완료");
  // A4988 스테퍼 초기화
  pinMode(STEP_PIN_0, OUTPUT);
  pinMode(DIR_PIN_0, OUTPUT);
  pinMode(EN_PIN_0, OUTPUT);
  digitalWrite(EN_PIN_0, LOW);  // 활성화
  Serial.println("A4988 스테퍼 초기화 완료");
  // WS2812B 초기화
  strip1.begin();
  strip1.show();
  Serial.println("WS2812B 초기화 완료");
  // 릴레이 초기화
  pinMode(RELAY_PIN_2, OUTPUT);
  digitalWrite(RELAY_PIN_2, LOW);  // 초기값 OFF
  Serial.println("릴레이 초기화 완료");
  
  // Universal Bridge MQTT 연결
  mqtt.setServer(mqtt_host, mqtt_port);
  String clientId = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  while (!mqtt.connect(clientId.c_str())) {
    delay(1000);
    Serial.println("Universal Bridge MQTT 연결 중...");
  }
  Serial.println("Universal Bridge MQTT 연결 완료!");
  
  // MQTT 구독 설정
  mqtt.setCallback(mqttCallback);
  mqtt.subscribe((String(topicBase) + "/actuators/stepper_0/set").c_str());
  mqtt.subscribe((String(topicBase) + "/actuators/neopixel_1/set").c_str());
  mqtt.subscribe((String(topicBase) + "/actuators/relay_2/set").c_str());
  
  Serial.println("시스템 초기화 완료!");
}

void loop() {
  if (!mqtt.connected()) {
    String clientId = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    mqtt.connect(clientId.c_str());
    mqtt.subscribe((String(topicBase) + "/actuators/stepper_0/set").c_str());
  mqtt.subscribe((String(topicBase) + "/actuators/neopixel_1/set").c_str());
  mqtt.subscribe((String(topicBase) + "/actuators/relay_2/set").c_str());
  }
  mqtt.loop();
  
  // 센서 데이터 발행 (5초 주기)
  static unsigned long lastPublish = 0;
  if (millis() - lastPublish > 5000) {
    lastPublish = millis();
    
    
    // BME280 데이터 읽기
    float temp0 = bme0.readTemperature();
    float hum0 = bme0.readHumidity();
    float press0 = bme0.readPressure() / 100.0;
    
    char tempStr[10], humStr[10], pressStr[10];
    dtostrf(temp0, 1, 2, tempStr);
    dtostrf(hum0, 1, 2, humStr);
    dtostrf(press0, 1, 2, pressStr);
    
    mqtt.publish((String(topicBase) + "/sensors/bme280_0/temperature").c_str(), tempStr, true);
    mqtt.publish((String(topicBase) + "/sensors/bme280_0/humidity").c_str(), humStr, true);
    mqtt.publish((String(topicBase) + "/sensors/bme280_0/pressure").c_str(), pressStr, true);
    // ENS160 데이터 읽기
    if (ens160_1.dataAvailable()) {
      float aqi1 = ens160_1.getAQI();
      float tvoc1 = ens160_1.getTVOC();
      float eco21 = ens160_1.getECO2();
      
      char aqiStr[10], tvocStr[10], eco2Str[10];
      dtostrf(aqi1, 1, 2, aqiStr);
      dtostrf(tvoc1, 1, 2, tvocStr);
      dtostrf(eco21, 1, 2, eco2Str);
      
      mqtt.publish((String(topicBase) + "/sensors/ens160_1/aqi").c_str(), aqiStr, true);
      mqtt.publish((String(topicBase) + "/sensors/ens160_1/tvoc").c_str(), tvocStr, true);
      mqtt.publish((String(topicBase) + "/sensors/ens160_1/eco2").c_str(), eco2Str, true);
    }
    // HC-SR04 거리 측정
    digitalWrite(TRIG_PIN_2, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN_2, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN_2, LOW);
    
    long duration2 = pulseIn(ECHO_PIN_2, HIGH, 30000);
    float distance2 = duration2 / 58.0;  // cm 단위
    
    char distStr[10];
    dtostrf(distance2, 1, 2, distStr);
    mqtt.publish((String(topicBase) + "/sensors/hcsr04_2/distance").c_str(), distStr, true);
    
    Serial.println("센서 데이터 발행 완료");
  }
  
  delay(100);
}

// MQTT 메시지 수신 콜백
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("MQTT 메시지 수신: " + String(topic) + " = " + message);
  
  
  // A4988 스테퍼 제어
  if (String(topic).endsWith("/actuators/stepper_0/set")) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, message);
    
    int steps = doc["steps"] | 0;
    int dir = doc["dir"] | 0;
    int speed_hz = doc["speed_hz"] | 1000;
    bool enable = doc["enable"] | true;
    
    digitalWrite(EN_PIN_0, enable ? LOW : HIGH);
    digitalWrite(DIR_PIN_0, dir);
    
    for (int i = 0; i < steps; i++) {
      digitalWrite(STEP_PIN_0, HIGH);
      delayMicroseconds(1000000 / speed_hz / 2);
      digitalWrite(STEP_PIN_0, LOW);
      delayMicroseconds(1000000 / speed_hz / 2);
    }
    Serial.println("스테퍼 이동: " + String(steps) + " 스텝");
  }
  // WS2812B 제어
  if (String(topic).endsWith("/actuators/neopixel_1/set")) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, message);
    
    int r = doc["r"] | 0;
    int g = doc["g"] | 0;
    int b = doc["b"] | 0;
    int count = doc["count"] | 60;
    
    strip1.fill(strip1.Color(r, g, b));
    strip1.show();
    Serial.println("NeoPixel 설정: R=" + String(r) + " G=" + String(g) + " B=" + String(b));
  }
  // 릴레이 제어
  if (String(topic).endsWith("/actuators/relay_2/set")) {
    if (message == "on") {
      digitalWrite(RELAY_PIN_2, HIGH);
      Serial.println("릴레이 ON");
    } else if (message == "off") {
      digitalWrite(RELAY_PIN_2, LOW);
      Serial.println("릴레이 OFF");
    }
  }
}
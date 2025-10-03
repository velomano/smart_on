#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <SPIFFS.h>

#include <Adafruit_BME280.h>
#include <Adafruit_ADS1015.h>
#include <DHT.h>

// ---------- Globals
WiFiClient espClient;
PubSubClient mqtt(espClient);

Adafruit_BME280 bme;
Adafruit_ADS1115 ads;
DHT* dht = nullptr;

// PWM channels
struct PwmChannel { int ch; int pin; bool enabled; } pwmChannels[16];

// Hardware profile loaded from JSON
struct Actuator { 
  String name; 
  int pin; 
  bool activeLow; 
  bool pwm; 
  String driver; 
};
std::vector<Actuator> actuators;

String topicBase = "farm/bridge1";
String cfgWifiSsid, cfgWifiPass, cfgMqttHost, cfgMqttUser, cfgMqttPass;
int cfgMqttPort = 1883;
int dhtPin = 27;

// ---------- Utils
void safeSetOutput(int pin, bool activeLow, bool off = true) {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, (off ? (activeLow ? HIGH : LOW) : (activeLow ? LOW : HIGH)));
}

void publishJson(const String& sub, JsonDocument& doc) {
  String payload;
  serializeJson(doc, payload);
  mqtt.publish((topicBase + sub).c_str(), payload.c_str(), true);
}

void scanI2C(JsonDocument& report) {
  JsonArray arr = report.createNestedArray("i2c");
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      arr.add(String(addr, HEX));
    }
  }
}

bool isBootstrapPin(int pin) {
  return pin == 0 || pin == 2 || pin == 4 || pin == 12 || pin == 15;
}

bool isInputOnly(int pin) {
  return pin >= 34 && pin <= 39;
}

// ---------- Config loader
bool loadConfig() {
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS 초기화 실패");
    return false;
  }
  
  File f = SPIFFS.open("/config.json", "r");
  if (!f) {
    Serial.println("config.json 파일을 찾을 수 없음");
    return false;
  }
  
  DynamicJsonDocument doc(4096);
  DeserializationError err = deserializeJson(doc, f);
  f.close();
  
  if (err) {
    Serial.println("JSON 파싱 실패: " + String(err.c_str()));
    return false;
  }

  // WiFi 설정
  cfgWifiSsid = doc["wifi"]["ssid"].as<String>();
  cfgWifiPass = doc["wifi"]["password"].as<String>();
  
  // MQTT 설정
  cfgMqttHost = doc["mqtt"]["host"].as<String>();
  cfgMqttPort = doc["mqtt"]["port"] | 1883;
  cfgMqttUser = doc["mqtt"]["user"].as<String>();
  cfgMqttPass = doc["mqtt"]["pass"].as<String>();
  topicBase = doc["mqtt"]["baseTopic"].as<String>();

  // I2C 정책 강제 적용
  int sda = doc["hardwareProfile"]["i2c"]["sda"] | 21;
  int scl = doc["hardwareProfile"]["i2c"]["scl"] | 22;
  if (sda != 21 || scl != 22) {
    Serial.println("I2C 핀 정책 위반: SDA=21, SCL=22 고정");
    return false;
  }

  // DHT22 핀 설정
  for (JsonObject sensor : doc["hardwareProfile"]["sensors"].as<JsonArray>()) {
    if (sensor["type"] == "DHT22") {
      dhtPin = sensor["pin"] | 27;
      break;
    }
  }

  // 액추에이터 설정
  actuators.clear();
  for (JsonObject act : doc["hardwareProfile"]["actuators"].as<JsonArray>()) {
    Actuator a;
    a.name = act["name"].as<String>();
    a.pin = act["pin"] | -1;
    a.activeLow = act["activeLow"] | false;
    a.pwm = act["pwm"] | false;
    a.driver = act["driver"].as<String>();
    
    if (a.pin < 0 || isBootstrapPin(a.pin) || isInputOnly(a.pin)) {
      Serial.println("액추에이터 핀 정책 위반: GPIO" + String(a.pin));
      return false;
    }
    actuators.push_back(a);
  }
  
  return true;
}

// ---------- MQTT Callback
void onMqtt(char* topic, byte* payload, unsigned int len) {
  String t(topic), p;
  p.reserve(len);
  for (unsigned int i = 0; i < len; i++) p += (char)payload[i];

  if (t == topicBase + "/cmd/selftest") {
    DynamicJsonDocument rep(1024);
    rep["cmd"] = "selftest";
    rep["timestamp"] = millis();
    
    Serial.println("Self-Test 시작");
    
    // 액추에이터 순차 토글
    for (auto &a : actuators) {
      Serial.println("토글: " + a.name + " (GPIO" + String(a.pin) + ")");
      safeSetOutput(a.pin, a.activeLow, false);
      delay(800);
      safeSetOutput(a.pin, a.activeLow, true);
      delay(200);
    }
    
    // PWM 부저 테스트
    for (auto &a : actuators) {
      if (a.pwm) {
        Serial.println("PWM 테스트: " + a.name + " (GPIO" + String(a.pin) + ")");
        ledcSetup(0, 2000, 10);
        ledcAttachPin(a.pin, 0);
        for (int duty = 0; duty <= 1023; duty += 128) {
          ledcWrite(0, duty);
          delay(120);
        }
        ledcWrite(0, 0);
        delay(500);
      }
    }
    
    rep["ok"] = true;
    rep["actuators_tested"] = actuators.size();
    publishJson("/status/selftest", rep);
    Serial.println("Self-Test 완료");
  }
}

// ---------- Setup
void setup() {
  Serial.begin(115200);
  delay(300);
  
  Serial.println("ESP32 Universal Bridge 시작");

  if (!loadConfig()) {
    Serial.println("설정 로드/검증 실패 - 부팅 중단");
    while (true) delay(1000);
  }

  // 모든 액추에이터 핀을 안전 상태로 초기화
  for (auto &a : actuators) {
    safeSetOutput(a.pin, a.activeLow, true);
  }

  // I2C 초기화 (고정 핀)
  Wire.begin(21, 22);
  
  // 센서 초기화
  if (bme.begin(0x76)) {
    Serial.println("BME280 초기화 성공");
  } else {
    Serial.println("BME280 초기화 실패");
  }
  
  if (ads.begin()) {
    Serial.println("ADS1115 초기화 성공");
  } else {
    Serial.println("ADS1115 초기화 실패");
  }
  
  if (dhtPin > 0) {
    dht = new DHT(dhtPin, DHT22);
    dht->begin();
    Serial.println("DHT22 초기화 성공 (GPIO" + String(dhtPin) + ")");
  }

  // WiFi 연결
  WiFi.mode(WIFI_STA);
  WiFi.begin(cfgWifiSsid.c_str(), cfgWifiPass.c_str());
  
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(200);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi 연결 성공: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi 연결 실패");
  }

  // MQTT 연결
  mqtt.setServer(cfgMqttHost.c_str(), cfgMqttPort);
  mqtt.setCallback(onMqtt);

  // 부팅 리포트
  DynamicJsonDocument boot(1024);
  boot["fw"] = "1.0.0";
  boot["board"] = "esp32-wroom";
  boot["wifi"] = WiFi.status() == WL_CONNECTED;
  boot["ip"] = WiFi.localIP().toString();
  boot["timestamp"] = millis();
  scanI2C(boot);
  
  // 센서 상태 추가
  boot["sensors"] = {
    {"bme280", bme.begin(0x76)},
    {"ads1115", ads.begin()},
    {"dht22", dhtPin > 0}
  };
  
  publishJson("/status/boot", boot);
  Serial.println("부팅 리포트 전송 완료");
}

// ---------- Loop
unsigned long lastPub = 0;
unsigned long lastReconnect = 0;

void loop() {
  // MQTT 재연결
  if (!mqtt.connected()) {
    if (millis() - lastReconnect > 5000) {
      lastReconnect = millis();
      String cid = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
      if (mqtt.connect(cid.c_str(), cfgMqttUser.c_str(), cfgMqttPass.c_str())) {
        mqtt.subscribe((topicBase + "/cmd/selftest").c_str());
        Serial.println("MQTT 연결 성공");
      } else {
        Serial.println("MQTT 연결 실패");
      }
    }
  } else {
    mqtt.loop();
  }

  // 텔레메트리 전송 (5초마다)
  if (millis() - lastPub > 5000) {
    lastPub = millis();
    
    DynamicJsonDocument tel(1024);
    tel["timestamp"] = millis();
    
    // BME280 데이터
    if (bme.begin(0x76)) {
      tel["temp"] = bme.readTemperature();
      tel["pressure"] = bme.readPressure() / 100.0;
    }
    
    // DHT22 데이터
    if (dht) {
      tel["dht_temp"] = dht->readTemperature();
      tel["dht_humidity"] = dht->readHumidity();
    }
    
    // ADS1115 데이터
    if (ads.begin()) {
      tel["adc0"] = ads.readADC_SingleEnded(0);
      tel["adc1"] = ads.readADC_SingleEnded(1);
      tel["adc2"] = ads.readADC_SingleEnded(2);
      tel["adc3"] = ads.readADC_SingleEnded(3);
    }
    
    // 시스템 상태
    tel["wifi_rssi"] = WiFi.RSSI();
    tel["free_heap"] = ESP.getFreeHeap();
    
    publishJson("/telemetry", tel);
  }
  
  delay(100);
}

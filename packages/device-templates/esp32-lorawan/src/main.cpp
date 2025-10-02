#include <LoRaWan.h>
#include <ArduinoJson.h>
#include <LittleFS.h>

// LoRaWAN 설정
const char* devEui = "YOUR_DEV_EUI";
const char* appEui = "YOUR_APP_EUI";
const char* appKey = "YOUR_APP_KEY";
const char* region = "AS923";

// 디바이스 정보
String device_id = "lorawan-device-001";
unsigned long lastUplink = 0;
const unsigned long uplinkInterval = 300000; // 5분

void setup() {
  Serial.begin(115200);
  
  // LittleFS 초기화
  if (!LittleFS.begin()) {
    Serial.println("LittleFS 마운트 실패");
    return;
  }
  
  // 설정 파일 로드
  loadConfig();
  
  // LoRaWAN 초기화
  if (!LoRaWan.begin(region)) {
    Serial.println("LoRaWAN 초기화 실패");
    return;
  }
  
  // 디바이스 활성화
  LoRaWan.setDevEui(devEui);
  LoRaWan.setAppEui(appEui);
  LoRaWan.setAppKey(appKey);
  
  // 센서 초기화
  initSensors();
  
  Serial.println("LoRaWAN 디바이스 준비 완료");
}

void loop() {
  // 업링크 전송
  if (millis() - lastUplink > uplinkInterval) {
    sendUplink();
    lastUplink = millis();
  }
  
  // 다운링크 확인
  checkDownlink();
  
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
    // LoRaWAN 설정 로드...
    
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

void sendUplink() {
  // 센서 데이터 수집
  float temperature = 25.5;
  float humidity = 60.2;
  float soilMoisture = 45.8;
  
  // 페이로드 인코딩
  uint8_t payload[12];
  encodePayload(temperature, humidity, soilMoisture, payload);
  
  // 업링크 전송
  if (LoRaWan.sendUplink(payload, 12, 1)) {
    Serial.println("업링크 전송 성공");
  } else {
    Serial.println("업링크 전송 실패");
  }
}

void encodePayload(float temp, float hum, float soil, uint8_t* payload) {
  // 온도 (2바이트, 0.1도 단위)
  int16_t tempInt = (int16_t)(temp * 10);
  payload[0] = (tempInt >> 8) & 0xFF;
  payload[1] = tempInt & 0xFF;
  
  // 습도 (2바이트, 0.1% 단위)
  int16_t humInt = (int16_t)(hum * 10);
  payload[2] = (humInt >> 8) & 0xFF;
  payload[3] = humInt & 0xFF;
  
  // 토양 수분 (2바이트, 0.1% 단위)
  int16_t soilInt = (int16_t)(soil * 10);
  payload[4] = (soilInt >> 8) & 0xFF;
  payload[5] = soilInt & 0xFF;
  
  // 상태 바이트
  payload[6] = 0x01; // 정상 상태
}

void checkDownlink() {
  if (LoRaWan.available()) {
    uint8_t* data = LoRaWan.read();
    int len = LoRaWan.getDataLength();
    
    if (len > 0) {
      Serial.println("다운링크 수신: " + String(len) + " 바이트");
      
      // 명령 처리
      if (data[0] == 0x01) { // 릴레이 ON
        int relayPin = data[1];
        digitalWrite(relayPin, HIGH);
        Serial.println("릴레이 ON: " + String(relayPin));
      } else if (data[0] == 0x02) { // 릴레이 OFF
        int relayPin = data[1];
        digitalWrite(relayPin, LOW);
        Serial.println("릴레이 OFF: " + String(relayPin));
      }
    }
  }
}

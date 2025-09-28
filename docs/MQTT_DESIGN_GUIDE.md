# MQTT 설계 가이드

## 📋 개요

이 문서는 스마트팜 시스템의 MQTT 설계 및 구축 방법을 설명합니다. 센서 데이터 수집, 디바이스 제어, 실시간 모니터링을 위한 완전한 설계 가이드입니다.

## 🚀 올바른 연동 순서

### ⚠️ **중요: 연동 순서**
1. **농장관리** → 농장/베드 생성 (웹서버 구성)
2. **MQTT 설정** → 브로커 연결 및 ID 확인
3. **디바이스 개발** → 제공받은 ID로 토픽 구성
4. **실시간 연동** → 양방향 데이터 통신

### 📋 **단계별 가이드**

#### **1단계: 웹서버에서 농장/베드 구성**
```
농장관리 페이지 → 새 농장 추가 → 베드 생성
```
- 웹 관리자 페이지에서 먼저 농장과 베드를 구성
- 각 베드는 고유한 UUID를 가짐
- 구성된 데이터가 MQTT 연동의 기준이 됨

#### **2단계: MQTT 브로커 설정**
```
농장 설정 → MQTT 설정 → 브로커 정보 입력 → 연결 테스트
```
- 농장별로 독립적인 MQTT 브로커 설정 가능
- 웹 관리자 페이지에서 브로커 정보 입력
- 연결 테스트 기능으로 설정 검증

#### **3단계: 토픽 구조 확인**
```
farms/{farm_id}/beds/{bed_id}/devices/{device_id}/sensors    # 센서 데이터 수신
farms/{farm_id}/beds/{bed_id}/devices/{device_id}/commands   # 디바이스 제어 명령
```
- 웹서버에서 구성된 실제 ID 사용
- 통합 가이드 모달에서 ID 확인 및 복사

#### **4단계: 디바이스 연결**
- 디바이스에서 구성된 토픽으로 데이터 발행
- 웹 관리자 페이지에서 실시간 모니터링

## 🏗️ 시스템 아키텍처

```
센서/디바이스 → MQTT 브로커 → MQTT 브리지 → Supabase → 웹 대시보드
```

## 📡 MQTT 토픽 구조

### 기본 토픽 패턴
```
farms/{farm_id}/beds/{bed_id}/devices/{device_id}/{data_type}
```

### 센서 데이터 토픽
```
farms/{farm_id}/beds/{bed_id}/devices/{device_id}/sensors
```

### 디바이스 제어 토픽
```
farms/{farm_id}/beds/{bed_id}/devices/{device_id}/commands
```

## 🗄️ 데이터베이스 구조

### 핵심 테이블 관계
```
farms (농장)
  └── beds (베드)
      └── devices (디바이스)
          └── sensors (센서)
              └── sensor_readings (센서 데이터)
```

### ID 생성 규칙

#### 1. 농장 ID (Farm ID)
- **형식**: UUID v4
- **예시**: `550e8400-e29b-41d4-a716-446655440002`
- **용도**: 농장 구분

#### 2. 베드 ID (Bed ID)
- **형식**: UUID v4
- **예시**: `550e8400-e29b-41d4-a716-446655440003`
- **용도**: 농장 내 베드 구분

#### 3. 디바이스 ID (Device ID)
- **형식**: UUID v4 또는 커스텀 ID
- **예시**: `pi-001`, `sensor-gateway-01`
- **용도**: 베드 내 디바이스 구분

#### 4. 센서 ID (Sensor ID)
- **형식**: UUID v4 (자동 생성)
- **용도**: 디바이스 내 센서 구분

## 📊 센서 데이터 메시지 구조

### 센서 데이터 전송 (디바이스 → 서버)

#### 토픽
```
farms/{farm_id}/beds/{bed_id}/devices/{device_id}/sensors
```

#### 메시지 페이로드
```json
{
  "device_id": "pi-001",
  "bed_id": "550e8400-e29b-41d4-a716-446655440003",
  "farm_id": "550e8400-e29b-41d4-a716-446655440002",
  "sensors": {
    "temp": 25.3,
    "humidity": 65.2,
    "ec": 2.1,
    "ph": 6.5,
    "water_level": 85.0,
    "light": 1200.5,
    "co2": 400.0,
    "soil_moisture": 70.0
  },
  "metadata": {
    "location": "베드-1",
    "crop_name": "토마토",
    "growing_method": "점적식",
    "tier_number": 1
  },
  "timestamp": "2025-09-28T17:35:00Z",
  "quality": 1
}
```

### 지원되는 센서 타입

| 센서 타입 | 단위 | 설명 | 범위 |
|-----------|------|------|------|
| `temp` | °C | 온도 | -10 ~ 50 |
| `humidity` | % | 습도 | 0 ~ 100 |
| `ec` | mS/cm | 전기전도도 | 0 ~ 5 |
| `ph` | pH | 산성도 | 0 ~ 14 |
| `water_level` | % | 수위 | 0 ~ 100 |
| `light` | lux | 조도 | 0 ~ 100000 |
| `co2` | ppm | 이산화탄소 | 300 ~ 2000 |
| `soil_moisture` | % | 토양수분 | 0 ~ 100 |
| `pressure` | hPa | 대기압 | 800 ~ 1200 |
| `wind_speed` | m/s | 풍속 | 0 ~ 50 |
| `rainfall` | mm | 강수량 | 0 ~ 100 |

## 🎛️ 디바이스 제어 메시지 구조

### 제어 명령 전송 (서버 → 디바이스)

#### 토픽
```
farms/{farm_id}/beds/{bed_id}/devices/{device_id}/commands
```

#### 메시지 페이로드
```json
{
  "command_id": "cmd-12345",
  "device_id": "tuya-light-001",
  "bed_id": "550e8400-e29b-41d4-a716-446655440003",
  "farm_id": "550e8400-e29b-41d4-a716-446655440002",
  "command": "turn_on",
  "payload": {
    "brightness": 80,
    "color_temp": 4000
  },
  "timestamp": "2025-09-28T17:35:00Z",
  "priority": "normal"
}
```

### 지원되는 디바이스 타입

| 디바이스 타입 | 명령어 | 페이로드 예시 |
|---------------|--------|---------------|
| `light` | `turn_on` | `{"brightness": 80}` |
| `light` | `turn_off` | `{}` |
| `pump` | `start` | `{"duration": 300}` |
| `pump` | `stop` | `{}` |
| `fan` | `set_speed` | `{"speed": 50}` |
| `fan` | `turn_off` | `{}` |
| `motor` | `move` | `{"direction": "up", "distance": 10}` |
| `switch` | `toggle` | `{"channel": 1}` |

## 🔐 인증 및 보안

### MQTT 브로커 설정

#### 연결 정보
- **프로토콜**: MQTT over SSL/TLS (권장)
- **포트**: 8883 (SSL), 1883 (비SSL)
- **QoS**: 1 (최소 한 번 전송)
- **클라이언트 ID**: `terahub-bridge-{farm_id}`

#### 인증 방식
1. **API 키 방식** (권장)
   - Username: `apikey`
   - Password: `{API_KEY}`

2. **사용자명/비밀번호 방식**
   - Username: `{USERNAME}`
   - Password: `{PASSWORD}`

### 데이터 암호화
- **전송**: TLS 1.2+ 사용
- **저장**: Supabase에서 자동 암호화

## 📝 구현 예시

### Python 클라이언트 예시

```python
import paho.mqtt.client as mqtt
import json
import time
from datetime import datetime

class SmartFarmMQTTClient:
    def __init__(self, broker_url, port, username, password):
        self.client = mqtt.Client()
        self.client.username_pw_set(username, password)
        self.client.on_connect = self.on_connect
        self.client.on_publish = self.on_publish
        
        # 농장/베드/디바이스 정보
        self.farm_id = "550e8400-e29b-41d4-a716-446655440002"
        self.bed_id = "550e8400-e29b-41d4-a716-446655440003"
        self.device_id = "pi-001"
        
        # MQTT 브로커 연결
        self.client.connect(broker_url, port, 60)
        self.client.loop_start()
    
    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected with result code {rc}")
        
        # 명령어 수신 구독
        command_topic = f"farms/{self.farm_id}/beds/{self.bed_id}/devices/{self.device_id}/commands"
        client.subscribe(command_topic)
    
    def on_publish(self, client, userdata, mid):
        print(f"Message {mid} published")
    
    def send_sensor_data(self, sensor_data):
        """센서 데이터 전송"""
        topic = f"farms/{self.farm_id}/beds/{self.bed_id}/devices/{self.device_id}/sensors"
        
        payload = {
            "device_id": self.device_id,
            "bed_id": self.bed_id,
            "farm_id": self.farm_id,
            "sensors": sensor_data,
            "metadata": {
                "location": "베드-1",
                "crop_name": "토마토",
                "growing_method": "점적식",
                "tier_number": 1
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "quality": 1
        }
        
        result = self.client.publish(topic, json.dumps(payload), qos=1)
        return result.rc == mqtt.MQTT_ERR_SUCCESS

# 사용 예시
client = SmartFarmMQTTClient(
    broker_url="mqtt://broker.hivemq.com",
    port=1883,
    username="test",
    password="test"
)

# 센서 데이터 전송
sensor_data = {
    "temp": 25.3,
    "humidity": 65.2,
    "ec": 2.1,
    "ph": 6.5
}

client.send_sensor_data(sensor_data)
```

### Arduino 예시

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// 농장/베드/디바이스 정보
const char* farm_id = "550e8400-e29b-41d4-a716-446655440002";
const char* bed_id = "550e8400-e29b-41d4-a716-446655440003";
const char* device_id = "esp32-001";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
    Serial.begin(115200);
    setup_wifi();
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
}

void setup_wifi() {
    delay(10);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
    }
}

void callback(char* topic, byte* payload, unsigned int length) {
    // 명령어 처리 로직
    String message = "";
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    
    // JSON 파싱 및 명령어 실행
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, message);
    
    String command = doc["command"];
    if (command == "turn_on") {
        // 디바이스 켜기
        digitalWrite(LED_PIN, HIGH);
    }
}

void send_sensor_data() {
    if (!client.connected()) {
        reconnect();
    }
    
    // 센서 데이터 읽기
    float temperature = readTemperature();
    float humidity = readHumidity();
    
    // JSON 메시지 생성
    DynamicJsonDocument doc(1024);
    doc["device_id"] = device_id;
    doc["bed_id"] = bed_id;
    doc["farm_id"] = farm_id;
    doc["sensors"]["temp"] = temperature;
    doc["sensors"]["humidity"] = humidity;
    doc["timestamp"] = getCurrentTimestamp();
    doc["quality"] = 1;
    
    String payload;
    serializeJson(doc, payload);
    
    // 토픽 생성 및 전송
    String topic = "farms/" + String(farm_id) + "/beds/" + String(bed_id) + "/devices/" + String(device_id) + "/sensors";
    client.publish(topic.c_str(), payload.c_str());
}

void loop() {
    client.loop();
    
    // 30초마다 센서 데이터 전송
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 30000) {
        send_sensor_data();
        lastSend = millis();
    }
}
```

## 📋 체크리스트

### 개발 전 확인사항
- [ ] MQTT 브로커 설정 완료
- [ ] 농장 ID, 베드 ID 확인
- [ ] 디바이스 ID 규칙 정립
- [ ] 센서 타입 및 단위 정의
- [ ] 인증 방식 선택

### 개발 중 확인사항
- [ ] 토픽 구조 준수
- [ ] JSON 메시지 형식 준수
- [ ] 에러 처리 구현
- [ ] 재연결 로직 구현
- [ ] QoS 설정 (최소 1)

### 배포 전 확인사항
- [ ] SSL/TLS 연결 설정
- [ ] 보안 인증 정보 설정
- [ ] 네트워크 방화벽 설정
- [ ] 로그 및 모니터링 설정

## 🚨 주의사항

1. **ID 생성**: 농장 ID와 베드 ID는 반드시 데이터베이스에 존재하는 값 사용
2. **메시지 크기**: MQTT 메시지는 최대 256MB이지만, 실용적으로는 1KB 이하 권장
3. **전송 주기**: 센서 데이터는 최소 30초 간격으로 전송 권장
4. **에러 처리**: 네트워크 오류 시 재연결 및 재전송 로직 필수
5. **보안**: 프로덕션 환경에서는 반드시 SSL/TLS 사용

## 📞 지원

문의사항이나 기술 지원이 필요한 경우:
- 이메일: support@terahub.com
- 문서 업데이트: 이 가이드는 시스템 업데이트에 따라 수정될 수 있습니다.

---

**버전**: 1.0  
**최종 업데이트**: 2025-09-28  
**작성자**: TeraHub Development Team

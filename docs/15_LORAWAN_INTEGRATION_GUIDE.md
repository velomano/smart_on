# LoRaWAN 통합 가이드

LoRaWAN 네트워크와 스마트팜 시스템을 통합하는 방법을 안내합니다.

## 📋 개요

이 가이드는 다음을 다룹니다:
- LoRaWAN 네트워크 서버(LNS) 선택 및 설정
- 디바이스 등록 및 관리
- MQTT/Webhook 통신 설정
- 페이로드 코덱 작성
- 다운링크 명령 처리

## 🌐 LoRaWAN 네트워크 서버 선택

### 1. The Things Stack (TTS)

**장점**:
- 무료 플랜 제공
- 사용자 친화적 UI
- 강력한 API
- 활발한 커뮤니티

**설정 방법**:
1. [The Things Stack Console](https://console.thethingsnetwork.org/) 접속
2. 계정 생성 및 로그인
3. 애플리케이션 생성
4. 디바이스 등록

### 2. ChirpStack

**장점**:
- 오픈소스
- 자체 호스팅 가능
- 높은 커스터마이징
- 엔터프라이즈 기능

**설정 방법**:
1. [ChirpStack](https://www.chirpstack.io/) 다운로드
2. Docker로 설치
3. 웹 UI 접속
4. 애플리케이션 및 디바이스 설정

### 3. Carrier

**장점**:
- 한국 서비스
- 빠른 지원
- 현지화된 서비스
- 안정적인 인프라

**설정 방법**:
1. [Carrier](https://carrier.co.kr/) 접속
2. 계정 생성
3. 프로젝트 생성
4. 디바이스 등록

## 🔧 디바이스 등록

### 1. 디바이스 정보 수집

등록에 필요한 정보:
- **DevEUI**: 디바이스 고유 식별자 (8바이트)
- **AppEUI**: 애플리케이션 식별자 (8바이트)
- **AppKey**: 애플리케이션 키 (16바이트)

### 2. DevEUI 생성

ESP32의 경우 MAC 주소를 기반으로 생성:

```cpp
uint8_t devEui[8];
esp_efuse_mac_get_default(devEui);
// DevEUI: devEui[0]~devEui[7]
```

### 3. 디바이스 등록

#### The Things Stack
1. **Applications** → **Add application**
2. **End devices** → **Add end device**
3. **Activation method**: OTAA (Over-The-Air Activation)
4. **DevEUI, AppEUI, AppKey** 입력
5. **Register end device**

#### ChirpStack
1. **Applications** → **Add application**
2. **Devices** → **Add device**
3. **Device EUI, Application EUI, Application Key** 입력
4. **Create device**

## 📡 통신 설정

### 1. MQTT 모드

#### 연결 설정

```json
{
  "transport": "lorawan",
  "mode": "mqtt",
  "lns": "the-things-stack",
  "region": "AS923",
  "mqtt": {
    "host": "eu1.cloud.thethings.network",
    "port": 8883,
    "username": "your-app-id@ttn",
    "password": "your-api-key",
    "uplinkTopic": "v3/your-app-id@ttn/devices/+/up",
    "downlinkTopicTpl": "v3/your-app-id@ttn/devices/{devId}/down/push",
    "tls": true
  }
}
```

#### 업링크 메시지 형식

```json
{
  "end_device_ids": {
    "device_id": "your-device-id",
    "dev_eui": "1234567890ABCDEF"
  },
  "received_at": "2023-12-01T10:30:00Z",
  "uplink_message": {
    "f_port": 1,
    "frm_payload": "AQIDBAUGBwgJ",
    "decoded_payload": {
      "temperature": 25.5,
      "humidity": 60.2
    }
  }
}
```

#### 다운링크 메시지 형식

```json
{
  "downlinks": [{
    "f_port": 1,
    "frm_payload": "AQIDBAUGBwgJ",
    "confirmed": false
  }]
}
```

### 2. Webhook 모드

#### 웹훅 설정

```json
{
  "transport": "lorawan",
  "mode": "webhook",
  "lns": "the-things-stack",
  "region": "AS923",
  "webhook": {
    "secret": "your-webhook-secret",
    "path": "/rpc/lorawan/webhook"
  },
  "api": {
    "baseUrl": "https://eu1.cloud.thethings.network/api/v3",
    "token": "your-api-token"
  }
}
```

#### 웹훅 페이로드 형식

```json
{
  "end_device_ids": {
    "device_id": "your-device-id",
    "dev_eui": "1234567890ABCDEF"
  },
  "received_at": "2023-12-01T10:30:00Z",
  "uplink_message": {
    "f_port": 1,
    "frm_payload": "AQIDBAUGBwgJ"
  }
}
```

## 🔐 보안 설정

### 1. TLS/SSL 설정

MQTT 연결 시 TLS 사용:

```json
{
  "mqtt": {
    "tls": true,
    "ca_cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
  }
}
```

### 2. HMAC 서명

웹훅 요청 검증:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const hash = hmac.digest('hex');
  return hash === signature;
}
```

### 3. API 토큰 관리

- 정기적인 토큰 갱신
- 최소 권한 원칙 적용
- 토큰 암호화 저장

## 📝 페이로드 코덱

### 1. 업링크 코덱 (디바이스 → 서버)

센서 데이터를 바이트 배열로 인코딩:

```javascript
function encodeUplink(input) {
  const bytes = [];
  
  // 온도 (2바이트, 0.1도 단위)
  const temp = Math.round(input.temperature * 10);
  bytes.push((temp >> 8) & 0xFF);
  bytes.push(temp & 0xFF);
  
  // 습도 (2바이트, 0.1% 단위)
  const hum = Math.round(input.humidity * 10);
  bytes.push((hum >> 8) & 0xFF);
  bytes.push(hum & 0xFF);
  
  // 토양 수분 (2바이트, 0.1% 단위)
  const soil = Math.round(input.soilMoisture * 10);
  bytes.push((soil >> 8) & 0xFF);
  bytes.push(soil & 0xFF);
  
  // 상태 바이트
  bytes.push(input.status === 'ok' ? 0x01 : 0x00);
  
  return {
    bytes: bytes,
    fPort: 1
  };
}
```

### 2. 다운링크 코덱 (서버 → 디바이스)

바이트 배열을 명령으로 디코딩:

```javascript
function decodeDownlink(input) {
  const bytes = input.bytes;
  
  if (bytes.length < 2) {
    return { error: 'Invalid payload length' };
  }
  
  const command = bytes[0];
  const param = bytes[1];
  
  switch (command) {
    case 0x01: // 릴레이 ON
      return {
        type: 'relay_on',
        params: { pin: param }
      };
    case 0x02: // 릴레이 OFF
      return {
        type: 'relay_off',
        params: { pin: param }
      };
    default:
      return { error: 'Unknown command' };
  }
}
```

## ⚡ 다운링크 제약사항

### 1. 슬롯 제한

- **RX1**: 첫 번째 수신 윈도우 (1초 후)
- **RX2**: 두 번째 수신 윈도우 (2초 후)
- **Class A**: 업링크 후에만 다운링크 가능

### 2. 듀티 사이클

지역별 듀티 사이클 제한:

| 지역 | 듀티 사이클 | 설명 |
|------|-------------|------|
| EU868 | 1% | 1시간 중 36초만 전송 가능 |
| US915 | 10% | 1시간 중 6분 전송 가능 |
| AS923 | 1% | 1시간 중 36초만 전송 가능 |

### 3. 전력 관리

- **ADR**: Adaptive Data Rate 자동 조정
- **전력 레벨**: 0-15 (높을수록 강한 신호)
- **스프레딩 팩터**: 7-12 (높을수록 느린 속도, 긴 거리)

## 🔄 버전 관리

### 1. 코덱 버전 관리

```json
{
  "codec": {
    "version": "1.0.0",
    "type": "js",
    "script": "function encodeUplink(input) { ... }"
  }
}
```

### 2. 펌웨어 버전 관리

```json
{
  "firmware": {
    "version": "1.2.3",
    "build_date": "2023-12-01",
    "features": ["temperature", "humidity", "relay_control"]
  }
}
```

## 🚨 문제 해결

### 1. 연결 실패

**증상**: 디바이스가 네트워크에 조인하지 못함

**해결 방법**:
1. DevEUI, AppEUI, AppKey 확인
2. 지역 설정 확인
3. 안테나 연결 확인
4. 전력 설정 확인

### 2. 업링크 실패

**증상**: 센서 데이터가 전송되지 않음

**해결 방법**:
1. 네트워크 커버리지 확인
2. 듀티 사이클 확인
3. 전력 레벨 조정
4. 스프레딩 팩터 조정

### 3. 다운링크 실패

**증상**: 명령이 디바이스에 전달되지 않음

**해결 방법**:
1. RX 윈도우 타이밍 확인
2. 페이로드 크기 확인 (최대 242바이트)
3. 포트 번호 확인
4. 코덱 설정 확인

## 📊 모니터링

### 1. 네트워크 상태

- **RSSI**: 수신 신호 강도
- **SNR**: 신호 대 잡음비
- **ADR**: 자동 데이터 레이트
- **듀티 사이클**: 전송 시간 비율

### 2. 디바이스 상태

- **마지막 업링크**: 최근 데이터 수신 시간
- **배터리 레벨**: 전력 상태
- **온라인 상태**: 연결 상태
- **오류 카운트**: 실패 횟수

### 3. 성능 지표

- **전송 성공률**: 업링크 성공 비율
- **지연 시간**: 데이터 전송 지연
- **처리량**: 시간당 데이터 양
- **에러율**: 오류 발생 비율

## 📚 추가 리소스

- [LoRaWAN 공식 문서](https://lora-alliance.org/resource_hub/lorawan-specification-v1-0-3/)
- [The Things Stack 문서](https://www.thethingsstack.org/)
- [ChirpStack 문서](https://www.chirpstack.io/docs/)
- [LoRaWAN 지역별 설정](https://lora-alliance.org/resource_hub/lorawan-regional-parameters-v1-0-3/)

## 🆘 지원

문제가 발생하면 다음을 확인하세요:

1. **네트워크 서버 로그** 확인
2. **디바이스 시리얼 로그** 확인
3. **네트워크 커버리지** 확인
4. **설정 파일** 문법 확인

추가 지원이 필요하면 GitHub Issues에 문의하세요.

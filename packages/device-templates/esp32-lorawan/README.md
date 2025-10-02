# ESP32 LoRaWAN 펌웨어 템플릿

ESP32 기반 IoT 디바이스용 LoRaWAN 통신 펌웨어 템플릿입니다.

## 기능

- LoRaWAN 통신
- 센서 데이터 수집 (온도, 습도, 토양 수분)
- 릴레이 제어
- 다운링크 명령 처리
- LittleFS 파일 시스템 지원
- JSON 설정 파일 지원

## 사용 방법

### 1. LoRaWAN 네트워크 설정

The Things Stack, ChirpStack 또는 Carrier에 디바이스를 등록하세요.

### 2. 설정 파일 준비

`data/config.example.json`을 `data/config.json`으로 복사하고 다음을 수정하세요:

```json
{
  "device_id": "your-device-id",
  "lorawan": {
    "devEui": "YOUR_DEV_EUI",
    "appEui": "YOUR_APP_EUI",
    "appKey": "YOUR_APP_KEY",
    "region": "AS923"
  }
}
```

### 3. 업로드

Arduino IDE 또는 PlatformIO를 사용하여 펌웨어를 업로드하세요.

### 4. 시리얼 모니터 확인

115200 baud로 시리얼 모니터를 열고 다음 로그를 확인하세요:

```
LoRaWAN 디바이스 준비 완료
업링크 전송 성공
다운링크 수신: 2 바이트
릴레이 ON: 2
```

## 페이로드 형식

### 업링크 (센서 데이터)
- 바이트 0-1: 온도 (0.1도 단위)
- 바이트 2-3: 습도 (0.1% 단위)
- 바이트 4-5: 토양 수분 (0.1% 단위)
- 바이트 6: 상태 바이트

### 다운링크 (명령)
- 바이트 0: 명령 타입 (0x01=ON, 0x02=OFF)
- 바이트 1: 릴레이 핀 번호

## 하드웨어 연결

- 온도 센서: GPIO 34
- 습도 센서: GPIO 35
- 토양 수분 센서: GPIO 32
- 릴레이 1: GPIO 2
- 릴레이 2: GPIO 4

## 문제 해결

### LoRaWAN 연결 실패
- DevEUI, AppEUI, AppKey 확인
- 지역 설정 확인
- 안테나 연결 확인

### 업링크 전송 실패
- 네트워크 커버리지 확인
- 전력 설정 확인
- 듀티 사이클 확인

### 다운링크 수신 실패
- RX 윈도우 설정 확인
- 네트워크 서버 설정 확인

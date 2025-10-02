# 🔌 ESP32 하드웨어 테스트 가이드

## 📋 개요

Universal Bridge v2.0과 ESP32 하드웨어를 연동하여 실제 IoT 시스템을 테스트하는 가이드입니다.

## 🛠️ 필요한 하드웨어

### **테스트 1: ESP32 + DHT22**
- ESP32 개발보드
- DHT22 온습도 센서
- 점퍼 와이어
- 브레드보드

### **테스트 2: ESP32 + 릴레이**
- ESP32 개발보드
- 2채널 릴레이 모듈
- LED (상태 표시용)
- 점퍼 와이어
- 브레드보드

## 🔌 회로 연결

### **DHT22 연결**
```
ESP32    DHT22
------   ------
3.3V  -> VCC
GND   -> GND
GPIO4 -> DATA
```

### **릴레이 모듈 연결**
```
ESP32     릴레이 모듈
------    -----------
3.3V   -> VCC
GND    -> GND
GPIO2  -> IN1 (릴레이1)
GPIO4  -> IN2 (릴레이2)
GPIO5  -> LED (상태 표시)
```

## 📱 소프트웨어 설정

### **1. Arduino IDE 설정**
1. ESP32 보드 매니저 설치
2. 필요한 라이브러리 설치:
   - `DHT sensor library`
   - `ArduinoJson`
   - `WebSockets`

### **2. WiFi 설정**
코드에서 다음을 수정:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### **3. Universal Bridge 설정**
로컬 테스트용:
```cpp
const char* serverUrl = "http://localhost:8080";
const char* wsUrl = "ws://localhost:8080";
```

## 🚀 테스트 실행

### **단계 1: Universal Bridge 시작**
```bash
cd apps/universal-bridge
npm run dev
```

### **단계 2: Web Admin 시작**
```bash
cd apps/web-admin
NEXT_PUBLIC_BRIDGE_URL=http://localhost:8080 npm run dev
```

### **단계 3: ESP32 코드 업로드**
1. `ESP32_DHT22_Test.ino` 업로드 (DHT22 테스트용)
2. `ESP32_Relay_Test.ino` 업로드 (릴레이 테스트용)

## 📊 테스트 시나리오

### **시나리오 1: DHT22 센서 데이터 수집**

1. **디바이스 등록 확인**
   - Web Admin → Connect → 디바이스 목록에서 확인
   - 디바이스 ID: `ESP32-DHT22-TEST-001`

2. **센서 데이터 확인**
   - Web Admin → Farms → 농장 선택
   - Dynamic UI에서 온도/습도 게이지 확인
   - 30초마다 데이터 업데이트 확인

3. **실시간 모니터링**
   - 시리얼 모니터에서 센서 값 확인
   - 웹 대시보드에서 실시간 업데이트 확인

### **시나리오 2: 릴레이 제어**

1. **디바이스 등록 확인**
   - 디바이스 ID: `ESP32-RELAY-TEST-001`
   - WebSocket 연결 상태 확인

2. **제어 명령 테스트**
   - Web Admin → Farms → 농장 → 디바이스
   - 액추에이터 패널에서 릴레이 제어
   - ON/OFF/Toggle 명령 테스트

3. **실시간 제어 확인**
   - 릴레이 모듈의 LED 확인
   - 시리얼 모니터에서 명령 수신 확인
   - 웹에서 즉시 반응 확인

## 🔍 문제 해결

### **WiFi 연결 실패**
- SSID/비밀번호 확인
- 신호 강도 확인
- ESP32 재부팅

### **Universal Bridge 연결 실패**
- 서버 실행 상태 확인
- 포트 충돌 확인 (8080)
- 방화벽 설정 확인

### **센서 데이터 없음**
- DHT22 연결 확인
- 센서 핀 번호 확인
- 전원 공급 확인

### **릴레이 제어 안됨**
- 릴레이 모듈 연결 확인
- 핀 번호 확인
- WebSocket 연결 상태 확인

## 📈 성공 기준

### **DHT22 테스트**
- ✅ WiFi 연결 성공
- ✅ 디바이스 등록 성공
- ✅ 센서 데이터 전송 (30초마다)
- ✅ 웹 대시보드에서 실시간 표시
- ✅ 온도/습도 값 정상 표시

### **릴레이 테스트**
- ✅ WiFi 연결 성공
- ✅ WebSocket 연결 성공
- ✅ 디바이스 등록 성공
- ✅ 웹에서 릴레이 제어 가능
- ✅ ON/OFF/Toggle 명령 정상 작동
- ✅ 실시간 상태 업데이트

## 🎯 다음 단계

테스트 성공 후:
1. **프로덕션 배포** (Vercel)
2. **실제 농장 환경 테스트**
3. **다양한 센서 추가**
4. **알림 시스템 연동**

## 📞 지원

문제 발생 시:
1. 시리얼 모니터 로그 확인
2. Web Admin 개발자 도구 확인
3. Universal Bridge 로그 확인
4. 하드웨어 연결 재확인

---

**테스트 완료 시 전체 IoT 플랫폼이 실제 하드웨어와 연동되어 작동하는 것을 확인할 수 있습니다!** 🎉

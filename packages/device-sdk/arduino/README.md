# 🔌 Arduino SmartFarm 연결 가이드

## 준비물

### 하드웨어
- ✅ ESP32 또는 ESP8266 보드
- ✅ DHT22 온습도 센서 (옵션)
- ✅ Jumper 와이어
- ✅ USB 케이블

### 소프트웨어
- ✅ Arduino IDE (1.8.19 이상)
- ✅ ESP32/ESP8266 보드 패키지
- ✅ ArduinoJson 라이브러리

## 🚀 빠른 시작 (5분)

### 1단계: 라이브러리 설치

Arduino IDE에서:
1. **도구 → 라이브러리 관리**
2. "ArduinoJson" 검색
3. 최신 버전 설치

### 2단계: 웹 마법사에서 코드 받기

1. 웹 어드민 → **디바이스 연결**
2. **Arduino** 선택
3. **WiFi (HTTP)** 선택
4. **코드 복사** 또는 **다운로드**

또는 `SmartFarm_HTTP.ino` 파일을 직접 수정:

```cpp
// WiFi 설정
const char* WIFI_SSID = "내WiFi이름";
const char* WIFI_PASSWORD = "WiFi비밀번호";

// 서버 설정 (웹 마법사에서 제공)
const char* SERVER_URL = "http://192.168.1.100:3000";
const char* DEVICE_ID = "esp32-001";
const char* DEVICE_KEY = "DK_xxxxxxxxxxxxx";  // 바인딩 후 받은 키
```

### 3단계: 배선 (DHT22 사용 시)

```
DHT22 센서    ESP32
-----------   ----------
VCC    →      3.3V
GND    →      GND
DATA   →      GPIO 4
```

### 4단계: 업로드

1. Arduino IDE에서 코드 열기
2. 보드 선택: **ESP32 Dev Module**
3. 포트 선택
4. **업로드** 버튼 클릭

### 5단계: 연결 확인

1. **도구 → 시리얼 모니터** (115200 baud)
2. 로그 확인:

```
🌉 SmartFarm Universal Bridge
=====================================
📡 WiFi 연결 중........ ✅
   IP 주소: 192.168.1.123
   신호 강도: -65 dBm
✅ DHT22 센서 초기화 완료
=====================================
🚀 시스템 준비 완료!

📤 센서 데이터 전송 중...
   🌡️  온도: 25.5 °C
   💧 습도: 65.2 %
   ✅ 전송 성공!
   응답: {"success":true,"message":"2개 센서 데이터 저장 완료"}
```

3. 웹 대시보드에서 실시간 데이터 확인! 🎉

## 🔧 문제 해결

### WiFi 연결 실패
```
❌ 해결 방법:
1. WiFi SSID와 비밀번호 확인
2. 2.4GHz WiFi인지 확인 (ESP32는 5GHz 미지원)
3. 공유기와 거리 확인
```

### 센서 값이 NaN
```
❌ 해결 방법:
1. DHT22 배선 확인
2. 전원(VCC) 3.3V 확인
3. 센서 불량 확인
```

### HTTP 오류
```
❌ 해결 방법:
1. SERVER_URL 확인 (http:// 포함)
2. 서버가 실행 중인지 확인
3. 방화벽 설정 확인
```

## 📊 성능 최적화

### 전송 주기 조정
```cpp
const unsigned long SEND_INTERVAL = 30000;  // 30초 (기본)
// 더 자주: 10000 (10초)
// 덜 자주: 60000 (1분)
```

### 배터리 절약 (Deep Sleep)
```cpp
// TODO: Deep Sleep 모드 추가 예정
```

## 🎓 다음 단계

- [ ] 더 많은 센서 추가 (EC, pH, 조도)
- [ ] 액추에이터 제어 받기
- [ ] 오프라인 버퍼링
- [ ] OTA 펌웨어 업데이트

---

**문의**: 문제가 해결되지 않으면 웹 대시보드의 **라이브 로그**를 확인하세요!


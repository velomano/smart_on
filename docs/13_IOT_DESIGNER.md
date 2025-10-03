# IoT Designer - 다중 장치 지원 IoT 설계 시스템

## 🎯 **설계 개요**

IoT Designer는 자연어로 IoT 시스템을 설명하면 자동으로 완벽한 펌웨어 코드와 하드웨어 연결 가이드를 생성하는 혁신적인 시스템입니다. **7가지 주요 IoT 장치**를 지원하며, 각 장치에 최적화된 코드를 생성합니다.

### **핵심 기능**
- **다중 장치 지원**: ESP32, ESP8266, Arduino Uno/R4, 라즈베리파이3/4/5
- **자동 핀 할당**: 장치별 핀맵 기반 충돌 없는 핀 배치
- **전원 계산**: 센서/제어별 전원 요구사항 자동 계산
- **회로도 생성**: 깔끔한 카드 기반 정보 표시
- **코드 생성**: 완벽한 펌웨어 코드 자동 생성 (ZIP 파일)
- **MQTT 전용**: Universal Bridge 내장 MQTT 브로커 사용
- **장치별 최적화**: PlatformIO 설정, 라이브러리 의존성, 핀 매핑

---

## 🔧 **지원 장치 (7개)**

### **ESP 계열**
- **ESP32**: `espressif32` 플랫폼, `esp32dev` 보드
- **ESP8266**: `espressif8266` 플랫폼, `nodemcuv2` 보드

### **Arduino 계열**
- **Arduino Uno**: `atmelavr` 플랫폼, `uno` 보드
- **Arduino R4**: `renesas_uno` 플랫폼, `uno_r4_wifi` 보드

### **라즈베리파이 계열**
- **라즈베리파이5**: `linux_arm` 플랫폼, `raspberry-pi-5` 보드
- **라즈베리파이4**: `linux_arm` 플랫폼, `raspberry-pi-4` 보드
- **라즈베리파이3**: `linux_arm` 플랫폼, `raspberry-pi-3` 보드

### **장치별 특화 설정**
- **라이브러리**: ESP/Arduino는 `WiFi.h`, 라즈베리파이는 `Arduino.h`
- **I2C 핀**: ESP/Arduino는 SDA=21/SCL=22, 라즈베리파이는 SDA=2/SCL=3
- **WiFi 연결**: ESP/Arduino는 `WiFi.begin()`, 라즈베리파이는 시스템 WiFi
- **MQTT 호스트**: `bridge.local` (localhost 금지!)

---

## 📊 **데이터 모델**

### **센서 카탈로그**
```typescript
interface Sensor {
  type: string;           // 'dht22', 'ds18b20', 'bh1750' 등
  name: string;           // 'DHT22', 'DS18B20' 등
  pins: string[];         // ['DATA', 'VCC', 'GND']
  requires: Array<{       // 필요한 부품
    part: string;         // 'resistor'
    value: string;        // '4.7kΩ'
    between: string;      // 'DATA-3.3V'
  }>;
  power: {
    voltage: 3.3 | 5 | 12 | 24;
    current_mA: number;
  };
  bus: 'single-wire' | 'onewire' | 'i2c' | 'analog';
  alloc: {
    prefer: 'digital' | 'onewire' | 'analog';
    count: number;
    i2c?: boolean;
  };
}
```

### **제어 카탈로그**
```typescript
interface Control {
  type: string;           // 'relay', 'dc_fan_pwm', 'servo' 등
  name: string;           // '릴레이(채널1)', 'DC 팬(PWM)' 등
  control: 'boolean' | 'pwm' | 'servo' | 'stepper';
  driver: string;         // 'relay-module', 'motor-driver' 등
  pins: string[];         // ['IN', 'VCC', 'GND']
  power: {
    voltage: 3.3 | 5 | 12 | 24;
    current_mA: number;
  };
  load_note: string;     // 안전 주의사항
}
```

---

## 🌉 **MQTT 전용 아키텍처**

### **핵심 아키텍처**
```
다양한 디바이스 → Universal Bridge (어댑터) → MQTT 일원화 → FMS
     ↓                    ↓                    ↓
  시리얼/RS-485/        프로토콜 변환         표준 토픽
  LoRaWAN/ESP32/        + 인증/ACL          terahub/{tenant}/{deviceId}
  아두이노/라즈베리파이
```

### **MQTT 설정**
- **브로커**: Universal Bridge 내장 MQTT 브로커
- **호스트**: `bridge.local` 또는 브릿지 IP (localhost 금지!)
- **포트**: 1883 (내부망), 8883 (TLS 권장)
- **토픽 규칙**: `terahub/{tenant}/{deviceId}/{kind}/{name}`

### **보안 가이드**
- **내부망 PoC**: 1883 포트 사용 가능
- **운영 환경**: TLS(8883) 권장
- **인증**: 장치별 계정/토큰 사용
- **ACL**: `terahub/{tenant}/{deviceId}/#` 만 접근 허용

---

## 🔌 **핀 할당 규칙 (장치별 최적화)**

### **ESP32 핀맵**
```typescript
const esp32Pinmap = {
  digital: [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
  pwm:     [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
  onewire: [4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
  i2c:     { sda: 21, scl: 22 }
};
```

### **핀 할당 우선순위**
1. **I2C 센서**: 고정 핀 (SDA: 21, SCL: 22)
2. **OneWire 센서**: 같은 버스 공유 가능
3. **아날로그 센서**: A0, A1, A2, A3 순서
4. **디지털 센서**: 사용 가능한 디지털 핀 순서
5. **PWM 제어**: PWM 가능 핀 우선
6. **디지털 제어**: 사용 가능한 디지털 핀 순서

### **충돌 검사**
- 중복 핀 사용 방지
- 전원 요구사항 충돌 검사
- 버스 충돌 검사 (I2C, OneWire)

---

## ⚡ **전원 계산 규칙**

### **전원 요구사항 계산**
```typescript
function calculatePowerRequirements(items: Array<{
  voltage: number;
  current_mA: number;
  count: number;
}>): PowerRequirement[] {
  // 전압별 그룹화
  const byVoltage = new Map<number, number>();
  
  // 전류 합계 계산
  items.forEach(item => {
    const sum = (byVoltage.get(item.voltage) || 0) + item.current_mA * item.count;
    byVoltage.set(item.voltage, sum);
  });
  
  // 50% 여유 포함하여 결과 반환
  return Array.from(byVoltage.entries())
    .map(([v, mA]) => ({ 
      voltage: v, 
      minCurrentA: +(mA/1000*1.5).toFixed(2) 
    }));
}
```

### **전원 공급 제안**
- **3.3V**: ESP32 내장 레귤레이터 사용 (최대 1A)
- **5V**: USB 전원 또는 외부 5V 어댑터
- **12V**: 외부 어댑터 필요
- **24V**: 산업용 전원 공급 장치 필요

### **안전 주의사항**
- 고전압 부하는 ESP32와 전원 분리 필수
- 공통 접지(GND) 연결 필수
- 릴레이/모터는 역기전력 보호 다이오드 권장

---

## 🎨 **카드 기반 정보 표시 스펙**

### **정보 표시 구성 요소**
1. **디바이스 정보**: 선택된 디바이스 (ESP32, Arduino 등) 표시
2. **컴포넌트 카드**: 센서/제어 장치별 정보 카드
3. **핀 할당 테이블**: 핀번호, 역할, 컴포넌트, 상태 정보
4. **배선 가이드**: 각 컴포넌트별 상세한 배선 정보
5. **전원 공급**: 전압별 전원 요구사항 표시
6. **충돌 경고**: 핀 충돌 시 명확한 경고 표시

### **카드 기반 레이아웃**
```typescript
<div className="bg-white border rounded-lg p-6">
  {/* 디바이스 정보 */}
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h4>📱 선택된 디바이스</h4>
    <p>{deviceInfo.name}</p>
  </div>

  {/* 컴포넌트 카드들 */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {componentCards.map(card => (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5>{card.name}</h5>
        <div>📍 연결 정보: {card.pins}</div>
        <div>⚡ 전원: {card.power}</div>
      </div>
    ))}
  </div>

  {/* 핀 할당 테이블 */}
  <table className="w-full">
    <thead>
      <tr>
        <th>핀번호</th>
        <th>역할</th>
        <th>컴포넌트</th>
        <th>상태</th>
      </tr>
    </thead>
    <tbody>
      {pinData.map(row => (
        <tr>
          <td>{row.pin}</td>
          <td>{row.role}</td>
          <td>{row.component}</td>
          <td>✅ 할당됨</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 🤖 **프롬프트 템플릿**

### **LLM 프롬프트**
```
당신은 IoT 시스템 설계 전문가입니다. 사용자의 자연어 요청을 분석하여 다음 정보를 추출해주세요:

1. 센서 목록 (타입, 개수)
2. 제어 장치 목록 (타입, 개수)
3. 시스템 목적 (스마트팜, 온실, 재배 등)

예시 입력: "온도 센서 2개, 습도 센서 1개, 스프링클러 4개, 팬 2개로 스마트팜을 만들어줘"

응답 형식:
{
  "system_type": "스마트팜",
  "sensors": [
    {"type": "DHT22", "count": 2, "purpose": "온도 측정"},
    {"type": "DHT22", "count": 1, "purpose": "습도 측정"}
  ],
  "controls": [
    {"type": "relay", "count": 4, "purpose": "스프링클러 제어"},
    {"type": "pwm_motor", "count": 2, "purpose": "팬 속도 제어"}
  ],
  "suggestions": ["토양 수분 센서 추가 권장", "조명 시스템 고려"]
}
```

### **제약사항**
- 지원하지 않는 센서/제어는 가장 유사한 카탈로그 아이템으로 맵핑
- 불확실성은 questions[]에 담아 반환
- "고전압/AC는 결선 안내 불가" 문구를 항상 포함
- 전원·접지 분리, 공통접지 규칙, 풀업저항, 역기전력 등 필수 경고 상시 출력

---

## ✅ **수용기준**

### **기본 기능 테스트**
1. **iot-designer 마법사**에서 DHT22×1, DS18B20×1, 릴레이×2, 팬(PWM)×1 구성 시
   - 충돌 없는 핀 자동 배치가 표시된다
   - 전원 요구량 카드에 3.3V, 5V, 12V 권장 전류가 계산되어 나온다
   - 카드 기반 정보 표시에 컴포넌트별 연결 정보가 깔끔하게 표시된다
   - 핀 할당 테이블과 배선 가이드가 명확하게 제공된다
   - Arduino 코드 미리보기가 생성되고 다운로드 가능하다

2. **자연어 입력** "온도 2개, 습도 1개, 스프링클러 4개, 팬 2개로 스마트팜"을 넣으면
   - 카탈로그로 정상 변환된다
   - 환경변수 없이도 템플릿 조합만으로 로컬에서 코드가 생성된다

3. **LLM 기능**을 켜면 동일 입력에 대해
   - 제안 구성(센서 대체안, 전원주의)을 추가로 제시한다

### **성능 기준**
- 자연어 파싱: 1초 이내
- 핀 할당: 0.5초 이내
- 코드 생성: 2초 이내
- 정보 표시 렌더링: 0.5초 이내

### **안전 기준**
- 핀 충돌 검사 100% 정확도
- 전원 요구사항 계산 오차 ±5% 이내
- 고전압 안전 경고 항상 표시
- 역기전력 보호 권장사항 포함

---

## 🆕 **최신 업데이트 (2025-01-03)**

### **핀 할당 시스템 개선**
- **🔄 핀 할당 초기화 기능**: 핀맵 섹션에서 모든 핀 할당을 한 번에 초기화 가능
- **🎯 디바이스 변경 시 자동 초기화**: 디바이스 타입 변경 시 이전 핀 할당 자동 정리
- **💾 완전한 데이터 정리**: localStorage, sessionStorage, 상태 변수 모두 초기화

### **핀 선택 모달 UX 개선**
- **📍 현재 할당된 핀 명확 표시**: 모달 상단에 현재 핀을 색상과 함께 강조 표시
- **🔄 다른 핀으로 변경 섹션 분리**: 현재 핀과 변경 가능한 핀들을 명확히 구분
- **🚫 중복 핀 제거**: 동일한 핀이 여러 번 표시되는 문제 해결
- **📝 직관적인 라벨링**: "현재 할당됨", "다른 핀으로 변경" 등 명확한 안내

### **센서/액추에이터 선택 개선**
- **🚫 중복 선택 방지**: 이미 선택된 센서/액추에이터 타입은 드롭다운에서 비활성화
- **➕ 자동 추가 로직**: "센서 추가" 버튼이 첫 번째 사용 가능한 타입을 자동 선택
- **🔢 인스턴스 관리**: 동일 타입의 여러 인스턴스를 count 필드로 관리

### **디바이스별 동적 핀맵**
- **📱 Raspberry Pi 시리즈**: GPIO2~27, PWM 핀 12/13/18/19, 아날로그 26/27
- **🔧 Arduino Uno**: 디지털 2~13, PWM 3/5/6/9/10/11, 아날로그 A0~A5
- **⚡ ESP32**: 디지털 2/4/5/12~27/32/33, PWM 지원, 아날로그 32/33/34/35/36/39
- **🔌 통신 핀**: I2C, SPI, UART 핀이 디바이스별로 동적 표시

### **전원 계산 개선**
- **⚡ 디바이스별 전력 한계**: Arduino(200mA), ESP32(500mA), RPi(2500mA)
- **📊 실시간 계산**: 센서/액추에이터 변경 시 즉시 전력 소비량 업데이트
- **🎯 정확한 전력 매핑**: 모든 센서/액추에이터 타입의 정확한 전력 소비량 데이터

### **워크플로우 개선**
- **📱 3단계 워크플로우**: 디자인 → 코드생성 → 연결 (직관적인 단계명)
- **🔗 QR 코드 분리**: QR 코드 기능을 농장 관리 페이지의 네이티브 앱 전용 버튼으로 분리
- **💾 자동 저장**: 페이지 이동 시 현재 설정 자동 저장, 변경사항 감지 및 경고
- **🔄 상태 유지**: 페이지 간 이동 시 이전 설정 유지, 디바이스 변경 시에만 초기화

---

## 🚀 **구현 계획**

### **Phase 1: 기본 MVP (완료)**
- [x] 센서/제어 카탈로그 구축
- [x] 핀 자동 할당 시스템 (7개 장치 지원)
- [x] 전원 요구사항 계산
- [x] 카드 기반 정보 표시 생성
- [x] 펌웨어 코드 생성 (ZIP 파일)
- [x] 자연어 파싱 (규칙 기반)
- [x] MQTT 전용 아키텍처 적용
- [x] 장치별 PlatformIO 설정
- [x] 하드웨어 검증 완료
- [x] **연결 페이지 워크플로우 개선** (2025-01-03)
- [x] **QR 코드 네이티브 앱 전용 분리** (2025-01-03)
- [x] **핀 할당 초기화 기능 추가** (2025-01-03)
- [x] **핀 선택 모달 UX 개선** (2025-01-03)
- [x] **중복 센서/액추에이터 선택 방지** (2025-01-03)
- [x] **디바이스별 동적 핀맵 지원** (2025-01-03)

### **Phase 2: 확장 기능 (진행 중)**
- [ ] RS-485/Modbus RTU 어댑터 (산업용 PLC)
- [ ] LoRaWAN 어댑터 (배터리 센서)
- [ ] 시리얼/UART 어댑터 (로컬 장비)
- [ ] CAN 버스 어댑터 (자동차/산업용)
- [ ] LLM 통합 (자연어 분석 고도화)

---

## 🔧 **기술 스택**

### **Frontend**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React Components

### **Backend**
- Next.js API Routes
- Edge Functions (Cloudflare)
- OpenAI/Claude API

### **데이터**
- JSON 카탈로그 (초기)
- Supabase (향후 이관)

### **배포**
- **Vercel (Production)**:
  - Web Admin: `https://smart-on-web-admin.vercel.app`
  - Universal Bridge: `https://universal-bridge.vercel.app`
- **통합 아키텍처**: JWT 토큰 서버가 Universal Bridge에 통합됨
- Cloudflare Workers (Edge Functions)

---

**정말 혁신적인 IoT 개발 경험을 제공하는 시스템입니다!** 🎉

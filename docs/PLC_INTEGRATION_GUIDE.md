# PLC 연동 가이드 - terahub 통합

## 🎯 **개요**

기존 PLC 현장과 terahub(웹어드민+유니버설 브릿지) 연동을 위한 완전한 가이드입니다.

## 🏗️ **전체 아키텍처**

```
[PLC 네트워크(OT)] ──(표준화: OPC UA/Modbus TCP/게이트웨이)── [Universal Bridge] ──(MQTT/HTTP)── [terahub Web Admin(Vercel)]
                                         ▲                                          ▲
                                 (Raspberry Pi/서버)                          (대시보드/관리)
```

## 🚀 **연동 경로 4가지**

### **A. Modbus TCP (가장 간단/보편)**

**조건**: PLC가 Modbus TCP 서버(슬레이브) 기능 제공 또는 통신 모듈/펌웨어 옵션 보유

**방법**: 브릿지의 modbus-tcp 어댑터로 폴링(read/write)

**필요 설정**: PLC IP, 포트(502), Unit ID, 레지스터 맵(주소·자료형·스케일)

**장점**: 
- 단순하고 많은 PLC/계측기가 지원
- 빠른 구현 가능

**단점**: 
- 태그 이름 없이 레지스터 주소 기반(맵 문서 필수)

### **B. OPC UA (산업 표준, 태그 기반, 보안·모델링 강함)**

**조건**: PLC 자체 OPC UA 서버 지원, 또는 게이트웨이(예: Kepware/Inductive Ignition/PLC 벤더 게이트웨이)에서 OPC UA 서버 제공

**방법**: 브릿지의 opc-ua 어댑터로 태그 subscribe/읽기/쓰기

**장점**: 
- 태그명으로 접근
- 접근제어/암호화/모델 구조
- 여러 프로토콜을 일괄 표준화

**단점**: 
- 초기 설정이 모드버스보다 많음(보안/인증서/네임스페이스)

### **C. MQTT 게이트웨이(PLC → MQTT 변환기)**

**조건**: PLC가 직접 MQTT 퍼블리시 or 게이트웨이(노드레드/벤더 게이트웨이)가 PLC 태그를 MQTT로 변환

**방법**: 브릿지의 mqtt 어댑터로 토픽 구독/명령 퍼블리시(스파크플러그B도 고려)

**장점**: 
- 실시간 이벤트 스타일
- 다수 장비 확장에 유리

**단점**: 
- 태그 스키마/토픽 규약을 합의해야 함

### **D. 독자 프로토콜 직접(필요 시)**

**지원 프로토콜**: 지멘스 S7, EtherNet/IP(CIP, Allen-Bradley), MELSEC(Q/L/QnUD), Omron FINS 등

**방법**: 게이트웨이 소프트웨어(예: Kepware/IGNITION/오픈소스 드라이버)로 OPC UA/Modbus/MQTT 중 하나로 변환 → A/B/C로 연동

**장점**: 벤더 혼합 현장 수용

**단점**: 드라이버 라이선스/유지관리 필요

## 📋 **빠른 선택 가이드**

| 상황 | 권장 방법 | 이유 |
|------|-----------|------|
| 빠르게 붙이고 싶다 | **Modbus TCP** | 단순, 빠른 구현 |
| 태그 기반 + 보안 + 모델링 | **OPC UA** | 산업 표준, 보안 강함 |
| 이미 MQTT 인프라 있다/원격 많다 | **MQTT 게이트웨이** | 실시간, 확장성 |
| 벤더 프로토콜 섞여 있다 | **게이트웨이(멀티드라이버)로 표준화** | 유연성 |

## 🔒 **네트워크/보안 설계**

### **네트워크 분리**
- **OT망 ↔ IT/클라우드 분리**: 방화벽/VLAN
- **브릿지 위치**: DMZ/게이트웨이 존 권장
- **외부 접근**: VPN(WireGuard/IPsec) 또는 단방향 업링크(아웃바운드) 우선

### **포트 설정**
- **Modbus TCP**: 502/TCP (장비→브릿지 inbound 필요 X, 브릿지→장비 outbound)
- **OPC UA**: 서버 포트(구성에 따름), TLS/사용자/역할 설정
- **MQTT**: 1883/8883(TLS) — 가급적 TLS

### **인증/보안**
- **브릿지↔terahub**: Bearer/HMAC로 보호
- **인증서/키**: 브릿지 호스트 내 안전 저장(권한 최소화)

### **로깅/감사**
- 폴링 실패/재시도/백오프
- 쓰기 명령 이력(idempotency_key 포함)

## 🗺️ **태그/레지스터 매핑 가이드**

### **공통 스키마 (terahub 호환)**
```typescript
type Telemetry = { 
  device_id: string; 
  ts: string; 
  metrics: Record<string, number|string|boolean>; 
  status?: 'ok'|'warn'|'err' 
};

type Command = { 
  device_id: string; 
  type: string; 
  params: Record<string, any>; 
  idempotency_key?: string; 
  timeout_ms?: number 
};
```

### **Modbus TCP 프로파일 예시**
```json
{
  "transport": "modbus-tcp",
  "host": "10.10.20.15",
  "port": 502,
  "unitId": 1,
  "pollMs": 1000,
  "reads": [
    { 
      "name": "water_temp", 
      "fc": 4, 
      "addr": 30001, 
      "len": 1, 
      "scale": 0.1, 
      "type": "U16" 
    },
    { 
      "name": "ec", 
      "fc": 4, 
      "addr": 30003, 
      "len": 2, 
      "type": "FLOAT_ABCD" 
    }
  ],
  "writes": [
    { 
      "type": "relay_pump1", 
      "fc": 6, 
      "addr": 40010 
    }
  ]
}
```

### **OPC UA 프로파일 예시**
```json
{
  "transport": "opc-ua",
  "endpoint": "opc.tcp://10.10.20.50:4840",
  "security": { 
    "mode": "SignAndEncrypt", 
    "policy": "Basic256Sha256", 
    "certRef": "bridge-client-cert" 
  },
  "subs": [
    { 
      "name": "water_temp", 
      "nodeId": "ns=3;s=Sensors.Water.Temp", 
      "deadband": 0.1 
    },
    { 
      "name": "ph", 
      "nodeId": "ns=3;s=Sensors.Water.pH", 
      "deadband": 0.01 
    }
  ],
  "writes": [
    { 
      "type": "relay_pump1", 
      "nodeId": "ns=3;s=Actuators.Pump1.State", 
      "datatype": "Boolean" 
    }
  ]
}
```

## ⚡ **폴링/이벤트 전략**

### **폴링 기본**
- **주기**: 250ms–5s (센서 성격별)
- **그룹화**: 장비/네트워크에 무리 안 가게

### **변경 감지**
- **데드밴드**: 값 변화율 (예: ±0.1°C 이상만 업링크)
- **이벤트 기반**: 값 변경 시에만 전송

### **명령 쓰기**
- **타임아웃**: 0.5–2s
- **재시도**: ack/timeout/재시도
- **안전장치**: 롤백/상한선 (예: 펌프 on 최대 X분)

### **대량 장치**
- **폴링 간격**: 교차 분할
- **동시 커넥션**: 제한

## 🏭 **PLC 제조사별 힌트**

### **Siemens S7-1200/1500**
- **권장**: OPC UA 옵션 모듈/펌웨어
- **대안**: Kepware/Ignition로 S7 드라이버→OPC UA 변환
- **Modbus TCP**: 활성화 가능(펌웨어/블록 필요)

### **Allen-Bradley(AB)**
- **방법**: EtherNet/IP(타사 드라이버 필요) → 게이트웨이에서 OPC UA/MQTT 변환
- **권장**: 게이트웨이 솔루션

### **Mitsubishi**
- **방법**: MELSEC 드라이버→게이트웨이(OPC UA/MQTT)
- **주의**: Q/L/FX 시리즈별 통신 카드 확인

### **Omron**
- **옵션**: FINS/OPC UA 옵션
- **권장**: 게이트웨이에서 표준화

### **Beckhoff**
- **장점**: TwinCAT OPC UA/TCP 등 표준화 쉬움

## ✅ **수용 기준 (현장 테스트 체크)**

### **Modbus TCP**
- [ ] 브릿지가 3개 이상 레지스터를 1s 주기로 폴링
- [ ] 값 변화 시 100ms 내 대시보드 반영

### **OPC UA**
- [ ] security on 상태에서 구독/쓰기 모두 성공
- [ ] 인증서 로테이션 시 무중단 재접속

### **명령 신뢰성**
- [ ] idempotency_key로 중복 방지
- [ ] timeout/재시도/백오프 로그가 남음

### **보안**
- [ ] 외부에서 PLC 포트 직접 개방 없이(아웃바운드만) 운영 가능
- [ ] VPN 또는 게이트웨이 경유

### **맵 변경**
- [ ] JSON 프로파일 바꾼 뒤 재기동 없이 핫리로드(가능하면) or 10초 내 반영

## 🎯 **지금 바로 할 일**

### **1단계: 현황 파악**
- [ ] 어떤 PLC/프로토콜이 깔려 있는지 목록화(브랜드/모델/통신 옵션)

### **2단계: 표준화 선택**
- [ ] 표준화 1안 선택(Modbus TCP 또는 OPC UA)
- [ ] 2안을 백업으로 준비

### **3단계: 게이트웨이 준비**
- [ ] 게이트웨이 필요 시 라즈베리파이(or 산업용 게이트웨이) 준비

### **4단계: 매핑 정리**
- [ ] 태그/레지스터 맵을 JSON으로 정리
- [ ] Git에 커밋

### **5단계: 테스트**
- [ ] 브릿지 어댑터 프로파일 적용
- [ ] 대시보드에서 실측 확인

## 🔧 **구현해야 할 컴포넌트**

### **Universal Bridge 어댑터**
- [ ] `modbus-tcp-adapter.ts` - PLC 데이터 수집 및 제어
- [ ] `opc-ua-adapter.ts` - 산업 표준 PLC 연동

### **IoT Designer 확장**
- [ ] PLC 매핑 UI - 태그/레지스터 매핑 폼
- [ ] 프로파일 생성기 - JSON 설정 자동 생성

### **보안 및 설정**
- [ ] 인증서 관리 시스템
- [ ] 네트워크 설정 가이드
- [ ] 폴링 전략 최적화

---

**이 가이드를 따라하면 기존 PLC 현장을 terahub와 완벽하게 연동할 수 있습니다!** 🚀

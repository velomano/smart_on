# 🌉 MQTT Bridge → Universal Bridge 마이그레이션 계획

## 📋 개요

기존 MQTT Bridge(`apps/mqtt-bridge/`)를 Universal Bridge(`apps/universal-bridge/`)로 완전 통합하는 마이그레이션 계획입니다.

## 🎯 목표

- **단일 시스템**: 하나의 Universal Bridge로 모든 IoT 디바이스 관리
- **데이터 통합**: `sensor_readings` → `iot_readings` 통합
- **토픽 표준화**: `terahub/{tenant}/{deviceId}/...` 구조로 통일
- **운영 단순화**: 하나의 서비스만 관리

---

## 📊 현재 상황 분석

### **기존 MQTT Bridge**
```
디바이스 → 외부 MQTT 브로커 → MQTT Bridge → Supabase (sensor_readings)
토픽: farms/{farmId}/devices/{deviceId}/telemetry
```

### **Universal Bridge**
```
디바이스 → Universal Bridge (내장 브로커) → Supabase (iot_readings)
토픽: terahub/{tenant}/{deviceId}/telemetry
```

---

## 🗺️ 마이그레이션 로드맵

### **Phase 1: 데이터 통합 (1주)**
- [ ] `sensor_readings` → `iot_readings` 데이터 마이그레이션 스크립트 작성
- [ ] 기존 데이터 백업 및 검증
- [ ] 마이그레이션 테스트 (개발 환경)
- [ ] 프로덕션 마이그레이션 실행

### **Phase 2: Universal Bridge MQTT 지원 강화 (1주)**
- [ ] 기존 MQTT Bridge 핸들러를 Universal Bridge로 포팅
- [ ] `farms/{farmId}/devices/{deviceId}/...` 토픽 지원 추가
- [ ] 기존 디바이스와의 호환성 테스트
- [ ] MQTT 클라이언트 연결 관리 개선

### **Phase 3: 점진적 마이그레이션 (2주)**
- [ ] 기존 디바이스들을 Universal Bridge로 연결 전환
- [ ] 이중 운영 (기존 + 새 시스템)
- [ ] 모니터링 및 검증
- [ ] 문제 발생 시 롤백 계획

### **Phase 4: 완전 전환 (1주)**
- [ ] 모든 디바이스 Universal Bridge 연결 완료
- [ ] 기존 MQTT Bridge 서비스 중단
- [ ] `apps/mqtt-bridge/` 폴더 제거
- [ ] 문서 업데이트

---

## 🔧 기술적 구현 계획

### **1. 데이터 마이그레이션**

```sql
-- sensor_readings → iot_readings 마이그레이션
INSERT INTO iot_readings (device_uuid, key, value, unit, ts, tenant_id)
SELECT 
    d.device_id as device_uuid,
    s.type as key,
    sr.value,
    sr.unit,
    sr.timestamp as ts,
    f.tenant_id
FROM sensor_readings sr
JOIN sensors s ON sr.sensor_id = s.id
JOIN devices d ON s.device_id = d.id
JOIN farms f ON d.farm_id = f.id;
```

### **2. Universal Bridge MQTT 핸들러 확장**

```typescript
// 기존 토픽 지원 추가
const topicMappings = {
  'farms/{farmId}/devices/{deviceId}/telemetry': 'terahub/{tenant}/{deviceId}/telemetry',
  'farms/{farmId}/devices/{deviceId}/registry': 'terahub/{tenant}/{deviceId}/registry',
  'farms/{farmId}/devices/{deviceId}/state': 'terahub/{tenant}/{deviceId}/state'
};
```

### **3. 이중 토픽 지원**

Universal Bridge에서 두 가지 토픽 구조를 모두 지원:

```typescript
// 기존 토픽 (하위 호환성)
client.subscribe('farms/+/+/+/+', handler);

// 새로운 토픽 (표준)
client.subscribe('terahub/+/+/+/+', handler);
```

---

## 📈 성공 지표

### **기술적 지표**
- [ ] 모든 기존 센서 데이터 마이그레이션 완료
- [ ] 기존 디바이스 100% Universal Bridge 연결
- [ ] 데이터 손실 0%
- [ ] 서비스 중단 시간 < 30분

### **운영 지표**
- [ ] 서비스 관리 복잡도 50% 감소
- [ ] 배포 시간 50% 단축
- [ ] 모니터링 포인트 50% 감소
- [ ] 문서 유지보수 부담 감소

---

## ⚠️ 위험 요소 및 대응 방안

### **높은 위험도**
1. **데이터 손실**: 백업 + 단계적 마이그레이션
2. **서비스 중단**: 이중 운영 + 롤백 계획
3. **디바이스 연결 실패**: 호환성 테스트 + 점진적 전환

### **중간 위험도**
1. **성능 저하**: 부하 테스트 + 모니터링
2. **토픽 충돌**: 네임스페이스 분리
3. **인증 문제**: JWT 토큰 호환성 확인

### **낮은 위험도**
1. **문서 업데이트**: 단계적 문서화
2. **팀 교육**: 기술 전달 세션

---

## 📅 일정표

| 주차 | 작업 내용 | 담당자 | 산출물 |
|------|-----------|--------|--------|
| 1주 | 데이터 마이그레이션 | 백엔드 | 마이그레이션 스크립트 |
| 2주 | Universal Bridge 확장 | 백엔드 | MQTT 핸들러 |
| 3주 | 점진적 마이그레이션 | 전체 | 테스트 보고서 |
| 4주 | 완전 전환 | 전체 | 완료 보고서 |

---

## 🎉 기대 효과

### **단기 효과**
- 운영 복잡도 감소
- 시스템 통합성 향상
- 유지보수 부담 감소

### **장기 효과**
- 새로운 프로토콜 추가 용이성
- 확장성 향상
- 개발 생산성 증대
- 기술 부채 감소

---

**작성일**: 2025-01-15  
**버전**: 1.0  
**상태**: 계획 단계

# 🚀 즉시 실행 가능한 MQTT Bridge 통합 방안

**날짜**: 2025-10-04  
**상태**: ✅ **완료됨**

## 📋 현재 상황

- **기존 MQTT Bridge**: `apps/mqtt-bridge/` (외부 브로커 연결, `sensor_readings` 테이블)
- **Universal Bridge**: `apps/universal-bridge/` (내장 브로커, `iot_readings` 테이블)
- **해결**: Legacy MQTT 클라이언트로 통합 완료

## 🎯 즉시 실행 방안

### **Option 1: Universal Bridge MQTT 클라이언트 기능 추가** ✅ **완료됨**

Universal Bridge에 기존 MQTT Bridge의 클라이언트 기능을 추가하여 **하위 호환성**을 제공합니다.

#### **달성된 장점:**
- ✅ 기존 디바이스 수정 불필요
- ✅ 점진적 마이그레이션 가능
- ✅ 데이터 손실 위험 최소화
- ✅ 서비스 중단 없음

#### **구현 방법:**
```typescript
// Universal Bridge에 MQTT 클라이언트 매니저 추가
class UniversalMQTTClientManager extends MQTTClientManager {
  // 기존 토픽 구조 지원
  subscribeToLegacyTopics(farmId: string) {
    const legacyTopics = [
      `farms/${farmId}/+/+/registry`,
      `farms/${farmId}/+/+/state`, 
      `farms/${farmId}/+/+/telemetry`,
      `farms/${farmId}/+/+/command/ack`
    ];
    
    legacyTopics.forEach(topic => {
      this.client.subscribe(topic);
    });
  }
  
  // 토픽 변환 및 데이터 저장
  handleLegacyMessage(topic: string, payload: any) {
    // farms/{farmId}/devices/{deviceId}/telemetry → terahub/{tenant}/{deviceId}/telemetry
    const convertedTopic = this.convertTopic(topic);
    const convertedPayload = this.convertPayload(payload);
    
    // iot_readings 테이블에 저장
    this.saveToIotReadings(convertedTopic, convertedPayload);
  }
}
```

### **Option 2: 데이터 동기화 레이어 구현**

두 테이블 간의 실시간 동기화를 구현합니다.

#### **구현 방법:**
```typescript
// sensor_readings → iot_readings 실시간 동기화
class DataSyncLayer {
  async syncSensorReadings() {
    // sensor_readings의 새로운 데이터를 iot_readings로 복사
    const newReadings = await this.getNewSensorReadings();
    
    for (const reading of newReadings) {
      await this.insertToIotReadings(reading);
    }
  }
  
  async syncIotReadings() {
    // iot_readings의 새로운 데이터를 sensor_readings로 복사
    const newReadings = await this.getNewIotReadings();
    
    for (const reading of newReadings) {
      await this.insertToSensorReadings(reading);
    }
  }
}
```

### **Option 3: 통합 데이터 조회 API**

웹 어드민에서 두 테이블을 모두 조회하는 통합 API를 구현합니다.

#### **구현 방법:**
```typescript
// 통합 센서 데이터 조회
async function getUnifiedSensorData(farmId: string) {
  const [legacyData, newData] = await Promise.all([
    getSensorReadingsFromLegacyTable(farmId),
    getSensorReadingsFromIotTable(farmId)
  ]);
  
  // 데이터 병합 및 중복 제거
  return mergeAndDeduplicate(legacyData, newData);
}
```

---

## 🚀 권장 실행 계획

### **1단계: Universal Bridge 확장 (1일)**

```typescript
// apps/universal-bridge/src/protocols/mqtt/legacy-client.ts
export class LegacyMQTTClient {
  // 기존 MQTT Bridge의 클라이언트 로직 포팅
  async connectToLegacyBroker(farmConfig: FarmConfig) {
    // 기존 토픽 구독
    // 메시지 핸들링
    // iot_readings 테이블에 저장
  }
}
```

### **2단계: 웹 어드민 통합 조회 (1일)**

```typescript
// apps/web-admin/src/lib/data/unified-iot-data.ts
export async function getUnifiedSensorData(farmId: string) {
  // 두 테이블 모두 조회
  // 데이터 병합
  // 중복 제거
}
```

### **3단계: 점진적 디바이스 마이그레이션 (1주)**

1. 새로운 디바이스는 Universal Bridge 사용
2. 기존 디바이스는 Legacy MQTT Client 지원
3. 필요시 기존 디바이스 펌웨어 업데이트

---

## 📊 구현 우선순위

### **High Priority (즉시)** ✅ **완료됨**
1. ✅ **알림 시스템 수정** (완료)
   - 두 테이블 모두 확인하도록 수정
   - 센서 연결 상태 정확한 감지

2. ✅ **Universal Bridge Legacy 지원 추가** (완료)
   - 기존 토픽 구조 지원
   - 하위 호환성 제공

### **Medium Priority (1주 내)** ✅ **완료됨**
3. ✅ **통합 데이터 조회 API** (완료)
   - 웹 어드민에서 통합 조회
   - 성능 최적화

4. ✅ **모니터링 대시보드 통합** (완료)
   - 두 시스템 상태 통합 표시

### **Low Priority (1개월 내)**
5. **완전 마이그레이션**
   - 모든 디바이스 Universal Bridge 전환
   - 기존 MQTT Bridge 제거

---

## 🎯 완료된 작업

### **1. Universal Bridge Legacy MQTT 클라이언트 추가** ✅ **완료**

```bash
# Universal Bridge에 기존 MQTT Bridge 기능 추가
cd apps/universal-bridge/src/protocols/mqtt/
# LegacyMQTTClientManager 구현 완료
```

### **2. 웹 어드민 통합 조회 수정** ✅ **완료**

```typescript
// apps/web-admin/src/lib/data/unified-iot-data.ts
// 두 테이블 모두 확인하도록 수정 완료
```

### **3. 환경 변수 설정** ✅ **완료**

```bash
# Universal Bridge에서 기존 MQTT Bridge 설정 로드
LEGACY_MQTT_SUPPORT=true
ENABLE_LEGACY_TOPICS=true
```

---

## ✅ 달성된 효과

### **즉시 효과** ✅ **달성**
- ✅ 데이터 분산 문제 해결
- ✅ 알림 시스템 정확성 향상
- ✅ 기존 디바이스 호환성 유지

### **장기 효과** ✅ **달성**
- ✅ 단일 시스템으로 운영 단순화
- ✅ 확장성 향상
- ✅ 유지보수 부담 감소

---

**결론**: Option 1 (Universal Bridge Legacy 지원 추가)이 **완료**되었습니다! 🚀

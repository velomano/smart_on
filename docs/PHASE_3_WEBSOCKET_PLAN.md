# Phase 3: WebSocket 실시간 연동 계획서

**날짜**: 2025-01-15  
**목표**: WebSocket 기반 실시간 데이터 스트리밍  
**예상 시간**: 2-3시간  

---

## 🎯 **Phase 3 목표**

### **현재 상태**
- ✅ **폴링 기반 실시간 업데이트** (5-10초 간격)
- ✅ **모든 UI 컴포넌트 완성**
- ✅ **API 엔드포인트 구현**

### **목표 상태**
- 🎯 **WebSocket 기반 실시간 스트리밍**
- 🎯 **즉시 UI 업데이트** (폴링 → 실시간)
- 🎯 **연결 상태 모니터링**
- 🎯 **자동 재연결 시스템**

---

## 📋 **작업 순서**

### **Step 1: WebSocket 서버 설정** (30분)
- Universal Bridge에 WebSocket 서버 추가
- 클라이언트 연결 관리
- 인증 및 권한 관리

### **Step 2: 실시간 데이터 스트리밍** (45분)
- 센서 데이터 실시간 브로드캐스트
- 디바이스 상태 변경 알림
- 이벤트 로그 실시간 전송

### **Step 3: UI 자동 업데이트** (30분)
- 폴링 → WebSocket 전환
- 실시간 데이터 수신 처리
- 상태 동기화

### **Step 4: 연결 모니터링** (15분)
- 연결 상태 표시
- 자동 재연결 로직
- 오프라인 처리

### **Step 5: 통합 테스트** (30분)
- 전체 시스템 테스트
- 성능 검증
- 에러 처리 확인

---

## 🚀 **구현 계획**

### **WebSocket 서버 (Universal Bridge)**
```typescript
// apps/universal-bridge/src/websocket/server.ts
export class WebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket>;
  
  // 실시간 센서 데이터 브로드캐스트
  broadcastSensorData(farmId: string, data: any);
  
  // 디바이스 상태 변경 알림
  broadcastDeviceStatus(deviceId: string, status: string);
  
  // 이벤트 로그 실시간 전송
  broadcastEvent(deviceId: string, event: any);
}
```

### **WebSocket 클라이언트 (Web Admin)**
```typescript
// apps/web-admin/src/hooks/useWebSocket.ts
export function useWebSocket(farmId: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  
  // 실시간 데이터 수신
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws?farmId=${farmId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeData(data);
    };
    
    return () => ws.close();
  }, [farmId]);
}
```

---

## 📊 **기대 효과**

### **성능 개선**
- **폴링 간격**: 5-10초 → **즉시**
- **네트워크 트래픽**: 90% 감소
- **서버 부하**: 80% 감소

### **사용자 경험**
- **실시간 반응**: 즉시 업데이트
- **연결 상태**: 시각적 표시
- **안정성**: 자동 재연결

---

## ✅ **완료 체크리스트**

### **Step 1: WebSocket 서버**
- [ ] Universal Bridge에 WebSocket 서버 추가
- [ ] 클라이언트 연결 관리 구현
- [ ] 인증 및 권한 관리
- [ ] 연결 상태 추적

### **Step 2: 실시간 스트리밍**
- [ ] 센서 데이터 브로드캐스트
- [ ] 디바이스 상태 알림
- [ ] 이벤트 로그 전송
- [ ] 메시지 형식 정의

### **Step 3: UI 업데이트**
- [ ] WebSocket 클라이언트 훅 생성
- [ ] 기존 폴링 로직 제거
- [ ] 실시간 데이터 처리
- [ ] 상태 동기화

### **Step 4: 연결 모니터링**
- [ ] 연결 상태 표시 UI
- [ ] 자동 재연결 로직
- [ ] 오프라인 처리
- [ ] 에러 복구

### **Step 5: 테스트**
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 성능 테스트
- [ ] 에러 시나리오 테스트

---

## 🎯 **성공 기준**

Phase 3 완료 시:
- ✅ **WebSocket 연결 성공률 99%+**
- ✅ **데이터 전송 지연 < 100ms**
- ✅ **자동 재연결 성공**
- ✅ **폴링 완전 제거**

---

**Phase 3 완료 후 완전한 실시간 IoT 대시보드가 완성됩니다!** 🚀

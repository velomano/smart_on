# 보안 사고 대응 절차

## 🚨 키 유출 대응 절차

### 1단계: 즉시 대응 (5분 이내)

#### 🔍 상황 파악
- **유출된 키 확인**: `device_key`, `setup_token`, `SUPABASE_SERVICE_ROLE_KEY` 등
- **유출 범위 확인**: 특정 디바이스, 테넌트, 전체 시스템
- **유출 경로 확인**: 로그, 코드, 문서, 네트워크 등

#### 🛑 즉시 조치
```bash
# 1. 해당 디바이스 키 회전
curl -X POST https://bridge.smartfarm.app/api/provisioning/rotate \
  -H "Content-Type: application/json" \
  -d '{"device_id": "ESP32_001", "reason": "security_incident"}'

# 2. Setup Token 무효화 (DB 직접 수정)
UPDATE device_claims 
SET status = 'revoked', 
    revoked_at = NOW(),
    revoked_reason = 'security_incident'
WHERE setup_token = 'st_유출된토큰';

# 3. 서비스 역할 키 회전 (Supabase 대시보드)
# - Supabase → Settings → API → Service Role Key → Reset
```

### 2단계: 시스템 보안 강화 (30분 이내)

#### 🔐 키 회전 실행
```sql
-- 모든 디바이스 키 회전
UPDATE iot_devices 
SET device_key = 'dk_' || encode(gen_random_bytes(16), 'hex'),
    key_rotated_at = NOW(),
    key_rotation_reason = 'security_incident'
WHERE tenant_id = '유출된_테넌트_ID';

-- Grace Period 설정 (1시간)
UPDATE iot_devices 
SET key_grace_period = NOW() + INTERVAL '1 hour'
WHERE tenant_id = '유출된_테넌트_ID';
```

#### 📝 로그 마스킹 강화
```typescript
// 로그 마스킹 함수
function maskSensitiveData(data: any): any {
  const sensitiveKeys = ['device_key', 'x-sig', 'setup_token', 'service_role_key'];
  
  function maskObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const masked = { ...obj };
    for (const key of sensitiveKeys) {
      if (masked[key]) {
        masked[key] = masked[key].substring(0, 8) + '***';
      }
    }
    
    return masked;
  }
  
  return maskObject(data);
}

// 사용 예시
console.log('Request:', maskSensitiveData(requestBody));
```

### 3단계: 모니터링 강화 (1시간 이내)

#### 🔍 의심 활동 모니터링
```sql
-- 의심스러운 API 호출 패턴 확인
SELECT 
  device_id,
  COUNT(*) as request_count,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM iot_readings 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY device_id
HAVING COUNT(*) > 100; -- 비정상적으로 많은 요청

-- 실패한 인증 시도 확인
SELECT 
  device_id,
  COUNT(*) as failed_attempts
FROM iot_readings 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND device_id IN (
    SELECT device_id FROM iot_devices 
    WHERE key_rotated_at > NOW() - INTERVAL '1 hour'
  )
GROUP BY device_id;
```

#### 📊 알림 설정
```typescript
// 보안 알림 함수
async function sendSecurityAlert(incident: {
  type: 'key_leak' | 'suspicious_activity' | 'unauthorized_access';
  device_id?: string;
  tenant_id?: string;
  details: string;
}) {
  const alert = {
    timestamp: new Date().toISOString(),
    severity: 'HIGH',
    ...incident
  };
  
  // Slack/Telegram 알림
  await sendSlackAlert(alert);
  await sendTelegramAlert(alert);
  
  // 로그 기록
  console.error('SECURITY_ALERT:', alert);
}
```

### 4단계: 복구 및 검증 (2시간 이내)

#### ✅ 시스템 정상화 확인
```bash
# 1. 모든 디바이스 연결 상태 확인
curl https://bridge.smartfarm.app/api/system/health

# 2. 키 회전 후 디바이스 재연결 테스트
curl -X POST https://bridge.smartfarm.app/api/bridge/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32_001" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -H "x-ts: $(date +%s)" \
  -H "x-sig: $(echo -n "ESP32_001|$(date +%s)|temp:25.5" | openssl dgst -sha256 -hmac "새로운_디바이스_키" | cut -d' ' -f2)" \
  -d '{"temp": 25.5, "hum": 60.2}'

# 3. Grace Period 만료 확인
SELECT device_id, key_grace_period 
FROM iot_devices 
WHERE key_grace_period < NOW() 
  AND status = 'active';
```

#### 📋 복구 체크리스트
- [ ] 모든 디바이스 키 회전 완료
- [ ] Setup Token 무효화 완료
- [ ] 서비스 역할 키 회전 완료
- [ ] 로그 마스킹 적용 완료
- [ ] 모니터링 알림 설정 완료
- [ ] 디바이스 재연결 테스트 완료
- [ ] Grace Period 만료 확인 완료

### 5단계: 사후 조치 (24시간 이내)

#### 📝 사고 보고서 작성
```markdown
# 보안 사고 보고서

## 사고 개요
- **발생 일시**: 2025-10-01 12:00:00
- **사고 유형**: 키 유출
- **영향 범위**: 특정 테넌트 (00000000-0000-0000-0000-000000000001)
- **유출된 키**: device_key (ESP32_001)

## 대응 조치
1. **즉시 조치**: 디바이스 키 회전, Setup Token 무효화
2. **시스템 강화**: 로그 마스킹 적용, 모니터링 강화
3. **복구 작업**: 디바이스 재연결, Grace Period 관리

## 개선 사항
- [ ] 키 회전 자동화 스크립트 개발
- [ ] 보안 모니터링 대시보드 구축
- [ ] 사고 대응 매뉴얼 업데이트
```

#### 🔄 프로세스 개선
- **자동화 스크립트** 개발
- **모니터링 대시보드** 구축
- **사고 대응 매뉴얼** 업데이트
- **팀 교육** 실시

## 📞 연락처

### 긴급 연락처
- **시스템 관리자**: admin@smartfarm.app
- **보안 담당자**: security@smartfarm.app
- **Slack 채널**: #security-alerts
- **Telegram 그룹**: @smartfarm-security

### 외부 연락처
- **Supabase 지원**: support@supabase.com
- **Vercel 지원**: support@vercel.com

## ⚠️ 주의사항

- **키 유출 시 즉시 회전** 필수
- **Grace Period** 동안 기존 키도 허용
- **로그 마스킹**으로 추가 유출 방지
- **모니터링 강화**로 재발 방지
- **사고 보고서** 작성으로 개선점 도출

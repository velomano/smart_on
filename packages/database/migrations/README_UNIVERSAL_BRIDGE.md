# Universal Bridge v2.0 Database Setup

## 🚀 빠른 실행

### 1. Supabase Dashboard 접속
```
https://app.supabase.com/project/YOUR_PROJECT/sql
```

### 2. SQL Editor 열기
왼쪽 메뉴 → **SQL Editor** → **New Query**

### 3. 스크립트 실행
`20251001_universal_bridge_schema.sql` 파일 내용을 복사하여 붙여넣고 **Run** 클릭

### 4. 결과 확인
```
✅ Universal Bridge v2.0 스키마 생성 완료!

생성된 테이블:
  - devices (디바이스 정보)
  - device_claims (Setup Token)
  - readings (센서 데이터)
  - commands (제어 명령)
  - readings_hourly (집계 뷰)
```

## 📋 생성되는 테이블

| 테이블 | 용도 | RLS |
|--------|------|-----|
| `devices` | 디바이스 정보 및 키 | ✅ |
| `device_claims` | Setup Token 관리 | ✅ |
| `readings` | 센서 데이터 | ✅ |
| `commands` | 제어 명령 | ✅ |
| `readings_hourly` | 시간별 집계 (뷰) | - |

## 🔐 보안

모든 테이블에 **Row Level Security (RLS)** 정책 적용:
- ✅ 테넌트 완전 격리
- ✅ farm_memberships 기반 권한 체크
- ✅ 자동 필터링

## 🔧 선택적 설정

### Materialized View 자동 새로고침 (pg_cron)

```sql
-- 1시간마다 자동 새로고침
SELECT cron.schedule(
  'refresh-readings-hourly',
  '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY readings_hourly'
);
```

### 만료된 토큰 자동 정리

```sql
-- 매일 자정에 실행
SELECT cron.schedule(
  'cleanup-expired-claims',
  '0 0 * * *',
  'SELECT cleanup_expired_claims()'
);
```

## 📊 확인 쿼리

스키마가 제대로 생성되었는지 확인:

```sql
-- 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('devices', 'device_claims', 'readings', 'commands')
ORDER BY table_name;

-- RLS 정책 확인
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('devices', 'device_claims', 'readings', 'commands')
ORDER BY tablename;

-- 함수 확인
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('current_tenant_id', 'update_device_last_seen', 'cleanup_expired_claims')
ORDER BY routine_name;
```

## ✅ 완료 후

스키마가 생성되면 Universal Bridge 서버가 자동으로 DB에 연결됩니다!

환경 변수 확인:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

**다음**: Universal Bridge 서버 DB 연동 코드 구현


# 🔐 사용자 권한 시스템 문서

## 📋 개요

스마트팜 애플리케이션의 완전한 사용자 권한 관리 시스템입니다. Supabase Auth와 연동하여 역할 기반 접근 제어(RBAC)를 제공합니다.

## 🏗️ 시스템 구조

### 계층 구조
```
테넌트 (Tenant)
├── 팀 (Team) - 농장 단위
│   ├── 팀 리더 (Team Leader)
│   └── 팀 멤버 (Team Member)
└── 시스템 관리자 (System Admin) - 모든 권한
```

### 권한 레벨
1. **시스템 관리자 (system_admin)**: 전체 시스템 관리 권한
2. **팀 리더 (team_leader)**: 특정 농장 관리 권한
3. **팀 멤버 (team_member)**: 기본 사용자 권한

## 📊 테이블 구조

### 1. tenants (테넌트)
- **목적**: 멀티 테넌트 지원
- **주요 컬럼**:
  - `id`: UUID (Primary Key)
  - `name`: 테넌트 이름
  - `description`: 테넌트 설명
  - `is_active`: 활성화 상태

### 2. teams (팀)
- **목적**: 농장 단위 팀 관리
- **주요 컬럼**:
  - `id`: UUID (Primary Key)
  - `tenant_id`: 테넌트 참조
  - `name`: 팀 이름 (예: "1농장", "2농장")
  - `team_code`: 팀 식별 코드 (예: "FARM001")

### 3. users (사용자)
- **목적**: Supabase Auth와 연동된 사용자 정보
- **주요 컬럼**:
  - `id`: UUID (auth.users 참조)
  - `email`: 이메일 주소
  - `name`: 사용자 이름
  - `role`: 사용자 역할 (system_admin, team_leader, team_member)
  - `team_id`: 소속 팀
  - `team_name`: 팀 이름
  - `is_approved`: 승인 상태
  - `is_active`: 활성화 상태

### 4. memberships (멤버십)
- **목적**: 사용자-팀 관계 관리
- **주요 컬럼**:
  - `user_id`: 사용자 참조
  - `team_id`: 팀 참조
  - `role`: 팀 내 역할 (leader, member)

### 5. user_settings (사용자 설정)
- **목적**: 개인화된 사용자 설정 관리
- **주요 설정 카테고리**:
  - `notification_preferences`: 알림 설정
  - `ui_preferences`: UI 설정
  - `dashboard_preferences`: 대시보드 설정
  - `sensor_thresholds`: 센서 임계값 설정
  - `telegram_chat_id`: 텔레그램 연동

### 6. user_activity_logs (활동 로그)
- **목적**: 사용자 활동 추적 및 감사
- **주요 컬럼**:
  - `user_id`: 사용자 참조
  - `action`: 수행한 작업
  - `resource_type`: 작업 대상 타입
  - `details`: 상세 정보 (JSONB)

## 🔒 보안 정책 (RLS)

### 사용자 정책
- **자신의 프로필 조회/수정**: 모든 사용자
- **전체 사용자 조회**: 시스템 관리자만
- **전체 사용자 수정**: 시스템 관리자만
- **팀 멤버 조회**: 팀 리더만

### 설정 정책
- **자신의 설정 조회/수정**: 모든 사용자
- **전체 설정 관리**: 시스템 관리자만

### 활동 로그 정책
- **자신의 활동 로그 조회**: 모든 사용자
- **전체 활동 로그 조회**: 시스템 관리자만

## 🛠️ 유틸리티 함수

### 권한 확인 함수
```sql
-- 사용자 역할 확인
SELECT get_user_role('user-uuid');

-- 시스템 관리자 여부 확인
SELECT is_system_admin('user-uuid');

-- 팀 리더 여부 확인
SELECT is_team_leader('user-uuid');
```

### 설정 관리 함수
```sql
-- 사용자 설정 업데이트
SELECT update_user_setting(
    'user-uuid',
    'notification',
    'telegram',
    'true'
);

-- 사용자 설정 조회
SELECT get_user_setting('user-uuid', 'dashboard');
```

### 활동 로그 함수
```sql
-- 사용자 활동 기록
SELECT log_user_activity(
    'user-uuid',
    'login',
    'user',
    'user-uuid',
    '{"ip": "192.168.1.1"}'
);
```

## 👥 테스트 계정 권한

### 시스템 관리자
- `test1@test.com` - 테스트 관리자
- `admin@smartfarm.com` - 시스템 관리자
- `velomano@naver.com` - 벨로마노 (테라 허브)
- `sky3rain7@gmail.com` - 서천우

### 1농장 팀
- **팀 리더**: `test2@test.com` - 테스트 농장장
- **팀 멤버**: 
  - `test3@test.com` - 테스트 팀원
  - `user@smartfarm.com` - 1농장 팀원

### 2농장 팀
- **팀 리더**: `test4@test.com` - 2농장 농장장
- **팀 멤버**: `test5@test.com` - 2농장 팀원

### 3농장 팀
- **팀 리더**: `test6@test.com` - 3농장 농장장
- **팀 멤버**: `test7@test.com` - 3농장 팀원

## 🔧 설정 예시

### 기본 알림 설정
```json
{
  "email": true,
  "telegram": false,
  "dashboard": true,
  "sensor_alerts": true,
  "system_alerts": true,
  "low_humidity": true,
  "high_temperature": true,
  "water_level": true,
  "ph_alerts": true
}
```

### 기본 센서 임계값
```json
{
  "temperature": {"min": 15, "max": 35},
  "humidity": {"min": 40, "max": 80},
  "soil_moisture": {"min": 30, "max": 70},
  "ph": {"min": 6.0, "max": 7.5},
  "light": {"min": 200, "max": 1000}
}
```

## 📈 성능 최적화

### 인덱스
- `idx_users_role`: 역할별 사용자 조회 최적화
- `idx_users_team_id`: 팀별 사용자 조회 최적화
- `idx_users_is_active`: 활성 사용자 조회 최적화
- `idx_user_activity_logs_created_at`: 활동 로그 시간순 조회 최적화

### 캐싱 전략
- 사용자 권한 정보는 세션 동안 캐시
- 팀 정보는 애플리케이션 레벨에서 캐시
- 설정 정보는 사용자별로 캐시

## 🚀 확장 계획

### 향후 추가 예정
1. **역할 기반 권한 세분화**: 세부 권한 매트릭스
2. **API 키 기반 인증**: IoT 디바이스용
3. **감사 로그 강화**: 상세한 활동 추적
4. **멀티 테넌트 확장**: 여러 조직 지원
5. **SSO 연동**: 기업용 단일 로그인

## 🔍 문제 해결

### 일반적인 문제
1. **권한 부족 오류**: 사용자 역할 확인
2. **설정 저장 실패**: RLS 정책 확인
3. **활동 로그 누락**: 함수 권한 확인

### 디버깅 쿼리
```sql
-- 사용자 권한 확인
SELECT u.name, u.role, u.team_name, u.is_active
FROM users u
WHERE u.email = 'user@example.com';

-- 팀 멤버십 확인
SELECT t.name as team_name, m.role as membership_role
FROM memberships m
JOIN teams t ON m.team_id = t.id
WHERE m.user_id = 'user-uuid';

-- 최근 활동 확인
SELECT action, resource_type, created_at
FROM user_activity_logs
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

## 🆕 최근 업데이트 (2025.01.28)

### ✅ 새로 추가된 기능
- **비밀번호 보기/숨기기**: 로그인 및 비밀번호 재설정 페이지에 직관적인 눈 모양 아이콘 추가
- **에러 메시지 한글화**: Supabase 기본 영어 에러 메시지를 사용자 친화적인 한국어로 변환
- **비밀번호 재설정**: 이메일 기반 비밀번호 재설정 기능 완전 구현
- **Mock 인증 시스템**: 개발 환경용 대체 인증 시스템 구축
- **환경 변수 설정**: Supabase 연결을 위한 완전한 환경 변수 설정
- **RLS 정책 최적화**: 중복 정책 제거 및 보안 강화

### 🔧 개선된 기능
- **UserDashboard 안정성**: undefined 배열 오류 수정으로 안정성 대폭 향상
- **로그인 시스템**: 완전한 Supabase 인증 시스템 구축
- **회원가입 프로세스**: 관리자 승인 기반 회원가입 시스템

### 🐛 수정된 버그
- **Runtime TypeError**: UserDashboard에서 undefined 배열에 대한 filter 오류 해결
- **400 Bad Request**: Supabase 인증 오류 해결
- **500 Internal Server Error**: RLS 정책 충돌 해결

---

**최종 업데이트**: 2025.01.28  
**버전**: v1.1  
**담당자**: 스마트팜 개발팀


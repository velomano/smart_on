# 사용자 권한 시스템 가이드

## 📋 개요

스마트팜 시스템의 사용자 권한 시스템은 4단계 역할 기반으로 구성되어 있으며, 각 역할별로 다른 권한과 접근 범위를 제공합니다.

## 🔐 역할 정의

### 1. `super_admin` (슈퍼 어드민)
- **최고 권한**을 가진 루트 관리자 역할
- 모든 시스템 기능에 대한 완전한 접근 권한
- 시스템 설정, 사용자 관리, 농장 관리 등 모든 권한
- **특별 사용자**: `sky3rain7@gmail.com`

### 2. `system_admin` (시스템 관리자)
- 시스템 전반을 관리하는 관리자 역할
- 농장 생성, 베드 생성, 사용자 승인, 사용자 정보 편집 권한
- MQTT 설정, 시스템 설정 등 대부분의 관리 기능 사용 가능
- 모든 농장에 대한 접근 권한

### 3. `team_leader` (농장장)
- 특정 농장을 관리하는 농장장 역할
- 자신이 배정된 농장에 대한 관리 권한
- MQTT 설정, 베드 추가/편집, 소속 팀원 정보 수정 권한
- 농장 운영에 필요한 모든 기능 사용 가능

### 4. `team_member` (팀원)
- 농장에서 작업하는 일반 사용자 역할
- 자신이 배정된 농장의 데이터 조회만 가능
- 센서 데이터 모니터링, 생육 노트 작성 등 기본 기능만 사용

## 🏗️ 데이터베이스 구조

### 사용자 테이블 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,                              -- auth.users.id와 동일
    email TEXT UNIQUE,                               -- 이메일 (로그인 ID)
    name TEXT,                                       -- 사용자 이름
    company TEXT,                                    -- 소속 회사
    phone TEXT,                                      -- 연락처
    is_approved BOOLEAN DEFAULT false,               -- 승인 여부
    approved_at TIMESTAMPTZ,                         -- 승인 일시
    approved_by UUID REFERENCES users(id),           -- 승인자
    is_active BOOLEAN DEFAULT true,                  -- 활성 상태
    role TEXT CHECK (role IN ('super_admin', 'system_admin', 'team_leader', 'team_member')), -- 4단계 권한 체계
    team_name TEXT,                                  -- 팀명
    team_id UUID REFERENCES teams(id),              -- 소속 팀 ID
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    preferred_team TEXT DEFAULT 'admin_assign',     -- 선호 팀
    avatar_url TEXT,                                 -- 프로필 이미지
    last_login_at TIMESTAMPTZ,                       -- 마지막 로그인
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 팀 테이블 (teams)
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,                              -- 팀명 (농장명)
    description TEXT,                                -- 팀 설명
    team_code TEXT UNIQUE,                          -- 팀 코드
    is_active BOOLEAN DEFAULT true,                 -- 활성 상태
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 멤버십 테이블 (memberships)
```sql
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role TEXT NOT NULL CHECK (role IN ('owner', 'operator', 'viewer')),
    team_id UUID REFERENCES teams(id)               -- 소속 팀
);
```

## 🎯 권한 매트릭스

| 기능 | super_admin | system_admin | team_leader | team_member |
|------|-------------|--------------|-------------|-------------|
| **시스템 관리** | | | | |
| 시스템 관리자 권한 부여 | ✅ | ❌ | ❌ | ❌ |
| 시스템 설정 변경 | ✅ | ✅ | ❌ | ❌ |
| 전체 시스템 모니터링 | ✅ | ✅ | ❌ | ❌ |
| **농장 관리** | | | | |
| 농장 생성/삭제 | ✅ | ✅ | ❌ | ❌ |
| 모든 농장 조회 | ✅ | ✅ | ❌ | ❌ |
| 자신의 농장 조회 | ✅ | ✅ | ✅ | ✅ |
| 농장 설정 변경 | ✅ | ✅ | ✅ (자신 농장만) | ❌ |
| **베드 관리** | | | | |
| 모든 농장 베드 조회 | ✅ | ✅ | ❌ | ❌ |
| 자신의 농장 베드 조회 | ✅ | ✅ | ✅ | ✅ |
| 베드 추가/편집/삭제 | ✅ | ✅ | ✅ (자신 농장만) | ❌ |
| **사용자 관리** | | | | |
| 사용자 승인/거부 | ✅ | ✅ | ❌ | ❌ |
| 사용자 역할 변경 | ✅ | ✅ | ✅ (소속 팀원만) | ❌ |
| 팀원 활성화/비활성화 | ✅ | ✅ | ✅ (소속 팀원만) | ❌ |
| 팀원 정보 수정 | ✅ | ✅ | ✅ (소속 팀원만) | ❌ |
| **팀원 보기** | | | | |
| 모든 팀원 조회 | ✅ | ✅ | ❌ | ❌ |
| 자신의 팀원 조회 | ✅ | ✅ | ✅ | ✅ |
| **MQTT 설정** | | | | |
| 전체 MQTT 설정 | ✅ | ✅ | ❌ | ❌ |
| 농장별 MQTT 설정 | ✅ | ✅ | ✅ (자신 농장만) | ❌ |
| **데이터 조회** | | | | |
| 센서 데이터 조회 | ✅ | ✅ | ✅ (자신 농장만) | ✅ (자신 농장만) |
| 알림 조회 | ✅ | ✅ | ✅ (자신 농장만) | ✅ (자신 농장만) |
| 생육 노트 조회/작성 | ✅ | ✅ | ✅ (자신 농장만) | ✅ (자신 농장만) |
| **양액계산** | | | | |
| 양액계산 사용 | ✅ | ✅ | ✅ | ✅ |
| 양액계산 설정 | ✅ | ✅ | ✅ (자신 농장만) | ❌ |

## 🔄 권한 변경 프로세스

### 1. 사용자 승인 과정
```typescript
// 관리자가 사용자 승인 시
const approveResult = await approveUser(userId);
const updateResult = await updateUser(userId, {
  role: 'team_leader' | 'team_member',
  team_id: selectedTeamId
});
```

### 2. 역할 변경 과정
```typescript
// 사용자 역할 변경
const updateResult = await updateUser(userId, {
  role: newRole,
  team_id: newTeamId
});
```

### 3. 권한 적용 확인
- 페이지 로드 시 `getCurrentUser()` 호출로 최신 권한 정보 조회
- `user.role`과 `user.team_id`를 기반으로 UI 및 데이터 필터링
- 실시간 권한 변경은 페이지 새로고침 후 적용

## 🛡️ 보안 정책

### 1. Row Level Security (RLS)
```sql
-- 사용자는 자신의 데이터만 조회 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
```

### 2. 권한 검증
```typescript
// 농장장/팀원은 자신의 농장만 조회
if (user && (user.role === 'team_leader' || user.role === 'team_member') && user.team_id) {
  farmsToShow = farms.filter(farm => farm.id === user.team_id);
}
```

### 3. UI 권한 제어
```typescript
// 팀원은 편집 버튼을 볼 수 없음
{user && user.role !== 'team_member' && (
  <button>편집</button>
)}
```

## 📱 사용자 인터페이스

### 1. 관리자 대시보드
- 모든 사용자 및 농장 관리
- 시스템 전체 설정
- 사용자 승인 및 역할 변경

### 2. 농장장 대시보드
- 자신의 농장 관리
- 팀원 관리
- MQTT 설정

### 3. 팀원 대시보드
- 농장 데이터 조회
- 센서 데이터 모니터링
- 생육 노트 작성

## 🔧 개발자 가이드

### 1. 권한 체크 함수
```typescript
const checkPermission = (user: AuthUser, requiredRole: string, teamId?: string) => {
  if (user.role === 'system_admin') return true;
  if (user.role === requiredRole) {
    if (teamId) return user.team_id === teamId;
    return true;
  }
  return false;
};
```

### 2. 데이터 필터링
```typescript
const filterDataByPermission = (data: any[], user: AuthUser) => {
  if (user.role === 'system_admin') return data;
  if (user.team_id) {
    return data.filter(item => item.farm_id === user.team_id);
  }
  return [];
};
```

### 3. API 권한 검증
```typescript
// API 라우트에서 권한 검증
const user = await getCurrentUser();
if (!user || !checkPermission(user, 'team_leader')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## 📊 모니터링 및 감사

### 1. 사용자 활동 로그
- 로그인/로그아웃 기록
- 권한 변경 이력
- 데이터 접근 기록

### 2. 감사 로그 테이블
```sql
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entity TEXT,                                      -- 대상 엔티티
    entity_id UUID,                                   -- 대상 ID
    action TEXT,                                      -- 수행한 작업
    diff JSONB,                                       -- 변경 내용
    ts TIMESTAMPTZ DEFAULT NOW()                      -- 발생 시간
);
```

## 🚀 향후 확장 계획

### 1. 세분화된 권한
- 기능별 세부 권한 설정
- 시간 기반 권한 제한
- 지역별 권한 관리

### 2. 역할 그룹
- 사용자 정의 역할 생성
- 권한 템플릿 시스템
- 계층적 권한 구조

### 3. API 권한
- API 키 기반 인증
- 서비스 간 권한 위임
- 마이크로서비스 권한 관리

---

**최종 업데이트**: 2025.01.01  
**문서 버전**: 1.0  
**작성자**: 스마트팜 개발팀

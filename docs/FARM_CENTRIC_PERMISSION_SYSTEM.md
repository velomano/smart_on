# 🏭 농장 중심 권한 시스템 설계

## 📋 개요

스마트팜 시스템에서 **농장이 기본 단위**가 되는 올바른 권한 체계를 설계합니다. 기존의 팀 중심 구조에서 농장 중심 구조로 전환합니다.

## 🏗️ 새로운 시스템 구조

### 계층 구조
```
테넌트 (Tenant)
├── 소속 (Company/Organization)
│   ├── 농장(팀) (Farm/Team) - 기본 운영 단위
│   │   ├── 농장장 (Team Leader) - 농장 전체 관리
│   │   └── 팀원 (Team Member) - 농장 운영 권한
│   └── 시스템 관리자 (System Admin) - 전체 시스템 관리
└── 최고관리자 (Super Admin) - 전체 시스템 최고 관리자
```

### 권한 레벨 (4단계)
1. **super_admin**: 최고관리자 (전체 시스템 최고 관리자)
2. **system_admin**: 시스템관리자 (농장 생성/삭제 권한)
3. **team_leader**: 농장장 (특정 농장의 모든 권한)
4. **team_member**: 팀원 (농장 운영 권한)

## 📊 새로운 테이블 구조

### 1. tenants (테넌트) - 유지
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. farms (농장) - 기본 단위
```sql
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,                    -- "1농장", "2농장", "3농장"
    location TEXT,                         -- 농장 위치
    description TEXT,                      -- 농장 설명
    farm_code TEXT UNIQUE,                 -- "FARM001", "FARM002", "FARM003"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. users (사용자) - 4단계 권한 체계
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,                   -- auth.users.id와 동일
    email TEXT UNIQUE,
    name TEXT,
    company TEXT,                          -- 소속 (회사명)
    phone TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    role TEXT CHECK (role IN ('super_admin', 'system_admin', 'team_leader', 'team_member')), -- 4단계 권한 체계
    team_name TEXT,                        -- 팀명 (농장명)
    team_id UUID REFERENCES teams(id),    -- 소속 팀 ID
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    preferred_team TEXT DEFAULT 'admin_assign',
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. teams (팀) - 농장 단위
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,                    -- 팀명 (농장명)
    description TEXT,                      -- 팀 설명
    team_code TEXT UNIQUE,                 -- 팀 코드 (FARM001, FARM002, FARM003)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. memberships (멤버십) - 사용자-팀 관계
```sql
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role TEXT NOT NULL CHECK (role IN ('owner', 'operator', 'viewer')),
    team_id UUID REFERENCES teams(id)     -- 소속 팀
);
```

## 🔄 기존 데이터 마이그레이션 계획

### 1단계: 기존 teams → farms 변환
```sql
-- teams 테이블의 데이터를 farms로 이관
INSERT INTO farms (id, tenant_id, name, farm_code, is_active)
SELECT 
    id,
    tenant_id,
    name,
    team_code,
    is_active
FROM teams
WHERE name LIKE '%농장%' OR team_code LIKE 'FARM%';
```

### 2단계: users 테이블 정리
```sql
-- users.role을 시스템 레벨로만 제한
UPDATE users 
SET role = CASE 
    WHEN role IN ('super_admin', 'system_admin') THEN role
    WHEN role = 'team_leader' THEN 'system_admin'  -- 임시로 system_admin으로
    WHEN role = 'team_member' THEN 'system_admin'  -- 임시로 system_admin으로
    ELSE 'system_admin'
END;

-- team_id, team_name 컬럼 제거
ALTER TABLE users DROP COLUMN IF EXISTS team_id;
ALTER TABLE users DROP COLUMN IF EXISTS team_name;
```

### 3단계: farm_memberships 생성
```sql
-- 기존 memberships 데이터를 farm_memberships로 이관
INSERT INTO farm_memberships (tenant_id, farm_id, user_id, role)
SELECT 
    u.tenant_id,
    m.team_id as farm_id,  -- team_id를 farm_id로 사용
    m.user_id,
    CASE 
        WHEN m.role = 'leader' THEN 'owner'
        WHEN m.role = 'member' THEN 'operator'
        ELSE 'operator'
    END as role
FROM memberships m
JOIN users u ON m.user_id = u.id
WHERE m.team_id IN (SELECT id FROM farms);
```

### 4단계: 기존 테이블 정리
```sql
-- 더 이상 사용하지 않는 테이블 제거
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
```

## 🎯 새로운 권한 매트릭스 (4단계)

| 기능 | super_admin | system_admin | team_leader | team_member |
|------|-------------|--------------|-------------|-------------|
| 시스템 관리 | ✅ | ✅ | ❌ | ❌ |
| 농장 생성/삭제 | ✅ | ✅ | ❌ | ❌ |
| 농장 설정 변경 | ✅ | ✅ | ✅ | ❌ |
| 농장 운영 | ✅ | ✅ | ✅ | ✅ |
| 데이터 조회 | ✅ | ✅ | ✅ | ✅ |
| 사용자 관리 | ✅ | ✅ | ❌ | ❌ |
| 팀원 배정 | ✅ | ✅ | ✅ (소속 팀원만) | ❌ |

## 🔧 API 변경사항

### 새로운 함수들
```typescript
// 농장별 사용자 조회
export const getFarmUsers = async (farmId: string) => {
  // farm_memberships 기반으로 농장 사용자 조회
};

// 사용자 농장 배정
export const assignUserToFarm = async (
  userId: string, 
  farmId: string, 
  role: 'owner' | 'operator' | 'viewer'
) => {
  // farm_memberships에 사용자 배정
};

// 사용자의 농장 목록 조회
export const getUserFarms = async (userId: string) => {
  // 사용자가 속한 모든 농장 조회
};
```

## 📝 테스트 계정 재정의

### 새로운 구조 (4단계 권한 체계)
```
최고관리자:
- sky3rain7@gmail.com (super_admin)

시스템관리자:
- test1@test.com (system_admin)

1농장(팀):
- test2@test.com (team_leader) - 농장장
- test3@test.com (team_member) - 팀원

2농장(팀):
- test4@test.com (team_leader) - 농장장
- test5@test.com (team_member) - 팀원

3농장(팀):
- test7@test.com (team_leader) - 농장장
- test6@test.com (team_member) - 팀원
```

## ✅ 마이그레이션 체크리스트

- [ ] 기존 teams → farms 데이터 이관
- [ ] users 테이블 정리 (role, team_id, team_name 제거)
- [ ] farm_memberships 테이블 생성 및 데이터 이관
- [ ] 기존 memberships, teams 테이블 제거
- [ ] RLS 정책 업데이트
- [ ] API 함수들 업데이트
- [ ] 프론트엔드 컴포넌트 업데이트
- [ ] 문서 업데이트

---

**설계 일시**: 2025.09.28  
**작성자**: 스마트팜 개발팀  
**버전**: 2.0 (농장 중심 구조)

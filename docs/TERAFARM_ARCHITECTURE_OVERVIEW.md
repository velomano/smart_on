# 🏗️ 테라팜 시스템 아키텍처 개요

## 📋 시스템 개요

테라팜(TeraFarm)은 서브도메인 기반 멀티 테넌트 스마트팜 관리 시스템입니다.

## 🌐 서브도메인 구조

```
acme.terafarm.com → 테넌트 A
demo.terafarm.com → 테넌트 B
xyz.terafarm.com  → 테넌트 C
```

### 테넌트 식별
- **서브도메인**: `acme.terafarm.com`
- **테넌트 ID**: `tenant-uuid-acme`
- **데이터 격리**: 완전 격리된 데이터베이스

## 🏢 시스템 구조

### 계층 구조
```
테넌트 (Tenant)
├── 시스템 관리자 (System Admin)
├── 농장 (Farm)
│   ├── 농장장 (Team Leader)
│   └── 팀원 (Team Member)
└── 베드 (Bed)
    ├── 센서 (Sensor)
    └── 액추에이터 (Actuator)
```

### 권한 체계 (4단계)
1. **super_admin**: 최고관리자 (전체 시스템 최고 관리자)
2. **system_admin**: 시스템관리자 (농장 생성/삭제 권한)
3. **team_leader**: 농장장 (특정 농장의 모든 권한)
4. **team_member**: 팀원 (농장 운영 권한)

## 📊 데이터베이스 구조

### 핵심 테이블

#### 1. tenants (테넌트)
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. farms (농장) - 기본 운영 단위
```sql
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    is_dashboard_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. users (사용자)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('super_admin', 'system_admin', 'team_leader', 'team_member')),
    tenant_id UUID REFERENCES tenants(id),
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. farm_memberships (농장 멤버십)
```sql
CREATE TABLE farm_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    farm_id UUID NOT NULL REFERENCES farms(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role TEXT CHECK (role IN ('owner', 'operator')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, farm_id, user_id)
);
```

#### 5. beds (베드)
```sql
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    name TEXT NOT NULL,
    crop TEXT,
    target_temp DECIMAL(5,2),
    target_humidity INTEGER,
    target_ec DECIMAL(5,2),
    target_ph DECIMAL(4,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔐 권한 매트릭스

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
| 팀원 정보 수정 | ✅ | ✅ | ✅ (소속 팀원만) | ❌ |
| **데이터 조회** | | | | |
| 센서 데이터 조회 | ✅ | ✅ | ✅ (자신 농장만) | ✅ (자신 농장만) |
| 알림 조회 | ✅ | ✅ | ✅ (자신 농장만) | ✅ (자신 농장만) |
| 생육 노트 조회/작성 | ✅ | ✅ | ✅ (자신 농장만) | ✅ (자신 농장만) |

## 🌐 페이지 구조

### 주요 페이지

#### 1. 대시보드 (`/`)
- **목적**: 전체 시스템 개요
- **접근**: 모든 권한
- **내용**: 농장 현황, 센서 데이터, 알림

#### 2. 농장관리 (`/farms`)
- **시스템 관리자**: 전체 농장 카드 목록
- **농장장/팀원**: 자동 리다이렉트
- **기능**: 농장 생성, 관리, 대시보드 노출 설정

#### 3. 농장 상세 (`/farms/[farmId]`)
- **목적**: 개별 농장 관리
- **기능**: 베드 관리, 센서 모니터링, 액추에이터 제어

#### 4. 사용자 관리 (`/admin`)
- **접근**: 시스템 관리자만
- **기능**: 사용자 승인, 역할 변경, 농장 배정

#### 5. 팀 관리 (`/team`)
- **접근**: 시스템 관리자, 농장장
- **기능**: 팀원 관리, 정보 수정

## 🔄 데이터 플로우

### 1. 농장 생성 플로우
```
시스템 관리자 → 농장 생성 → 베드 자동 생성 → 대시보드 노출
```

### 2. 사용자 승인 플로우
```
사용자 가입 → 시스템 관리자 승인 → 농장 배정 → 권한 부여
```

### 3. 데이터 수집 플로우
```
센서 → Universal Bridge → MQTT → 데이터베이스 → 대시보드
```

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **Real-time**: Supabase Realtime

### Infrastructure
- **Hosting**: Vercel
- **Domain**: Wildcard DNS
- **CDN**: Vercel Edge Network

## 🔧 개발 환경

### 로컬 개발
```bash
# 프로젝트 클론
git clone <repository>
cd smart_on

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 시작
npm run dev
```

### 환경 변수
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel
VERCEL_URL=
```

## 📈 확장성

### 수평적 확장
- **테넌트 추가**: 새로운 서브도메인 등록
- **농장 추가**: 무제한 농장 생성
- **베드 추가**: 농장별 무제한 베드

### 수직적 확장
- **센서 추가**: 베드별 다양한 센서
- **액추에이터 추가**: 자동화 제어 장치
- **알림 시스템**: 다중 채널 알림

## 🔒 보안

### 데이터 격리
- **테넌트별 격리**: RLS (Row Level Security)
- **권한 기반 접근**: RBAC (Role-Based Access Control)
- **API 보안**: JWT 토큰 기반 인증

### 보안 정책
- **HTTPS**: 모든 통신 암호화
- **CORS**: 도메인별 접근 제어
- **Rate Limiting**: API 호출 제한

## 📊 모니터링

### 시스템 모니터링
- **성능**: Vercel Analytics
- **에러**: Sentry (예정)
- **로그**: Supabase Logs

### 비즈니스 모니터링
- **사용자 활동**: 사용자별 로그인/활동 추적
- **농장 현황**: 농장별 운영 상태
- **센서 데이터**: 실시간 데이터 품질

## 🚀 배포

### 자동 배포
- **GitHub Actions**: CI/CD 파이프라인
- **Vercel**: 자동 배포 및 프리뷰
- **도메인**: 자동 SSL 인증서

### 배포 환경
- **Production**: `*.terafarm.com`
- **Staging**: `*.staging.terafarm.com`
- **Development**: `localhost:3000`

---

**문서 버전**: v1.0  
**최종 업데이트**: 2025-01-04  
**담당자**: 테라팜 개발팀

# 🏭 농장관리 시스템 V2 - 완전 개편

## 📋 개요

기존 `/beds` 기반 농장관리 시스템을 `/farms` 기반으로 완전히 재설계하여 더 직관적이고 효율적인 농장 관리 시스템을 구축했습니다.

## 🎯 주요 개선사항

### 1. **URL 구조 개선**
- **기존**: `/beds` (베드 중심)
- **신규**: `/farms` (농장 중심)
- **상세**: `/farms/[farmId]` (개별 농장 관리)

### 2. **사용자 경험 최적화**
- **시스템 관리자**: 전체 농장 카드 뷰 + 탭 네비게이션
- **농장장/팀원**: 자동 리다이렉트로 불필요한 단계 제거
- **베드 정보 통합**: 농장 카드에 베드 현황 직접 표시

### 3. **권한 체계 단순화**
- **농장 생성**: 시스템 관리자만 가능
- **농장 배정**: 시스템 관리자만 가능
- **농장 관리**: 권한별 접근 제어

## 🏗️ 시스템 구조

### 권한별 접근 제어

| 권한 | `/farms` 접근 | `/farms/[farmId]` 접근 | 농장 생성 | 농장 배정 |
|------|---------------|------------------------|-----------|-----------|
| **시스템 관리자** | 전체 농장 카드 목록 | 모든 농장 상세 | ✅ | ✅ |
| **농장장** | 자동 리다이렉트 | 자신의 농장만 | ❌ | ❌ |
| **팀원** | 자동 리다이렉트 | 자신의 농장만 | ❌ | ❌ |

### 사용자 플로우

#### 시스템 관리자
1. `/farms` 접속 → 전체 농장 카드 목록 표시
2. 농장 카드에서 베드 정보 확인
3. "농장 상세 보기" 또는 탭 클릭 → `/farms/[farmId]` 이동
4. 개별 농장 상세 관리

#### 농장장/팀원
1. `/farms` 접속 → 자동으로 `/farms/[farmId]` 리다이렉트
2. 자신의 농장 상세 관리 페이지 표시
3. 베드 관리, 센서 모니터링 등

## 📊 데이터베이스 구조

### 1. farms 테이블 (확장)
```sql
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    is_dashboard_visible BOOLEAN DEFAULT true,  -- 신규 추가
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. farm_memberships 테이블
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

### 3. beds 테이블 (유지)
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

## 🔄 대시보드 연동

### 연동 구조
```
농장관리 페이지 (/farms) ←→ 대시보드 (/)
     ↓                           ↓
농장 생성/관리              농장 정보 표시
     ↓                           ↓
is_dashboard_visible        권한별 필터링
```

### 대시보드 표시 조건
- **노출 조건**: `is_dashboard_visible = true`
- **권한별 필터링**:
  - 시스템 관리자: 모든 노출된 농장
  - 농장장/팀원: 자신의 농장만

## 🛠️ API 구조

### 1. `/api/farms` - 농장 목록 조회
```typescript
GET /api/farms
// 권한별 농장 목록 반환
// 시스템 관리자: 모든 농장
// 농장장/팀원: 자신의 농장만
```

### 2. 농장 조회 쿼리 (베드 정보 포함)
```sql
-- 시스템 관리자
SELECT *, beds(*) FROM farms ORDER BY created_at DESC;

-- 농장장/팀원
SELECT farm_id, farms(*, beds(*)) 
FROM farm_memberships 
WHERE user_id = ?;
```

## 🎨 UI/UX 개선

### 1. 농장 카드 디자인
- **베드 현황**: 최대 3개 베드 미리보기
- **베드 정보**: 베드명, 작물 정보
- **대시보드 토글**: 노출/숨김 설정
- **농장 관리**: 상세 페이지 이동

### 2. 탭 네비게이션 (시스템 관리자)
- **전체농장 보기**: 모든 농장 카드 표시
- **개별 농장**: 해당 농장 상세 페이지로 이동
- **동적 생성**: 생성된 농장 수만큼 탭 생성

### 3. 자동 리다이렉트 (농장장/팀원)
- **로딩 화면**: "농장 관리 페이지로 이동 중..."
- **즉시 이동**: 불필요한 중간 단계 제거

## 📁 파일 구조

### 새로 생성된 파일
```
apps/web-admin/
├── src/components/farm/
│   └── FarmManagementPage.tsx          # 새로운 농장관리 페이지
├── app/
│   ├── farms/
│   │   ├── page.tsx                    # 농장 목록 페이지
│   │   └── [farmId]/
│   │       └── page.tsx                # 농장 상세 페이지
│   └── api/farms/
│       └── route.ts                    # 농장 API
```

### 수정된 파일
```
apps/web-admin/
├── src/components/farm/
│   └── FarmAutoDashboard.tsx           # 농장 상세 관리 컴포넌트
├── src/components/
│   └── AppHeader.tsx                   # 네비게이션 링크 수정
├── app/
│   ├── page.tsx                        # 대시보드 연동
│   ├── admin/page.tsx                  # 동적 농장 배정
│   └── team/page.tsx                   # 동적 농장 배정
```

## 🔧 주요 기능

### 1. 농장 생성 (시스템 관리자)
- **권한**: 시스템 관리자만
- **기본값**: `is_dashboard_visible = true`
- **자동 생성**: 기본 베드 생성 옵션

### 2. 대시보드 노출 토글
- **권한**: 시스템 관리자, 농장장
- **즉시 반영**: 실시간 대시보드 업데이트
- **상태 표시**: 노출됨/숨김 시각적 표시

### 3. 동적 농장 배정
- **회원가입**: 농장관리 페이지의 농장 목록 연동
- **멤버관리**: 실시간 농장 선택 가능
- **권한 매핑**: farm_memberships.role → users.role

## 🚀 성능 최적화

### 1. 데이터 로딩
- **베드 정보 통합**: 단일 쿼리로 농장+베드 정보 조회
- **권한별 필터링**: 서버 사이드에서 권한 체크
- **캐싱**: Supabase 클라이언트 싱글톤 패턴

### 2. 사용자 경험
- **자동 리다이렉트**: 불필요한 클릭 제거
- **로딩 상태**: 명확한 로딩 인디케이터
- **에러 처리**: 친화적인 에러 메시지

## 📈 향후 개선 계획

### Phase 1: 기본 기능 완성 ✅
- [x] 농장관리 페이지 시스템 구축
- [x] 권한별 접근 제어
- [x] 대시보드 연동
- [x] 베드 정보 통합

### Phase 2: 고급 기능
- [ ] 농장별 통계 대시보드
- [ ] 베드별 상세 모니터링
- [ ] 알림 시스템 연동
- [ ] 모바일 최적화

### Phase 3: 확장 기능
- [ ] 농장 그룹 관리
- [ ] 템플릿 시스템
- [ ] 자동화 규칙
- [ ] 리포트 생성

## 🔍 테스트 계정

### 농장별 배정
- **1조**: test1@test.com (농장장), test2@test.com (팀원)
- **2조**: test3@test.com (농장장), test4@test.com (팀원)
- **3조**: test5@test.com (농장장), test6@test.com (팀원)

### 시스템 관리자
- sky3rain7@gmail.com (최고관리자)
- velomano@naver.com (시스템관리자)

## 📝 마이그레이션 가이드

### 기존 시스템에서 마이그레이션
1. **데이터 정리**: 기존 beds 관련 데이터 삭제
2. **테이블 확장**: farms 테이블에 `is_dashboard_visible` 컬럼 추가
3. **URL 변경**: `/beds` → `/farms`
4. **네비게이션 업데이트**: AppHeader 링크 수정

### 롤백 계획
- 기존 `/beds` 페이지 백업 유지
- 데이터베이스 스키마 버전 관리
- 점진적 마이그레이션 지원

---

**업데이트 일시**: 2025-01-04  
**버전**: v2.0 (농장관리 시스템 완전 개편)  
**담당자**: 스마트팜 개발팀

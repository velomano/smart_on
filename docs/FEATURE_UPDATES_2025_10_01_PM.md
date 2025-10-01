# 🚀 기능 업데이트 로그 - 2025.10.01 PM

## 📋 개요
멀티 테넌트 SaaS 시스템 구현 및 생육 단계 관리 기능 대폭 개선

---

## 🏢 멀티 테넌트 시스템 구현

### 배경
서브도메인 기반으로 각 고객사에게 독립적인 서비스를 제공하기 위한 멀티 테넌트 시스템 구축

### 구현 내용

#### 1. **서브도메인 기반 테넌트 식별**
```typescript
// apps/web-admin/middleware.ts
acme.smartfarm.app → tenant-uuid-acme
demo.smartfarm.app → tenant-uuid-demo
xyz.smartfarm.app → tenant-uuid-xyz
```

#### 2. **자동 테넌트 컨텍스트 주입**
- Next.js middleware에서 요청 헤더에 `x-tenant-id` 주입
- 모든 API와 페이지에서 자동으로 사용 가능
- Public 경로 예외 처리

#### 3. **데이터 격리 보장**
```
테넌트 A:
├── 농장 A1, A2, A3
├── 사용자 A-users
└── 센서 데이터 A-data

테넌트 B:
├── 농장 B1, B2
├── 사용자 B-users
└── 센서 데이터 B-data

완전 격리! 서로 접근 불가능
```

#### 4. **공용 서비스 구분**
**공유 데이터 (모든 테넌트):**
- 배양액 레시피 (nutrient_recipes)
- 작물 프로필 (crop_profiles)
- 농산물 시세 (market_prices)
- 영양 이온 정보

**격리 데이터 (테넌트별):**
- 농장/베드 구조
- 센서 데이터
- 제어 명령
- 사용자 정보

### 신규 파일
- `apps/web-admin/middleware.ts` - 서브도메인 처리
- `apps/web-admin/src/lib/tenant.ts` - 테넌트 유틸리티
- `apps/web-admin/src/lib/tenantContext.ts` - React Context
- `apps/web-admin/docs/MULTI_TENANT_SETUP.md` - 설정 가이드

### 변경 파일
- `app/admin/page.tsx` - 동적 tenant_id
- `app/team/page.tsx` - 동적 tenant_id
- `src/lib/auth.ts` - 동적 tenant_id
- `app/api/farm-memberships/route.ts` - 동적 tenant_id

---

## 🌱 생육 단계 관리 시스템

### 배경
작물의 생육 단계를 시각적으로 관리하고, 작물마다 다른 생육 패턴을 설정할 수 있는 기능 필요

### 1. **정식/수확 일자 입력**
- 정식 시작일자 입력
- 수확 예정일자 입력
- 총 재배 기간 자동 계산

### 2. **생육 단계 프로그레스 바**
```
베드 시각화 SVG 내부에 표시:

[━━발아━━][━━━생식생장━━━][━━━━영양생장━━━━][수확]
  10/1      10/4         10/11        10/20
  
현재: 생식생장 (15/90일)
```

#### 파종 (4단계):
- 🟨 발아 (기본 15%)
- 🔵 생식생장 (기본 30%)
- 🟢 영양생장 (기본 40%)
- 🔴 수확시기 (기본 15%)

#### 육묘 (3단계):
- 🔵 생식생장 (기본 40%)
- 🟢 영양생장 (기본 40%)
- 🔴 수확시기 (기본 20%)

### 3. **사용자 맞춤형 단계 설정**

슬라이더로 각 단계의 경계를 직접 조절:

```
작물 정보 입력 모달:

🌱 생육 단계 기간 설정 (총 90일)

🟨 발아 기간 종료
◀━━━━●━━━━▶  20일 (22%)

🔵 생식생장 기간 종료  
◀━━━━●━━━━▶  45일 (50%)

🟢 영양생장 기간 종료
◀━━━━●━━━━▶  75일 (83%)

[미리보기 게이지 실시간 표시]
```

### 4. **동적 진행률 계산**
- 매일 자동으로 경과 일수 증가
- 현재 단계 자동 전환
- 수확 시기 알림
- 단계별 날짜 표시

### 구현 파일
- `src/lib/growthStageCalculator.ts` - 단계 계산 로직
- `src/components/BedTierShelfVisualization.tsx` - SVG 프로그레스 바
- `app/beds/page.tsx` - 슬라이더 UI
- `app/api/bed-crop-data/route.ts` - DB 저장

### 데이터베이스
```sql
ALTER TABLE bed_crop_data 
ADD COLUMN harvest_date DATE,
ADD COLUMN stage_boundaries JSONB;
```

---

## 🔧 기타 개선사항

### 관리자 승인 시스템
- 시스템 관리자는 조(농장) 배정 없이 승인 가능
- 안내 메시지 추가
- 조건부 필드 표시

### UI/UX 개선
- 작물 정보 모달 스크롤 개선 (max-h-90vh)
- 모달 헤더/푸터 고정, 컨텐츠 스크롤
- 배경 클릭 시 모달 닫기

### 용어 개선
- "생육 시작일자" → "정식 시작일자"

---

## 🐛 버그 수정

### TypeScript 타입 에러
- Next.js 15 params Promise 타입 대응
- RecipeUpdate 인터페이스 필드 추가
- Controlled input 경고 수정

### SVG 렌더링 에러
- `rx="10 0 0 10"` 속성 제거 (SVG 미지원)

### API 인증 문제
- Vercel 도메인을 보안 허용 목록에 추가
- `web-admin-snowy.vercel.app` 등

### GitHub Actions
- 불필요한 워크플로우 정리
- `nutrient-collection-detailed.yml`만 유지

---

## 📊 성능 지표

### 빌드 정보
- Next.js 15.5.3 (Turbopack)
- 빌드 시간: ~50초
- 총 페이지: 58개
- `/beds` 페이지: 23.3 kB (생육 단계 기능 포함)

### 배포 정보
- Production: web-admin-snowy.vercel.app
- Region: Seoul (icn1)
- 빌드 캐시: 183.29 MB

---

## 🎯 다음 단계

### Phase 1: 프로덕션 준비
- [ ] 도메인 구매 및 연결
- [ ] Vercel Wildcard 도메인 설정
- [ ] 환경 변수 정리
- [ ] 테넌트 관리 UI

### Phase 2: 고급 기능
- [ ] 테넌트별 브랜딩
- [ ] 사용량 추적 시스템
- [ ] 테넌트 관리자 대시보드
- [ ] 커스텀 도메인 지원

### Phase 3: 모니터링
- [ ] 테넌트별 사용 통계
- [ ] 성능 모니터링
- [ ] 에러 추적
- [ ] 감사 로그 UI

---

## 📝 기술 스택

### 새로 추가된 기술
- **Next.js Middleware**: 서브도메인 라우팅
- **멀티 테넌트 아키텍처**: SaaS 구조
- **동적 프로그레스 바**: SVG 생육 단계 시각화
- **React 슬라이더**: 사용자 맞춤 설정

### 데이터베이스
- **RLS 정책**: 100% 테넌트 격리
- **JSONB**: 유연한 설정 저장
- **외래키**: 완벽한 데이터 무결성

---

**업데이트 일시**: 2025.10.01 PM  
**버전**: v2.0 (멀티 테넌트 + 생육 관리)  
**담당자**: 스마트팜 개발팀


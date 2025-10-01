# 🏢 멀티 테넌트 시스템 설정 가이드

## 📋 개요

본 문서는 스마트팜 시스템의 멀티 테넌트 SaaS 전환 가이드입니다.

## 🎯 목표

서브도메인 기반으로 각 고객사(테넌트)에게 독립적인 서비스를 제공합니다.

```
smartfarm.app (메인)
├── acme.smartfarm.app → ACME 회사
├── demo.smartfarm.app → 데모 고객
└── xyz.smartfarm.app → XYZ 농장
```

## 🏗️ 시스템 구조

### 1. 테넌트 식별 플로우

```
사용자 접속: acme.smartfarm.app
    ↓
Next.js middleware.ts
    ↓
서브도메인 추출: 'acme'
    ↓
테넌트 ID 조회: 'tenant-uuid-acme'
    ↓
요청 헤더에 주입: x-tenant-id
    ↓
모든 API/페이지에서 사용 가능
```

### 2. 데이터 격리

```
테넌트 A의 요청
    ↓
Supabase RLS 정책 자동 적용
    ↓
tenant_id로 필터링
    ↓
테넌트 A 데이터만 조회/수정
```

## 📁 구현된 파일

### 1. `apps/web-admin/middleware.ts`
- 서브도메인에서 테넌트 ID 추출
- 요청 헤더에 `x-tenant-id` 주입
- Public 경로 예외 처리

### 2. `apps/web-admin/src/lib/tenant.ts`
- 테넌트 매핑 함수
- 클라이언트/서버 테넌트 ID 조회
- 테넌트 설정 관리

### 3. `apps/web-admin/src/lib/tenantContext.ts`
- React Context로 테넌트 정보 공유
- `useTenant()` 훅 제공

## 🔧 테넌트 추가 방법

### 1. 데이터베이스에 테넌트 추가

```sql
INSERT INTO tenants (id, name, description) VALUES
('tenant-uuid-acme', 'ACME Corporation', 'ACME 스마트팜');
```

### 2. middleware.ts에 매핑 추가

```typescript
const TENANT_MAPPING: Record<string, string> = {
  'acme': 'tenant-uuid-acme',  // ← 추가
  // ...
};
```

### 3. Vercel 도메인 설정

1. Vercel Dashboard → 프로젝트 → Domains
2. `acme.smartfarm.app` 추가
3. DNS 설정 (자동 또는 수동)

### 4. 보안 설정에 도메인 추가

```typescript
// src/lib/security.ts
const allowedOrigins = [
  'https://acme.smartfarm.app',  // ← 추가
  // ...
];
```

## 🌍 공용 서비스 vs 테넌트별 데이터

### 공용 (모든 테넌트 공유) ✅

```
✅ nutrient_recipes (배양액 레시피)
✅ nutrient_sources (데이터 소스)  
✅ crop_profiles (작물 프로필)
✅ nutrient_ions (영양 이온)
✅ salts (염류 정보)
✅ 농산물 시세 (market_prices)
```

**RLS 정책**: `FOR SELECT TO authenticated USING (true)`
→ 로그인만 하면 모든 테넌트가 조회 가능

### 테넌트별 격리 (완전 격리) 🔒

```
🔒 farms (농장)
🔒 devices (장치)
🔒 sensors (센서)
🔒 sensor_readings (센서 데이터)
🔒 commands (제어 명령)
🔒 alerts (알림)
🔒 rules (자동화 규칙)
🔒 bed_crop_data (베드 작물 정보)
🔒 bed_notes (베드 노트)
🔒 recipes (사용자 생성 레시피)
```

**RLS 정책**: `tenant_id = current_user_tenant_id`
→ 자기 테넌트 데이터만 조회 가능

## 🚀 Vercel 멀티 도메인 설정

### 1. 루트 도메인 구매 및 설정
```
도메인: smartfarm.app
DNS Provider: Cloudflare/GoDaddy 등
```

### 2. Vercel 도메인 추가
```
1. Vercel Dashboard → web-admin → Settings → Domains
2. Add Domain: smartfarm.app
3. Add Domain: *.smartfarm.app (Wildcard)
```

### 3. DNS 설정
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME  
Name: *
Value: cname.vercel-dns.com
```

### 4. SSL 인증서
- Vercel이 자동으로 Let's Encrypt SSL 발급
- Wildcard 도메인도 자동 지원

## 📊 테넌트별 사용량 추적 (선택)

```typescript
// 추후 구현 시
interface TenantUsage {
  tenantId: string;
  farms: number;
  devices: number;
  sensorDataPoints: number;
  apiCalls: number;
  storage: number; // MB
}
```

## ✅ 체크리스트

### Phase 1: 기본 구현 (완료) ✅
- [x] Next.js middleware 생성
- [x] 테넌트 매핑 헬퍼 함수
- [x] 하드코딩된 tenant_id 제거
- [ ] 인증 시스템 tenant context 주입
- [ ] API 라우트 tenant 검증

### Phase 2: 프로덕션 준비
- [ ] 환경 변수 설정
- [ ] Vercel 도메인 설정
- [ ] DNS 설정
- [ ] 테넌트 관리 UI

### Phase 3: 고급 기능
- [ ] 테넌트별 브랜딩
- [ ] 사용량 추적
- [ ] 커스텀 도메인
- [ ] 테넌트별 이메일

## 🎓 사용 예시

### 클라이언트 컴포넌트

```typescript
'use client';
import { useTenant } from '@/lib/tenantContext';

export default function MyComponent() {
  const { tenantId, subdomain } = useTenant();
  
  // tenant_id는 자동으로 현재 서브도메인에서 가져옴
  console.log('현재 테넌트:', tenantId);
}
```

### API 라우트

```typescript
import { getTenantIdFromRequest } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  const tenantId = getTenantIdFromRequest(request);
  
  // 이 tenant_id로 DB 쿼리
  const { data } = await supabase
    .from('farms')
    .select('*')
    .eq('tenant_id', tenantId);  // 자동 격리
}
```

## 🔒 보안

### RLS 정책이 모든 것을 보호
- 미들웨어나 코드를 우회해도 DB 레벨에서 차단
- Supabase가 자동으로 tenant_id 검증
- SQL Injection 불가능

### 테넌트 간 데이터 누수 불가능
- 모든 조회에 tenant_id 필터 자동 적용
- RLS 정책 위반 시 403 에러
- 감사 로그 자동 기록

---

**작성일**: 2025.10.01  
**작성자**: 스마트팜 개발팀  
**버전**: 1.0 (멀티 테넌트 시스템)


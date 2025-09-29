# 🚀 기능 업데이트 문서 - 2025.09.28

## 📋 개요

2025년 1월 28일에 완료된 스마트팜 시스템의 주요 기능 개선 및 버그 수정 사항을 정리한 문서입니다.

## ✅ 완료된 주요 기능

### 1. 🔐 사용자 인증 시스템 완전 구축

#### 구현된 기능
- **Supabase 기반 인증**: 완전한 로그인/회원가입 시스템
- **역할 기반 접근 제어**: system_admin, team_leader, team_member
- **관리자 승인 시스템**: 회원가입 후 관리자 승인 필요
- **세션 관리**: 자동 로그인 상태 유지

#### 관련 파일
- `apps/web-admin/src/lib/auth.ts` - 인증 로직
- `apps/web-admin/src/app/login/page.tsx` - 로그인 UI
- `docs/USER_AUTH_SYSTEM.md` - 인증 시스템 문서

### 2. 👁️ 비밀번호 보기/숨기기 기능

#### 구현된 기능
- **직관적인 UI**: 눈 모양 아이콘으로 비밀번호 가시성 제어
- **상태별 아이콘**: 
  - 숨김 상태: 👁️ (눈 모양)
  - 보임 상태: 👁️‍🗨️ (눈에 줄 그어진 모양)
- **반응형 디자인**: 호버 효과 및 부드러운 애니메이션
- **두 페이지 적용**: 로그인 페이지 + 비밀번호 재설정 페이지

#### 관련 파일
- `apps/web-admin/src/app/login/page.tsx` - 로그인 페이지
- `apps/web-admin/src/app/reset-password/page.tsx` - 비밀번호 재설정 페이지

### 3. 🇰🇷 에러 메시지 한글화

#### 구현된 기능
- **Supabase 에러 번역**: 영어 에러 메시지를 한국어로 변환
- **주요 에러 메시지**:
  - `Invalid login credentials` → `이메일 또는 비밀번호가 올바르지 않습니다.`
  - `Email not confirmed` → `이메일 인증이 완료되지 않았습니다.`
  - `Too many requests` → `너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.`
- **스마트 매칭**: 정확한 매칭 우선, 부분 매칭으로 폴백

#### 관련 파일
- `apps/web-admin/src/lib/auth.ts` - `translateAuthError` 함수

### 4. 🔑 비밀번호 재설정 기능

#### 구현된 기능
- **이메일 기반 재설정**: Supabase Auth의 resetPasswordForEmail 활용
- **안전한 토큰 처리**: URL 파라미터와 fragment 모두 지원
- **사용자 친화적 UI**: 깔끔한 재설정 페이지 디자인
- **검증 로직**: 비밀번호 확인 및 최소 길이 검증

#### 관련 파일
- `apps/web-admin/src/app/reset-password/page.tsx` - 재설정 페이지
- `apps/web-admin/src/app/login/page.tsx` - 비밀번호 찾기 모달

### 5. 🛡️ RLS 정책 최적화

#### 개선된 사항
- **중복 정책 제거**: `allow_user_selects`, `allow_user_updates` 등 보안 취약 정책 삭제
- **조건부 정책 생성**: 테이블 존재 여부 확인 후 정책 생성
- **보안 강화**: 사용자별 접근 제어 강화
- **안정성 향상**: 정책 충돌 방지

#### 관련 파일
- `docs/03_RLS_POLICIES.sql` - RLS 정책 스크립트

### 6. 🧪 Mock 인증 시스템

#### 구현된 기능
- **개발 환경 지원**: Supabase 연결 불가 시 Mock 인증 사용
- **완전한 시뮬레이션**: 실제 인증 플로우와 동일한 인터페이스
- **환경 변수 토글**: `NEXT_PUBLIC_USE_MOCK_AUTH`로 간편 전환
- **테스트 계정**: 개발용 사전 정의된 계정들

#### 관련 파일
- `apps/web-admin/src/lib/mockAuth.ts` - Mock 인증 로직

### 7. ⚙️ 환경 변수 설정

#### 완료된 설정
- **Supabase 연결**: URL과 API 키 설정 완료
- **환경별 분리**: 개발/프로덕션 환경 변수 분리
- **보안 고려**: 민감한 정보의 적절한 처리

#### 관련 파일
- `apps/web-admin/.env.local` - 환경 변수 설정
- `docs/01_ENV.md` - 환경 변수 문서

### 8. 🐛 UserDashboard 안정성 향상

#### 수정된 오류
- **Runtime TypeError**: `Cannot read properties of undefined (reading 'filter')` 해결
- **안전한 배열 처리**: 모든 배열에 optional chaining 적용
- **기본값 설정**: undefined 시 빈 배열로 폴백

#### 관련 파일
- `apps/web-admin/src/components/UserDashboard.tsx` - 대시보드 컴포넌트

### 9. 🔐 Supabase 완전 통합 (2025.09.28 추가)

#### 주요 개선사항
- **Mock 시스템 완전 제거**: localStorage 및 mockAuth 의존성 제거
- **RLS 정책 수정**: memberships 테이블 순환 참조 문제 해결
- **실시간 데이터 연동**: 모든 데이터를 Supabase에서 직접 조회
- **팀 기반 접근 제어**: 사용자별 팀 정보 기반 데이터 필터링

#### 해결된 문제들
- **team_id null 문제**: getCurrentUser()에서 membership 데이터 조회 실패 해결
- **팀원 보기 메뉴**: canViewTeamMembers 조건이 true인데 메뉴가 안 보이는 문제 해결
- **농장 필터링**: 3농장 팀원이 1농장을 보던 문제 해결
- **mockSensorData 에러**: 농장관리 페이지에서 undefined 에러 해결

#### 관련 파일
- `apps/web-admin/src/lib/auth.ts` - getCurrentUser, getTeams 함수 수정
- `apps/web-admin/src/components/AppHeader.tsx` - 메뉴 표시 로직 수정
- `apps/web-admin/src/app/beds/page.tsx` - mockSensorData 제거
- `apps/web-admin/src/app/team/page.tsx` - 페이지 제목 및 설명 수정

### 10. 📱 팀 정보 페이지 개선

#### 개선사항
- **제목 변경**: "팀 관리" → "팀 정보"
- **설명 수정**: "팀원들의 정보를 확인하고 관리하세요" → "팀의 정보를 볼 수 있습니다"
- **권한 기반 접근**: 팀원은 조회만, 농장장은 관리 가능

#### 관련 파일
- `apps/web-admin/src/app/team/page.tsx` - UI 텍스트 수정

### 11. 🎨 사용자 인터페이스 개선 (2025.09.29 추가)

#### 메뉴 구조 최적화
- **사용자 관리 메뉴 상단 이동**: 모든 계정이 상단에서 "사용자 관리" 접근 가능
- **시스템관리자 메뉴 확장**: 상단에 "관리자 페이지" + "사용자 관리" + "농장 관리" (3개)
- **일반 사용자 메뉴**: 상단에 "사용자 관리" + "농장 관리" (2개)
- **햄버거 메뉴 통일**: 모든 계정이 동일한 메뉴 구조 유지

#### 색상 및 가시성 개선
- **햄버거 메뉴 색상 중복 해결**: 농장관리(초록) vs 양액계산(파란)으로 구분
- **사용자 편집 모달 텍스트 개선**: 활성/비활성 텍스트 가시성 향상
- **폰트 굵기 조정**: `font-medium` → `font-semibold`로 가독성 향상

#### 프로젝트 구조 정리
- **중복 디렉토리 제거**: `src/app/` 디렉토리 삭제로 혼선 해결
- **Next.js 표준 구조**: `app/` 디렉토리만 사용하여 App Router 통일
- **컴포넌트 구조 유지**: `src/components/`와 `src/lib/` 보존

#### 관련 파일
- `apps/web-admin/src/components/AppHeader.tsx` - 메뉴 구조 개선
- `apps/web-admin/app/admin/page.tsx` - 사용자 편집 모달 개선
- `apps/web-admin/src/app/admin/page.tsx` - 사용자 편집 모달 개선

### 12. 🔧 GitHub Actions 워크플로우 개선 (2025.09.29 추가)

#### YAML 문법 오류 해결
- **secrets 컨텍스트 정리**: `env` 변수로 통일하여 문법 오류 해결
- **조건문 수정**: 올바른 GitHub Actions 표현식 사용
- **환경변수 기본값**: 안정적인 실행을 위한 기본값 제공
- **Node.js 20 최적화**: 내장 fetch API 사용으로 의존성 최적화

#### 배양액 레시피 수집 시스템
- **중복 제거 로직**: 완전히 동일한 레시피 자동 제거
- **부분 저장 지원**: 중복 제외하고 나머지 레시피 저장
- **데이터베이스 정리**: 기존 중복 데이터 10건 제거 완료

#### 관련 파일
- `.github/workflows/nutrient-collection.yml` - 워크플로우 수정
- `apps/worker/src/server.ts` - 중복 체크 로직 추가

## 🔧 기술적 개선사항

### 1. 타입 안전성 향상
- **DatabaseUser 인터페이스**: Supabase 테이블 스키마와 정확한 타입 매칭
- **타입 어서션**: Supabase 클라이언트의 타입 이슈 해결
- **Optional Chaining**: 안전한 객체 접근

### 2. 에러 처리 강화
- **한글 에러 메시지**: 사용자 친화적인 오류 메시지
- **폴백 메커니즘**: Mock 인증으로의 안전한 전환
- **로깅 개선**: 디버깅을 위한 상세한 로그

### 3. 사용자 경험 개선
- **직관적인 UI**: 비밀번호 보기/숨기기 아이콘
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **로딩 상태**: 사용자에게 명확한 피드백 제공

## 📊 성능 최적화

### 1. 렌더링 최적화
- **조건부 렌더링**: 불필요한 컴포넌트 렌더링 방지
- **배열 처리**: undefined 배열에 대한 안전한 처리
- **메모이제이션**: 반복 계산 최적화

### 2. 네트워크 최적화
- **싱글톤 클라이언트**: Supabase 클라이언트 재사용
- **에러 재시도**: 네트워크 오류 시 자동 재시도
- **캐싱 전략**: 사용자 정보 캐싱

## 🧪 테스트 계정

### 시스템 관리자
- `test1@test.com` / `123456` - 테스트 관리자
- `sky3rain7@gmail.com` - 서천우 (Tera Hub 관리자)

### 팀 리더
- `test2@test.com` / `123456` - 1농장 농장장
- `test4@test.com` / `123456` - 2농장 농장장
- `test6@test.com` / `123456` - 3농장 농장장

### 팀 멤버
- `test3@test.com` / `123456` - 1농장 팀원
- `test5@test.com` / `123456` - 2농장 팀원
- `test7@test.com` / `123456` - 3농장 팀원

## 🔄 향후 계획

### Phase 2: MQTT 연동 (예정)
- 라즈베리 파이와 MQTT 브로커 연동
- 실시간 센서 데이터 수집
- 원격 제어 기능

### Phase 3: 하드웨어 연동 (예정)
- 아두이노 릴레이 모듈 제어
- 물리적 액추에이터 제어
- 완전한 IoT 시스템 구축

## 📝 변경 사항 요약

### 추가된 파일
- `apps/web-admin/src/app/reset-password/page.tsx`
- `apps/web-admin/src/lib/mockAuth.ts`
- `docs/USER_AUTH_SYSTEM.md`
- `docs/FEATURE_UPDATES_2025_01_28.md`

### 수정된 파일
- `apps/web-admin/src/lib/auth.ts`
- `apps/web-admin/src/app/login/page.tsx`
- `apps/web-admin/src/components/UserDashboard.tsx`
- `apps/web-admin/src/components/AppHeader.tsx`
- `apps/web-admin/src/app/team/page.tsx`
- `apps/web-admin/src/app/beds/page.tsx`
- `apps/web-admin/app/admin/page.tsx` - 사용자 편집 모달 개선
- `apps/web-admin/src/app/admin/page.tsx` - 사용자 편집 모달 개선
- `.github/workflows/nutrient-collection.yml` - 워크플로우 수정
- `apps/worker/src/server.ts` - 중복 체크 로직 추가
- `docs/00_README.md`
- `docs/01_ENV.md`
- `docs/02_DB_SCHEMA.sql`
- `docs/03_RLS_POLICIES.sql`

### 삭제된 정책
- `allow_user_selects` (보안 취약점)
- `allow_user_updates` (보안 취약점)
- `allow_user_inserts` (중복 정책)

### 삭제된 파일
- `apps/web-admin/src/lib/mockAuth.ts` (Supabase 전용으로 전환)
- `apps/web-admin/src/lib/migrateUsers.ts` (불필요한 파일)
- `init_supabase_users.sql` (일회성 스크립트)
- `apps/web-admin/src/app/` (중복 디렉토리 제거)

## 🎯 성과 지표

- **버그 수정**: 7개 주요 런타임 오류 해결
- **기능 추가**: 12개 새로운 기능 구현
- **보안 강화**: RLS 정책 최적화로 보안 수준 향상
- **사용자 경험**: 한글화 및 직관적 UI로 UX 개선
- **시스템 통합**: Supabase 완전 통합으로 데이터 일관성 확보
- **권한 관리**: 팀 기반 접근 제어로 보안 강화
- **UI/UX 개선**: 메뉴 구조 최적화 및 가시성 향상
- **프로젝트 구조**: 중복 디렉토리 제거로 개발 효율성 향상
- **CI/CD 개선**: GitHub Actions 워크플로우 안정성 향상

---

**문서 작성일**: 2025.09.29 (최종 업데이트)  
**작성자**: 스마트팜 개발팀  
**버전**: v1.2

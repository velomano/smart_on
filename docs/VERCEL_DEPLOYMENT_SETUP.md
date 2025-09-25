# Vercel 배포 설정 가이드

## 1. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 이름: `smart-farm-web-admin`
5. Framework Preset: `Next.js`
6. Root Directory: `apps/web-admin`

## 2. GitHub Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 secrets를 추가:

### 필수 Secrets:
- `VERCEL_TOKEN`: Vercel 계정의 API 토큰
- `VERCEL_ORG_ID`: Vercel 조직 ID
- `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID
- `VERCEL_SCOPE`: Vercel 스코프 (보통 사용자명)

### Vercel 정보 찾는 방법:

#### VERCEL_TOKEN:
1. Vercel Dashboard > Settings > Tokens
2. "Create Token" 클릭
3. 토큰 이름: `github-actions`
4. 생성된 토큰을 복사

#### VERCEL_ORG_ID & VERCEL_PROJECT_ID:
1. Vercel 프로젝트 페이지에서
2. Settings > General 탭
3. "Project ID" 섹션에서 확인

#### VERCEL_SCOPE:
1. Vercel Dashboard > Settings > General
2. "Username" 또는 조직명 사용

## 3. 환경 변수 설정

Vercel 프로젝트에서 Environment Variables 설정:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키

## 4. 배포 확인

1. GitHub에 코드 푸시
2. Actions 탭에서 워크플로우 실행 확인
3. Vercel에서 배포 상태 확인
4. 배포된 URL로 접속 테스트

## 5. 현재 배포 상태

### ✅ 배포 완료
- **URL**: https://web-admin-fsi2tolta-smart-ons-projects.vercel.app
- **상태**: 정상 작동 중
- **Mock 인증**: 활성화 (개발/테스트용)
- **최근 업데이트**: 2025.01.15

### 🧪 테스트 계정
- **시스템 관리자**: test1@test.com / password
- **1농장장**: test2@test.com / password
- **2농장장**: test4@test.com / password
- **3농장장**: test6@test.com / password
- **팀원들**: test3@test.com, test5@test.com, test7@test.com / password

## 6. 도메인 설정 (선택사항)

1. Vercel 프로젝트 > Settings > Domains
2. 커스텀 도메인 추가
3. DNS 설정 업데이트

## 트러블슈팅

### 빌드 실패 시:
- `pnpm-lock.yaml` 파일이 최신인지 확인
- 의존성 버전 충돌 확인
- Node.js 버전 호환성 확인

### 배포 실패 시:
- GitHub Secrets가 올바르게 설정되었는지 확인
- Vercel 프로젝트 설정 확인
- 워크플로우 로그 확인

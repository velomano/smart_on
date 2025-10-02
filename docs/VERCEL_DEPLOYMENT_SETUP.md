# 🚀 Vercel 배포 설정 가이드

## 📋 개요
이 문서는 Smart Farm 시스템의 Vercel 배포 설정을 안내합니다.

## 🔧 필요한 설정

### 1. Vercel 프로젝트 설정

#### Web Admin 프로젝트
- **프로젝트 이름**: `smart-farm-web-admin`
- **Framework**: Next.js
- **Root Directory**: `apps/web-admin`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

#### Universal Bridge 프로젝트
- **프로젝트 이름**: `smart-farm-universal-bridge`
- **Framework**: Node.js
- **Root Directory**: `apps/universal-bridge`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2. 환경변수 설정

#### Web Admin 환경변수
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxOTgsImV4cCI6MjA3NDExODE5OH0.oo-iIviVJ2oaWZldtmkYo1sWgHbxxIIkFUrBrU8rQqY

# Supabase Service Keys (Server-side only)
SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxOTgsImV4cCI6MjA3NDExODE5OH0.oo-iIviVJ2oaWZldtmkYo1sWgHbxxIIkFUrBrU8rQqY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4

# Telegram Notification Settings
TELEGRAM_BOT_TOKEN=8405537801:AAGm3ycoklEtpNcAyBShI1_nKvOEFGBf_uQ
TELEGRAM_CHAT_ID=6827239951

# Universal Bridge Configuration
NEXT_PUBLIC_BRIDGE_URL=https://smart-farm-universal-bridge.vercel.app

# Application Settings
NODE_ENV=production
NEXTAUTH_SECRET=your-production-secret-key-here
NEXTAUTH_URL=https://smart-farm-web-admin.vercel.app
```

#### Universal Bridge 환경변수
```bash
# Supabase Configuration
SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4

# Security
BRIDGE_ENCRYPTION_KEY=smartfarm-universal-bridge-key-32-production

# Ports
BRIDGE_HTTP_PORT=8080
BRIDGE_WS_PORT=8081

# Server URLs
BRIDGE_SERVER_URL=https://smart-farm-universal-bridge.vercel.app
WEB_ADMIN_URL=https://smart-farm-web-admin.vercel.app

# Environment
NODE_ENV=production
LOG_LEVEL=info
SIGNATURE_VERIFY_OFF=false
```

### 3. GitHub Secrets 설정

다음 시크릿을 GitHub 저장소에 추가해야 합니다:

#### Vercel 관련
- `VERCEL_TOKEN`: Vercel API 토큰
- `VERCEL_ORG_ID`: Vercel 조직 ID
- `VERCEL_PROJECT_ID`: Web Admin 프로젝트 ID
- `VERCEL_PROJECT_ID_BRIDGE`: Universal Bridge 프로젝트 ID

#### 환경변수
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NEXT_PUBLIC_BRIDGE_URL`
- `BRIDGE_ENCRYPTION_KEY`
- `BRIDGE_HTTP_PORT`
- `BRIDGE_WS_PORT`
- `BRIDGE_SERVER_URL`
- `WEB_ADMIN_URL`

## 🚀 배포 과정

### 1. Vercel 대시보드에서 설정
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "New Project" 클릭
3. GitHub 저장소 연결: `velomano/smart_on`
4. 프로젝트 설정:
   - **Project Name**: `smart-farm-web-admin`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web-admin`
5. 환경변수 추가 (위의 환경변수 목록 참조)
6. "Deploy" 클릭

### 2. Universal Bridge 프로젝트 설정
1. 동일한 과정으로 새 프로젝트 생성
2. 프로젝트 설정:
   - **Project Name**: `smart-farm-universal-bridge`
   - **Framework Preset**: Node.js
   - **Root Directory**: `apps/universal-bridge`
3. 환경변수 추가
4. "Deploy" 클릭

### 3. 도메인 설정
1. 각 프로젝트의 "Settings" → "Domains"에서 커스텀 도메인 설정
2. DNS 설정 업데이트

## 🔍 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# 로컬에서 테스트
cd apps/web-admin
npm run build
```

#### 2. 환경변수 누락
- Vercel 대시보드에서 환경변수 확인
- GitHub Secrets 확인

#### 3. CORS 문제
- API 엔드포인트에서 CORS 설정 확인
- 도메인 허용 목록 업데이트

#### 4. 데이터베이스 연결 문제
- Supabase 연결 정보 확인
- RLS 정책 확인

## 📊 모니터링

### 1. Vercel Analytics
- 각 프로젝트의 "Analytics" 탭에서 성능 모니터링

### 2. 로그 확인
- "Functions" 탭에서 서버리스 함수 로그 확인
- 에러 및 성능 메트릭 모니터링

### 3. 알림 설정
- Vercel에서 배포 실패 알림 설정
- GitHub Actions에서 워크플로우 실패 알림 설정

## 🔄 자동 배포

GitHub Actions 워크플로우가 설정되어 있어서:
- `main` 브랜치에 푸시할 때마다 자동 배포
- Pull Request 생성 시 프리뷰 배포
- 배포 상태는 GitHub Actions 탭에서 확인 가능

## 📞 지원

문제가 발생하면:
1. Vercel 대시보드의 로그 확인
2. GitHub Actions 로그 확인
3. 로컬에서 동일한 환경으로 테스트
4. 필요한 경우 롤백 실행
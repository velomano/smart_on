# 🔧 Vercel 프로젝트 재설정 가이드

## 🚨 현재 상황
기존 Vercel 프로젝트 설정이 꼬여서 새로 설정이 필요합니다.

## 🛠️ 해결 단계

### Step 1: 기존 프로젝트 정리

#### 1.1 Vercel 대시보드에서 기존 프로젝트 삭제
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 기존 프로젝트들 찾기:
   - `smart-farm-web-admin` (또는 유사한 이름)
   - `smart-farm-universal-bridge` (또는 유사한 이름)
3. 각 프로젝트의 Settings → General → Delete Project

#### 1.2 로컬 설정 정리 (완료됨)
- ✅ 루트 `vercel.json` 제거
- ✅ 기존 설정 백업 완료
- ✅ 새로운 설정 파일 생성 완료

### Step 2: 새 프로젝트 생성

#### 2.1 Web Admin 프로젝트 생성
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 선택: `velomano/smart_on`
3. **프로젝트 설정**:
   - **Project Name**: `smart-farm-web-admin-v2`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web-admin`
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)

#### 2.2 Universal Bridge 프로젝트 생성
1. "New Project" 클릭
2. 동일한 GitHub 저장소 선택
3. **프로젝트 설정**:
   - **Project Name**: `smart-farm-universal-bridge-v2`
   - **Framework Preset**: Other
   - **Root Directory**: `apps/universal-bridge`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: 환경변수 설정

#### 3.1 Web Admin 환경변수
각 프로젝트의 Settings → Environment Variables에서 추가:

```bash
# Public Variables (클라이언트에서 접근 가능)
NEXT_PUBLIC_SUPABASE_URL = https://kkrcwdybrsppbsufrrdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxOTgsImV4cCI6MjA3NDExODE5OH0.oo-iIviVJ2oaWZldtmkYo1sWgHbxxIIkFUrBrU8rQqY
NEXT_PUBLIC_BRIDGE_URL = https://smart-farm-universal-bridge-v2.vercel.app

# Private Variables (서버에서만 접근)
SUPABASE_URL = https://kkrcwdybrsppbsufrrdg.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxOTgsImV4cCI6MjA3NDExODE5OH0.oo-iIviVJ2oaWZldtmkYo1sWgHbxxIIkFUrBrU8rQqY
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4
TELEGRAM_BOT_TOKEN = 8405537801:AAGm3ycoklEtpNcAyBShI1_nKvOEFGBf_uQ
TELEGRAM_CHAT_ID = 6827239951
NODE_ENV = production
```

#### 3.2 Universal Bridge 환경변수
```bash
# Public Variables
NODE_ENV = production

# Private Variables
SUPABASE_URL = https://kkrcwdybrsppbsufrrdg.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4
BRIDGE_ENCRYPTION_KEY = smartfarm-universal-bridge-key-32-production
BRIDGE_HTTP_PORT = 8080
BRIDGE_WS_PORT = 8081
BRIDGE_SERVER_URL = https://smart-farm-universal-bridge-v2.vercel.app
WEB_ADMIN_URL = https://smart-farm-web-admin-v2.vercel.app
LOG_LEVEL = info
SIGNATURE_VERIFY_OFF = false
```

### Step 4: 빌드 테스트

#### 4.1 로컬 빌드 테스트
```bash
# Web Admin 빌드 테스트
cd apps/web-admin
npm install
npm run build

# Universal Bridge 빌드 테스트
cd apps/universal-bridge
npm install
npm run build
```

#### 4.2 배포 실행
1. 각 프로젝트에서 "Deploy" 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 후 URL 확인

### Step 5: 도메인 설정

#### 5.1 커스텀 도메인 설정 (선택사항)
1. 각 프로젝트의 Settings → Domains
2. 원하는 도메인 추가
3. DNS 설정 업데이트

#### 5.2 기본 Vercel 도메인 사용
- Web Admin: `https://smart-farm-web-admin-v2.vercel.app`
- Universal Bridge: `https://smart-farm-universal-bridge-v2.vercel.app`

### Step 6: 연결 테스트

#### 6.1 Web Admin 테스트
1. 브라우저에서 Web Admin URL 접속
2. 로그인 페이지 확인
3. 기본 기능 테스트

#### 6.2 Universal Bridge 테스트
1. WebSocket 연결 테스트
2. API 엔드포인트 테스트
3. 데이터 전송 테스트

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# 로그 확인
# 환경변수 누락 확인
# 의존성 문제 확인
```

#### 2. 환경변수 문제
- 대소문자 확인
- 공백 확인
- 따옴표 확인

#### 3. CORS 문제
- 도메인 허용 목록 확인
- API 엔드포인트 CORS 설정 확인

#### 4. 데이터베이스 연결 문제
- Supabase 연결 정보 확인
- RLS 정책 확인

## 📞 지원

문제 발생 시:
1. Vercel 대시보드 로그 확인
2. 빌드 에러 메시지 분석
3. 로컬 환경에서 동일한 설정으로 테스트
4. 필요시 이전 설정으로 롤백

---

**🎯 목표**: 깔끔하게 새로 설정하여 안정적인 배포 환경 구축

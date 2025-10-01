# 환경변수 설정 가이드

## 📋 환경변수 체크리스트

### Web Admin (공개 환경변수)
| 변수명 | 설명 | 예시값 | 필수 |
|--------|------|--------|------|
| `NEXT_PUBLIC_BRIDGE_URL` | Universal Bridge 서버 URL | `http://localhost:3000` (로컬)<br>`https://bridge.smartfarm.app` (운영) | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `NEXT_PUBLIC_TENANT_ID` | 기본 테넌트 ID | `00000000-0000-0000-0000-000000000001` | ✅ |
| `NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD` | 레거시 대시보드 강제 사용 | `false` (기본값) | ❌ |

### Universal Bridge (비공개 환경변수)
| 변수명 | 설명 | 예시값 | 필수 |
|--------|------|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `SIGNATURE_VERIFY_OFF` | HMAC 서명 검증 비활성화 | `false` (운영)<br>`true` (개발) | ❌ |
| `BRIDGE_SERVER_URL` | Bridge 서버 URL | `http://localhost:3000` (로컬)<br>`https://bridge.smartfarm.app` (운영) | ✅ |
| `WEB_ADMIN_URL` | Web Admin URL | `http://localhost:3001` (로컬)<br>`https://admin.smartfarm.app` (운영) | ✅ |

## 🔧 설정 방법

### 1. Web Admin (.env.local)
```bash
# 로컬 개발
NEXT_PUBLIC_BRIDGE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_TENANT_ID=00000000-0000-0000-0000-000000000001

# 운영 환경
NEXT_PUBLIC_BRIDGE_URL=https://bridge.smartfarm.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_TENANT_ID=00000000-0000-0000-0000-000000000001
```

### 2. Universal Bridge (.env)
```bash
# 로컬 개발
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SIGNATURE_VERIFY_OFF=true
BRIDGE_SERVER_URL=http://localhost:3000
WEB_ADMIN_URL=http://localhost:3001

# 운영 환경
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SIGNATURE_VERIFY_OFF=false
BRIDGE_SERVER_URL=https://bridge.smartfarm.app
WEB_ADMIN_URL=https://admin.smartfarm.app
```

## ⚠️ 보안 주의사항

- **NEXT_PUBLIC_*** 변수는 클라이언트에 노출됩니다
- **SUPABASE_SERVICE_ROLE_KEY**는 절대 공개하지 마세요
- **운영 환경**에서는 `SIGNATURE_VERIFY_OFF=false`로 설정하세요

## 🔍 환경변수 확인

### Web Admin
```bash
cd apps/web-admin
npm run dev
# 브라우저 콘솔에서 확인 가능
console.log(process.env.NEXT_PUBLIC_BRIDGE_URL)
```

### Universal Bridge
```bash
cd apps/universal-bridge
npm run dev
# 서버 로그에서 확인 가능
```

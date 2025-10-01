# 통합 Universal Bridge 환경변수 가이드

## Web Admin (Vercel) 환경변수

### 필수 환경변수
```bash
# 앱 기본 설정
NEXT_PUBLIC_APP_URL=https://smart-on-web-admin.vercel.app
NEXT_PUBLIC_APP_NAME=Smart On

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Universal Bridge 연결
BRIDGE_INTERNAL_URL=https://bridge.terahub.ai
BRIDGE_API_TOKEN=your-secure-bridge-token

# OpenAI (LLM Phase 2)
OPENAI_API_KEY=sk-...

# MQTT (선택사항)
MQTT_WS_URL=wss://mqtt.terahub.ai:8080
MQTT_USERNAME=your-mqtt-username
MQTT_PASSWORD=your-mqtt-password
```

### Vercel 설정 방법

1. **Vercel Dashboard** → **Project Settings** → **Environment Variables**
2. **Production, Preview, Development** 각각 설정
3. **Sensitive** 체크박스로 민감한 값 보호

## Universal Bridge (서버) 환경변수

### 필수 환경변수
```bash
# 서버 설정
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API 보안
BRIDGE_API_TOKEN=your-secure-bridge-token

# MQTT 브로커 (선택사항)
MQTT_BROKER_URL=mqtt://mqtt.terahub.ai:1883
MQTT_USERNAME=your-mqtt-username
MQTT_PASSWORD=your-mqtt-password

# 개발 모드 설정
SIGNATURE_VERIFY_OFF=false
```

## 배포 환경별 설정

### Production (Vercel)
```bash
NEXT_PUBLIC_APP_URL=https://smart-on-web-admin.vercel.app
BRIDGE_INTERNAL_URL=https://bridge.terahub.ai
```

### Preview (Vercel)
```bash
NEXT_PUBLIC_APP_URL=https://smart-on-web-admin-git-feat-integrated-bridge.vercel.app
BRIDGE_INTERNAL_URL=https://bridge-preview.terahub.ai
```

### Development (로컬)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
BRIDGE_INTERNAL_URL=http://localhost:3001
```

## 보안 체크리스트

- ✅ **민감한 키는 Sensitive로 설정**
- ✅ **BRIDGE_API_TOKEN은 강력한 랜덤 문자열**
- ✅ **SUPABASE_SERVICE_ROLE_KEY는 서버에서만 사용**
- ✅ **MQTT_PASSWORD는 암호화된 값 사용**
- ✅ **Production과 Development 환경 분리**

## 환경변수 검증

### Web Admin에서 검증
```typescript
// apps/web-admin/src/lib/env.ts
export const env = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  BRIDGE_INTERNAL_URL: process.env.BRIDGE_INTERNAL_URL!,
  BRIDGE_API_TOKEN: process.env.BRIDGE_API_TOKEN!,
} as const;

// 환경변수 누락 체크
Object.entries(env).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});
```

### Universal Bridge에서 검증
```typescript
// apps/universal-bridge/src/env.ts
export const env = {
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  BRIDGE_API_TOKEN: process.env.BRIDGE_API_TOKEN!,
} as const;

// 환경변수 누락 체크
Object.entries(env).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});
```

## 문제 해결

### 환경변수가 적용되지 않는 경우
1. **Vercel 재배포**: 환경변수 변경 후 재배포 필요
2. **캐시 클리어**: 브라우저 캐시 삭제
3. **변수명 확인**: 대소문자, 언더스코어 정확히 입력

### Bridge 연결 실패
1. **BRIDGE_INTERNAL_URL 확인**: 올바른 URL인지 확인
2. **BRIDGE_API_TOKEN 확인**: 토큰이 일치하는지 확인
3. **네트워크 연결**: Bridge 서버가 실행 중인지 확인

### Supabase 연결 실패
1. **URL 형식 확인**: `https://project.supabase.co` 형식
2. **키 형식 확인**: JWT 토큰 형식인지 확인
3. **RLS 정책**: 서비스 역할 키 권한 확인

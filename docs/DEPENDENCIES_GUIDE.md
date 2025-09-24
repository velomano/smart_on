# 📦 의존성 패키지 설치 가이드

## 📋 개요
SmartOn 프로젝트의 각 디렉토리별로 필요한 의존성 패키지들을 정리한 문서입니다.

---

## 🌐 웹 앱 (apps/web-admin)

### 필수 패키지
```bash
cd apps/web-admin
pnpm install
```

### 추가로 필요한 패키지 (이미 설치됨)
- `@supabase/supabase-js` - Supabase 클라이언트
- `next` - Next.js 프레임워크
- `react` - React 라이브러리
- `react-dom` - React DOM
- `typescript` - TypeScript

### 환경변수
```env
# .env 파일에 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_TUYA_APP_KEY=your_tuya_app_key_here
NEXT_PUBLIC_TUYA_APP_SECRET=your_tuya_app_secret_here
NEXT_PUBLIC_TUYA_REGION=eu
NEXT_PUBLIC_API_BASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_REALTIME_URL=wss://your-project.supabase.co
TZ=Asia/Seoul
```

---

## 📱 모바일 앱 (mobile-app)

### 필수 패키지
```bash
cd mobile-app
pnpm install
```

### 추가로 필요한 패키지 (문제 해결용)
```bash
# React Native Web 관련
pnpm install react-native-web

# Expo 관련
pnpm install expo-constants expo-modules-core

# Babel 런타임
pnpm install @babel/runtime

# React Native Web 의존성
pnpm install fbjs nullthrows

# Supabase 관련
pnpm install @supabase/supabase-js
pnpm install @supabase/functions-js
pnpm install @supabase/postgrest-js
pnpm install @supabase/realtime-js
pnpm install @supabase/storage-js
pnpm install @supabase/auth-js
pnpm install @supabase/node-fetch

# 기타 의존성
pnpm install pretty-format
pnpm install react-refresh
pnpm install react-is
pnpm install ansi-styles
pnpm install @expo/metro-runtime

# React Native URL Polyfill
pnpm install react-native-url-polyfill
```

### 환경변수 설정
```json
// app.json의 extra 섹션에 설정
{
  "expo": {
    "extra": {
      "supabaseUrl": "your_supabase_url_here",
      "supabaseAnonKey": "your_supabase_anon_key_here",
      "tuyaAppKey": "your_tuya_app_key_here",
      "tuyaAppSecret": "your_tuya_app_secret_here",
      "tuyaRegion": "eu"
    }
  }
}
```

---

## 🗄️ 데이터베이스 (packages/database)

### 필수 패키지
```bash
cd packages/database
pnpm install
```

### Supabase 관련
- `@supabase/supabase-js` - Supabase 클라이언트
- `@supabase/cli` - Supabase CLI (개발용)

---

## 🏗️ 루트 프로젝트

### 필수 패키지
```bash
# 루트에서 실행
pnpm install
```

### 워크스페이스 관리
- `pnpm` - 패키지 매니저
- `typescript` - TypeScript
- `@types/node` - Node.js 타입 정의

---

## 🚀 설치 순서

### 1. 루트 프로젝트 초기화
```bash
cd C:\SCW\smarton
pnpm install
```

### 2. 웹 앱 설정
```bash
cd apps/web-admin
pnpm install
# .env 파일 생성 및 환경변수 설정
```

### 3. 모바일 앱 설정
```bash
cd mobile-app
pnpm install
# 추가 의존성 설치
pnpm install react-native-web expo-constants expo-modules-core @babel/runtime fbjs nullthrows @supabase/supabase-js @supabase/functions-js @supabase/postgrest-js @supabase/realtime-js @supabase/storage-js @supabase/auth-js @supabase/node-fetch pretty-format react-refresh react-is ansi-styles @expo/metro-runtime react-native-url-polyfill
# app.json에 환경변수 설정
```

### 4. 데이터베이스 설정
```bash
cd packages/database
pnpm install
```

---

## 🔧 문제 해결

### Metro 캐시 문제
```bash
# 캐시 삭제 후 재시작
npx expo start --web --clear --reset-cache
```

### 의존성 충돌 해결
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### 웹팩 빌드 오류
```bash
# 웹팩 캐시 삭제
rm -rf .next
npx expo start --web --clear
```

---

## 📝 주의사항

### 웹 앱
- 환경변수는 `NEXT_PUBLIC_` 접두사 필수
- 클라이언트 사이드에서 접근 가능한 변수만 사용

### 모바일 앱
- `app.json`의 `extra` 섹션에 환경변수 설정
- `Constants.expoConfig?.extra`로 접근
- 네이티브 모듈은 실제 디바이스에서만 작동

### 공통
- 모든 패키지는 `pnpm`으로 설치
- 버전 충돌 시 `pnpm-lock.yaml` 삭제 후 재설치
- 캐시 문제 시 `--clear` 플래그 사용

---

## 🎯 실행 명령어

### 웹 앱 실행
```bash
cd apps/web-admin
pnpm dev
# http://localhost:3000
```

### 모바일 앱 실행
```bash
cd mobile-app
npx expo start --web
# http://localhost:19006
```

### Android 빌드
```bash
cd mobile-app
npx expo run:android
```

### iOS 빌드
```bash
cd mobile-app
npx expo run:ios
```

---

**💡 팁**: 새로운 환경에서 프로젝트를 설정할 때는 이 문서를 참고하여 순서대로 설치하세요!

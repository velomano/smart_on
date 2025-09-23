# 🔐 GitHub Secrets 설정 가이드

## 📋 필요한 GitHub Secrets

### 1. Vercel 배포용 Secrets

#### VERCEL_TOKEN
1. [Vercel Dashboard](https://vercel.com/dashboard) 로그인
2. Settings → Tokens → "Create Token" 클릭
3. Token 이름: `smart-farm-github-actions`
4. Scope: Full Account
5. 생성된 토큰을 복사하여 GitHub Secrets에 등록

#### VERCEL_ORG_ID
1. Vercel Dashboard → Settings → General
2. "Team ID" 또는 "Account ID" 복사
3. GitHub Secrets에 등록

#### VERCEL_PROJECT_ID
1. Vercel Dashboard → 프로젝트 선택 → Settings → General
2. "Project ID" 복사
3. GitHub Secrets에 등록

### 2. Expo EAS Build용 Secrets

#### EXPO_TOKEN
1. [Expo Dashboard](https://expo.dev/) 로그인
2. Account Settings → Access Tokens → "Create Token"
3. Token 이름: `github-actions`
4. Scope: All
5. 생성된 토큰을 복사하여 GitHub Secrets에 등록

### 3. Supabase 연동용 Secrets

#### SUPABASE_URL
1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택 → Settings → API
3. "Project URL" 복사
4. GitHub Secrets에 등록

#### SUPABASE_ANON_KEY
1. Supabase Dashboard → Settings → API
2. "anon public" 키 복사
3. GitHub Secrets에 등록

### 4. Tuya IoT Platform용 Secrets

#### TUYA_APP_KEY
1. [Tuya IoT Platform](https://iot.tuya.com/) 로그인
2. 프로젝트 → Overview → API
3. "AppKey" 복사
4. GitHub Secrets에 등록

#### TUYA_APP_SECRET
1. Tuya IoT Platform → 프로젝트 → Overview → API
2. "AppSecret" 복사
3. GitHub Secrets에 등록

## 🛠️ GitHub Secrets 등록 방법

### 1. GitHub 저장소로 이동
1. https://github.com/velomano/smart_on 이동
2. Settings → Secrets and variables → Actions

### 2. New repository secret 클릭
각 Secret을 다음 이름으로 등록:

| Secret 이름 | 설명 | 예시 값 |
|-------------|------|---------|
| `VERCEL_TOKEN` | Vercel 배포 토큰 | `vercel_xxxxxxxxx` |
| `VERCEL_ORG_ID` | Vercel 조직/계정 ID | `team_xxxxxxxxx` |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | `prj_xxxxxxxxx` |
| `EXPO_TOKEN` | Expo EAS 빌드 토큰 | `exp_xxxxxxxxx` |
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 익명 키 | `eyJhbGciOiJIUzI1NiIs...` |
| `TUYA_APP_KEY` | Tuya 앱 키 | `xxxxxxxxxxxxxxx` |
| `TUYA_APP_SECRET` | Tuya 앱 시크릿 | `xxxxxxxxxxxxxxxxxxxxxxxx` |

## ✅ 검증 방법

### 1. Vercel 배포 테스트
```bash
# GitHub Actions에서 워크플로우 실행
# Web Deploy 작업이 성공적으로 완료되는지 확인
```

### 2. EAS 빌드 테스트
```bash
# GitHub Actions에서 Android Build 워크플로우 실행
# EAS project not configured 에러가 발생하지 않는지 확인
```

### 3. 로컬 테스트 (선택사항)
```bash
# Vercel CLI로 로컬 배포 테스트
cd apps/web-admin
npx vercel --token $VERCEL_TOKEN

# EAS CLI로 로컬 빌드 테스트
cd mobile-app
npx eas build --platform android --profile preview --local
```

## ⚠️ 보안 주의사항

1. **토큰 보안**: 모든 토큰은 GitHub Secrets에만 저장
2. **권한 최소화**: 필요한 최소 권한만 부여
3. **정기 갱신**: 토큰은 정기적으로 갱신 권장
4. **로컬 환경변수**: `.env` 파일은 절대 Git에 커밋하지 않음

## 🔧 문제 해결

### Vercel 배포 실패
- VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID 확인
- Vercel 프로젝트가 올바르게 연결되어 있는지 확인

### EAS 빌드 실패
- EXPO_TOKEN 확인
- app.json의 projectId가 올바른지 확인
- eas.json 파일이 존재하는지 확인

### Supabase 연결 실패
- SUPABASE_URL, SUPABASE_ANON_KEY 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

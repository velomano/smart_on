# 🌱 Smart Farm Platform

> 통합 스마트팜 원격 제어 및 모니터링 플랫폼

## 📋 프로젝트 개요

스마트팜에서 작물을 재배하는 팀들이 원격으로 베드를 제어하고 모니터링할 수 있는 **통합 플랫폼**입니다.

### 🎯 주요 기능
- **🌱 스마트 스위치 등록** - Tuya 스마트 스위치 초기 연동 (모바일 앱)
- **🏠 농장 관리** - 다중 농장 및 베드 관리 시스템
- **📊 실시간 모니터링** - 온도, 습도, 조도, EC, pH 센서 데이터 시각화
- **🔌 디바이스 제어** - Tuya 스마트 스위치를 통한 조명, 팬, 펌프 제어
- **📱 모바일 앱** - React Native + Expo 크로스 플랫폼 (스위치 등록용)
- **🌐 웹 어드민** - Next.js 기반 관리자/사용자 대시보드
- **🎨 현대적 UI/UX** - Glassmorphism 디자인 테마 적용

## 🚀 기술 스택

### Frontend
- **React Native** - 크로스 플랫폼 모바일 앱
- **Next.js** - 웹 어드민 대시보드
- **Expo** - 모바일 개발 및 빌드 도구
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **React Navigation** - 화면 네비게이션

### Backend
- **Supabase** - PostgreSQL 데이터베이스
- **Supabase Auth** - 사용자 인증
- **Supabase Realtime** - 실시간 데이터 동기화
- **Row Level Security (RLS)** - 데이터 보안
- **Edge Functions** - 서버리스 함수

### IoT
- **Tuya SDK** - 스마트 디바이스 제어
- **MQTT** - 로컬 센서 데이터 수집
- **Raspberry Pi** - 게이트웨이 역할
- **Arduino** - 센서 데이터 수집

## 📁 프로젝트 구조

```
smart_on/
├── apps/                      # 애플리케이션
│   ├── mobile-app/           # React Native 모바일 앱 (스위치 등록용)
│   │   ├── App.tsx           # 메인 앱 컴포넌트
│   │   ├── src/              # 소스 코드
│   │   │   └── services/     # Supabase & Tuya 서비스
│   │   ├── android/          # Android 네이티브 코드
│   │   │   └── app/src/main/java/com/velomano/smartfarm/
│   │   │       ├── TuyaSDKModule.java      # Tuya SDK 네이티브 모듈
│   │   │       ├── TuyaSDKPackage.java     # 모듈 패키지
│   │   │       └── MainApplication.java    # 메인 애플리케이션
│   │   ├── app.json          # Expo 설정 (환경변수 포함)
│   │   └── package.json      # 의존성
│   └── web-admin/            # Next.js 웹 어드민 (관리자/사용자용)
│       ├── src/              # 소스 코드
│       │   ├── app/          # Next.js 13+ App Router
│       │   └── lib/          # Supabase 클라이언트
│       ├── .env.local        # 환경변수 (로컬)
│       └── package.json      # 의존성
├── packages/                 # 공유 패키지
│   └── database/            # 데이터베이스 스키마
│       └── supabase/        # Supabase 설정
├── docs/                    # 프로젝트 문서
│   ├── 00_README.md         # 문서 인덱스
│   ├── 01_ENV.md            # 환경변수 가이드
│   ├── 02_DB_SCHEMA.sql     # 데이터베이스 스키마
│   ├── 03_RLS_POLICIES.sql  # 보안 정책
│   ├── 06_API_CONTRACT.md   # API 계약
│   ├── 07_TUYA_SDK.md       # Tuya SDK 가이드
│   ├── 12_ACCEPTANCE_CHECKS.md # 수용성 체크
│   ├── EXISTING_DB_STRUCTURE.md # 기존 DB 구조 분석
│   └── UI_DESIGN_SYSTEM.md  # UI 디자인 시스템
├── book/                    # Tuya SDK 및 리소스
├── .github/                 # GitHub Actions
│   └── workflows/           # CI/CD 파이프라인
├── env.example              # 환경변수 템플릿
└── README.md                # 프로젝트 문서
```

## 🛠️ 설치 및 실행

### 1. 환경 요구사항
- Node.js 20.x 이상
- npm 또는 yarn
- Android Studio (Android 빌드용)
- Xcode (iOS 빌드용, macOS만)

### 2. 프로젝트 클론
```bash
git clone <repository-url>
cd smart-farm-app
```

### 3. 의존성 설치

#### 모바일 앱
```bash
cd apps/mobile-app
npm install
```

#### 웹 어드민
```bash
cd apps/web-admin
npm install
```

### 4. 환경변수 설정

#### 모바일 앱 (app.json에 설정됨)
```bash
# mobile-app/app.json의 extra 필드에 이미 설정되어 있음
{
  "extra": {
    "supabaseUrl": "https://kkrcwdybrsppbsufrrdg.supabase.co",
    "supabaseAnonKey": "your-anon-key",
    "tuyaAppKey": "your-tuya-app-key",
    "tuyaAppSecret": "your-tuya-app-secret",
    "tuyaRegion": "eu"
  }
}
```

#### 웹 어드민
```bash
cd apps/web-admin
# .env.local 파일 생성 (이미 생성됨)
NEXT_PUBLIC_SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. 웹 어드민 실행
```bash
cd apps/web-admin
npm run dev
```

### 6. 모바일 앱 실행

#### 웹 버전 (개발용)
```bash
cd apps/mobile-app
npm start
# 브라우저에서 'w' 키를 눌러 웹 버전 실행
```

#### Android (실제 디바이스 테스트용)
```bash
cd apps/mobile-app
npm run android
# Android Studio 설치 필요
```

#### iOS (macOS만)
```bash
cd apps/mobile-app
npm run ios
# Xcode 설치 필요
```

### 7. Tuya SDK 네이티브 모듈 빌드 (Android)
```bash
cd apps/mobile-app
npx expo run:android
# 또는 Android Studio에서 직접 빌드
```

## 🔧 개발 가이드

### 코드 스타일
- **TypeScript** 사용 필수
- **함수형 컴포넌트** 사용
- **Hooks** 활용
- **ESLint** 및 **Prettier** 설정 준수

### 커밋 메시지 규칙
```
<타입>: <제목>

<본문>

<푸터>
```

### 브랜치 전략
- `main` - 프로덕션 브랜치
- `develop` - 개발 브랜치
- `feature/*` - 기능 개발 브랜치
- `hotfix/*` - 긴급 수정 브랜치

## 📊 데이터베이스 스키마

### 🗄️ 실제 테이블 구조 (Supabase)
- `tenants` - 팀/조직 정보
- `farms` - 농장 정보 (1개 농장: '메인 팜')
- `beds` - 베드 정보 (6개 베드)
- `devices` - 디바이스 정보 (7개: 3개 센서 게이트웨이 + 4개 Tuya 디바이스)
- `sensors` - 센서 정보 (10개: 온도, 습도, EC, pH, 조도, 수온)
- `sensor_readings` - 센서 데이터 (2,890개 레코드)
- `commands` - 제어 명령
- `rules` - 자동화 규칙
- `alerts` - 알림 정보
- `users` - 사용자 정보
- `memberships` - 멤버십 정보

### 🔗 테이블 관계
```
tenants (1) → farms (1) → devices (7) → sensors (10) → sensor_readings (2,890)
```

### 📱 모바일 앱 연동
- **스위치 등록**: Tuya 디바이스 초기 설정 및 등록
- **디바이스 제어**: `devices` 테이블의 `status` JSONB 필드로 상태 관리
- **센서 모니터링**: `sensor_readings` 테이블에서 실시간 데이터 조회

## 🔐 보안

- **Row Level Security (RLS)** 적용
- **팀별 데이터 격리**
- **JWT 토큰** 기반 인증
- **환경변수**로 민감 정보 관리

## 🚀 배포

### 웹 어드민
- **Vercel** 또는 **Netlify** 배포
- **자동 배포** (GitHub Actions)

### 모바일 앱
- **Google Play Store** (Android)
- **Apple App Store** (iOS)
- **Expo Application Services (EAS)** 빌드

### 통합 배포
- **GitHub Actions** CI/CD 파이프라인
- **자동 빌드 및 테스트**
- **다중 환경 배포** (dev, staging, production)

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

---

**💡 팁**: 개발 시작 전에 `docs/md/작업_시작_전_체크리스트.md`를 확인하세요!

## 📚 추가 문서

- [📋 문서 인덱스](docs/00_README.md)
- [🔧 환경변수 가이드](docs/01_ENV.md)
- [🗄️ 데이터베이스 스키마](docs/02_DB_SCHEMA.sql)
- [🔐 보안 정책](docs/03_RLS_POLICIES.sql)
- [📡 API 계약](docs/06_API_CONTRACT.md)
- [🔌 Tuya SDK 가이드](docs/07_TUYA_SDK.md)
- [✅ 수용성 체크](docs/12_ACCEPTANCE_CHECKS.md)
- [🗃️ 기존 DB 구조 분석](docs/EXISTING_DB_STRUCTURE.md)
- [🎨 UI 디자인 시스템](docs/UI_DESIGN_SYSTEM.md)
- [📱 프로젝트 기획서](book/스마트팜_제어_모니터링_앱_prd_v_0.md)

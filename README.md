# 🌱 TeraHub

> 인도어 스마트팜 ALL-IN-ONE BOARD 통합 관리 플랫폼

## 📋 프로젝트 개요

아두이노 + 라즈베리 파이 조합으로 구성된 스마트팜의 센서 데이터 수집, 분석, 제어를 위한 통합 시스템입니다.

### 🎯 주요 기능
- **🌱 센서 데이터 수집** - 아두이노를 통한 온도, 습도, EC, pH, 조도 센서 데이터 수집
- **🏠 농장 관리** - 다중 농장 및 베드 관리 시스템 (농장장/팀원 권한 분리)
- **🌱 베드 관리** - 베드 생성, 편집, 삭제 및 다단 구조 지원
- **📊 실시간 모니터링** - 라즈베리 파이 + MQTT를 통한 실시간 센서 데이터 시각화
- **🔌 디바이스 제어** - 릴레이 모듈을 통한 조명, 팬, 펌프 제어 (투야 스마트 스위치 대신)
- **👥 사용자 관리** - 4단계 역할 기반 권한 관리 (super_admin, system_admin, team_leader, team_member)
- **📝 생육 노트** - 베드별 노트 작성 및 관리 시스템
- **🔧 MQTT 설정** - 농장별 MQTT 브로커 설정 및 연결 테스트
- **📱 모바일 앱** - React Native + Expo 크로스 플랫폼 (센서 데이터 모니터링용)
- **🌐 웹 어드민** - Next.js 기반 관리자/사용자 대시보드
- **🌱 양액계산 서비스** - 작물별 최적 배양액 제조 계산 (4종 작물 지원)
- **📊 시세정보** - KAMIS API 연동 농산물 시세 조회
- **🚨 실시간 알림 시스템** - 텔레그램 + 대시보드 동시 알림 (센서 임계값 초과 감지)
- **⚡ 베드별 실시간 경고** - 센서 데이터 이상 시 해당 베드 카드 자동 깜빡임
- **🎨 현대적 UI/UX** - Glassmorphism 디자인 테마 적용
- **📋 레시피 상세 정보** - 완전한 배양액 레시피 정보 (환경 조건, 영양소, 사용법, 주의사항)
- **🔄 실시간 레시피 업데이트** - 오늘 추가된 레시피 실시간 표시 및 상세 보기

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
- **Arduino** - 센서 데이터 수집 + 액추에이터 제어
- **Raspberry Pi** - 게이트웨이 역할 + MQTT 브로커
- **MQTT** - 센서 데이터 수집 및 제어 명령 전송
- **릴레이 모듈** - 조명, 팬, 펌프 제어

## 📚 문서

### 핵심 문서
- **[데이터베이스 스키마](docs/02_DB_SCHEMA.sql)** - 테이블 구조 및 관계
- **[사용자 권한 시스템](docs/USER_PERMISSION_SYSTEM.md)** - 4단계 역할 기반 권한 관리
- **[농장 관리 기능](docs/FARM_MANAGEMENT_FEATURES.md)** - 농장, 베드, 센서 관리
- **[API 계약서](docs/06_API_CONTRACT.md)** - REST API 엔드포인트 명세
- **[기술 아키텍처](docs/TECHNICAL_ARCHITECTURE.md)** - 전체 시스템 구조

### 개발 가이드
- **[환경 설정](docs/01_ENV.md)** - 개발 환경 구축
- **[의존성 가이드](docs/DEPENDENCIES_GUIDE.md)** - 패키지 및 라이브러리
- **[MQTT 통합 가이드](docs/MQTT_INTEGRATION_GUIDE.md)** - MQTT 브로커 연동
- **[Tuya SDK 통합](docs/TUYA_SDK_INTEGRATION.md)** - Tuya 디바이스 연동

### 운영 가이드
- **[농장 운영 가이드](docs/FARM_OPERATION_GUIDE.md)** - 실제 농장 운영 방법
- **[배포 설정](docs/VERCEL_DEPLOYMENT_SETUP.md)** - Vercel 배포 가이드
- **[GitHub Secrets 설정](docs/GITHUB_SECRETS_SETUP.md)** - CI/CD 설정

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
- `farms` - 농장 정보 (3개 농장: 1농장, 2농장, 3농장)
- `beds` - 베드 정보 (6개 베드, 각 농장별 2개씩)
- `devices` - 디바이스 정보 (센서 게이트웨이 + 릴레이 모듈)
- `sensors` - 센서 정보 (온도, 습도, EC, pH, 조도, 수온)
- `sensor_readings` - 센서 데이터 (실시간 모니터링)
- `commands` - 제어 명령
- `rules` - 자동화 규칙
- `alerts` - 알림 정보
- `users` - 사용자 정보 (시스템 관리자, 농장장, 팀원)
- `memberships` - 멤버십 정보

### 🔗 테이블 관계
```
tenants (1) → farms (3) → devices (N) → sensors (N) → sensor_readings (N)
```

### 👥 사용자 권한 체계
- **시스템 관리자**: 모든 농장 및 사용자 관리 권한
- **농장장**: 자신의 농장 및 팀원 관리 권한
- **팀원**: 자신의 농장 정보 조회 권한

### 📱 모바일 앱 연동
- **센서 모니터링**: `sensor_readings` 테이블에서 실시간 데이터 조회
- **디바이스 제어**: `devices` 테이블의 `status` JSONB 필드로 상태 관리
- **MQTT 통신**: 라즈베리 파이와 실시간 데이터 교환

## 🔐 보안

- **Row Level Security (RLS)** 적용
- **팀별 데이터 격리**
- **JWT 토큰** 기반 인증
- **환경변수**로 민감 정보 관리

## 🚀 배포

### 웹 어드민
- **Vercel** 배포: https://web-admin-snowy.vercel.app
- **자동 배포** (GitHub Actions)
- **Supabase Auth** 연동 (실제 사용자 인증)
- **사용자 승인 시스템** (관리자 승인 후 접근)

### 🎨 최근 UI/UX 개선사항
- **TeraHub 브랜딩**: 프로젝트명 변경 및 로고 통일 디자인 적용
- **그라데이션 로고**: 대시보드/로그인 페이지 일관된 브랜딩 스타일
- **페이지 타이틀 통합**: 시세정보/양액계산/알림설정 페이지 헤더 디자인 통일
- **반응형 UI**: 모든 페이지 간 일관된 레이아웃과 스타일링
- **제어 인터페이스 개선**: "Tuya" 브랜드명 제거하여 일반화된 용어 사용
- **마이페이지 추가**: 개인정보 관리, 비밀번호 변경, 텔레그램 설정 통합
- **사용자 관리 개선**: Supabase 연동으로 실제 데이터베이스 기반 사용자 관리
- **승인 시스템**: 관리자 승인 후 사용자 접근 가능한 워크플로우 구현

### 모바일 앱
- **Google Play Store** (Android)
- **Apple App Store** (iOS)
- **Expo Application Services (EAS)** 빌드

### 통합 배포
- **GitHub Actions** CI/CD 파이프라인
- **자동 빌드 및 테스트**
- **다중 환경 배포** (dev, staging, production)

### 🧪 테스트 계정 (4단계 권한 체계)
- **최고관리자**: sky3rain7@gmail.com / password
- **시스템관리자**: velomano@naver.com / password (곧 test0@test.com 추가 예정)
- **1농장(팀)**: test1@test.com (농장장), test2@test.com (팀원) / password
- **2농장(팀)**: test3@test.com (농장장), test4@test.com (팀원) / password
- **3농장(팀)**: test5@test.com (농장장), test6@test.com (팀원) / password

### 👤 사용자 관리 시스템
- **회원가입**: 이메일 기반 회원가입 (Supabase Auth 연동)
- **승인 시스템**: 관리자가 신규 사용자 승인 후 접근 가능
- **역할 기반 권한**: 최고관리자(시스템관리자 권한 부여 가능), 시스템관리자(농장/베드/사용자 관리), 농장장(자신 농장 관리), 팀원(조회/보기 권한) 4단계 권한 체계
- **마이페이지**: 개인정보 수정, 비밀번호 변경, 텔레그램 알림 설정
- **Supabase 연동**: 실제 데이터베이스 기반 사용자 관리 (localStorage 백업)

### 🌱 양액계산 서비스
- **지원 작물**: 상추, 토마토, 오이, 딸기 (4종)
- **생육단계**: 영양생장기, 개화기, 결실기, 성숙기
- **기능**: 작물별 최적 배양액 제조 계산, A/B 탱크 분리, EC/pH 추정
- **접근**: 웹 어드민 → "🌱 양액계산" 메뉴

### 📊 시세정보 서비스
- **데이터 소스**: KAMIS 농산물 시세 API
- **지원 품목**: 쌀, 상추, 토마토, 오이, 딸기 등 주요 농산물
- **기능**: 실시간 시세 조회, 가격 검색, 월별 추이 분석
- **접근**: 웹 어드민 → "📊 시세정보" 메뉴

### 🚨 실시간 알림 서비스
- **템플릿 알림**: 고수위, 저수위, 연기감지 등 미리 정의된 알림 템플릿 전송
- **실시간 센서 감지**: 임계값 초과 시 자동 텔레그램 알림 발송
- **다중 플랫폼 알림**: 텔레그램 + 대시보드 경고 동시 표시
- **베드별 경고 시스템**: 특정 베드 센서 이상 시 해당 베드 카드 자동 깜빡임
- **중복 알림 방지**: 동일 알림은 설정 간격 후 재발송 (기본 30분)
- **개인화된 알림**: 사용자별 텔레그램 채팅 ID 설정 및 관리
- **마이페이지 연동**: 텔레그램 ID 설정을 마이페이지에서 관리
- **접근**: 웹 어드민 → "알림 설정" 메뉴

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
# Vercel 배포 테스트
# Vercel Root Directory 설정 테스트
# web-admin Git 연결 테스트
# web-admin Git 연결 성공 테스트
# Git 연결 성공 후 자동 배포 테스트
# Production Overrides 제거 후 배포 테스트
# Root Directory 설정 수정 후 배포 테스트
# vercel.json 빌드 명령어 제거 후 배포 테스트
# 루트 vercel.json 빌드 명령어 제거 후 배포 테스트
# 누락된 파일들 생성 후 배포 테스트

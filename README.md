# 🌱 Smart Farm App

> 스마트팜 원격 제어 및 모니터링 앱

## 📋 프로젝트 개요

스마트팜에서 작물을 재배하는 팀들이 원격으로 베드를 제어하고 모니터링할 수 있는 앱입니다.

### 주요 기능
- **다단 베드 관리** - 1-4단 베드별 작물 및 재배방식 설정
- **실시간 모니터링** - 온도, 습도, 조도, CO2, EC, pH 센서 데이터
- **디바이스 제어** - Tuya 스마트 스위치를 통한 조명, 팬, 펌프 제어
- **타이머 설정** - 주간 스케줄링으로 자동 제어
- **팀 관리** - 팀별 계정 및 권한 관리
- **웹/모바일** - React Native + Expo로 크로스 플랫폼 지원

## 🚀 기술 스택

### Frontend
- **React Native** - 크로스 플랫폼 모바일 앱
- **Expo** - 개발 및 빌드 도구
- **TypeScript** - 타입 안전성
- **React Navigation** - 화면 네비게이션

### Backend
- **Supabase** - PostgreSQL 데이터베이스
- **Supabase Auth** - 사용자 인증
- **Supabase Realtime** - 실시간 데이터 동기화
- **Row Level Security (RLS)** - 데이터 보안

### IoT
- **Tuya SDK** - 스마트 디바이스 제어
- **MQTT** - 로컬 센서 데이터 수집
- **Raspberry Pi** - 게이트웨이 역할

## 📁 프로젝트 구조

```
smart-farm-app/
├── mobile-app/                 # React Native 앱
│   ├── App.tsx                # 메인 앱 컴포넌트
│   ├── screens/               # 화면 컴포넌트
│   │   ├── BedDetailScreen.tsx
│   │   ├── BedSettingsScreen.tsx
│   │   ├── TeamLoginScreen.tsx
│   │   ├── BedAuthScreen.tsx
│   │   ├── TimerSettingsScreen.tsx
│   │   └── DeviceSetupScreen.tsx
│   ├── lib/                   # 유틸리티 라이브러리
│   │   ├── supabase.ts
│   │   ├── tuya.ts
│   │   └── teamAuth.ts
│   └── android/               # Android 네이티브 코드
├── supabase/                  # 데이터베이스 스키마
│   └── migrations/
├── .env.example              # 환경변수 템플릿
└── README.md                 # 프로젝트 문서
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
```bash
cd mobile-app
npm install
```

### 4. 환경변수 설정
```bash
cp .env.example .env
# .env 파일에 Supabase 및 Tuya 키 설정
```

### 5. 웹 앱 실행
```bash
npm run web
```

### 6. Android 앱 실행
```bash
npm run android
```

### 7. iOS 앱 실행
```bash
npm run ios
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

### 주요 테이블
- `tenants` - 팀/조직 정보
- `farms` - 농장 정보
- `beds` - 베드 정보
- `devices` - 디바이스 정보
- `sensors` - 센서 정보
- `sensor_readings` - 센서 데이터
- `commands` - 제어 명령
- `rules` - 자동화 규칙
- `alerts` - 알림 정보

## 🔐 보안

- **Row Level Security (RLS)** 적용
- **팀별 데이터 격리**
- **JWT 토큰** 기반 인증
- **환경변수**로 민감 정보 관리

## 🚀 배포

### 웹 앱
- **Vercel** 또는 **Netlify** 배포
- **자동 배포** (GitHub Actions)

### 모바일 앱
- **Google Play Store** (Android)
- **Apple App Store** (iOS)
- **Expo Application Services (EAS)** 빌드

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

**💡 팁**: 개발 시작 전에 `md/작업_시작_전_체크리스트.md`를 확인하세요!

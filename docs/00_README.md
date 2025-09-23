# 🌱 스마트팜 프로젝트 개요

## 📋 프로젝트 소개

스마트팜 IoT 제어 및 모니터링 시스템으로, Tuya 스마트스위치를 활용한 단계별 확장 아키텍처를 구현합니다.

## 🎯 핵심 목표

- **Phase 0**: Tuya 스마트스위치 직접 제어 (Android APK)
- **Phase 1**: Raspberry Pi ↔ REST API 센서 데이터 수집
- **Phase 2**: MQTT 브로커를 통한 대규모 확장

## 🏗️ 아키텍처 개요

```
Phase 0 (현재):
Android APK → Tuya SDK → Smart Switch

Phase 1 (센서 연결):
Arduino → Raspberry Pi → REST API → Supabase
Web Admin → Supabase → REST API → Raspberry Pi → Arduino

Phase 2 (확장):
REST + MQTT 브로커 병행 구조
```

## 🔧 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 14, Expo Bare, Tailwind, shadcn/ui |
| **Backend** | Supabase (Postgres + Auth + RLS + Edge Functions) |
| **IoT** | Raspberry Pi (FastAPI), Arduino (센서 허브) |
| **Devices** | Tuya SDK (Android 패키지명 등록 필요) |
| **CI/CD** | GitHub Actions, Vercel, EAS Build |

## 📊 현재 상태 (2025.09.23)

- ✅ **Web Admin**: Next.js + Glassmorphism UI 완료, Supabase 연동 완료
- ✅ **Mobile App**: React Native + Expo + Tuya SDK 네이티브 모듈 완료
- ✅ **Supabase**: 실제 데이터베이스 구조 연동 완료 (2,890개 센서 데이터)
- ✅ **GitHub Actions**: CI/CD 정상 작동
- ✅ **UI/UX**: 현대적인 Glassmorphism 디자인 테마 적용
- ✅ **환경변수**: 모바일 앱(app.json) 및 웹(.env.local) 설정 완료
- 🔄 **Android Studio**: 설치 및 설정 필요 (Tuya SDK 실제 연동용)

## 🚀 구현 단계

### ✅ Phase 0: Tuya 스마트스위치 제어 (완료)
1. ✅ Expo Bare 환경 준비 (prebuild)
2. ✅ Tuya SDK 네이티브 모듈 구현 (Java)
3. ✅ 기기 페어링/제어 화면 구현 (React Native)
4. ✅ 현대적 UI/UX 디자인 적용

### ✅ Phase 1: 웹 어드민 대시보드 (완료)
1. ✅ Next.js 기반 웹 어드민 구현
2. ✅ Supabase 데이터베이스 연동
3. ✅ Glassmorphism UI/UX 디자인
4. ✅ 실시간 센서 데이터 시각화

### 🔄 Phase 2: 실제 Tuya SDK 연동 (진행 중)
1. 🔄 Android Studio 설치 및 설정
2. 🔄 실제 Tuya SDK 라이브러리 연동
3. 🔄 디바이스 등록 및 제어 테스트

### 📋 Phase 3: 센서 데이터 수집 (예정)
1. REST API 라우트 추가
2. Raspberry Pi Python 스크립트 작성
3. 센서 데이터 업로드/제어 명령 처리

### 📋 Phase 4: MQTT 확장 (예정)
1. Mosquitto 브로커 설치
2. REST ↔ MQTT 브리지 구현
3. 대규모 센서 데이터 처리

## 📁 프로젝트 구조

```
smart_on/
├── apps/
│   ├── web-admin/          # Next.js 관리자/사용자 대시보드
│   │   ├── src/app/        # Next.js 13+ App Router
│   │   ├── src/lib/        # Supabase 클라이언트
│   │   └── .env.local      # 환경변수
│   └── mobile-app/         # Expo React Native 앱 (스위치 등록용)
│       ├── src/services/   # Supabase & Tuya 서비스
│       ├── android/        # Android 네이티브 코드
│       │   └── app/src/main/java/com/velomano/smartfarm/
│       │       ├── TuyaSDKModule.java      # Tuya SDK 네이티브 모듈
│       │       ├── TuyaSDKPackage.java     # 모듈 패키지
│       │       └── MainApplication.java    # 메인 애플리케이션
│       └── app.json        # Expo 설정 (환경변수 포함)
├── packages/
│   └── database/           # Supabase 설정
├── docs/                   # 프로젝트 문서
│   ├── UI_DESIGN_SYSTEM.md # UI 디자인 시스템
│   ├── EXISTING_DB_STRUCTURE.md # 기존 DB 구조 분석
│   └── ...                 # 기타 문서들
└── book/                   # Tuya SDK 문서
```

## 🔗 주요 링크

- **Web Admin**: https://smart-on.vercel.app/
- **GitHub**: https://github.com/velomano/smart_on
- **Supabase**: 프로젝트 대시보드
- **Vercel**: 배포 관리

## 📞 연락처

- **개발자**: seochunwoo
- **환경**: macOS (Asia/Seoul) + Expo/Android Studio

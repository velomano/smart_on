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

## 📊 현재 상태 (2025.01.24)

- ✅ **Web Admin**: Next.js + Vercel 배포 완료
- ✅ **Mobile App**: Expo 설정 완료 (Tuya SDK 연동 준비)
- ✅ **Supabase**: 스키마/연동 완료
- ✅ **GitHub Actions**: CI/CD 정상 작동
- 🔄 **Android APK**: EAS Build 환경 준비 중

## 🚀 구현 단계

### Phase 0: Tuya 스마트스위치 제어
1. Expo Bare 환경 준비 (prebuild)
2. Tuya SDK 연결 및 SHA-256 키 등록
3. 기기 페어링/제어 화면 구현

### Phase 1: 센서 데이터 수집
1. REST API 라우트 추가
2. Raspberry Pi Python 스크립트 작성
3. 센서 데이터 업로드/제어 명령 처리

### Phase 2: MQTT 확장
1. Mosquitto 브로커 설치
2. REST ↔ MQTT 브리지 구현
3. 대규모 센서 데이터 처리

## 📁 프로젝트 구조

```
smart-farm-app/
├── apps/
│   ├── web-admin/          # Next.js 관리자 대시보드
│   └── mobile-app/         # Expo React Native 앱
├── packages/
│   ├── database/           # Supabase 설정
│   └── shared/             # 공유 유틸리티
├── docs/                   # 프로젝트 문서
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

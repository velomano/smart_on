# 🌱 스마트팜 프로젝트 개요

## 📋 프로젝트 소개

아두이노 + 라즈베리 파이 조합으로 구성된 스마트팜의 센서 데이터 수집, 분석, 제어를 위한 통합 시스템입니다.

## 🚀 최근 업데이트 (2025.09.28)

### ✅ 완료된 기능들
- **사용자 인증 시스템**: Supabase 기반 완전한 로그인/회원가입 시스템
- **비밀번호 보기/숨기기**: 직관적인 눈 모양 아이콘으로 비밀번호 가시성 제어
- **에러 메시지 한글화**: 사용자 친화적인 한국어 오류 메시지
- **비밀번호 재설정**: 이메일 기반 비밀번호 재설정 기능
- **RLS 정책 최적화**: 중복 정책 제거 및 보안 강화
- **Mock 인증 시스템**: 개발 환경용 대체 인증 시스템
- **환경 변수 설정**: Supabase 연결 설정 완료
- **대시보드 안정성**: undefined 배열 오류 수정으로 안정성 향상

## 🎯 핵심 목표

- **Phase 1**: JSON 기반 웹어드민 + Mock 데이터 시뮬레이션
- **Phase 2**: 라즈베리 파이 + MQTT 연동
- **Phase 3**: 아두이노 하드웨어 연동 (릴레이 모듈 제어)

## 🏗️ 아키텍처 개요

```
Phase 1 (현재):
웹어드민 ←→ Supabase ←→ Mock 데이터 시뮬레이션

Phase 2 (MQTT 연동):
웹어드민 ←→ Supabase ←→ MQTT 브로커 ←→ 라즈베리 파이

Phase 3 (하드웨어 연동):
웹어드민 ←→ Supabase ←→ MQTT ←→ 라즈베리 파이 ←→ 아두이노 ←→ 릴레이 모듈
```

## 🔧 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 14, Expo Bare, Tailwind, shadcn/ui |
| **Backend** | Supabase (Postgres + Auth + RLS + Edge Functions) |
| **IoT** | Raspberry Pi (MQTT 브로커), Arduino (센서 수집 + 릴레이 제어) |
| **Devices** | 릴레이 모듈 (조명, 팬, 펌프 제어) |
| **CI/CD** | GitHub Actions, Vercel, EAS Build |

## 📊 현재 상태 (2025.09.24)

- ✅ **Web Admin**: Next.js + Glassmorphism UI 완료, Supabase 연동 완료
- ✅ **사용자 권한 시스템**: 완전한 RBAC 시스템 구축 완료 (Supabase Auth 연동)
  - 시스템 관리자, 농장장, 팀원 3단계 권한 체계
  - 테넌트-팀-사용자 계층 구조
  - 개인화된 사용자 설정 시스템
  - 활동 로그 및 감사 추적
- ✅ **농장 관리**: 다중 농장 및 베드 관리 시스템 완료 (3개 농장, 6개 베드)
- ✅ **팀원 관리**: 농장장이 자신의 팀원들을 관리할 수 있는 시스템 완료
- ✅ **Supabase 인증**: Mock 인증에서 Supabase Auth로 완전 전환 완료
- ✅ **실시간 알림**: 텔레그램 + 대시보드 동시 알림 시스템 완료
- ✅ **베드 경고 시스템**: 센서 이상 시 베드 카드 자동 깜빡임 구현 완료
- ✅ **Mobile App**: React Native + Expo + Tuya SDK 네이티브 모듈 완료
- ✅ **Android 빌드**: BUILD SUCCESSFUL, APK 파일 생성 완료
- ✅ **IDE 설정**: Java 클래스패스, .project/.classpath 파일 생성 완료
- ✅ **Tuya SDK**: 네이티브 모듈 구현 완료, 빌드 성공
- ✅ **Supabase**: 실제 데이터베이스 구조 연동 완료
- ✅ **GitHub Actions**: CI/CD 정상 작동
- ✅ **UI/UX**: 현대적인 Glassmorphism 디자인 테마 적용
- ✅ **환경변수**: 모바일 앱(app.json) 및 웹(.env.local) 설정 완료
- ✅ **Vercel 배포**: https://smart-on.vercel.app
- ✅ **🌱 양액계산 서비스**: 작물별 최적 배양액 제조 계산 완료 (4종 작물 지원)
- ✅ **📊 시세정보 서비스**: KAMIS API 연동 농산물 시세 조회 완료
- ✅ **Mock 데이터 시뮬레이션**: 센서 데이터 및 액추에이터 제어 시뮬레이션 완료
- 🚀 **다음 단계**: 관리자 대시보드 구축 및 더 많은 작물 데이터 추가

## 🚀 구현 단계

### ✅ Phase 0: 웹어드민 기반 구축 (완료)
1. ✅ Next.js 기반 웹어드민 구현
2. ✅ Supabase 데이터베이스 연동
3. ✅ 사용자 권한 시스템 구현
4. ✅ 농장 및 베드 관리 시스템
5. ✅ Mock 인증 시스템
6. ✅ Vercel 배포 완료

### ✅ Phase 1: JSON 기반 Mock 데이터 시뮬레이션 (완료)
1. ✅ Mock 센서 데이터 시뮬레이션 구현
2. ✅ Mock 액추에이터 제어 시뮬레이션 구현
3. ✅ MQTT 통신 구조 설계
4. ✅ JSON 데이터 형식 표준화
5. ✅ 🌱 양액계산 서비스 구현 (4종 작물 지원)
6. ✅ 📊 시세정보 서비스 구현 (KAMIS API 연동)

### 📋 Phase 2: 라즈베리 파이 + MQTT 연동 (예정)
1. 라즈베리 파이에 MQTT 브로커 설치
2. 센서 데이터 수집 시뮬레이션
3. 제어 명령 처리 시뮬레이션
4. 웹어드민과 MQTT 연동

### 📋 Phase 3: 아두이노 하드웨어 연동 (예정)
1. 실제 센서 연결
2. 릴레이 모듈로 액추에이터 제어
3. 실시간 데이터 수집 및 제어
4. 완전한 하드웨어 연동 완료

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

- **Web Admin**: https://smart-on.vercel.app
- **GitHub**: https://github.com/velomano/smart_on
- **Supabase**: 프로젝트 대시보드
- **Vercel**: 배포 관리

## 🌱 새로 추가된 서비스

### 양액계산 서비스
- **접근**: 웹 어드민 → "🌱 양액계산" 메뉴
- **지원 작물**: 상추, 토마토, 오이, 딸기 (4종)
- **기능**: 작물별 최적 배양액 제조 계산, A/B 탱크 분리, EC/pH 추정

### 시세정보 서비스  
- **접근**: 웹 어드민 → "📊 시세정보" 메뉴
- **데이터 소스**: KAMIS 농산물 시세 API
- **기능**: 실시간 시세 조회, 가격 검색, 월별 추이 분석

## 🧪 테스트 계정

- **시스템 관리자**: test1@test.com / password
- **1농장장**: test2@test.com / password
- **2농장장**: test4@test.com / password
- **3농장장**: test6@test.com / password
- **팀원들**: test3@test.com, test5@test.com, test7@test.com / password

## 📞 연락처

- **개발자**: seochunwoo
- **환경**: macOS (Asia/Seoul) + Expo/Android Studio

# 환경 변수 설정 가이드

> 스마트팜 시스템의 환경 변수 설정 및 관리 가이드

## 📋 목차

- [개요](#개요)
- [프로젝트 구조](#프로젝트-구조)
- [Universal Bridge 환경 변수](#universal-bridge-환경-변수)
- [웹 어드민 환경 변수](#웹-어드민-환경-변수)
- [설정 방법](#설정-방법)
- [환경별 설정](#환경별-설정)
- [문제 해결](#문제-해결)

## 🎯 개요

스마트팜 시스템은 두 개의 주요 서버로 구성되어 있으며, 각각 독립적인 환경 변수 파일을 사용합니다:

- **Universal Bridge**: IoT 디바이스 연결 및 데이터 처리 서버
- **웹 어드민**: 사용자 인터페이스 및 관리 시스템

## 📁 프로젝트 구조

```
smart-on/
├── apps/
│   ├── universal-bridge/
│   │   ├── .env                    # Universal Bridge 환경 변수
│   │   └── env.example             # 환경 변수 템플릿
│   └── web-admin/
│       └── .env.local              # 웹 어드민 환경 변수
└── docs/
    └── ENVIRONMENT_VARIABLES.md    # 이 문서
```

## 🌉 Universal Bridge 환경 변수

### 📍 파일 위치
```
apps/universal-bridge/.env
```

### 🔧 환경 변수 목록

#### **Supabase 연동**
```bash
# Supabase 프로젝트 URL
SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co

# Supabase 서비스 역할 키 (서버 사이드 전용)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **보안 설정**
```bash
# 디바이스 통신 암호화 키 (32자 이상)
BRIDGE_ENCRYPTION_KEY=smartfarm-universal-bridge-key-32

# 개발 모드에서 서명 검증 우회 (프로덕션에서는 false)
SIGNATURE_VERIFY_OFF=true
```

#### **포트 설정**
```bash
# HTTP API 서버 포트
BRIDGE_HTTP_PORT=8080

# WebSocket 서버 포트
BRIDGE_WS_PORT=8081
```

#### **서버 URL 설정**
```bash
# 브릿지 서버 주소 (QR 코드 및 API 호출용)
BRIDGE_SERVER_URL=http://localhost:8080

# 웹 어드민 주소 (QR 코드 생성 시 사용)
WEB_ADMIN_URL=http://localhost:3000
```

#### **환경 설정**
```bash
# Node.js 환경
NODE_ENV=development

# 로그 레벨 (debug, info, warn, error)
LOG_LEVEL=info
```

### 📝 완전한 Universal Bridge .env 파일

```bash
# =====================================================
# Universal Bridge v2.0 Environment Variables
# =====================================================

# ==================== Supabase ====================
SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4

# ==================== Security ====================
BRIDGE_ENCRYPTION_KEY=smartfarm-universal-bridge-key-32

# ==================== Ports ====================
BRIDGE_HTTP_PORT=8080
BRIDGE_WS_PORT=8081

# ==================== Server URL ====================
# 로컬 개발: http://localhost:8080
BRIDGE_SERVER_URL=http://localhost:8080

# 웹어드민 URL (QR 코드용)
# 로컬 개발: http://localhost:3000
WEB_ADMIN_URL=http://localhost:3000

# ==================== Environment ====================
NODE_ENV=development
LOG_LEVEL=info

# ==================== Security ====================
# 개발 모드에서 서명 검증 우회 (true/false)
# 프로덕션에서는 반드시 false로 설정!
SIGNATURE_VERIFY_OFF=true
```

## 🌐 웹 어드민 환경 변수

### 📍 파일 위치
```
apps/web-admin/.env.local
```

### 🔧 환경 변수 목록

#### **Supabase 연동 (클라이언트)**
```bash
# 브라우저에서 접근 가능한 Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Supabase 연동 (서버)**
```bash
# 서버 사이드에서만 접근 가능한 Supabase 설정
SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Telegram 알림 설정**
```bash
# Telegram 봇 토큰
TELEGRAM_BOT_TOKEN=8405537801:AAGm3ycoklEtpNcAyBShI1_nKvOEFGBf_uQ

# 알림을 받을 채팅 ID
TELEGRAM_CHAT_ID=6827239951
```

### 📝 완전한 웹 어드민 .env.local 파일

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxOTgsImV4cCI6MjA3NDExODE5OH0.oo-iIviVJ2oaWZldtmkYo1sWgHbxxIIkFUrBrU8rQqY

# 텔레그램 알림 설정
TELEGRAM_BOT_TOKEN=8405537801:AAGm3ycoklEtpNcAyBShI1_nKvOEFGBf_uQ
TELEGRAM_CHAT_ID=6827239951

# Supabase
SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxOTgsImV4cCI6MjA3NDExODE5OH0.oo-iIviVJ2oaWZldtmkYo1sWgHbxxIIkFUrBrU8rQqY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4
```

## 🚀 설정 방법

### 1. 새 컴퓨터에서 환경 변수 설정

#### **Universal Bridge 설정**
```bash
# 1. 프로젝트 디렉토리로 이동
cd /path/to/smart-on

# 2. Universal Bridge 환경 변수 파일 생성
nano apps/universal-bridge/.env

# 3. 위의 Universal Bridge .env 내용을 복사하여 붙여넣기
# 4. 저장 후 종료 (Ctrl+X, Y, Enter)
```

#### **웹 어드민 설정**
```bash
# 1. 웹 어드민 환경 변수 파일 생성
nano apps/web-admin/.env.local

# 2. 위의 웹 어드민 .env.local 내용을 복사하여 붙여넣기
# 3. 저장 후 종료 (Ctrl+X, Y, Enter)
```

### 2. 서버 실행

#### **Universal Bridge 서버**
```bash
cd apps/universal-bridge
npm install
npm run dev
# 서버가 포트 8080에서 실행됩니다
```

#### **웹 어드민 서버**
```bash
cd apps/web-admin
npm install
npm run dev
# 서버가 포트 3000에서 실행됩니다
```

### 3. 접속 확인

- **웹 어드민**: http://localhost:3000
- **Universal Bridge API**: http://localhost:8080/health

## 🌍 환경별 설정

### 개발 환경 (Development)

#### **로컬 개발**
```bash
# Universal Bridge
BRIDGE_SERVER_URL=http://localhost:8080
WEB_ADMIN_URL=http://localhost:3000
SIGNATURE_VERIFY_OFF=true
NODE_ENV=development
```

#### **네트워크 개발** (다른 컴퓨터에서 접근)
```bash
# Universal Bridge
BRIDGE_SERVER_URL=http://192.168.1.100:8080
WEB_ADMIN_URL=http://192.168.1.100:3000
SIGNATURE_VERIFY_OFF=true
NODE_ENV=development
```

### 프로덕션 환경 (Production)

```bash
# Universal Bridge
BRIDGE_SERVER_URL=https://bridge.smartfarm.app
WEB_ADMIN_URL=https://admin.smartfarm.app
SIGNATURE_VERIFY_OFF=false
NODE_ENV=production
LOG_LEVEL=warn
```

## 🔗 서버 간 연결 구조

```mermaid
graph TB
    A[웹 어드민<br/>포트 3000] --> B[Universal Bridge<br/>포트 8080]
    B --> C[Supabase<br/>데이터베이스]
    B --> D[IoT 디바이스<br/>센서 데이터]
    A --> E[Telegram<br/>알림 시스템]
    
    F[사용자] --> A
    G[모바일 앱] --> B
    H[Arduino/ESP32] --> B
```

## ⚠️ 보안 주의사항

### 1. 환경 변수 파일 보안
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env*` 패턴이 포함되어 있는지 확인하세요
- 프로덕션에서는 환경 변수를 안전한 방식으로 관리하세요

### 2. 키 관리
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용
- `SIGNATURE_VERIFY_OFF=true`는 개발 환경에서만 사용
- 프로덕션에서는 반드시 `SIGNATURE_VERIFY_OFF=false`

### 3. 네트워크 보안
- 로컬 개발 시 방화벽 설정 확인
- 프로덕션에서는 HTTPS 사용 필수

## 🔧 문제 해결

### 자주 발생하는 문제들

#### **1. 포트 충돌**
```bash
# 에러: EADDRINUSE: address already in use :::8080
# 해결: 다른 포트 사용 또는 기존 프로세스 종료
lsof -ti:8080 | xargs kill -9
```

#### **2. 환경 변수 인식 안됨**
```bash
# 서버 재시작
npm run dev
```

#### **3. Supabase 연결 실패**
```bash
# 환경 변수 확인
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### **4. WebSocket 연결 실패**
```bash
# Universal Bridge 서버 상태 확인
curl http://localhost:8080/health
```

### 로그 확인 방법

#### **Universal Bridge 로그**
```bash
cd apps/universal-bridge
npm run dev
# 콘솔에서 실시간 로그 확인
```

#### **웹 어드민 로그**
```bash
cd apps/web-admin
npm run dev
# 브라우저 개발자 도구 > Console 탭
```

## 📞 지원

환경 변수 설정에 문제가 있으면:

1. 이 문서의 설정 방법을 다시 확인
2. 서버 로그에서 에러 메시지 확인
3. 팀 슬랙 채널에서 문의

---

**마지막 업데이트**: 2025-10-02  
**문서 버전**: 1.0.0

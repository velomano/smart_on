# 📚 SmartOn 문서 목록

## 🏗️ 시스템 아키텍처
- [**시스템 통합 개요**](./SYSTEM_INTEGRATION_OVERVIEW.md) - 전체 시스템 구조 및 최신 업데이트
- [**기술 아키텍처**](./TECHNICAL_ARCHITECTURE.md) - 전체 시스템 구조 및 기술 스택
- [**Universal Bridge MQTT 아키텍처**](./UNIVERSAL_BRIDGE_MQTT_ARCHITECTURE.md) - MQTT 전용 브릿지 시스템
- [**시스템 안정성 아키텍처**](./SYSTEM_STABILITY_ARCHITECTURE.md) - 로깅, 에러 처리, 모니터링 시스템
- [**MQTT 브리지 아키텍처**](./MQTT_BRIDGE_ARCHITECTURE.md) - MQTT 통신 및 브리지 시스템

## 🗄️ 데이터베이스
- [**기존 DB 구조**](./EXISTING_DB_STRUCTURE.md) - 현재 Supabase 데이터베이스 구조
- [**사용자 권한 시스템**](./USER_PERMISSION_SYSTEM.md) - 사용자 역할 및 권한 관리

## 🔧 IoT Designer (NEW!)
- [**IoT Designer 가이드**](./13_IOT_DESIGNER.md) - 다중 장치 지원 IoT 설계 시스템
- [**IoT Designer 워크플로우 개선**](./IOT_DESIGNER_WORKFLOW_UPDATE_2025_01_03.md) - QR 코드 분리 및 워크플로우 개선 (2025-01-03)
- [**펌웨어 템플릿 퀵스타트**](./14_FIRMWARE_TEMPLATES_QUICKSTART.md) - 펌웨어 템플릿 사용 가이드
- [**LoRaWAN 통합 가이드**](./15_LORAWAN_INTEGRATION_GUIDE.md) - LoRaWAN 프로토콜 통합
- [**연결 마법사**](./15_CONNECTION_WIZARD.md) - 디바이스 연결 설정 가이드

## 🔐 인증 및 보안
- [**사용자 인증 시스템**](./USER_AUTH_SYSTEM.md) - 로그인, 회원가입, 비밀번호 관리
- [**사용자 권한 시스템**](./USER_PERMISSION_SYSTEM.md) - 역할 기반 접근 제어

## 🚀 배포 및 운영
- [**Cron 작업 설정**](./CRON_SETUP.md) - 자동화 작업 설정 가이드
- [**Vercel 배포 가이드**](./VERCEL_DEPLOYMENT.md) - Vercel 배포 및 설정

## 📱 개발 가이드
- [**Cursor 명령어**](./CURSOR_COMMANDS.md) - Cursor IDE 사용 가이드
- [**개발 환경 설정**](./DEVELOPMENT_SETUP.md) - 로컬 개발 환경 구축

## 🔧 시스템 구성 요소

### 웹 어드민 대시보드
- **기술 스택**: Next.js 15, TypeScript, Tailwind CSS
- **주요 기능**: 농장 관리, 센서 모니터링, 사용자 관리, 영양액 관리, IoT Designer
- **시스템 안정성**: 통합 로깅, 에러 처리, 모니터링 대시보드

### Universal Bridge (MQTT 전용)
- **기능**: 내장 MQTT 브로커, 센서 데이터 수집, 디바이스 제어, 실시간 통신
- **프로토콜**: MQTT 전용 (HTTP 제거), JSON 메시지 포맷
- **아키텍처**: Southbound 다양화 + Northbound MQTT 일원화
- **지원 장치**: ESP32, ESP8266, Arduino Uno/R4, 라즈베리파이3/4/5

### IoT Designer (NEW!)
- **기능**: 자연어 기반 IoT 시스템 설계, 자동 코드 생성, 하드웨어 연결 가이드
- **지원 장치**: 7가지 주요 IoT 장치 (ESP32, ESP8266, Arduino, 라즈베리파이)
- **코드 생성**: ZIP 파일 (main.ino, config.json, platformio.ini, README.md)
- **특화 설정**: 장치별 PlatformIO 설정, 핀 매핑, 라이브러리 의존성

### 데이터베이스
- **플랫폼**: Supabase (PostgreSQL)
- **주요 테이블**: users, farms, beds, devices, sensors, sensor_readings
- **보안**: Row Level Security (RLS) 정책 적용

## 🛡️ 시스템 안정성 (NEW!)

### 통합 로깅 시스템
- **Winston 기반**: 구조화된 로깅
- **로그 타입**: API, 사용자 활동, 시스템 이벤트, 보안, 성능
- **환경별 설정**: 개발환경(파일+콘솔), 프로덕션(콘솔만)

### 전역 에러 처리
- **에러 타입 분류**: 인증, 권한, 데이터베이스, 네트워크 등
- **표준화된 응답**: 일관된 에러 형식 및 HTTP 상태 코드
- **자동 로깅**: 모든 에러 자동 기록

### 시스템 모니터링
- **실시간 대시보드**: 시스템 상태, 성능 메트릭, 사용자 통계
- **자동 새로고침**: 30초 간격 데이터 업데이트
- **헬스 체크**: 데이터베이스 연결, 메모리 사용률, 가동 시간

### 보안 강화
- **Rate Limiting**: 분당 100회 요청 제한
- **요청 추적**: IP, User-Agent, 요청 ID 로깅
- **접근 권한**: 시스템 관리자만 모니터링 접근

## 📊 모니터링 지표

### 시스템 헬스
- 데이터베이스 연결 상태
- 메모리 사용률
- 시스템 가동 시간
- Node.js 버전 및 플랫폼

### 사용자 통계
- 총 사용자 수
- 활성 사용자 (24시간 내)
- 승인된 사용자 수
- 승인 대기 사용자 수

### 농장 및 디바이스
- 총 농장 수 / 활성 농장 수
- 총 디바이스 수 / 온라인 디바이스 수
- 디바이스 타입별 분포

### 센서 데이터
- 총 센서 수 / 활성 센서 수
- 센서 타입별 분포
- 센서 데이터 수집량 (총계, 24시간, 시간당 평균)

### 성능 메트릭
- 평균 응답 시간
- 에러율
- 시스템 가동 시간

## 🔗 관련 링크

- **GitHub 저장소**: [SmartOn Repository](https://github.com/velomano/smart_on)
- **Vercel 배포**: [SmartOn Web Admin](https://web-admin-smart-on.vercel.app)
- **Supabase 대시보드**: [Database Management](https://supabase.com/dashboard)

## 📞 지원 및 문의

시스템 관련 문의사항이나 문제가 발생한 경우:

1. **로그 확인**: 먼저 관련 로그 파일 확인
2. **모니터링 대시보드**: 시스템 상태 확인 (`/system`)
3. **개발팀 문의**: 기술적 문제 해결 필요 시

---

**문서 버전**: v2.0  
**최종 업데이트**: 2025-01-30  
**작성자**: SmartOn 개발팀

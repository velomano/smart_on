# 🌱 SmartOn - 웹 어드민 대시보드

인도어 스마트팜 ALL-IN-ONE BOARD를 위한 웹 관리자 대시보드입니다.

## 🚀 주요 기능

### 📊 농장 관리
- 🏠 농장 및 베드 관리
- 🌱 센서 모니터링 및 제어
- 📈 실시간 데이터 시각화
- 🔧 MQTT 브리지 설정

### 👥 사용자 관리
- 👤 사용자 권한 관리 (시스템 관리자, 농장장, 팀원)
- 🏢 팀별 농장 할당
- ✅ 사용자 승인 시스템

### 🌱 영양액 관리
- 📊 배양액 찾기 (페이지네이션 지원)
- 🧪 다양한 작물별 레시피 제공
- 📚 출처별 정보 및 링크

### 🛡️ 시스템 안정성 (NEW!)
- 📝 통합 로깅 시스템 (Winston 기반)
- 🚨 전역 에러 처리 및 API 미들웨어
- 📊 시스템 모니터링 대시보드
- 🔒 Rate Limiting 및 보안 강화
- ⚡ 성능 모니터링

### 🔔 알림 시스템
- 📱 텔레그램 봇 연동
- 🚨 실시간 알림 발송
- 📧 사용자별 알림 설정

### 💡 디바이스 제어
- 🔌 스마트 스위치 제어
- 🌡️ 센서 데이터 수집
- 📡 MQTT 통신 관리

## 텔레그램 봇 설정

### 1. 봇 토큰 발급
1. 텔레그램 앱에서 @BotFather 검색하여 채팅
2. `/newbot` 명령 입력
3. 봇 이름과 사용자명 설정
4. 받은 토큰을 복사

### 2. 환경변수 설정 (Vercel)
1. Vercel 대시보드 → Project Settings → Environment Variables
2. `TELEGRAM_BOT_TOKEN` : 발급받은 봇 토큰 입력
3. `TELEGRAM_CHAT_ID` (선택): 기본 채팅 ID 설정

### 3. 채팅 ID 확인
1. 봇과 1:1 메시지에서 `/start` 입력
2. https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates 접속하여 chat ID 확인

## 🛠️ 시스템 요구사항

- Node.js 18.17.0 이상
- npm 또는 yarn
- Supabase 계정 및 프로젝트
- 텔레그램 봇 토큰 (알림 기능 사용 시)

## 🚀 개발 환경 설정

### 1. 프로젝트 클론 및 의존성 설치
```bash
git clone <repository-url>
cd apps/web-admin
npm install
```

### 2. 환경변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 텔레그램 봇 (선택사항)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# 기타 설정
NODE_ENV=development
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속하여 확인하세요.

## 📊 시스템 모니터링

### 모니터링 대시보드 접근
1. **시스템 관리자로 로그인**
2. **햄버거 메뉴 → "시스템 모니터링" 클릭**
3. **실시간 시스템 상태 및 메트릭 확인**

### 주요 모니터링 지표
- 🏥 **시스템 헬스**: 데이터베이스 연결, 메모리 사용률
- 👥 **사용자 통계**: 활성 사용자, 승인 상태
- 🏭 **농장/디바이스**: 온라인 디바이스, 센서 상태
- 📈 **성능 메트릭**: 응답 시간, 에러율

## 🔧 API 문서

### 시스템 모니터링 API
- `GET /api/system/health` - 시스템 헬스 체크
- `GET /api/system/metrics` - 시스템 메트릭 수집

### 주요 기능 API
- `GET/POST /api/bed-crop-data` - 베드 작물 정보 관리
- `GET /api/nutrients/browse` - 영양액 레시피 조회 (페이지네이션)
- `POST /api/user-settings` - 사용자 설정 관리

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
<!-- GitHub Actions 테스트 -->

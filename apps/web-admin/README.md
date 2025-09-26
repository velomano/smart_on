# 🌱 TeraHub - 웹 어드민 대시보드

인도어 스마트팜 ALL-IN-ONE BOARD를 위한 웹 관리자 대시보드입니다.

## 주요 기능
- 🏠 농장 및 베드 관리
- 🌱 센서 모니터링 및 제어
- 👥 사용자 권한 관리  
- 📊 시세정보 및 양액계산
- 🚨 실시간 알림 시스템 (텔레그램 연동)
- 💡 스마트 스위치 제어

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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
<!-- GitHub Actions 테스트 -->

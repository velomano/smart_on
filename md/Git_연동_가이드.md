# 🔄 Git 연동 가이드

## 📋 Git 연동 목적

### 1. 버전 관리
- **코드 변경사항** 추적 및 관리
- **백업** 및 **복구** 기능
- **협업** 시 충돌 방지

### 2. 배포 관리
- **브랜치별** 환경 분리 (개발/스테이징/프로덕션)
- **자동 배포** 파이프라인 구축
- **롤백** 기능

### 3. 협업 효율성
- **코드 리뷰** 프로세스
- **이슈 트래킹** 연동
- **문서화** 자동화

## 🚀 Git 연동 계획

### 1단계: 기본 Git 설정
```bash
# Git 초기화
git init

# .gitignore 설정
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "android/app/build/" >> .gitignore
echo "ios/build/" >> .gitignore

# 첫 커밋
git add .
git commit -m "Initial commit: Smart Farm App v1.0"
```

### 2단계: GitHub 저장소 생성
- **Private 저장소** 생성 (보안상 중요)
- **README.md** 자동 생성
- **라이선스** 설정

### 3단계: 브랜치 전략
```
main (프로덕션)
├── develop (개발)
├── feature/android-build-fix
├── feature/pwa-enhancement
└── feature/real-time-data
```

### 4단계: CI/CD 파이프라인
- **GitHub Actions** 설정
- **자동 빌드** 및 **테스트**
- **자동 배포** (웹/Android)

## 📁 Git 연동할 파일들

### ✅ 포함할 파일들
```
smart-farm-app/
├── mobile-app/
│   ├── App.tsx
│   ├── screens/
│   ├── lib/
│   ├── android/
│   └── package.json
├── supabase/
│   └── migrations/
├── .env.example
└── README.md
```

### ❌ 제외할 파일들
```
smart-farm-app/
├── node_modules/
├── .env
├── android/app/build/
├── ios/build/
└── .expo/
```

## 🔧 Git 명령어 가이드

### 기본 명령어
```bash
# 상태 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "작업 내용 설명"

# 푸시
git push origin main

# 풀
git pull origin main
```

### 브랜치 관리
```bash
# 브랜치 생성
git checkout -b feature/android-build-fix

# 브랜치 전환
git checkout main

# 브랜치 병합
git merge feature/android-build-fix

# 브랜치 삭제
git branch -d feature/android-build-fix
```

## 📝 커밋 메시지 규칙

### 형식
```
<타입>: <제목>

<본문>

<푸터>
```

### 타입
- **feat**: 새로운 기능
- **fix**: 버그 수정
- **docs**: 문서 수정
- **style**: 코드 스타일 변경
- **refactor**: 코드 리팩토링
- **test**: 테스트 추가/수정
- **chore**: 빌드/설정 변경

### 예시
```
feat: 다단 베드 설정 기능 추가

- 1-4단 베드 설정 구현
- 작물명 및 재배방식 선택 기능
- 목표 환경 설정 (온도, 습도, EC, pH)

Closes #123
```

## 🚀 GitHub Actions 설정

### 웹 앱 자동 배포
```yaml
name: Deploy Web App
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Build web app
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

### Android APK 자동 빌드
```yaml
name: Build Android APK
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Setup Java
        uses: actions/setup-java@v2
        with:
          java-version: '17'
      - name: Install dependencies
        run: npm install
      - name: Build Android APK
        run: npx expo build:android
```

## 📋 내일 작업 계획

### 1. Git 저장소 초기화
- [ ] Git 초기화 및 설정
- [ ] .gitignore 파일 생성
- [ ] 첫 커밋 생성

### 2. GitHub 저장소 생성
- [ ] Private 저장소 생성
- [ ] README.md 작성
- [ ] 원격 저장소 연결

### 3. 브랜치 전략 설정
- [ ] main 브랜치 보호 설정
- [ ] develop 브랜치 생성
- [ ] feature 브랜치 생성

### 4. CI/CD 파이프라인 구축
- [ ] GitHub Actions 설정
- [ ] 자동 빌드 파이프라인
- [ ] 자동 배포 파이프라인

## 🎯 Git 연동 후 기대 효과

### 1. 개발 효율성 향상
- **코드 변경사항** 추적 용이
- **협업** 시 충돌 방지
- **백업** 및 **복구** 기능

### 2. 배포 자동화
- **자동 빌드** 및 **테스트**
- **자동 배포** 파이프라인
- **롤백** 기능

### 3. 프로젝트 관리
- **이슈 트래킹** 연동
- **코드 리뷰** 프로세스
- **문서화** 자동화

---

**💡 팁**: Git 연동 후에는 매일 작업 시작 전에 `git pull`로 최신 변경사항을 가져오세요!

# GitHub Actions 크론 설정 가이드

## 🔧 **필요한 설정**

### 1. GitHub Secrets 설정
Repository → Settings → Secrets and variables → Actions에서 다음 시크릿 추가:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_FN_URL=https://your-project.supabase.co/functions/v1
WORKER_URL=https://your-worker-domain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... (선택사항)
```

### 2. 워커 서버 배포
워커를 별도 서버에 배포하거나 Vercel Functions로 배포:

```bash
# Vercel Functions로 워커 배포
vercel --prod --cwd apps/worker
```

## 📅 **크론 스케줄 설정**

### 현재 설정
```yaml
schedule:
  - cron: '0 18 * * 0'  # 매주 일요일 오후 6시 (UTC) = 월요일 오전 3시 (KST)
```

### 다른 스케줄 옵션
```yaml
# 매일 오전 2시 (KST)
- cron: '17 * * *'

# 매주 월요일, 목요일 오전 3시 (KST)
- cron: '0 18 * * 0,3'

# 매월 1일 오전 3시 (KST)
- cron: '0 18 1 * *'
```

## 🚀 **수동 실행**

### GitHub Actions에서 수동 실행
1. Repository → Actions 탭
2. "영양액 레시피 자동 수집" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. 소스 선택 (all, cornell, rda, fao, academic)

### API로 수동 실행
```bash
curl -X POST https://api.github.com/repos/OWNER/REPO/actions/workflows/nutrient-collection.yml/dispatches \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"ref":"main","inputs":{"source":"all"}}'
```

## 📊 **모니터링**

### 1. GitHub Actions 로그 확인
- Repository → Actions → 워크플로우 실행 기록
- 각 단계별 로그 확인 가능
- 실패 시 자동 알림

### 2. Slack 알림 설정 (선택사항)
```yaml
- name: 수집 결과 알림
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: "영양액 레시피 수집 완료"
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🔍 **디버깅**

### 일반적인 문제
1. **Secrets 누락**: 환경변수가 제대로 설정되지 않음
2. **워커 서버 접근 불가**: WORKER_URL이 올바르지 않음
3. **권한 문제**: Supabase Service Role Key 권한 부족

### 해결 방법
1. GitHub Secrets 재확인
2. 워커 서버 상태 확인
3. Supabase 권한 설정 확인

## ⚡ **성능 최적화**

### 병렬 처리
```yaml
strategy:
  matrix:
    source: [cornell, rda, fao, academic]
```

### 캐싱
```yaml
- name: 의존성 캐싱
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## 🎯 **배포 체크리스트**

- [ ] GitHub Secrets 설정 완료
- [ ] 워커 서버 배포 완료
- [ ] 첫 수동 실행 테스트
- [ ] 크론 스케줄 확인
- [ ] 알림 설정 (선택사항)
- [ ] 모니터링 대시보드 구축

이제 **GitHub Actions**로 완전 자동화된 영양액 레시피 수집이 가능합니다! 🎉

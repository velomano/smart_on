# 실전형 영양액 자동 수집 시스템 - 크론 설정

## 🕐 크론 작업 설정

### Vercel Cron 설정
```json
{
  "crons": [
    {
      "path": "/api/collect",
      "schedule": "0 3 * * 1"
    }
  ]
}
```

**스케줄 설명:**
- `0 3 * * 1` = 매주 월요일 오전 3시 (KST)
- 서버 부하가 적은 시간대에 실행
- 주간 단위로 새로운 레시피 수집

### 📅 추가 크론 옵션

#### 1. 일일 수집 (테스트용)
```json
{
  "path": "/api/collect",
  "schedule": "0 2 * * *"
}
```

#### 2. 월간 수집 (안정화 후)
```json
{
  "path": "/api/collect", 
  "schedule": "0 1 1 * *"
}
```

#### 3. 다중 스케줄
```json
{
  "crons": [
    {
      "path": "/api/collect",
      "schedule": "0 3 * * 1"
    },
    {
      "path": "/api/collect",
      "schedule": "0 4 * * 4"
    }
  ]
}
```

## 🔧 크론 작업 모니터링

### 로그 확인
```bash
# Vercel 로그 확인
vercel logs --follow

# 특정 함수 로그
vercel logs /api/collect --follow
```

### 상태 확인 API
```bash
# 최근 수집 작업 조회
GET /api/collect?limit=10

# 헬스체크
GET /api/collect/health
```

## 📊 크론 작업 통계

### 성공률 모니터링
- 목표: 95% 이상 성공률
- 실패 시 자동 재시도 (3회)
- 실패 로그 자동 저장

### 데이터 품질 지표
- 수집된 레시피 수
- 중복 제거율
- 신뢰도 점수 평균
- 새로운 레시피 발견율

## 🚀 배포 및 활성화

### 1. Vercel 배포
```bash
vercel --prod
```

### 2. 크론 작업 활성화
- Vercel 대시보드에서 Cron Jobs 활성화
- 환경변수 설정 확인
- 첫 실행 테스트

### 3. 모니터링 설정
- 알림 설정 (실패 시 이메일/Slack)
- 대시보드 구축
- 성능 메트릭 수집

## ⚙️ 환경변수 설정

```bash
# Vercel 환경변수
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_FN_URL
vercel env add WORKER_URL
```

## 🔍 크론 작업 디버깅

### 일반적인 문제
1. **타임아웃**: 함수 실행 시간 초과
2. **메모리 부족**: 대용량 데이터 처리
3. **네트워크 오류**: 외부 API 호출 실패
4. **권한 문제**: Supabase 접근 권한

### 해결 방법
1. 함수 타임아웃 증가 (최대 300초)
2. 배치 처리로 메모리 사용량 최적화
3. 재시도 로직 및 에러 핸들링 강화
4. Service Role Key 권한 확인

## 📈 성능 최적화

### 병렬 처리
- 여러 소스 동시 수집
- 비동기 처리 최적화
- 연결 풀 관리

### 캐싱 전략
- 중복 요청 방지
- 임시 데이터 저장
- 효율적인 데이터베이스 쿼리

이제 **매주 월요일 오전 3시**에 자동으로 영양액 레시피를 수집합니다! 🎉

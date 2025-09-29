# 🚀 영양액 자동 수집 시스템 구축 명령어

## 📋 빠른 시작 가이드

### 1. 데이터베이스 마이그레이션 실행
```bash
# Supabase CLI 사용 (권장)
supabase db push

# 또는 직접 SQL 실행
psql -h your-db-host -U postgres -d postgres -f packages/database/supabase/migrations/20250101_nutrient_auto_collection.sql
```

### 2. Supabase Edge Function 배포
```bash
# Edge Function 배포
supabase functions deploy ingest-nutrient

# 배포 상태 확인
supabase functions list
```

### 3. 워커 서비스 설정 및 실행
```bash
# 워커 디렉토리로 이동
cd apps/worker

# 의존성 설치
npm install

# 개발 서버 실행 (포트 3001)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### 4. 환경변수 설정
```bash
# .env.local 파일에 추가
echo "WORKER_ORIGIN=http://localhost:3001" >> apps/web-admin/.env.local
echo "SUPABASE_FN_URL=https://your-project.supabase.co/functions/v1/ingest-nutrient" >> apps/web-admin/.env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> apps/web-admin/.env.local
```

### 5. Next.js 개발 서버 실행
```bash
# 웹 어드민 디렉토리로 이동
cd apps/web-admin

# 개발 서버 실행 (포트 3000)
npm run dev
```

## 🧪 테스트 명령어

### 1. 워커 서버 테스트
```bash
# 헬스 체크
curl http://localhost:3001/health

# Cornell 레시피 수집 테스트
curl http://localhost:3001/sources/cornell

# 전체 소스 수집 테스트
curl http://localhost:3001/sources/all
```

### 2. Next.js API 테스트
```bash
# 즉시 수집 요청
curl -X POST http://localhost:3000/api/collect \
  -H "Content-Type: application/json" \
  -d '{"source": "cornell"}'

# 수집 작업 상태 확인
curl http://localhost:3000/api/collect?limit=5
```

### 3. 데이터베이스 확인
```sql
-- 수집된 레시피 확인
SELECT crop_key, stage, target_ec, target_ph, reliability, collected_at 
FROM vw_crop_recipes_latest 
ORDER BY collected_at DESC;

-- 수집 작업 로그 확인
SELECT type, status, started_at, finished_at, error 
FROM nutrient_jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- 데이터 소스 확인
SELECT name, org_type, reliability_default, created_at 
FROM nutrient_sources;
```

## 🚀 배포 명령어

### 1. Vercel 배포 (크론 작업 포함)
```bash
# 프로덕션 배포
vercel --prod

# 크론 작업 확인
vercel cron ls

# 크론 작업 수동 실행
vercel cron run collect
```

### 2. Docker 배포 (선택사항)
```bash
# 워커 서비스 Docker 빌드
cd apps/worker
docker build -t smarton-worker .

# Docker 실행
docker run -p 3001:3001 --env-file .env smarton-worker
```

## 🔧 개발 도구 명령어

### 1. 코드 품질 검사
```bash
# 워커 서비스 린트
cd apps/worker
npm run lint

# 타입 체크
npm run type-check

# 테스트 실행
npm test
```

### 2. 로그 모니터링
```bash
# 워커 서버 로그 실시간 확인
tail -f apps/worker/logs/combined.log

# 에러 로그만 확인
tail -f apps/worker/logs/error.log

# Vercel 함수 로그 확인
vercel logs --follow
```

### 3. 데이터베이스 관리
```bash
# Supabase 상태 확인
supabase status

# Edge Function 로그 확인
supabase functions logs ingest-nutrient

# 데이터베이스 백업
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🚨 문제 해결 명령어

### 1. 연결 테스트
```bash
# Supabase 연결 테스트
supabase status

# 데이터베이스 연결 테스트
psql -h your-db-host -U postgres -d postgres -c "SELECT 1;"

# 워커 서버 연결 테스트
curl -v http://localhost:3001/health
```

### 2. 환경변수 확인
```bash
# 환경변수 출력 (민감한 정보 제외)
echo "WORKER_ORIGIN: $WORKER_ORIGIN"
echo "SUPABASE_FN_URL: $SUPABASE_FN_URL"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."
```

### 3. 프로세스 관리
```bash
# 실행 중인 Node.js 프로세스 확인
ps aux | grep node

# 특정 포트 사용 프로세스 확인
lsof -i :3001
lsof -i :3000

# 프로세스 종료
kill -9 $(lsof -t -i:3001)
```

## 📊 모니터링 명령어

### 1. 성능 모니터링
```bash
# 시스템 리소스 사용량 확인
top -p $(pgrep -f "node.*worker")
htop

# 메모리 사용량 확인
free -h
ps aux --sort=-%mem | head -10
```

### 2. 네트워크 모니터링
```bash
# 네트워크 연결 상태 확인
netstat -tulpn | grep :3001
ss -tulpn | grep :3001

# 네트워크 트래픽 모니터링
iftop -i eth0
```

## 🔄 유지보수 명령어

### 1. 정기 작업
```bash
# 로그 파일 정리 (30일 이상된 파일 삭제)
find apps/worker/logs -name "*.log" -mtime +30 -delete

# 데이터베이스 정리 (오래된 작업 로그 삭제)
psql -h your-db-host -U postgres -d postgres -c "
DELETE FROM nutrient_jobs 
WHERE created_at < NOW() - INTERVAL '30 days' 
AND status IN ('success', 'failed');
"

# 캐시 정리
npm cache clean --force
```

### 2. 백업 및 복구
```bash
# 전체 데이터베이스 백업
pg_dump -h your-db-host -U postgres postgres > full_backup_$(date +%Y%m%d).sql

# 특정 테이블만 백업
pg_dump -h your-db-host -U postgres -t nutrient_recipes postgres > nutrient_recipes_backup.sql

# 백업에서 복구
psql -h your-db-host -U postgres -d postgres < full_backup_20250101.sql
```

---

## 📝 주의사항

1. **환경변수 보안**: Service Role Key는 절대 공개하지 마세요
2. **데이터베이스 접근**: 프로덕션 환경에서는 백업 후 작업하세요
3. **크론 작업**: Vercel 크론은 무료 플랜에서 제한이 있습니다
4. **로그 관리**: 로그 파일이 디스크 공간을 많이 차지할 수 있습니다
5. **네트워크**: 외부 API 호출 시 Rate Limit을 고려하세요

## 🆘 긴급 상황 대응

```bash
# 모든 서비스 중지
pkill -f "node.*worker"
pkill -f "next.*dev"

# 데이터베이스 연결 차단 (필요시)
supabase db pause

# 서비스 재시작
cd apps/worker && npm start &
cd apps/web-admin && npm run dev &
```

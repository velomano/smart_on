# 🚀 스마트팜 영양액 자동 수집 시스템 구축 가이드

## 📋 개요
이 가이드는 스마트팜 시스템에 영양액 레시피 자동 수집 기능을 추가하는 완전한 구현 방법을 제공합니다.

## 🏗️ 시스템 아키텍처
```
웹앱 (/api/collect) → 워커 서버 → Supabase Edge Function → PostgreSQL
     ↓                    ↓              ↓
Vercel Cron         Cornell PDF      데이터 저장
(주간 실행)         크롤링          및 검증
```

## 📁 파일 구조
```
smarton/
├── docs/
│   ├── 02_DB_SCHEMA.sql              # 업데이트된 DB 스키마
│   └── 03_RLS_POLICIES.sql           # 업데이트된 RLS 정책
├── packages/database/supabase/
│   ├── migrations/
│   │   └── 20250101_nutrient_auto_collection.sql  # 마이그레이션 SQL
│   └── functions/
│       └── ingest-nutrient/
│           └── index.ts              # Supabase Edge Function
├── apps/
│   ├── web-admin/
│   │   └── app/api/collect/
│   │       └── route.ts             # Next.js API 엔드포인트
│   └── worker/                       # 새로운 워커 서비스
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts              # Express 서버
│           ├── sources/
│           │   └── cornell-recipes.ts  # Cornell PDF 크롤러
│           └── utils/
│               └── logger.ts         # 로깅 유틸리티
└── vercel.json                       # Vercel 크론 설정
```

## 🛠️ 구현 단계

### 1단계: 데이터베이스 마이그레이션
```bash
# Supabase CLI로 마이그레이션 실행
supabase db push

# 또는 SQL 파일 직접 실행
psql -h your-db-host -U postgres -d postgres -f packages/database/supabase/migrations/20250101_nutrient_auto_collection.sql
```

### 2단계: Supabase Edge Function 배포
```bash
# Supabase CLI로 Edge Function 배포
supabase functions deploy ingest-nutrient

# 또는 수동 배포
supabase functions deploy ingest-nutrient --project-ref your-project-ref
```

### 3단계: 워커 서비스 설정
```bash
# 워커 디렉토리로 이동
cd apps/worker

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### 4단계: 환경변수 설정
```bash
# .env.local 파일에 추가
WORKER_ORIGIN=http://localhost:3001
SUPABASE_FN_URL=https://your-project.supabase.co/functions/v1/ingest-nutrient
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5단계: Vercel 배포
```bash
# Vercel에 배포 (크론 작업 포함)
vercel --prod

# 크론 작업 확인
vercel cron ls
```

## 🧪 테스트 방법

### 1. 수동 테스트
```bash
# 워커 서버 테스트
curl http://localhost:3001/health
curl http://localhost:3001/sources/cornell

# Next.js API 테스트
curl -X POST http://localhost:3000/api/collect \
  -H "Content-Type: application/json" \
  -d '{"source": "cornell"}'
```

### 2. 데이터베이스 확인
```sql
-- 수집된 레시피 확인
SELECT * FROM vw_crop_recipes_latest;

-- 수집 작업 로그 확인
SELECT * FROM nutrient_jobs ORDER BY created_at DESC LIMIT 10;

-- 데이터 소스 확인
SELECT * FROM nutrient_sources;
```

## 📊 모니터링 및 운영

### 1. 로그 모니터링
```bash
# 워커 서버 로그
tail -f apps/worker/logs/combined.log

# Vercel 함수 로그
vercel logs --follow
```

### 2. 성능 지표
- **수집 성공률**: 95% 이상 목표
- **데이터 품질**: 스키마 검증 100% 통과
- **처리 시간**: 평균 5초 이내
- **중복률**: 5% 이하

### 3. 알림 설정
```typescript
// 수집 실패 시 알림 (예시)
if (error) {
  await sendTelegramNotification(
    `영양액 수집 실패: ${error.message}`
  );
}
```

## 🔧 커스터마이징

### 1. 새로운 데이터 소스 추가
```typescript
// apps/worker/src/sources/new-source.ts
export async function fetchNewSourceRecipes() {
  // 새로운 소스 크롤링 로직 구현
}
```

### 2. 검증 규칙 수정
```sql
-- validate_nutrient_recipe 함수 수정
CREATE OR REPLACE FUNCTION validate_nutrient_recipe(...)
-- 새로운 검증 로직 추가
```

### 3. 스케줄 조정
```json
// vercel.json 수정
{
  "crons": [
    {
      "path": "/api/collect",
      "schedule": "0 2 * * *"  // 매일 오전 2시
    }
  ]
}
```

## 🚨 문제 해결

### 1. 일반적인 오류
- **PDF 다운로드 실패**: 네트워크 연결 확인
- **데이터베이스 연결 실패**: 환경변수 확인
- **크론 작업 실행 안됨**: Vercel 프로젝트 설정 확인

### 2. 디버깅 명령어
```bash
# Supabase 연결 테스트
supabase status

# Edge Function 로그 확인
supabase functions logs ingest-nutrient

# 데이터베이스 연결 테스트
psql -h your-db-host -U postgres -d postgres -c "SELECT 1;"
```

## 📈 확장 계획

### 1. 추가 데이터 소스
- 농촌진흥청 웹사이트 크롤링
- FAO 데이터베이스 API 연동
- 학술 논문 데이터베이스 연동

### 2. AI 기반 데이터 생성
- 기존 데이터 패턴 학습
- 누락된 레시피 자동 생성
- 품질 점수 기반 추천

### 3. 실시간 수집
- 웹훅 기반 즉시 수집
- 사용자 요청 기반 수집
- 스트리밍 데이터 처리

## 📞 지원 및 문의

- **기술 지원**: 개발팀 슬랙 채널
- **문서 업데이트**: GitHub Issues
- **버그 신고**: 상세한 오류 메시지와 함께 문의

---

**구현 완료 후 반드시 확인할 사항:**
1. ✅ 데이터베이스 마이그레이션 성공
2. ✅ Edge Function 배포 성공
3. ✅ 워커 서버 정상 실행
4. ✅ API 엔드포인트 테스트 통과
5. ✅ 크론 작업 스케줄 등록
6. ✅ 로그 및 모니터링 설정
7. ✅ 백업 및 복구 계획 수립

# 🚀 스마트 대량 크롤링 시스템

## 📋 개요

3-4시간에 걸쳐 대량으로 배양액 레시피를 수집하는 스마트 크롤링 시스템입니다.

## ✨ 주요 기능

### 1. **스마트 중복 방지**
- 기존 데이터베이스에서 이미 수집된 작물/성장단계 조합 확인
- 중복 데이터 수집 방지
- 효율적인 데이터 확장

### 2. **크롤링 블록 방지**
- 랜덤 지연 (2-5초)
- User-Agent 로테이션
- 다양한 검색 사이트 활용
- 안전한 요청 패턴

### 3. **포괄적 검색**
- 50+ 검색 키워드 (한국어/영어)
- 9개 검색 사이트
- 작물별/성장단계별 키워드
- 폭넓은 데이터 소스

### 4. **자동 데이터 변환**
- 영문→한글 작물명 변환
- EC, pH, NPK 비율 추출
- 환경 조건 정보 생성
- 출처 정보 자동 분류

## 🎯 수집 대상

### 검색 키워드
- **일반**: 배양액 제조, 수경재배 영양액, 액체비료 조성
- **작물별**: 토마토 배양액, 상추 배양액, 딸기 배양액, 오이 배양액
- **성장단계별**: 생장기 배양액, 개화기 배양액, 결실기 배양액
- **영문**: hydroponic nutrient solution, plant nutrition, fertilizer formula

### 검색 사이트
- Google, Google Scholar
- PubMed, ResearchGate, Academia.edu
- RISS, KCI (한국 학술지)
- Naver, Daum

## 📊 예상 결과

- **수집량**: 500-1000개 레시피
- **소요시간**: 3-4시간
- **처리 페이지**: 1000개
- **중복 제거**: 자동 적용

## 🚀 사용법

### 1. 테스트 실행 (소량)
```bash
cd apps/worker
npm run smart-test
```

### 2. 대량 수집 실행
```bash
cd apps/worker
npm run smart-collect
```

### 3. 환경변수 확인
```bash
# .env 파일에 다음 변수들이 설정되어 있어야 합니다
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_FN_URL=your_edge_function_url
```

## ⚙️ 설정 옵션

### 크롤링 설정 (`smartCrawler.ts`)
```typescript
const CRAWL_CONFIG = {
  REQUEST_DELAY: {
    MIN: 2000,  // 최소 2초
    MAX: 5000,  // 최대 5초
  },
  // 검색 키워드, 사이트 등
};
```

### 배치 설정 (`smartBatch.ts`)
```typescript
const batchSize = 50;        // 배치당 50개씩 처리
const totalBatches = 20;     // 총 20배치
const batchDelay = 10 * 60;  // 배치 간 10분 대기
```

## 📈 진행 상황 모니터링

실행 중 다음과 같은 로그가 출력됩니다:

```
🔍 검색: "배양액 제조" on google.com
📄 5개 링크 발견
📖 페이지 분석: https://example.com/recipe1
✅ 레시피 추출 성공: 상추 (vegetative)
📊 진행상황: 10개 페이지 처리, 3개 레시피 수집
⏳ 다음 배치까지 10분 대기...
```

## 🛡️ 안전 기능

### 1. **블록 방지**
- 랜덤 지연 시간
- 다양한 User-Agent
- 요청 패턴 다양화

### 2. **에러 처리**
- 네트워크 오류 시 재시도
- 잘못된 데이터 필터링
- 부분 실패 시 계속 진행

### 3. **중단 및 재시작**
- Ctrl+C로 안전한 중단
- 진행 상황 로그 저장
- 부분 결과 저장

## 📋 수집된 데이터 구조

```typescript
{
  crop_key: "tomato",
  crop_name: "토마토",
  stage: "vegetative",
  target_ec: 2.0,
  target_ph: 6.2,
  macro: { N: 140, P: 40, K: 220, Ca: 150, Mg: 45, S: 70 },
  micro: { Fe: 2.5, Mn: 0.6, B: 0.6, Zn: 0.06, Cu: 0.03, Mo: 0.02 },
  env: { temp: 22, humidity: 65, lux: 20000 },
  source: {
    name: "example.com",
    url: "https://example.com/recipe",
    org_type: "academic",
    license: "CC BY 4.0",
    reliability_default: 0.8
  },
  reliability: 0.8,
  collected_at: "2025-01-04T...",
  checksum: "abc123..."
}
```

## 🔧 문제 해결

### 1. **크롤링이 느린 경우**
- `REQUEST_DELAY` 값을 조정
- 검색 사이트 수 줄이기
- 키워드 수 줄이기

### 2. **블록당하는 경우**
- `REQUEST_DELAY` 값을 늘리기
- User-Agent 추가
- 프록시 사용 고려

### 3. **데이터 품질이 낮은 경우**
- 패턴 매칭 로직 개선
- 유효성 검사 강화
- 수동 검증 추가

## 📊 성능 최적화

### 1. **병렬 처리**
- 여러 검색어 동시 처리
- 페이지 분석 병렬화
- 데이터베이스 배치 저장

### 2. **메모리 관리**
- 스트리밍 처리
- 가비지 컬렉션 최적화
- 대용량 데이터 청크 처리

### 3. **네트워크 최적화**
- HTTP/2 활용
- 연결 재사용
- 압축 응답 처리

## 🎯 향후 개선 계획

1. **AI 기반 데이터 추출**
   - 자연어 처리 모델 활용
   - 더 정확한 정보 추출
   - 자동 품질 검증

2. **실시간 모니터링**
   - 웹 대시보드
   - 진행 상황 시각화
   - 실시간 알림

3. **확장성 개선**
   - 분산 크롤링
   - 클라우드 배포
   - 자동 스케일링

## 📞 지원

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해주세요.

---

**⚠️ 주의사항**: 이 시스템은 교육 및 연구 목적으로만 사용하세요. 웹사이트의 이용약관을 준수하고, 과도한 요청으로 서버에 부담을 주지 않도록 주의하세요.

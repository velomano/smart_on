# 🛡️ 시스템 안정성 아키텍처 (2025.01.30)

## 📋 개요

상용화를 위한 시스템 안정성 강화를 위해 구축된 로깅, 에러 처리, 모니터링 시스템에 대한 종합 가이드입니다.

## 🏗️ 시스템 아키텍처

### 1. 로깅 시스템 (Winston 기반)

#### 📁 파일 구조
```
apps/web-admin/src/lib/
├── logger.ts              # 통합 로깅 시스템
├── errorHandler.ts        # 전역 에러 처리
└── apiMiddleware.ts       # API 미들웨어
```

#### 🔧 로깅 시스템 특징
- **구조화된 로깅**: JSON 형식으로 모든 로그 저장
- **환경별 설정**: 개발환경(파일+콘솔), 프로덕션(콘솔만)
- **로그 레벨 관리**: DEBUG, INFO, WARN, ERROR
- **메타데이터 포함**: 요청 ID, 사용자 정보, 컨텍스트

#### 📝 로그 타입별 분류
```typescript
// API 요청/응답 로깅
logger.logApiRequest(method, url, context);
logger.logApiResponse(method, url, statusCode, responseTime, context);

// 사용자 활동 로깅
logger.logUserActivity(action, context);

// 시스템 이벤트 로깅
logger.logSystemEvent(event, context);

// 보안 관련 로깅
logger.logSecurity(event, context);

// 성능 메트릭 로깅
logger.logPerformance(metric, value, unit, context);
```

### 2. 에러 처리 시스템

#### 🚨 에러 타입 분류
```typescript
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',           // 400
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',   // 401
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',     // 403
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',            // 404
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',          // 429
  DATABASE_ERROR = 'DATABASE_ERROR',              // 500
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR', // 502
  NETWORK_ERROR = 'NETWORK_ERROR',                // 503
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',                // 504
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'  // 500
}
```

#### 🔄 에러 처리 플로우
1. **에러 발생** → API 핸들러에서 에러 발생
2. **에러 분석** → `handleError()` 함수가 에러 타입 분석
3. **로그 기록** → 구조화된 로그로 에러 정보 저장
4. **응답 생성** → 표준화된 에러 응답 반환

#### 📊 표준 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "type": "DATABASE_ERROR",
    "message": "데이터베이스 오류가 발생했습니다.",
    "code": "DATABASE_ERROR",
    "timestamp": "2025-01-30T10:30:00.000Z",
    "requestId": "req_1735635000000_abc123def",
    "details": {}
  }
}
```

### 3. API 미들웨어 시스템

#### 🔒 보안 기능
- **Rate Limiting**: 분당 100회 요청 제한
- **요청 추적**: IP 주소, User-Agent, 요청 시간 기록
- **요청 ID**: 각 요청에 고유 ID 부여

#### 📈 성능 모니터링
- **응답 시간 측정**: 모든 API 응답 시간 추적
- **요청/응답 로깅**: 자동 로깅으로 디버깅 지원
- **헤더 추가**: X-Request-ID, X-Response-Time 헤더

#### 🛠️ 미들웨어 사용법
```typescript
export const GET = withApiMiddleware(async (request: NextRequest) => {
  // API 로직
  return createApiResponse(data);
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true
});
```

### 4. 시스템 모니터링 대시보드

#### 📊 모니터링 지표
1. **시스템 헬스**
   - 데이터베이스 연결 상태
   - 메모리 사용률
   - 가동 시간
   - Node.js 버전

2. **사용자 통계**
   - 총 사용자 수
   - 활성 사용자 수 (24시간 내)
   - 승인된 사용자 수
   - 승인 대기 사용자 수

3. **농장 및 디바이스 통계**
   - 총 농장 수 / 활성 농장 수
   - 총 디바이스 수 / 온라인 디바이스 수
   - 디바이스 타입별 분포

4. **센서 데이터 통계**
   - 총 센서 수 / 활성 센서 수
   - 센서 타입별 분포
   - 센서 데이터 수집량

5. **성능 메트릭**
   - 평균 응답 시간
   - 에러율
   - 시스템 가동 시간

#### 🔄 자동 새로고침
- **30초 간격**: 실시간 데이터 업데이트
- **수동 새로고침**: 사용자 요청 시 즉시 업데이트

## 🚀 API 엔드포인트

### 시스템 모니터링 API

#### 1. 헬스 체크 API
```http
GET /api/system/health
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-30T10:30:00.000Z",
    "responseTime": 45,
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 23
      }
    },
    "resources": {
      "memory": {
        "used": 128,
        "total": 512,
        "percentage": 25
      },
      "uptime": 86400,
      "nodeVersion": "v18.17.0",
      "platform": "linux"
    },
    "metrics": {
      "activeUsers": 15,
      "totalRequests": 1250,
      "errorRate": 0.02,
      "averageResponseTime": 150
    }
  }
}
```

#### 2. 시스템 메트릭 API
```http
GET /api/system/metrics
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-30T10:30:00.000Z",
    "users": {
      "total": 25,
      "active": 15,
      "approved": 20,
      "pending": 5
    },
    "farms": {
      "total": 4,
      "active": 4
    },
    "devices": {
      "total": 12,
      "online": 10,
      "offline": 2,
      "byType": {
        "sensor_gateway": 6,
        "light": 3,
        "fan": 2,
        "pump": 1
      }
    },
    "sensors": {
      "total": 24,
      "active": 22,
      "inactive": 2,
      "byType": {
        "temp": 4,
        "humidity": 4,
        "ec": 4,
        "ph": 4,
        "lux": 4,
        "water_temp": 4
      }
    },
    "data": {
      "totalReadings": 125000,
      "last24Hours": 2880,
      "averagePerHour": 120
    },
    "performance": {
      "averageResponseTime": 145,
      "errorRate": 0.015,
      "uptime": 86400
    }
  }
}
```

## 🔧 개발자 가이드

### 1. 로깅 사용법

#### 기본 로깅
```typescript
import { logger } from '@/lib/logger';

// 정보 로그
logger.info('사용자 로그인 성공', { userId: '123', email: 'user@example.com' });

// 에러 로그
logger.error('데이터베이스 연결 실패', { error: error.message }, error);

// 경고 로그
logger.warn('메모리 사용률 높음', { memoryUsage: '85%' });

// 디버그 로그 (개발환경에서만)
logger.debug('변수 상태', { variable: 'value' });
```

#### API 로깅
```typescript
import { logApi } from '@/lib/logger';

// 요청 로깅
logApi.request('POST', '/api/users', { userId: '123' });

// 응답 로깅
logApi.response('POST', '/api/users', 201, 250, { userId: '123' });
```

### 2. 에러 처리 사용법

#### 커스텀 에러 생성
```typescript
import { createValidationError, createDatabaseError } from '@/lib/errorHandler';

// 유효성 검사 에러
throw createValidationError('이메일 형식이 올바르지 않습니다.');

// 데이터베이스 에러
throw createDatabaseError('사용자 정보 저장에 실패했습니다.');
```

#### API 미들웨어 사용
```typescript
import { withApiMiddleware, createApiResponse } from '@/lib/apiMiddleware';

export const POST = withApiMiddleware(async (request: NextRequest) => {
  // 비즈니스 로직
  const result = await processData();
  
  return createApiResponse(result, 201, '데이터가 성공적으로 처리되었습니다.');
}, {
  logRequest: true,
  logResponse: true,
  rateLimit: true
});
```

### 3. 모니터링 대시보드 접근

#### 접근 권한
- **시스템 관리자만 접근 가능**: `role === 'system_admin'`
- **햄버거 메뉴에서 "시스템 모니터링" 선택**

#### 대시보드 기능
1. **실시간 모니터링**: 30초마다 자동 업데이트
2. **수동 새로고침**: 새로고침 버튼 클릭
3. **상세 메트릭**: 각 항목별 상세 정보 표시

## 🔍 문제 해결

### 1. 로깅 관련 문제

#### 로그가 출력되지 않는 경우
```bash
# 환경변수 확인
echo $NODE_ENV

# 로그 레벨 확인
logger.level = 'debug'  # 개발환경에서 설정
```

#### 로그 파일 권한 문제
```bash
# 로그 디렉토리 생성 및 권한 설정
mkdir -p logs
chmod 755 logs
```

### 2. 에러 처리 관련 문제

#### 에러가 제대로 분류되지 않는 경우
```typescript
// 명시적으로 에러 타입 지정
throw new AppError(
  '사용자 정의 에러 메시지',
  ErrorType.CUSTOM_ERROR,
  400,
  { userId: '123' }
);
```

### 3. 모니터링 관련 문제

#### 메트릭이 업데이트되지 않는 경우
1. **데이터베이스 연결 확인**
2. **API 엔드포인트 접근성 확인**
3. **브라우저 콘솔에서 네트워크 에러 확인**

## 📈 성능 최적화

### 1. 로깅 최적화
- **비동기 로깅**: 파일 I/O 블로킹 방지
- **로그 레벨 조정**: 프로덕션에서는 ERROR만 로깅
- **로그 순환**: 파일 크기 제한으로 디스크 공간 절약

### 2. 모니터링 최적화
- **캐싱**: 메트릭 데이터 캐싱으로 성능 향상
- **배치 처리**: 대량 데이터 조회 시 배치 처리
- **인덱싱**: 데이터베이스 쿼리 최적화

## 🔐 보안 고려사항

### 1. 로그 보안
- **민감 정보 마스킹**: 비밀번호, 토큰 등 마스킹 처리
- **로그 접근 권한**: 시스템 관리자만 로그 파일 접근
- **로그 보존 기간**: 법적 요구사항에 따른 보존 기간 설정

### 2. 모니터링 보안
- **접근 권한 제한**: 시스템 관리자만 모니터링 대시보드 접근
- **API 보안**: 모니터링 API에도 인증 적용
- **데이터 마스킹**: 민감한 시스템 정보 마스킹

## 🛡️ 보안 강화 시스템

### 1. 종합 보안 시스템 (`src/lib/security.ts`)
```typescript
// 보안 헤더 설정
export function setSecurityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Content-Security-Policy', "default-src 'self'; ...");
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

// 민감한 데이터 마스킹
export function maskSensitiveData(data: any): any {
  // password, token, secret, key 등 민감한 필드 자동 마스킹
  // 로그에 민감한 정보 노출 방지
}
```

### 2. JWT 기반 인증 시스템 (`src/lib/jwt.ts`)
- **토큰 생성 및 검증**: JWT 토큰을 통한 안전한 사용자 인증
- **권한 계층 구조**: system_admin > super_admin > team_leader > team_member > user
- **리소스별 접근 제어**: 시스템, 관리자, 팀, 농장, 디바이스별 세밀한 권한 관리
- **토큰 블랙리스트**: 로그아웃된 토큰 무효화

### 3. 고급 Rate Limiting
- **IP 기반 제한**: 분당 100회 요청 제한으로 DDoS 공격 방어
- **응답 헤더**: Rate limit 정보를 클라이언트에 제공
- **메모리 기반 저장소**: 빠른 응답을 위한 인메모리 구현 (프로덕션에서는 Redis 권장)

### 4. 요청 보안 검증
- **Origin 검증**: 허용된 도메인에서의 요청만 허용
- **요청 크기 제한**: 1MB 기본 제한으로 DoS 공격 방어
- **세션 보안 검증**: User-Agent, Referer 등 요청 헤더 검증
- **SQL Injection 방지**: 입력 데이터 자동 sanitization

### 5. 민감한 정보 보호
- **자동 마스킹**: 로그에서 API 키, 비밀번호 등 민감한 정보 자동 마스킹
- **에러 정보 보호**: 프로덕션에서 스택 트레이스 등 내부 정보 노출 방지
- **환경변수 보안**: 민감한 설정값의 로깅 방지

## ⚡ 성능 최적화 시스템

### 1. 메모리 기반 캐싱 시스템 (`src/lib/cache.ts`)
```typescript
// 전역 캐시 인스턴스들
export const systemMetricsCache = new MemoryCache({
  ttl: 30 * 1000, // 30초
  maxSize: 100
});

export const userDataCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5분
  maxSize: 500
});

// 캐시 래퍼 함수
export async function withCache<T>(
  cache: MemoryCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T>
```

### 2. 성능 모니터링 API (`/api/system/performance`)
- **실시간 메트릭**: 메모리, CPU, 응답 시간, 에러율 모니터링
- **캐시 통계**: 히트율, 크기, 만료 시간 등 캐시 성능 지표
- **데이터베이스 성능**: 쿼리 시간, 연결 수, 캐시 히트율
- **자동 알림**: 성능 임계값 초과 시 알림 생성

### 3. 최적화된 API 응답
- **병렬 처리**: Promise.all을 통한 동시 데이터 수집
- **캐시 적용**: 시스템 메트릭 30초 캐시로 DB 부하 감소
- **응답 압축**: 큰 데이터의 효율적 전송
- **요청 크기 제한**: 10KB 제한으로 과도한 리소스 사용 방지

### 4. 성능 모니터링 대시보드
- **실시간 차트**: 메모리, CPU 사용률 시각화
- **성능 트렌드**: 시간별 성능 변화 추적
- **알림 시스템**: 성능 임계값 초과 시 자동 알림
- **캐시 효율성**: 캐시 히트율 및 성능 지표 표시

## 🚀 향후 확장 계획

### 1. 고급 모니터링
- **실시간 알림**: 임계값 초과 시 알림 발송
- **트렌드 분석**: 장기간 성능 트렌드 분석
- **예측 분석**: 머신러닝 기반 성능 예측

### 2. 로깅 강화
- **분산 로깅**: ELK 스택 연동
- **로그 분석**: 자동 로그 패턴 분석
- **알림 시스템**: 에러 발생 시 자동 알림

### 3. 백업 및 복구
- **자동 백업**: 정기적인 데이터베이스 백업
- **재해 복구**: 시스템 장애 시 자동 복구
- **데이터 마이그레이션**: 버전 업그레이드 시 데이터 이전

### 4. 보안 강화
- **Redis 캐싱**: 분산 캐시 시스템으로 성능 향상
- **API 게이트웨이**: 중앙집중식 API 관리
- **보안 스캐닝**: 정기적인 보안 취약점 스캔

---

## 📞 지원 및 문의

시스템 안정성 관련 문의사항이나 문제가 발생한 경우:

1. **로그 확인**: 먼저 관련 로그 파일 확인
2. **모니터링 대시보드**: 시스템 상태 확인
3. **개발팀 문의**: 기술적 문제 해결 필요 시

**문서 버전**: v1.0  
**최종 업데이트**: 2025-01-30  
**작성자**: 시스템 개발팀

# 하이브리드 인증 시스템 가이드

## 🎯 개요

이 프로젝트는 **하이브리드 인증 시스템**을 사용합니다:
- **개발 환경**: Mock Auth (미리 생성된 테스트 계정)
- **운영 환경**: Supabase Auth + 승인 시스템

## 🔧 환경 설정

### 개발 환경 (기본)
```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

### 운영 환경
```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

## 📊 방식별 비교

| 방식 | 장점 | 단점 | 사용 시기 |
|------|------|------|-----------|
| **미리 생성** | 즉시 사용 가능, 간단 | 보안 위험, 유연성 부족 | 개발/테스트 |
| **가입 후 승인** | 보안성 높음, 유연함 | 복잡, 관리자 개입 필요 | 운영 |
| **하이브리드** | 환경별 최적화 | 구현 복잡 | **추천** |

## 🚀 사용법

### 개발 환경
```typescript
// 자동으로 Mock Auth 사용
const user = await getCurrentUser();
```

### 운영 환경
```typescript
// 자동으로 Supabase Auth 사용
const user = await getCurrentUser();
```

## 🔐 테스트 계정 (개발 환경)

| 계정 | 비밀번호 | 역할 | 조 | 권한 |
|------|----------|------|-----|------|
| `sky3rain7@gmail.com` | `sky1005` | 최종 관리자 | - | 모든 사용자 관리 |
| `test1@test.com` | `123456` | 관리자 | - | 모든 사용자 관리 |
| `test2@test.com` | `123456` | 1조 조장 | 1조 | 1조 조원들만 관리 |
| `test3@test.com` | `123456` | 1조 조원 | 1조 | 1조 조원들만 조회 |
| `test4@test.com` | `123456` | 2조 조장 | 2조 | 2조 조원들만 관리 |
| `test5@test.com` | `123456` | 2조 조원 | 2조 | 2조 조원들만 조회 |

## 🔄 전환 방법

### 개발 → 운영 전환
1. `.env.local`에서 `NEXT_PUBLIC_USE_MOCK_AUTH=false` 설정
2. Supabase 프로젝트 설정 확인
3. 데이터베이스 마이그레이션 실행
4. 관리자 계정 생성

### 운영 → 개발 전환
1. `.env.local`에서 `NEXT_PUBLIC_USE_MOCK_AUTH=true` 설정
2. 브라우저 캐시 클리어
3. 테스트 계정으로 로그인

## 🛠️ 구현 세부사항

### 환경 감지
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const useMockAuth = isDevelopment || process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';
```

### 함수 선택
```typescript
const getAuthFunctions = () => {
  if (useMockAuth) {
    return mockFunctions;
  } else {
    return realSupabaseFunctions;
  }
};
```

## 📝 주의사항

1. **환경 변수**: `NEXT_PUBLIC_` 접두사 필수
2. **캐시**: 환경 변경 후 브라우저 새로고침 필요
3. **보안**: 운영 환경에서는 Mock Auth 사용 금지
4. **데이터**: Mock 데이터는 로컬 스토리지에 저장

## 🔍 디버깅

### 현재 환경 확인
```javascript
console.log('Mock Auth 사용:', process.env.NEXT_PUBLIC_USE_MOCK_AUTH);
console.log('개발 환경:', process.env.NODE_ENV === 'development');
```

### 인증 함수 확인
```javascript
import { getCurrentUser } from './lib/mockAuth';
// Mock 또는 실제 함수가 자동으로 선택됨
```


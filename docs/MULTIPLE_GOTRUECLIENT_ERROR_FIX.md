# Multiple GoTrueClient Instances Error 해결 방법

## 문제 상황
웹 애플리케이션에서 "Multiple GoTrueClient instances detected in the same browser context" 오류가 발생했습니다. 이는 동일한 브라우저 컨텍스트에서 여러 개의 Supabase 클라이언트 인스턴스가 생성되어 발생하는 문제입니다.

## 원인 분석
1. **중복된 Supabase 클라이언트 생성**: 여러 파일에서 각각 `createClient`를 호출하여 독립적인 클라이언트 인스턴스를 생성
2. **타입 정의 문제**: Supabase 타입 정의가 제대로 로드되지 않아 모든 테이블이 `never` 타입으로 인식
3. **일관성 없는 클라이언트 사용**: 일부 파일에서는 중앙화된 `getSupabaseClient`를 사용하고, 일부에서는 직접 `createClient`를 호출

## 해결 방법

### 1. Supabase 클라이언트 중앙화
모든 Supabase 클라이언트 생성을 `apps/web-admin/src/lib/supabase.ts`로 중앙화했습니다.

**수정 전:**
```typescript
// apps/web-admin/src/lib/auth.ts
import { createClient } from '@supabase/supabase-js';
const supabaseClient = createClient(url, key);

// apps/web-admin/src/lib/auth_new.ts  
import { createClient } from '@supabase/supabase-js';
const supabaseClient = createClient(url, key);

// apps/web-admin/app/beds/page.tsx
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(url, key);
```

**수정 후:**
```typescript
// apps/web-admin/src/lib/supabase.ts (중앙화된 클라이언트)
let supabaseClient: any = null;
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
};

// 다른 모든 파일들
import { getSupabaseClient } from './supabase';
const supabase = getSupabaseClient();
```

### 2. 타입 오류 해결
Supabase 타입 정의 문제로 인한 `never` 타입 오류를 해결하기 위해 타입 캐스팅을 적용했습니다.

**수정 전:**
```typescript
const { data, error } = await supabase
  .from('farms')
  .insert([...]); // TypeScript 오류: never 타입
```

**수정 후:**
```typescript
const { data, error } = await (supabase as any)
  .from('farms')
  .insert([...]); // 타입 오류 해결
```

### 3. 메타데이터 접근 수정
`Device.meta` 속성이 `{}` 타입으로 인식되는 문제를 해결했습니다.

**수정 전:**
```typescript
const location = device.meta?.location || ''; // TypeScript 오류
const bedMatch = location.match(/베드-?(\d+)/); // match 함수 오류
```

**수정 후:**
```typescript
const location = (device.meta as any)?.location || ''; // 타입 캐스팅
const bedMatch = location.match(/베드-?(\d+)/); // 정상 작동
```

## 수정된 파일 목록

### 1. 클라이언트 중앙화
- `apps/web-admin/src/lib/supabase.ts`: 중앙화된 클라이언트 관리
- `apps/web-admin/src/lib/auth.ts`: 중앙화된 클라이언트 사용
- `apps/web-admin/src/lib/auth_new.ts`: 중앙화된 클라이언트 사용
- `apps/web-admin/app/beds/page.tsx`: 모든 직접 클라이언트 생성 제거
- `apps/web-admin/src/app/beds/page.tsx`: 모든 직접 클라이언트 생성 제거

### 2. 타입 오류 수정
- 모든 Supabase 쿼리에 `(supabase as any)` 타입 캐스팅 적용
- `Device.meta` 접근 시 `(device.meta as any)` 타입 캐스팅 적용
- `newBedData` 상태에 `totalTiers` 속성 추가

## 결과
1. **GoTrueClient 중복 오류 해결**: 단일 클라이언트 인스턴스만 사용
2. **TypeScript 오류 해결**: 모든 타입 오류 수정 완료
3. **코드 일관성 향상**: 모든 파일에서 동일한 클라이언트 사용
4. **성능 개선**: 불필요한 클라이언트 인스턴스 생성 방지

## 예방 방법
1. **중앙화된 클라이언트 사용**: 항상 `getSupabaseClient()` 함수 사용
2. **직접 클라이언트 생성 금지**: `createClient` 직접 호출 금지
3. **타입 정의 확인**: Supabase 타입 정의가 올바르게 로드되는지 확인
4. **일관된 패턴 사용**: 모든 파일에서 동일한 Supabase 사용 패턴 적용

## 참고사항
- 이 수정은 개발 환경에서의 타입 오류를 해결하기 위한 임시 조치입니다
- 프로덕션 환경에서는 적절한 Supabase 타입 정의를 설정하는 것이 권장됩니다
- `as any` 타입 캐스팅은 타입 안전성을 해치므로, 장기적으로는 적절한 타입 정의를 사용해야 합니다

# 🔒 보안 강화 체크리스트 (베타테스트 전)

**작성일**: 2025-01-15  
**목적**: terahub 베타테스트 공개 전 보안 취약점 해결  
**우선순위**: 🔴 긴급 → 🟡 중요 → 🟢 권장  

---

## 🚨 **긴급 보안 조치 (즉시 실행)**

### **1. 민감한 API 키 재생성** 🔑
```bash
# 즉시 재생성해야 할 키들
□ Supabase Service Role Key (완전한 DB 관리자 권한)
□ Supabase Anon Key (공개 키이지만 새로 발급)
□ Tuya App Secret (IoT 디바이스 제어 권한)
□ Tuya App Key (IoT 디바이스 식별자)
```

**재생성 방법:**
- **Supabase**: Dashboard → Settings → API → Generate new key
- **Tuya IoT Platform**: Console → Cloud → Authorization → Create new app

### **2. 노출된 파일 즉시 제거** 🗑️
```bash
# Git에서 완전 삭제해야 할 파일들
□ docs/01_ENV.md (실제 API 키 노출)
□ apps/worker/temp.env (Service Role Key 포함)
□ 모든 .env 파일들 (실제 값 포함)
□ 하드코딩된 키가 있는 소스 코드
```

**Git 히스토리 정리:**
```bash
# 민감한 파일을 Git 히스토리에서 완전 제거
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch docs/01_ENV.md' \
  --prune-empty --tag-name-filter cat -- --all
```

### **3. 데이터베이스 접근 권한 재설정** 🛡️
```bash
□ Supabase RLS (Row Level Security) 정책 강화
□ 사용자별 테넌트 격리 확인
□ 관리자 권한 최소화
□ API 접근 로그 활성화
```

---

## 🟡 **중요 보안 개선사항**

### **4. 환경변수 관리 체계화** ⚙️
```bash
# 현재 문제점
❌ 실제 API 키가 문서에 노출됨
❌ 환경변수 파일이 Git에 커밋됨
❌ 개발/프로덕션 키 분리 안됨

# 개선 방안
✅ .env.example 파일만 공개 (더미 값 사용)
✅ .gitignore에 모든 .env* 파일 추가
✅ 환경별 키 분리 (dev/staging/prod)
✅ 환경변수 검증 로직 추가
```

**새로운 .env.example 구조:**
```bash
# .env.example (공개용)
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example...

# Tuya IoT
TUYA_APP_KEY=your_tuya_app_key_here
TUYA_APP_SECRET=your_tuya_app_secret_here
TUYA_REGION=us

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=development
```

### **5. API 보안 강화** 🔐
```bash
□ Rate Limiting 구현 (API 남용 방지)
□ CORS 정책 강화 (허용 도메인 제한)
□ Request Validation 강화 (입력값 검증)
□ API 응답에서 민감 정보 제거
□ 에러 메시지 일반화 (시스템 정보 노출 방지)
```

**Rate Limiting 예시:**
```typescript
// apps/web-admin/src/lib/rateLimiter.ts
export const rateLimiter = {
  // IP별 요청 제한
  perIP: 100, // 시간당 100회
  perUser: 50, // 사용자별 시간당 50회
  perEndpoint: {
    '/api/auth/login': 5, // 로그인 시도 제한
    '/api/devices': 30,   // 디바이스 API 제한
  }
};
```

### **6. 인증 및 권한 관리** 👤
```bash
□ JWT 토큰 만료 시간 단축 (현재: 24시간 → 1시간)
□ Refresh Token 로테이션 구현
□ 다중 인증 (2FA) 옵션 추가
□ 세션 타임아웃 설정
□ 비밀번호 정책 강화 (복잡도, 만료 주기)
```

### **7. 데이터 보호** 💾
```bash
□ 민감한 데이터 암호화 (개인정보, 농장 데이터)
□ 데이터베이스 백업 암호화
□ 로그에서 민감 정보 제거
□ GDPR 준수 (개인정보 보호)
□ 데이터 보존 정책 수립
```

---

## 🟢 **권장 보안 개선사항**

### **8. 모니터링 및 로깅** 📊
```bash
□ 보안 이벤트 모니터링 (실패한 로그인, 권한 오류)
□ API 접근 로그 수집
□ 비정상적인 트래픽 패턴 감지
□ 실시간 알림 시스템 (보안 위협 시)
□ 보안 대시보드 구축
```

### **9. 인프라 보안** 🏗️
```bash
□ HTTPS 강제 (HTTP → HTTPS 리다이렉트)
□ 보안 헤더 추가 (HSTS, CSP, X-Frame-Options)
□ CDN 보안 설정 (DDoS 방어)
□ 정기적인 의존성 업데이트
□ 취약점 스캔 자동화
```

### **10. 개발 프로세스 보안** 🔧
```bash
□ Pre-commit Hook으로 민감 정보 커밋 방지
□ 코드 리뷰 시 보안 체크리스트
□ 정기적인 보안 감사
□ 개발자 보안 교육
□ 보안 테스트 자동화
```

---

## 📋 **베타테스트 보안 체크리스트**

### **공개 전 최종 점검** ✅
```bash
□ 모든 API 키 재생성 완료
□ 민감한 파일 Git에서 제거 완료
□ 환경변수 정리 완료
□ 데이터베이스 권한 재설정 완료
□ Rate Limiting 구현 완료
□ 인증 시스템 강화 완료
□ 보안 테스트 통과 완료
```

### **베타테스트 중 모니터링** 👀
```bash
□ 실시간 보안 로그 모니터링
□ API 사용량 추적
□ 비정상적인 접근 패턴 감지
□ 사용자 피드백 수집 (보안 관련)
□ 성능 영향도 측정
```

### **베타테스트 후 개선사항** 🔄
```bash
□ 보안 취약점 수집 및 분석
□ 사용자 피드백 반영
□ 추가 보안 기능 구현
□ 정기적인 보안 업데이트 계획
□ 보안 문서화 업데이트
```

---

## 🛠️ **구현 우선순위**

### **Week 1: 긴급 보안 조치**
1. API 키 재생성 및 교체
2. 민감한 파일 제거
3. 환경변수 정리
4. 기본 Rate Limiting 구현

### **Week 2: 중요 보안 개선**
1. 인증 시스템 강화
2. API 보안 강화
3. 데이터 보호 강화
4. 모니터링 시스템 구축

### **Week 3: 권장 보안 개선**
1. 인프라 보안 강화
2. 개발 프로세스 개선
3. 보안 테스트 자동화
4. 문서화 완성

### **Week 4: 베타테스트 준비**
1. 최종 보안 점검
2. 베타테스트 환경 구축
3. 모니터링 시스템 활성화
4. 베타테스트 계획 수립

---

## 📞 **긴급 상황 대응**

### **보안 사고 발생 시** 🚨
```bash
1. 즉시 서비스 중단 (필요 시)
2. 영향 범위 파악
3. 취약점 차단
4. 사용자 알림
5. 사후 분석 및 재발 방지
```

### **연락처** 📱
- **보안 책임자**: [담당자 정보]
- **긴급 연락처**: [24시간 연락처]
- **외부 보안 전문가**: [컨설팅 업체]

---

**🎯 목표: 안전하고 신뢰할 수 있는 IoT 플랫폼으로 베타테스트 진행**

**⚠️ 주의: 보안은 한 번에 완성되는 것이 아니라 지속적인 과정입니다.**

# 🔍 권한 체계 테스트 체크리스트

## 📋 테스트 계정별 권한 확인

### 1. **super_admin** (sky3rain7@gmail.com)
- [ ] 사용자 관리 페이지 접근 가능
- [ ] 모든 농장 조회 가능
- [ ] 모든 베드 조회 가능
- [ ] 팀원 관리 페이지 접근 가능
- [ ] 팀원 보기 메뉴 표시
- [ ] 시스템 관리자 권한 부여 가능

### 2. **system_admin** (velomano@naver.com)
- [ ] 사용자 관리 페이지 접근 가능
- [ ] 모든 농장 조회 가능
- [ ] 모든 베드 조회 가능
- [ ] 팀원 보기 메뉴 표시
- [ ] 농장 생성/삭제 가능
- [ ] 베드 추가/편집/삭제 가능

### 3. **team_leader** (test1@test.com, test3@test.com, test5@test.com)
- [ ] 사용자 관리 페이지 접근 가능 (제한적)
- [ ] 자신의 농장만 조회 가능
- [ ] 자신의 베드만 조회 가능
- [ ] 팀원 관리 페이지 접근 가능
- [ ] 팀원 보기 메뉴 표시
- [ ] 베드 추가/편집/삭제 가능 (자신 농장만)
- [ ] 팀원 정보 수정 가능 (소속 팀원만)

### 4. **team_member** (test2@test.com, test4@test.com, test6@test.com)
- [ ] 사용자 관리 페이지 접근 불가
- [ ] 자신의 농장만 조회 가능
- [ ] 자신의 베드만 조회 가능
- [ ] 팀원 보기 메뉴 표시
- [ ] 베드 추가/편집/삭제 불가
- [ ] 팀원 정보 수정 불가

## 🎯 권한 매트릭스 검증

### 시스템 관리
- [ ] super_admin: 시스템 관리자 권한 부여 가능
- [ ] system_admin: 시스템 관리자 권한 부여 불가
- [ ] team_leader: 시스템 관리자 권한 부여 불가
- [ ] team_member: 시스템 관리자 권한 부여 불가

### 농장 관리
- [ ] super_admin: 농장 생성/삭제 가능
- [ ] system_admin: 농장 생성/삭제 가능
- [ ] team_leader: 농장 생성/삭제 불가
- [ ] team_member: 농장 생성/삭제 불가

### 베드 관리
- [ ] super_admin: 모든 농장 베드 추가/편집/삭제 가능
- [ ] system_admin: 모든 농장 베드 추가/편집/삭제 가능
- [ ] team_leader: 자신 농장 베드 추가/편집/삭제 가능
- [ ] team_member: 베드 추가/편집/삭제 불가

### 사용자 관리
- [ ] super_admin: 모든 사용자 관리 가능
- [ ] system_admin: 모든 사용자 관리 가능
- [ ] team_leader: 소속 팀원만 관리 가능
- [ ] team_member: 사용자 관리 불가

### 팀원 보기
- [ ] super_admin: 모든 팀원 조회 가능
- [ ] system_admin: 모든 팀원 조회 가능
- [ ] team_leader: 자신의 팀원만 조회 가능
- [ ] team_member: 자신의 팀원만 조회 가능

## 🔧 수정된 파일들

### 권한 타입 정의
- ✅ `apps/web-admin/src/lib/auth.ts` - super_admin 타입 추가
- ✅ `apps/web-admin/src/lib/auth_new.ts` - super_admin 타입 추가

### 권한 체크 로직
- ✅ `apps/web-admin/src/app/admin/page.tsx` - super_admin 권한 체크 추가
- ✅ `apps/web-admin/app/admin/page.tsx` - super_admin 권한 체크 추가
- ✅ `apps/web-admin/src/components/AppHeader.tsx` - super_admin 권한 체크 추가
- ✅ `apps/web-admin/src/app/team-management/page.tsx` - super_admin 접근 권한 추가
- ✅ `apps/web-admin/src/app/beds/page.tsx` - team_member 필터링 추가

## 🎉 예상 결과

### sky3rain7@gmail.com (super_admin)
- 모든 기능에 접근 가능
- 시스템 관리자 권한 부여 가능
- 모든 농장과 베드 관리 가능

### velomano@naver.com (system_admin)
- 농장/베드/사용자 관리 가능
- 시스템 관리자 권한 부여 불가
- 모든 농장과 베드 관리 가능

### test5@test.com (team_leader - 3농장장)
- 3농장만 조회 가능
- 3농장 베드만 관리 가능
- test6@test.com 팀원 관리 가능

### test6@test.com (team_member - 3농장 팀원)
- 3농장만 조회 가능
- 3농장 베드만 조회 가능
- 베드 관리 불가
- 팀원 보기 가능

---

**테스트 일시**: 2025.09.29  
**작성자**: 스마트팜 개발팀  
**버전**: 1.0

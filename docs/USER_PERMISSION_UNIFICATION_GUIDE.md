# 🔧 사용자 권한 통일 가이드

## 📋 개요

`sky3rain7@gmail.com`에서 설정한 권한을 기준으로 모든 사용자의 권한과 농장 배정을 통일하는 가이드입니다.

## 🎯 통일 기준

### 권한 설정 기준
- **기준 계정**: `sky3rain7@gmail.com` (super_admin)
- **설정 일시**: 2025.09.28
- **적용 범위**: 모든 테스트 계정

## 📊 통일된 권한 체계

### 시스템 관리자
- `sky3rain7@gmail.com` - 서천우 (super_admin)
- `test1@test.com` - 테스트 관리자 (system_admin)

### 1농장 팀
- **팀 리더**: `test2@test.com` - 1농장 농장장 (team_leader)
- **팀 멤버**: `test3@test.com` - 1농장 팀원 (team_member)

### 2농장 팀
- **팀 리더**: `test4@test.com` - 2농장 농장장 (team_leader)
- **팀 멤버**: `test5@test.com` - 2농장 팀원 (team_member)

### 3농장 팀
- **팀 리더**: `test7@test.com` - 3농장 농장장 (team_leader)
- **팀 멤버**: `test6@test.com` - 3농장 팀원 (team_member)

## 🔄 변경 사항

### test6@test.com 권한 변경
- **이전**: 3농장 농장장 (team_leader)
- **이후**: 3농장 팀원 (team_member)
- **변경 이유**: sky3rain7@gmail.com에서 team_member로 설정함

### test7@test.com 권한 변경
- **이전**: 3농장 팀원 (team_member)
- **이후**: 3농장 농장장 (team_leader)
- **변경 이유**: 3농장에 농장장이 필요함

## 🛠️ 데이터베이스 업데이트

### SQL 업데이트 쿼리
```sql
-- test6@test.com을 team_member로 변경
UPDATE users 
SET role = 'team_member', 
    team_id = 'c4e16b80-b572-4f7b-b843-4a612807ee8c',  -- 3농장 ID
    team_name = '3농장',
    updated_at = NOW()
WHERE email = 'test6@test.com';

-- test7@test.com을 team_leader로 변경
UPDATE users 
SET role = 'team_leader', 
    team_id = 'c4e16b80-b572-4f7b-b843-4a612807ee8c',  -- 3농장 ID
    team_name = '3농장',
    updated_at = NOW()
WHERE email = 'test7@test.com';

-- memberships 테이블도 일치시키기
UPDATE memberships 
SET role = 'viewer'  -- team_member에 해당
WHERE user_id = (SELECT id FROM users WHERE email = 'test6@test.com');

UPDATE memberships 
SET role = 'operator'  -- team_leader에 해당
WHERE user_id = (SELECT id FROM users WHERE email = 'test7@test.com');
```

## 📝 문서 업데이트 완료

### 수정된 문서
1. **`docs/USER_AUTH_SYSTEM.md`** - 테스트 계정 권한 정보 수정
2. **`README.md`** - 테스트 계정 섹션 수정
3. **`docs/USER_PERMISSION_UNIFICATION_GUIDE.md`** - 새로 생성된 통일 가이드

### 변경 내용
- `test6@test.com`: 농장장 → 팀원
- `test7@test.com`: 팀원 → 농장장
- 3농장 팀 구조 재정리

## ✅ 검증 방법

### 1. 로그인 테스트
- `test6@test.com`으로 로그인하여 팀원 권한 확인
- `test7@test.com`으로 로그인하여 농장장 권한 확인

### 2. 권한 확인
- 마이페이지에서 역할이 올바르게 표시되는지 확인
- 농장 관리 기능 접근 권한 확인

### 3. 데이터 일관성 확인
- `users` 테이블과 `memberships` 테이블의 권한이 일치하는지 확인

## 🎯 결과

이제 `sky3rain7@gmail.com`에서 설정한 권한과 실제 로그인 시 표시되는 권한이 완전히 일치합니다.

- ✅ 권한 체계 통일 완료
- ✅ 문서 업데이트 완료
- ✅ 데이터 일관성 확보
- ✅ 테스트 계정 정리 완료

---

**업데이트 일시**: 2025.09.28  
**작성자**: 스마트팜 개발팀  
**버전**: 1.0

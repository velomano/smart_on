# 🌉 Universal Bridge 프로덕션 배포 체크리스트

## 📋 **재진입 시 단계별 체크리스트**

### **Phase 1: 저장공간 정리 및 준비** ✅
- [ ] 디스크 공간 정리 (`df -h`로 확인)
- [ ] 불필요한 node_modules 제거
- [ ] pnpm 캐시 정리 (`pnpm store prune`)
- [ ] 현재 브랜치 확인 (`git branch --show-current`)

### **Phase 2: 코드 커밋 및 푸시** ✅
- [ ] 변경사항 스테이징 (`git add .`)
- [ ] 커밋 생성 (`git commit -m "feat: Universal Bridge healthcheck endpoints"`)
- [ ] 브랜치 푸시 (`git push origin feat/bridge-prod-deploy`)

### **Phase 3: Vercel 프로덕션 배포** ✅
- [ ] Vercel 연결 확인 (`.vercel` 폴더 존재)
- [ ] 환경변수 확인 (`vercel env ls`)
- [ ] 프로덕션 배포 실행 (`vercel --prod`)
- [ ] 배포 URL 확인

### **Phase 4: 배포 검증** ✅
- [ ] HTTP 헬스체크 테스트 (`curl [URL]/bridge`)
- [ ] 응답 구조 확인 (`{data: {ok: true}, error: null, traceId: "..."}`)
- [ ] WebSocket 엔드포인트 테스트 (`curl [URL]/ws`)
- [ ] 에러 로그 확인 (Vercel 대시보드)

### **Phase 5: 커스텀 도메인 연결** ✅
- [ ] 도메인 추가 (`vercel domains add bridge.your-domain.com`)
- [ ] 배포 URL을 도메인에 연결 (`vercel alias`)
- [ ] 도메인 접근 테스트
- [ ] SSL 인증서 확인 (자동 적용)

### **Phase 6: Web Admin 연동** ✅
- [ ] `NEXT_PUBLIC_BRIDGE_URL` 환경변수 업데이트
- [ ] Web Admin에서 Bridge 호출 테스트
- [ ] 실시간 연동 확인
- [ ] 에러 핸들링 테스트

## 🎯 **성공 기준**

### **기술적 검증**
- [ ] `/bridge` 엔드포인트가 `200 OK` 반환
- [ ] 응답에 `traceId` 포함
- [ ] `/ws` 엔드포인트 정상 응답
- [ ] 커스텀 도메인 접근 가능
- [ ] SSL 인증서 정상 작동

### **기능적 검증**
- [ ] Web Admin에서 Bridge 호출 성공
- [ ] 실시간 데이터 연동 정상
- [ ] 에러 처리 정상 작동
- [ ] 로그 추적 가능

## 🚨 **문제 해결**

### **배포 실패 시**
1. Vercel 대시보드에서 빌드 로그 확인
2. 환경변수 설정 재확인
3. vercel.json 설정 검토
4. 필요시 Node.js 런타임으로 변경

### **도메인 연결 실패 시**
1. DNS 설정 확인
2. 도메인 소유권 인증 확인
3. Vercel 도메인 설정 재확인

### **Web Admin 연동 실패 시**
1. 환경변수 업데이트 확인
2. CORS 설정 확인
3. 네트워크 요청 로그 확인

## 📞 **지원 정보**

- **Vercel 대시보드**: https://vercel.com/smart-ons-projects/smart_on
- **배포 URL**: 배포 후 확인
- **커스텀 도메인**: bridge.your-domain.com (설정 후)
- **GitHub 브랜치**: feat/bridge-prod-deploy

---

**다음 작업**: 저장공간 정리 후 위 체크리스트를 순서대로 진행

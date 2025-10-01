# Dynamic UI 시스템 설정 가이드

## 📋 **환경 변수 설정**

`.env.local` 파일에 다음 변수를 추가하세요:

```bash
# Feature Flags
NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD=0  # 1로 설정하면 레거시 대시보드 활성화

# Universal Bridge
NEXT_PUBLIC_BRIDGE_SERVER_URL=http://localhost:3000
```

---

## 🚀 **사용 방법**

### **1. 정상 모드 (Dynamic UI)**
```bash
NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD=0
```

- `/farms` → 농장 목록
- `/farms/[id]` → Dynamic UI 대시보드
- Device Profile 기반 자동 UI 생성

### **2. 롤백 모드 (레거시)**
```bash
NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD=1
```

- 기존 대시보드로 즉시 복귀
- 문제 발생 시 긴급 롤백

---

## 📊 **페이지 구조**

```
/beds                      ← 베드 시각화 (그대로 유지)
├─ BedTierShelfVisualization
└─ 작물 관리

/farms                     ← 농장 목록 (신규)
├─ 농장 카드
└─ 디바이스 수, 온라인 상태

/farms/[id]                ← 농장 상세 (신규, Dynamic UI)
├─ FarmAutoDashboard
├─ Device Profile 기반 UI
└─ 센서/액추에이터 자동 렌더링
```

---

## ✅ **체크리스트**

### **배포 전**
- [ ] `.env.local`에 환경 변수 설정
- [ ] Device Profiles 등록 (Supabase SQL)
- [ ] `/api/farms/[id]/devices/ui-model` 테스트
- [ ] 디바이스 최소 2개 등록

### **배포 후**
- [ ] `/farms` 접근 확인
- [ ] `/farms/[id]` Dynamic UI 렌더링 확인
- [ ] 센서 데이터 표시 확인
- [ ] 액추에이터 제어 확인

### **긴급 롤백**
```bash
# .env.local 수정
NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD=1

# 재시작
npm run dev  # 또는 pm2 restart
```

---

## 🔄 **기존 시스템과의 관계**

| 페이지 | 목적 | 상태 |
|--------|------|------|
| `/beds` | 베드 시각화, 작물 관리 | ✅ 그대로 유지 |
| `/farms` | IoT 디바이스 모니터링 | 🆕 신규 (Dynamic UI) |
| `/connect` | 디바이스 연결 | ✅ 그대로 유지 |
| `/system` | 시스템 관리 | ✅ 그대로 유지 |

**베드 시각화는 절대 건드리지 않음!** ✅

---

## 📞 **문제 발생 시**

1. **UI가 표시 안 됨**
   - Device Profile 등록 확인
   - API 엔드포인트 확인: `/api/farms/[id]/devices/ui-model`

2. **센서 데이터 없음**
   - `iot_devices` 테이블 확인
   - `iot_readings` 테이블 확인
   - Universal Bridge 서버 실행 확인

3. **즉시 롤백 필요**
   ```bash
   NEXT_PUBLIC_FORCE_LEGACY_DASHBOARD=1
   ```

---

**마지막 업데이트:** 2025-10-01


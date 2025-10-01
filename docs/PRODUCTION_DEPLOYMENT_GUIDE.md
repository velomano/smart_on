# Universal Bridge 프로덕션 배포 가이드

## 🚀 배포 옵션

### 옵션 1: Vercel (추천)
```bash
# Universal Bridge를 별도 Vercel 프로젝트로 배포
cd apps/universal-bridge
vercel --prod
```

### 옵션 2: Railway
```bash
# Railway CLI 설치 후
railway login
railway init
railway up
```

### 옵션 3: AWS EC2
```bash
# EC2 인스턴스에서
git clone your-repo
cd apps/universal-bridge
npm install
npm run build
npm start
```

## 🔧 환경변수 설정

### 프로덕션 환경변수
```bash
# Universal Bridge 서버
SUPABASE_URL=https://kkrcwdybrsppbsufrrdg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_key
BRIDGE_HTTP_PORT=3000
BRIDGE_SERVER_URL=https://your-bridge-domain.com
WEB_ADMIN_URL=https://smart-on.vercel.app
SIGNATURE_VERIFY_OFF=false  # 프로덕션에서는 보안 강화
```

### Web Admin 환경변수 업데이트
```bash
# Web Admin (.env.local)
NEXT_PUBLIC_BRIDGE_URL=https://your-bridge-domain.com
```

## 📱 ESP32 코드 설정

### 프로덕션용 ESP32 코드
```cpp
// WiFi 설정
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 서버 설정 (프로덕션)
const char* SERVER_URL = "https://your-bridge-domain.com";
const char* DEVICE_ID = "esp32-001";
const char* DEVICE_KEY = "DK_your_device_key";
```

## 🔄 배포 후 테스트

1. **Universal Bridge 서버 배포**
2. **Web Admin 환경변수 업데이트**
3. **ESP32 코드 업데이트 후 업로드**
4. **Connect Wizard에서 테스트**

## 💡 추천 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Admin     │    │ Universal Bridge│    │   ESP32 IoT     │
│ (Vercel)        │◄──►│ (Railway/AWS)   │◄──►│   Devices       │
│ smart-on.vercel │    │ bridge-domain   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 장점

- **확장성**: Universal Bridge만 별도 스케일링
- **안정성**: Web Admin과 Bridge 독립적 운영
- **보안**: 각 서비스별 독립적 보안 설정
- **비용**: 필요한 리소스만 사용

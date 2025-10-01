# Vercel 배포 체크리스트 (Terahub SmartFarm)

## 1️⃣ 프로젝트/환경변수 세팅

### Vercel → Project(Settings) → Environment Variables 설정

**Preview/Production 둘 다 설정:**

#### 필수 환경변수
```bash
# 앱 기본 설정
NEXT_PUBLIC_APP_NAME=Terahub SmartFarm
NEXT_PUBLIC_APP_URL=https://app.terahub.ai

# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # 서버 전용, 클라이언트 노출 금지

# LLM 설정 (Phase 2)
OPENAI_API_KEY=sk-... # LLM 기능 활성화 시

# MQTT 설정
MQTT_WS_URL=wss://your-mqtt-broker.com:8083
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password

# Bridge API (선택)
BRIDGE_HTTP_URL=https://api.terahub.ai/bridge
```

## 2️⃣ Next.js 라우트 핸들러 런타임 설정

### Edge 런타임 (빠르고 저렴)
```typescript
// app/api/iot/generate-code/route.ts
export const runtime = 'edge'; // 템플릿 조합만 하면 Edge가 베스트

export async function POST(req: Request) {
  const spec = await req.json();
  // ...코드 생성 (템플릿 조립)
  return new Response(generated, {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
```

### Node.js 런타임 (Supabase SDK 필요)
```typescript
// app/api/devices/[id]/ui-model/route.ts
export const runtime = 'nodejs'; // Supabase SDK 사용

export async function GET(req: NextRequest) {
  const supabase = createClient(); // Supabase 클라이언트
  // ...
}
```

## 3️⃣ Vercel 빌드 설정

### Settings → Build & Development Settings
- **Framework**: Next.js
- **Build Command**: `next build` (기본)
- **Output**: 자동
- **Environment**: Node.js 18+ (기본)

### vercel.json 설정
```json
{
  "framework": "nextjs",
  "regions": ["icn1"],
  "functions": {
    "app/api/**/route.ts": { "maxDuration": 10 }
  }
}
```

## 4️⃣ 서브도메인(멀티테넌트) 설정

### DNS & 도메인 설정
1. **Vercel → Project → Domains**
   - `terahub.ai` 추가
   - Wildcard 도메인 추가: `*.terahub.ai`

2. **DNS 레코드 설정**
   ```
   terahub.ai        A    76.76.19.61
   *.terahub.ai      A    76.76.19.61
   ```

### middleware.ts (테넌트 식별)
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(req: Request) {
  const url = new URL(req.url);
  const host = url.hostname; // ex) farm1.terahub.ai
  const root = 'terahub.ai';

  let sub = '';
  if (host.endsWith(`.${root}`)) {
    sub = host.slice(0, -1 * (`.${root}`).length); // 'farm1'
  }

  // 서브도메인이면 테넌트 힌트를 헤더로 전달
  if (sub && sub !== 'www') {
    const res = NextResponse.next();
    res.headers.set('x-tenant', sub);
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/|.*\\..*).*)'
  ]
};
```

### 서버측 핸들러에서 테넌트 읽기
```typescript
// app/api/whatever/route.ts
export async function GET(req: Request) {
  const tenant = req.headers.get('x-tenant') || 'default';
  // 테넌트별 RLS/필터링에 활용
  return new Response(JSON.stringify({ tenant }));
}
```

## 5️⃣ MQTT/WebSocket 주의점

### 브라우저 MQTT 설정
- **브라우저**: MQTT over WebSocket으로 외부 브로커 연결
- **ESP32**: 일반 MQTT(TCP) 브로커에 연결
- **서버→디바이스**: 브로커의 Retained 메시지/명령 토픽 설계 권장

### 환경변수 예시
```bash
MQTT_WS_URL=wss://emqx.terahub.ai:8083
MQTT_USERNAME=farm_user
MQTT_PASSWORD=secure_password
```

## 6️⃣ ZIP 다운로드/파일 생성

### 클라이언트 사이드 처리
```typescript
// 클라이언트에서 JSZip으로 ZIP 구성 → Blob 다운로드
import JSZip from 'jszip';

const zip = new JSZip();
zip.file('iot_system.ino', generatedCode);
zip.file('README.md', readmeContent);

const blob = await zip.generateAsync({ type: 'blob' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'iot_project.zip';
a.click();
```

## 7️⃣ 보안·비공개 키

### 서버 전용 키 (클라이언트 노출 금지)
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `MQTT_PASSWORD`

### 클라이언트 키 (NEXT_PUBLIC_ 접두사)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_NAME`

## 8️⃣ 로그/관측

### Vercel Analytics
```typescript
// app/api/iot/events/route.ts (edge ok)
export const runtime = 'edge';

export async function POST(req: Request) {
  const { event, pins, power } = await req.json();
  
  // Supabase 테이블에 적재 (fetch로 RPC 호출)
  await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/log_iot_event`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ event, pins, power })
  });
  
  return new Response(null, { status: 204 });
}
```

## 9️⃣ LLM 온램프 (Phase 2)

### OpenAI API 설정
```typescript
// app/api/iot/interpret/route.ts
export const runtime = 'edge';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data.choices[0].message.content));
  } catch (error) {
    // 실패 시 규칙 기반 파서로 폴백
    return new Response(JSON.stringify({ error: 'LLM 서비스 일시 중단' }));
  }
}
```

## 🔟 최종 점검 스모크 (프로덕션 도메인)

### 체크리스트
- [ ] `/iot-designer` 로딩 정상
- [ ] 자연어 입력 → 체크박스 동기 반영
- [ ] 핀 충돌 0 케이스/충돌 케이스 처리
- [ ] 전원 카드 계산값 정확
- [ ] SVG Export 정상
- [ ] 코드 생성 API(Edge) 응답 시간 < 200ms
- [ ] ZIP 다운로드 정상
- [ ] `farm1.terahub.ai`로 접속 시 `x-tenant=farm1` 흐름 정상

### 테스트 명령어
```bash
# 기본 접속 테스트
curl -I https://app.terahub.ai/iot-designer

# 서브도메인 테스트
curl -I https://farm1.terahub.ai/iot-designer

# API 테스트
curl -X POST https://app.terahub.ai/api/iot/generate-code \
  -H "Content-Type: application/json" \
  -d '{"device":"esp32","protocol":"http","sensors":[{"type":"dht22","count":1}],"controls":[]}'
```

## 📋 배포 순서

1. **환경변수 설정** (Vercel 대시보드)
2. **도메인 연결** (`terahub.ai`, `*.terahub.ai`)
3. **빌드 테스트** (Preview 배포)
4. **스모크 테스트** (모든 기능 동작 확인)
5. **프로덕션 배포** (Production 배포)

## 🚨 주의사항

- **Vercel은 장시간 유지되는 TCP 소켓이나 순수 MQTT 브로커를 호스팅하지 않음**
- **브라우저→외부 MQTT(WS) 또는 Serverless API→외부 브로커 구성 필요**
- **모든 비공개 키는 서버 런타임에서만 사용, 클라이언트 노출 금지**
- **Edge 런타임은 Node.js API 사용 불가, fetch 기반으로만 외부 서비스 호출**

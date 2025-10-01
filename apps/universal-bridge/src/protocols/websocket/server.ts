/**
 * WebSocket Server
 * 
 * 양방향 실시간 통신
 * TODO: WebSocket 서버 구현
 */

import { WebSocketServer, WebSocket } from 'ws';

/**
 * WebSocket 서버 생성
 * 
 * TODO:
 * - [ ] 연결 인증
 * - [ ] 메시지 라우팅
 * - [ ] 명령 푸시
 * - [ ] Ping/Pong watchdog
 * - [ ] 토큰 재검증 (5분마다)
 */
export function createWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    console.log('[WebSocket] Client connected:', req.url);

    // TODO: 디바이스 ID 추출
    const deviceId = extractDeviceId(req.url);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[WebSocket] Message received:', message.type);

        // TODO: 메시지 처리
        switch (message.type) {
          case 'telemetry':
            // TODO: 텔레메트리 처리
            break;
          case 'ack':
            // TODO: ACK 처리
            break;
          default:
            console.warn('[WebSocket] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected:', deviceId);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    // TODO: Ping/Pong watchdog
    // TODO: 명령 구독 설정
  });

  console.log(`[WebSocket] Server listening on port ${port}`);
  return wss;
}

/**
 * URL에서 디바이스 ID 추출
 */
function extractDeviceId(url?: string): string | undefined {
  if (!url) return undefined;
  
  // /ws/:device_id 형식 파싱
  const match = url.match(/\/ws\/([^/?]+)/);
  return match ? match[1] : undefined;
}


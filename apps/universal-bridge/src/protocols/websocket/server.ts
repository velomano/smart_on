/**
 * WebSocket Server
 * 
 * 양방향 실시간 통신
 */

import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';

// 연결된 디바이스 관리
const deviceConnections = new Map<string, WebSocket>();

/**
 * WebSocket 서버 생성
 */
export function createWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    const { pathname, query } = parse(req.url || '', true);
    console.log('[WebSocket] Client connected:', pathname);

    // 디바이스 ID 또는 Setup Token 추출
    let deviceId: string | undefined;
    let isMonitor = false;

    if (pathname?.startsWith('/ws/')) {
      // 디바이스 연결: /ws/:device_id
      deviceId = pathname.split('/ws/')[1]?.split('?')[0];
      if (deviceId) {
        deviceConnections.set(deviceId, ws);
        console.log(`[WebSocket] Device registered: ${deviceId}`);
      }
    } else if (pathname?.startsWith('/monitor/')) {
      // 모니터링 연결: /monitor/:setup_token
      isMonitor = true;
      const setupToken = pathname.split('/monitor/')[1]?.split('?')[0];
      console.log(`[WebSocket] Monitor connected: ${setupToken}`);
    }

    // 메시지 수신
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[WebSocket] Message received:', message.type, 'from', deviceId);

        switch (message.type) {
          case 'telemetry':
            // 텔레메트리 처리
            await handleTelemetry(deviceId!, message.data);
            break;

          case 'ack':
            // 명령 ACK 처리
            await handleCommandAck(deviceId!, message.data);
            break;

          case 'ping':
            // Ping/Pong
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

          default:
            console.warn('[WebSocket] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message' }));
      }
    });

    // 연결 종료
    ws.on('close', () => {
      if (deviceId) {
        deviceConnections.delete(deviceId);
        console.log(`[WebSocket] Device disconnected: ${deviceId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    // Ping/Pong watchdog (30초마다)
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('close', () => {
      clearInterval(pingInterval);
    });
  });

  console.log(`[WebSocket] Server listening on port ${port}`);
  return wss;
}

/**
 * 디바이스에 명령 푸시
 */
export function pushCommandToDevice(deviceId: string, command: any): boolean {
  const ws = deviceConnections.get(deviceId);
  
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn(`[WebSocket] Device not connected: ${deviceId}`);
    return false;
  }

  try {
    ws.send(JSON.stringify({
      type: 'command',
      id: command.id,
      command: command.type,
      payload: command.payload,
      timestamp: new Date().toISOString(),
    }));
    
    console.log(`[WebSocket] Command pushed to ${deviceId}:`, command.type);
    return true;
  } catch (error) {
    console.error('[WebSocket] Failed to push command:', error);
    return false;
  }
}

/**
 * 텔레메트리 처리
 */
async function handleTelemetry(deviceId: string, data: any) {
  console.log(`[WS Telemetry] From ${deviceId}:`, data);
  // TODO: DB 저장
}

/**
 * 명령 ACK 처리
 */
async function handleCommandAck(deviceId: string, data: any) {
  console.log(`[WS ACK] From ${deviceId}:`, data);
  // TODO: DB 업데이트 (iot_commands.status = 'acked', ack_at = NOW())
}


import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  farmId: string;
  onMessage?: (message: WebSocketMessage) => void;
  onTelemetry?: (data: any) => void;
  onDeviceStatus?: (deviceId: string, status: string) => void;
  onEvent?: (event: any) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  farmId,
  onMessage,
  onTelemetry,
  onDeviceStatus,
  onEvent,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (connecting || connected) return;
    
    setConnecting(true);
    setError(null);

    try {
      // Universal Bridge WebSocket 연결
      const wsUrl = process.env.NEXT_PUBLIC_BRIDGE_URL?.replace('http', 'ws') || 'ws://localhost:3000';
      const ws = new WebSocket(`${wsUrl}/ws?farmId=${farmId}`);

      ws.onopen = () => {
        console.log('🔌 WebSocket connected:', farmId);
        setSocket(ws);
        setConnected(true);
        setConnecting(false);
        setReconnectAttempts(0);
        setError(null);

        // Ping 주기적 전송 (30초마다)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // 메시지 타입별 처리
          switch (message.type) {
            case 'pong':
              // Ping 응답
              break;
            case 'connection':
              console.log('🔌 WebSocket connection established:', message);
              break;
            case 'telemetry':
              console.log('📊 Real-time telemetry received:', message);
              onTelemetry?.(message);
              break;
            case 'device_status':
              console.log('📱 Device status update:', message);
              onDeviceStatus?.(message.deviceId, message.status);
              break;
            case 'event':
              console.log('📋 Real-time event:', message);
              onEvent?.(message);
              break;
            default:
              console.log('📨 WebSocket message:', message);
              onMessage?.(message);
          }
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setConnected(false);
        setConnecting(false);
        setSocket(null);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // 자동 재연결 (정상 종료가 아닌 경우)
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          console.log(`🔄 Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
          setReconnectAttempts(prev => prev + 1);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('연결 실패: 최대 재연결 시도 횟수 초과');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket 연결 오류');
        setConnecting(false);
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      setError('WebSocket 연결 실패');
      setConnecting(false);
    }
  }, [farmId, connecting, connected, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onMessage, onTelemetry, onDeviceStatus, onEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }
  }, [socket]);

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [socket]);

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    if (farmId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [farmId]); // farmId 변경 시에만 재연결

  return {
    socket,
    connected,
    connecting,
    error,
    reconnectAttempts,
    sendMessage,
    connect,
    disconnect
  };
}

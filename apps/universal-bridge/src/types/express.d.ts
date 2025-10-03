/**
 * Express Request 타입 확장
 * 
 * reqId 속성을 추가하여 로깅 시스템에서 사용
 */

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export {};

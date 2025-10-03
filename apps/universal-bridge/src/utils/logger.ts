/**
 * Logger Utility
 * 
 * Go-Live 체크리스트 기반 구조화된 로깅 시스템
 * - 모든 요청에 reqId(UUID) 부여
 * - MQTT 수신/발행은 topic·latency 포함
 * - 에러는 error + reqId로 묶기
 */

import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogContext {
  reqId?: string;
  userId?: string;
  deviceId?: string;
  tenantId?: string;
  farmId?: string;
  topic?: string;
  latency?: number;
  error?: Error | string | unknown;
  [key: string]: any;
}

export interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
  
  // MQTT 전용 로깅
  mqttReceive(topic: string, payload: any, latency?: number, context?: LogContext): void;
  mqttPublish(topic: string, payload: any, latency?: number, context?: LogContext): void;
  
  // HTTP 요청 로깅
  httpRequest(method: string, path: string, statusCode: number, latency: number, context?: LogContext): void;
  
  // 에러 로깅 (reqId 포함)
  logError(error: Error, message: string, context?: LogContext): void;
}

class StructuredLogger implements Logger {
  private readonly logLevel: LogLevel;
  private readonly serviceName = 'universal-bridge';
  private readonly version = '2.0.0';

  constructor() {
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    if (['error', 'warn', 'info', 'debug', 'trace'].includes(level)) {
      return level;
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'trace'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      version: this.version,
      message,
      ...context
    };

    return JSON.stringify(logEntry);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedLog = this.formatLog(level, message, context);
    
    switch (level) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'trace':
        console.trace(formattedLog);
        break;
    }
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log('trace', message, context);
  }

  // MQTT 전용 로깅
  mqttReceive(topic: string, payload: any, latency?: number, context?: LogContext): void {
    this.info('MQTT message received', {
      topic,
      payloadSize: JSON.stringify(payload).length,
      latency,
      ...context
    });
  }

  mqttPublish(topic: string, payload: any, latency?: number, context?: LogContext): void {
    this.info('MQTT message published', {
      topic,
      payloadSize: JSON.stringify(payload).length,
      latency,
      ...context
    });
  }

  // HTTP 요청 로깅
  httpRequest(method: string, path: string, statusCode: number, latency: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'error' : 'info';
    this.log(level, 'HTTP request', {
      method,
      path,
      statusCode,
      latency,
      ...context
    });
  }

  // 에러 로깅 (reqId 포함)
  logError(error: Error, message: string, context?: LogContext): void {
    this.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      reqId: context?.reqId || uuidv4(),
      ...context
    });
  }
}

// 요청 ID 생성 헬퍼
export function generateRequestId(): string {
  return uuidv4();
}

// 로거 인스턴스
export const logger = new StructuredLogger();
import winston from 'winston';

// 로그 레벨 정의
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// 로그 컨텍스트 타입 정의
export interface LogContext {
  userId?: string;
  farmId?: string;
  deviceId?: string;
  requestId?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

// 구조화된 로그 엔트리 타입
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private winston: winston.Logger;

  constructor() {
    // 환경별 로그 설정
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    this.winston = winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'smart-farm-web-admin',
        version: process.env.npm_package_version || '1.0.0'
      },
      transports: [
        // 콘솔 출력 (개발환경에서 컬러 적용)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, error }: any) => {
              const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
              const errorStr = error ? ` | Error: ${error.message}` : '';
              return `${timestamp} [${level}]: ${message}${contextStr}${errorStr}`;
            })
          )
        }),
        
        // 파일 출력 (개발환경에서만)
        ...(isDevelopment ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          })
        ] : [])
      ]
    });

    // 프로덕션에서는 에러만 로깅
    if (isProduction) {
      this.winston.level = 'error';
    }
  }

  /**
   * 에러 로그
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.winston.error(message, {
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  /**
   * 경고 로그
   */
  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, { context });
  }

  /**
   * 정보 로그
   */
  info(message: string, context?: LogContext): void {
    this.winston.info(message, { context });
  }

  /**
   * 디버그 로그 (개발환경에서만)
   */
  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, { context });
  }

  /**
   * API 요청 로그
   */
  logApiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      action: 'api_request'
    });
  }

  /**
   * API 응답 로그
   */
  logApiResponse(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'error' : 'info';
    const message = `API Response: ${method} ${url} - ${statusCode} (${responseTime}ms)`;
    
    this.winston.log(level, message, {
      context: {
        ...context,
        action: 'api_response',
        statusCode,
        responseTime
      }
    });
  }

  /**
   * 사용자 활동 로그
   */
  logUserActivity(action: string, context?: LogContext): void {
    this.info(`User Activity: ${action}`, {
      ...context,
      action: 'user_activity'
    });
  }

  /**
   * 시스템 이벤트 로그
   */
  logSystemEvent(event: string, context?: LogContext): void {
    this.info(`System Event: ${event}`, {
      ...context,
      action: 'system_event'
    });
  }

  /**
   * 보안 관련 로그
   */
  logSecurity(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      action: 'security_event'
    });
  }

  /**
   * 성능 메트릭 로그
   */
  logPerformance(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Performance: ${metric} = ${value}${unit}`, {
      ...context,
      action: 'performance_metric',
      metric,
      value,
      unit
    });
  }
}

// 싱글톤 인스턴스 생성
export const logger = new Logger();

// 편의 함수들
export const logError = (message: string, context?: LogContext, error?: Error) => 
  logger.error(message, context, error);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logWarning = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

export const logApi = {
  request: (method: string, url: string, context?: LogContext) => 
    logger.logApiRequest(method, url, context),
  response: (method: string, url: string, statusCode: number, responseTime: number, context?: LogContext) => 
    logger.logApiResponse(method, url, statusCode, responseTime, context)
};

export const logUser = (action: string, context?: LogContext) => 
  logger.logUserActivity(action, context);

export const logSystem = (event: string, context?: LogContext) => 
  logger.logSystemEvent(event, context);

export const logSecurity = (event: string, context?: LogContext) => 
  logger.logSecurity(event, context);

export const logPerformance = (metric: string, value: number, unit: string, context?: LogContext) => 
  logger.logPerformance(metric, value, unit, context);

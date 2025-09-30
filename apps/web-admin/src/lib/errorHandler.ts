import { NextRequest, NextResponse } from 'next/server';
import { logger, LogContext } from './logger';

// 에러 타입 정의
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

// 커스텀 에러 클래스
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: LogContext;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    context?: LogContext
  ) {
    super(message);
    
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.context = context;

    // 스택 트레이스 보존
    Error.captureStackTrace(this, this.constructor);
  }
}

// 에러 응답 형식
interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    code: string;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
}

// 에러 타입별 상태 코드 매핑
const ERROR_STATUS_MAP: Record<ErrorType, number> = {
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.AUTHENTICATION_ERROR]: 401,
  [ErrorType.AUTHORIZATION_ERROR]: 403,
  [ErrorType.NOT_FOUND_ERROR]: 404,
  [ErrorType.RATE_LIMIT_ERROR]: 429,
  [ErrorType.DATABASE_ERROR]: 500,
  [ErrorType.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorType.NETWORK_ERROR]: 503,
  [ErrorType.TIMEOUT_ERROR]: 504,
  [ErrorType.INTERNAL_SERVER_ERROR]: 500
};

// 에러 타입별 메시지 매핑
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION_ERROR]: '입력 데이터가 올바르지 않습니다.',
  [ErrorType.AUTHENTICATION_ERROR]: '인증이 필요합니다.',
  [ErrorType.AUTHORIZATION_ERROR]: '접근 권한이 없습니다.',
  [ErrorType.NOT_FOUND_ERROR]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorType.RATE_LIMIT_ERROR]: '요청 한도를 초과했습니다.',
  [ErrorType.DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',
  [ErrorType.EXTERNAL_SERVICE_ERROR]: '외부 서비스 오류가 발생했습니다.',
  [ErrorType.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
  [ErrorType.TIMEOUT_ERROR]: '요청 시간이 초과되었습니다.',
  [ErrorType.INTERNAL_SERVER_ERROR]: '서버 내부 오류가 발생했습니다.'
};

/**
 * 에러를 분석하고 적절한 응답 생성
 */
export function handleError(error: unknown, context?: LogContext): NextResponse {
  const requestId = generateRequestId();
  
  // AppError인 경우
  if (error instanceof AppError) {
    logger.error(`Application Error: ${error.message}`, {
      ...context,
      ...error.context,
      requestId,
      errorType: error.type,
      statusCode: error.statusCode
    }, error);

    const response: ErrorResponse = {
      success: false,
      error: {
        type: error.type,
        message: error.message,
        code: error.type,
        timestamp: new Date().toISOString(),
        requestId,
        details: error.context
      }
    };

    return NextResponse.json(response, { status: error.statusCode });
  }

  // 일반 Error인 경우
  if (error instanceof Error) {
    // Supabase 에러인지 확인
    if (error.message.includes('supabase') || error.message.includes('database')) {
      logger.error('Database Error', {
        ...context,
        requestId,
        errorType: ErrorType.DATABASE_ERROR
      }, error);

      const response: ErrorResponse = {
        success: false,
        error: {
          type: ErrorType.DATABASE_ERROR,
          message: ERROR_MESSAGES[ErrorType.DATABASE_ERROR],
          code: ErrorType.DATABASE_ERROR,
          timestamp: new Date().toISOString(),
          requestId
        }
      };

      return NextResponse.json(response, { status: ERROR_STATUS_MAP[ErrorType.DATABASE_ERROR] });
    }

    // 네트워크 에러인지 확인
    if (error.message.includes('fetch') || error.message.includes('network')) {
      logger.error('Network Error', {
        ...context,
        requestId,
        errorType: ErrorType.NETWORK_ERROR
      }, error);

      const response: ErrorResponse = {
        success: false,
        error: {
          type: ErrorType.NETWORK_ERROR,
          message: ERROR_MESSAGES[ErrorType.NETWORK_ERROR],
          code: ErrorType.NETWORK_ERROR,
          timestamp: new Date().toISOString(),
          requestId
        }
      };

      return NextResponse.json(response, { status: ERROR_STATUS_MAP[ErrorType.NETWORK_ERROR] });
    }

    // 일반 에러
    logger.error('Unexpected Error', {
      ...context,
      requestId,
      errorType: ErrorType.INTERNAL_SERVER_ERROR
    }, error);

    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES[ErrorType.INTERNAL_SERVER_ERROR],
        code: ErrorType.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    return NextResponse.json(response, { status: ERROR_STATUS_MAP[ErrorType.INTERNAL_SERVER_ERROR] });
  }

  // 알 수 없는 에러
  logger.error('Unknown Error', {
    ...context,
    requestId,
    errorType: ErrorType.INTERNAL_SERVER_ERROR,
    rawError: error
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      type: ErrorType.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES[ErrorType.INTERNAL_SERVER_ERROR],
      code: ErrorType.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  return NextResponse.json(response, { status: ERROR_STATUS_MAP[ErrorType.INTERNAL_SERVER_ERROR] });
}

/**
 * API 핸들러를 래핑하여 에러 처리 자동화
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // 요청 컨텍스트 추출
      const request = args[0] as NextRequest;
      const context: LogContext = {
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
        requestId: generateRequestId()
      };

      return handleError(error, context);
    }
  };
}

/**
 * 유효성 검사 에러 생성
 */
export function createValidationError(message: string, context?: LogContext): AppError {
  return new AppError(message, ErrorType.VALIDATION_ERROR, 400, context);
}

/**
 * 인증 에러 생성
 */
export function createAuthError(message: string = '인증이 필요합니다.', context?: LogContext): AppError {
  return new AppError(message, ErrorType.AUTHENTICATION_ERROR, 401, context);
}

/**
 * 권한 에러 생성
 */
export function createAuthzError(message: string = '접근 권한이 없습니다.', context?: LogContext): AppError {
  return new AppError(message, ErrorType.AUTHORIZATION_ERROR, 403, context);
}

/**
 * Not Found 에러 생성
 */
export function createNotFoundError(message: string = '리소스를 찾을 수 없습니다.', context?: LogContext): AppError {
  return new AppError(message, ErrorType.NOT_FOUND_ERROR, 404, context);
}

/**
 * 데이터베이스 에러 생성
 */
export function createDatabaseError(message: string, context?: LogContext): AppError {
  return new AppError(message, ErrorType.DATABASE_ERROR, 500, context);
}

/**
 * 외부 서비스 에러 생성
 */
export function createExternalServiceError(message: string, context?: LogContext): AppError {
  return new AppError(message, ErrorType.EXTERNAL_SERVICE_ERROR, 502, context);
}

/**
 * Rate Limit 에러 생성
 */
export function createRateLimitError(message: string = '요청 한도를 초과했습니다.', context?: LogContext): AppError {
  return new AppError(message, ErrorType.RATE_LIMIT_ERROR, 429, context);
}

// 유틸리티 함수들
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// 성공 응답 헬퍼
export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
}

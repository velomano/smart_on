// 인증 에러 전역 핸들러
import { createClient } from './supabase/client';

export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  
  public static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * 인증 에러 처리
   * @param error 에러 객체
   * @returns 사용자에게 표시할 메시지
   */
  public async handleAuthError(error: any): Promise<string> {
    const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
    
    console.warn('🔐 인증 에러 감지:', errorMessage);
    
    // Refresh Token 관련 오류들
    if (this.isRefreshTokenError(errorMessage)) {
      await this.handleRefreshTokenError();
      return '인증 세션이 만료되었습니다. 다시 로그인해주세요.';
    }
    
    // 네트워크 관련 오류
    if (this.isNetworkError(errorMessage)) {
      return '네트워크 연결을 확인해주세요.';
    }
    
    // 일반적인 인증 오류
    if (this.isAuthError(errorMessage)) {
      return this.translateAuthError(errorMessage);
    }
    
    // 기본 에러 메시지
    return `인증 오류가 발생했습니다: ${errorMessage}`;
  }

  /**
   * Refresh Token 에러 여부 확인
   */
  private isRefreshTokenError(message: string): boolean {
    const refreshTokenErrors = [
      'Refresh Token Not Found',
      'Invalid refresh token',
      'refresh_token_not_found',
      'invalid_refresh_token'
    ];
    
    return refreshTokenErrors.some(error => 
      message.toLowerCase().includes(error.toLowerCase())
    );
  }

  /**
   * 네트워크 에러 여부 확인
   */
  private isNetworkError(message: string): boolean {
    const networkErrors = [
      'network error',
      'connection error',
      'timeout',
      'fetch failed'
    ];
    
    return networkErrors.some(error => 
      message.toLowerCase().includes(error.toLowerCase())
    );
  }

  /**
   * 인증 에러 여부 확인
   */
  private isAuthError(message: string): boolean {
    const authErrors = [
      'invalid credentials',
      'user not found',
      'email not confirmed',
      'too many requests'
    ];
    
    return authErrors.some(error => 
      message.toLowerCase().includes(error.toLowerCase())
    );
  }

  /**
   * Refresh Token 에러 처리
   */
  private async handleRefreshTokenError(): Promise<void> {
    try {
      console.log('🔄 Refresh Token 에러 처리: 세션 정리 중...');
      
      // Supabase 세션 정리
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // 로컬 스토리지 정리
      if (typeof window !== 'undefined') {
        // Supabase 관련 키들 정리
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('supabase')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // 세션 스토리지도 정리
        sessionStorage.clear();
        
        console.log('✅ 로컬 스토리지 정리 완료');
      }
      
      // 로그인 페이지로 리다이렉트
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
    } catch (cleanupError) {
      console.error('❌ 세션 정리 중 오류:', cleanupError);
    }
  }

  /**
   * 에러 메시지 한글 번역
   */
  private translateAuthError(message: string): string {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'Email not confirmed': '이메일 인증이 완료되지 않았습니다.',
      'User not found': '사용자를 찾을 수 없습니다.',
      'Invalid email': '올바르지 않은 이메일 형식입니다.',
      'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다.',
      'User already registered': '이미 등록된 사용자입니다.',
      'Too many requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
      'Network error': '네트워크 오류가 발생했습니다.',
      'Server error': '서버 오류가 발생했습니다.',
      'Invalid refresh token': '인증 토큰이 만료되었습니다. 다시 로그인해주세요.',
      'Refresh Token Not Found': '인증 세션이 만료되었습니다. 다시 로그인해주세요.'
    };

    // 정확한 매칭 시도
    if (errorMap[message]) {
      return errorMap[message];
    }

    // 부분 매칭 시도
    for (const [key, value] of Object.entries(errorMap)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // 기본 메시지
    return `인증 중 오류가 발생했습니다: ${message}`;
  }
}

// 전역 인스턴스 export
export const authErrorHandler = AuthErrorHandler.getInstance();

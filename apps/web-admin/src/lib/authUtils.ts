// 개발 환경용 인증 유틸리티

/**
 * 개발 환경에서 Supabase 토큰 정리
 */
export const clearSupabaseTokens = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('🧹 개발 환경 토큰 정리 중...');
  
  // Supabase 관련 모든 키 정리
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ 제거된 키: ${key}`);
  });
  
  // 세션 스토리지도 정리
  sessionStorage.clear();
  
  console.log('✅ 토큰 정리 완료');
};

/**
 * 개발 환경에서 인증 상태 초기화
 */
export const resetAuthState = () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  clearSupabaseTokens();
  
  // 페이지 새로고침
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

/**
 * 개발 환경에서 토큰 상태 확인
 */
export const checkTokenStatus = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('🔍 토큰 상태 확인:');
  
  const supabaseKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  
  console.log('Supabase 관련 키들:', supabaseKeys);
  
  supabaseKeys.forEach(key => {
    const value = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(value || '{}');
      console.log(`${key}:`, parsed);
    } catch {
      console.log(`${key}:`, value);
    }
  });
};

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 환경변수 또는 기본값 사용
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'https://your-project.supabase.co') {
    console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다. 기본값을 사용합니다.');
    console.warn('NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.');
  }
  
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 기본 클라이언트는 런타임에 동적으로 생성
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const supabase = {
  get instance() {
    if (!supabaseInstance) {
      supabaseInstance = createClient();
    }
    return supabaseInstance;
  }
};

// getSupabaseClient 함수 추가 (로그인 페이지에서 사용)
export function getSupabaseClient() {
  return createClient();
}

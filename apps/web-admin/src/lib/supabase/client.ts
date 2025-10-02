import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수가 없거나 placeholder인 경우 기본값 사용
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://placeholder.supabase.co' ||
      supabaseUrl.includes('placeholder') ||
      supabaseAnonKey === 'placeholder-key') {
    console.warn('Supabase environment variables are not properly set, using placeholder values');
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
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

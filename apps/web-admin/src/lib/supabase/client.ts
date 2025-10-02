import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are not set!');
    // 실제 환경변수가 없으면 에러를 던지도록 수정
    throw new Error('Supabase environment variables are not set');
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

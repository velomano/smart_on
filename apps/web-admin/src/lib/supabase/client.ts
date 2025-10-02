import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 시점에서는 기본값 사용, 런타임에서 에러 처리
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// 기본 클라이언트는 동적으로 생성
export const supabase = createClient();

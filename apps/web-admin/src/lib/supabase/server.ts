import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 환경변수가 없거나 placeholder인 경우 기본값 사용
  if (!supabaseUrl || !supabaseServiceKey || 
      supabaseUrl === 'https://placeholder.supabase.co' ||
      supabaseUrl.includes('placeholder') ||
      supabaseServiceKey === 'placeholder-key') {
    console.warn('Supabase server environment variables are not properly set, using placeholder values');
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

// getSupabaseClient 함수 추가 (로그인 페이지에서 사용)
export function getSupabaseClient() {
  return createClient();
}

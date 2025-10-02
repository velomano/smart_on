import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 환경변수를 직접 하드코딩 (임시 해결책)
const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDIxOTgsImV4cCI6MjA3NDExODE5OH0.oo-iIviVJ2oaWZldtmkYo1sWgHbxxIIkFUrBrU8rQqY';

export function createClient() {
  console.log('🔍 Supabase Client 생성 - 하드코딩된 값 사용');
  
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

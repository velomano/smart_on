import { createClient } from '@supabase/supabase-js';

export function createSbServer() {
  // Vercel 배포 환경에서는 ANON_KEY만 사용
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('Supabase 환경변수가 설정되지 않았습니다.');
    return null;
  }
  
  return createClient(url, key, { auth: { persistSession: false }});
}

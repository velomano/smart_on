import { createClient } from '@supabase/supabase-js';

export function createSbServer() {
  // 서버 전용: 서비스 롤키 사용 가능(서버 파일 내에서만)
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('Supabase 환경변수가 설정되지 않았습니다. Mock 데이터를 사용합니다.');
    return null;
  }
  
  return createClient(url, key, { auth: { persistSession: false }});
}

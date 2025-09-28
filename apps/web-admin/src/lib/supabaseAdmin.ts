import { createClient } from '@supabase/supabase-js';

export const supaAdmin = () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.');
  }
  
  return createClient(url, serviceKey);
};

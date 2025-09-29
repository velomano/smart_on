const { createClient } = require('@supabase/supabase-js');

async function removeDuplicates() {
  const supabaseUrl = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTQ0NzQ4MCwiZXhwIjoyMDUxMDIzNDgwfQ.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('🔍 중복 데이터 분석 시작...');
    
    // 모든 데이터 조회
    const { data: allData, error } = await supabase
      .from('crop_profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    console.log(`📊 전체 데이터: ${allData.length}건`);
    
    // 중복 체크 (crop_key, stage, target_ec, target_ph, npk_ratio 기준)
    const seen = new Set();
    const duplicates = [];
    const unique = [];
    
    for (const item of allData) {
      const key = `${item.crop_key}_${item.stage}_${item.target_ec}_${item.target_ph}_${item.npk_ratio}`;
      
      if (seen.has(key)) {
        duplicates.push(item);
      } else {
        seen.add(key);
        unique.push(item);
      }
    }
    
    console.log(`✅ 고유 데이터: ${unique.length}건`);
    console.log(`❌ 중복 데이터: ${duplicates.length}건`);
    
    if (duplicates.length > 0) {
      console.log('🗑️ 중복 데이터 삭제 시작...');
      
      const duplicateIds = duplicates.map(d => d.id);
      
      const { error: deleteError } = await supabase
        .from('crop_profiles')
        .delete()
        .in('id', duplicateIds);
      
      if (deleteError) throw deleteError;
      
      console.log(`✅ ${duplicates.length}건의 중복 데이터 삭제 완료`);
    }
    
    console.log('🎉 중복 제거 완료!');
    
  } catch (error) {
    console.error('❌ 중복 제거 실패:', error.message);
  }
}

removeDuplicates();

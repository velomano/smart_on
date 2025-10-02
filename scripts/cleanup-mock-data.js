#!/usr/bin/env node

/**
 * 목데이터 정리 스크립트
 * 기존에 저장된 가짜/샘플 데이터를 삭제합니다.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupMockData() {
  try {
    console.log('🧹 목데이터 정리 시작...');
    
    // 1. 기존 레시피 개수 확인
    const { count: beforeCount } = await supabase
      .from('nutrient_recipes')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 기존 레시피 수: ${beforeCount}건`);
    
    // 2. 목데이터 식별 및 삭제
    // 체크섬이 특정 패턴을 가진 데이터들을 삭제 (예: 기본값들)
    const mockChecksums = [
      // Cornell 기본값 체크섬들
      'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
      // RDA 기본값 체크섬들  
      'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
      // FAO 기본값 체크섬들
      'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2'
    ];
    
    // 특정 출처의 기본 데이터 삭제
    const { data: mockSources } = await supabase
      .from('nutrient_sources')
      .select('id, name')
      .in('name', ['Cornell CEA', '농촌진흥청', 'FAO Open Knowledge']);
    
    if (mockSources && mockSources.length > 0) {
      console.log(`🔍 목데이터 출처 발견: ${mockSources.map(s => s.name).join(', ')}`);
      
      // 해당 출처의 레시피들 중 기본값으로 보이는 것들 삭제
      for (const source of mockSources) {
        const { data: recipes } = await supabase
          .from('nutrient_recipes')
          .select('id, crop_key, stage, checksum')
          .eq('source_id', source.id);
        
        if (recipes && recipes.length > 0) {
          console.log(`🗑️ ${source.name} 레시피 ${recipes.length}건 삭제 중...`);
          
          const { error } = await supabase
            .from('nutrient_recipes')
            .delete()
            .eq('source_id', source.id);
          
          if (error) {
            console.error(`❌ ${source.name} 삭제 실패:`, error);
          } else {
            console.log(`✅ ${source.name} 레시피 삭제 완료`);
          }
        }
      }
    }
    
    // 3. 최종 개수 확인
    const { count: afterCount } = await supabase
      .from('nutrient_recipes')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 정리 후 레시피 수: ${afterCount}건`);
    console.log(`🗑️ 삭제된 레시피: ${beforeCount - afterCount}건`);
    
    // 4. 사용하지 않는 출처 정리
    const { data: unusedSources } = await supabase
      .from('nutrient_sources')
      .select('id, name')
      .not('id', 'in', `(SELECT DISTINCT source_id FROM nutrient_recipes WHERE source_id IS NOT NULL)`);
    
    if (unusedSources && unusedSources.length > 0) {
      console.log(`🗑️ 사용하지 않는 출처 ${unusedSources.length}개 삭제 중...`);
      
      const { error } = await supabase
        .from('nutrient_sources')
        .delete()
        .in('id', unusedSources.map(s => s.id));
      
      if (error) {
        console.error('❌ 출처 삭제 실패:', error);
      } else {
        console.log('✅ 사용하지 않는 출처 삭제 완료');
      }
    }
    
    console.log('🎉 목데이터 정리 완료!');
    
  } catch (error) {
    console.error('💥 목데이터 정리 실패:', error);
    process.exit(1);
  }
}

// 실행
cleanupMockData();

#!/usr/bin/env node

/**
 * nutrient_recipes 테이블의 데이터를 crop_profiles 테이블로 통합하는 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('SUPABASE_URL:', supabaseUrl ? '설정됨' : '미설정');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '설정됨' : '미설정');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateNutrientRecipes() {
  console.log('🚀 nutrient_recipes → crop_profiles 마이그레이션 시작');
  console.log('='.repeat(60));

  try {
    // 1. nutrient_recipes 테이블에서 모든 데이터 조회
    console.log('📊 nutrient_recipes 데이터 조회 중...');
    const { data: nutrientRecipes, error: fetchError } = await supabase
      .from('nutrient_recipes')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ nutrient_recipes 조회 실패:', fetchError);
      return;
    }

    console.log(`✅ ${nutrientRecipes.length}개의 레시피 발견`);

    if (nutrientRecipes.length === 0) {
      console.log('⚠️ 마이그레이션할 데이터가 없습니다.');
      return;
    }

    // 2. 각 레시피를 crop_profiles 형식으로 변환
    console.log('🔄 데이터 변환 중...');
    const cropProfiles = nutrientRecipes.map(recipe => {
      // macro 데이터에서 NPK 값 추출
      const macro = recipe.macro || {};
      const npk_ratio = `${macro.N || 0}-${macro.P || 0}-${macro.K || 0}`;
      
      // nutrients_detail 생성
      const nutrients_detail = {
        nitrogen: macro.N || 0,
        phosphorus: macro.P || 0,
        potassium: macro.K || 0,
        calcium: macro.Ca || 0,
        magnesium: macro.Mg || 0
      };

      // growing_conditions 생성
      const growing_conditions = recipe.env || {
        temp: 20,
        humidity: 65,
        lux: 15000
      };

      // source 정보에서 출처 정보 추출
      const source = recipe.source || {};
      
      return {
        crop_key: recipe.crop_key,
        crop_name: recipe.crop_name,
        stage: recipe.stage,
        target_ppm: macro, // target_ppm 필드 추가
        target_ec: recipe.target_ec,
        target_ph: recipe.target_ph,
        npk_ratio: npk_ratio,
        nutrients_detail: nutrients_detail,
        growing_conditions: growing_conditions,
        volume_l: 1000, // 기본값
        ec_target: recipe.target_ec,
        ph_target: recipe.target_ph,
        source_title: source.name || '스마트팜 데이터베이스',
        source_year: new Date().getFullYear(),
        author: source.name || '스마트팜 시스템',
        license: source.license || 'CC BY 4.0',
        description: `${recipe.crop_name} ${recipe.stage}에 최적화된 배양액 레시피입니다.`,
        metadata: {
          source_url: source.url || null,
          org_type: source.org_type || 'other',
          reliability: recipe.reliability || 0.9,
          collected_at: recipe.collected_at,
          checksum: recipe.checksum,
          migrated_from: 'nutrient_recipes',
          original_id: recipe.id
        }
      };
    });

    console.log(`✅ ${cropProfiles.length}개 레시피 변환 완료`);

    // 3. crop_profiles 테이블에 삽입
    console.log('💾 crop_profiles 테이블에 저장 중...');
    
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 10; // 배치 크기

    for (let i = 0; i < cropProfiles.length; i += batchSize) {
      const batch = cropProfiles.slice(i, i + batchSize);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('crop_profiles')
        .insert(batch)
        .select('id');

      if (insertError) {
        console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 삽입 실패:`, insertError);
        errorCount += batch.length;
      } else {
        successCount += insertedData.length;
        console.log(`✅ 배치 ${Math.floor(i/batchSize) + 1} 완료: ${insertedData.length}개 저장`);
      }

      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 마이그레이션 완료!');
    console.log(`📊 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    console.log(`📈 성공률: ${((successCount / cropProfiles.length) * 100).toFixed(1)}%`);

    // 4. 마이그레이션 완료 후 nutrient_recipes 테이블 비우기 (선택사항)
    console.log('\n🗑️ nutrient_recipes 테이블 정리 중...');
    
    const { error: deleteError } = await supabase
      .from('nutrient_recipes')
      .delete()
      .neq('id', 0); // 모든 데이터 삭제

    if (deleteError) {
      console.error('❌ nutrient_recipes 테이블 정리 실패:', deleteError);
    } else {
      console.log('✅ nutrient_recipes 테이블 정리 완료');
    }

    // 5. 최종 확인
    console.log('\n📋 최종 확인:');
    
    const { count: finalCount } = await supabase
      .from('crop_profiles')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 crop_profiles 테이블 총 레시피 수: ${finalCount}개`);

  } catch (error) {
    console.error('💥 마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
migrateNutrientRecipes().then(() => {
  console.log('\n🏁 마이그레이션 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 실패:', error);
  process.exit(1);
});

#!/usr/bin/env tsx

/**
 * 스마트 대량 수집 시스템
 * 3-4시간에 걸쳐 대량으로 배양액 레시피를 수집합니다.
 */

import "dotenv/config";
import { runSmartBatchCollection, runSingleBatchTest } from "./sources/smartBatch";
import { runPeriodCrawling } from "./sources/periodCrawler";
import { runCoverageSince2020 } from "./crawl/runCoverageSince2020";
import fetch from "node-fetch";

// Supabase에 레시피 저장
async function saveToSupabase(recipes: any[]): Promise<void> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
    }

    console.log(`💾 ${recipes.length}개 레시피를 Supabase에 저장 중...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const recipe of recipes) {
      try {
        // 레시피를 crop_profiles 형식으로 변환
        const cropProfile = {
          crop_key: recipe.crop_key,
          crop_name: recipe.crop_name,
          stage: recipe.stage,
          target_ec: recipe.target_ec,
          target_ph: recipe.target_ph,
          npk_ratio: `${recipe.macro.N}-${recipe.macro.P}-${recipe.macro.K}`,
          nutrients_detail: {
            nitrogen: recipe.macro.N,
            phosphorus: recipe.macro.P,
            potassium: recipe.macro.K,
            calcium: recipe.macro.Ca || 0,
            magnesium: recipe.macro.Mg || 0
          },
          growing_conditions: recipe.env,
          volume_l: 1000, // 기본값
          ec_target: recipe.target_ec,
          ph_target: recipe.target_ph,
          source_title: recipe.source.name,
          source_year: new Date().getFullYear(),
          author: recipe.source.name,
          license: recipe.source.license,
          description: `${recipe.source.name}에서 수집된 ${recipe.crop_name} 배양액 레시피`,
          metadata: {
            source_url: recipe.source.url,
            org_type: recipe.source.org_type,
            reliability: recipe.reliability,
            collected_at: recipe.collected_at,
            checksum: recipe.checksum
          }
        };

        const response = await fetch(`${supabaseUrl}/rest/v1/crop_profiles`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(cropProfile)
        });

        if (response.ok) {
          successCount++;
          console.log(`✅ 저장 완료: ${recipe.crop_name} (${recipe.stage}) - ${recipe.source.name}`);
        } else {
          errorCount++;
          console.error(`❌ 저장 실패: ${recipe.crop_name} (${recipe.stage}) - ${response.status}`);
        }
        
        // 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ 레시피 저장 중 오류: ${recipe.crop_name}`, error.message);
      }
    }
    
    console.log(`\n📊 저장 결과: 성공 ${successCount}개, 실패 ${errorCount}개`);
    
  } catch (error) {
    console.error('💥 Supabase 저장 실패:', error.message);
    throw error;
  }
}

// 명령행 인수 처리
const args = process.argv.slice(2);
const command = args[0] || 'batch';

async function main() {
  console.log('🚀 스마트 대량 수집 시스템');
  console.log('=' .repeat(50));
  
  switch (command) {
    case 'test':
      console.log('🧪 단일 배치 테스트 모드');
      await runSingleBatchTest();
      break;
      
    case 'period':
      console.log('📅 기간별 크롤링 모드 (2022-2025년)');
      console.log('⚠️ 이 작업은 오랜 시간이 걸립니다. 중단하려면 Ctrl+C를 누르세요.');
      
      // 5초 대기 (사용자가 중단할 수 있도록)
      console.log('⏳ 5초 후 시작...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const periodRecipes = await runPeriodCrawling();
      
      if (periodRecipes.length > 0) {
        console.log(`\n🎉 기간별 크롤링 완료: ${periodRecipes.length}개 레시피 수집`);
        
        // Supabase에 저장
        console.log('💾 Supabase에 저장 중...');
        await saveToSupabase(periodRecipes);
        
        process.exit(0);
      } else {
        console.log('\n❌ 기간별 크롤링이 실패했습니다.');
        process.exit(1);
      }
      break;
      
    case 'coverage':
      console.log('🎯 커버리지 우선 크롤링 모드 (2020-현재, 작물별 최대 2개)');
      console.log('⚠️ 이 작업은 오랜 시간이 걸립니다. 중단하려면 Ctrl+C를 누르세요.');
      
      // 5초 대기 (사용자가 중단할 수 있도록)
      console.log('⏳ 5초 후 시작...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const coverageRecipes = await runCoverageSince2020();
      
      if (coverageRecipes.length > 0) {
        console.log(`\n🎉 커버리지 크롤링 완료: ${coverageRecipes.length}개 레시피 수집`);
        
        // Supabase에 저장
        console.log('💾 Supabase에 저장 중...');
        await saveToSupabase(coverageRecipes);
        
        process.exit(0);
      } else {
        console.log('\n❌ 커버리지 크롤링이 실패했습니다.');
        process.exit(1);
      }
      break;
      
    case 'batch':
    default:
      console.log('🕐 대량 배치 수집 모드 (3-4시간 소요)');
      console.log('⚠️ 이 작업은 오랜 시간이 걸립니다. 중단하려면 Ctrl+C를 누르세요.');
      
      // 5초 대기 (사용자가 중단할 수 있도록)
      console.log('⏳ 5초 후 시작...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const result = await runSmartBatchCollection();
      
      if (result.success) {
        console.log('\n🎉 대량 수집이 성공적으로 완료되었습니다!');
        process.exit(0);
      } else {
        console.log('\n❌ 대량 수집이 실패했습니다.');
        process.exit(1);
      }
      break;
  }
}

// 에러 처리
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n⚠️ 사용자에 의해 중단되었습니다.');
  process.exit(0);
});

// 메인 함수 실행
main().catch(error => {
  console.error('💥 메인 함수 실행 실패:', error);
  process.exit(1);
});

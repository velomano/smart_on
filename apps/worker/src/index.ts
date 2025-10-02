import "dotenv/config";
import fetch from "node-fetch";
import { fetchCornellLettuce } from "./sources/cornell";
import { fetchRDARecipes } from "./sources/rda";
import { fetchFAORecipes } from "./sources/fao";
import { fetchAcademicRecipes } from "./sources/academic";

// 통합 수집 함수
async function collectAllRecipes() {
  const allRecipes = [];
  
  try {
    // 1. Cornell 수집
    console.log('🌱 Cornell CEA 수집 시작...');
    const cornellRecipes = await fetchCornellLettuce();
    allRecipes.push(...cornellRecipes);
    console.log(`✅ Cornell: ${cornellRecipes.length}건 수집`);
  } catch (error) {
    console.error('❌ Cornell 수집 실패:', error.message);
  }
  
  try {
    // 2. 농촌진흥청 수집
    console.log('🏛️ 농촌진흥청 수집 시작...');
    const rdaRecipes = await fetchRDARecipes();
    allRecipes.push(...rdaRecipes);
    console.log(`✅ 농촌진흥청: ${rdaRecipes.length}건 수집`);
  } catch (error) {
    console.error('❌ 농촌진흥청 수집 실패:', error.message);
  }
  
  try {
    // 3. FAO 수집
    console.log('🌍 FAO Open Knowledge 수집 시작...');
    const faoRecipes = await fetchFAORecipes();
    allRecipes.push(...faoRecipes);
    console.log(`✅ FAO: ${faoRecipes.length}건 수집`);
  } catch (error) {
    console.error('❌ FAO 수집 실패:', error.message);
  }
  
  try {
    // 4. 학술 연구소 수집
    console.log('🎓 학술 연구소 수집 시작...');
    const academicRecipes = await fetchAcademicRecipes();
    allRecipes.push(...academicRecipes);
    console.log(`✅ 학술 연구소: ${academicRecipes.length}건 수집`);
  } catch (error) {
    console.error('❌ 학술 연구소 수집 실패:', error.message);
  }
  
  return allRecipes;
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🚀 실전형 영양액 레시피 자동 수집 시작');
    console.log('=' .repeat(50));
    
    // 모든 소스에서 레시피 수집
    const allRecipes = await collectAllRecipes();
    
    console.log('=' .repeat(50));
    console.log(`📊 총 ${allRecipes.length}건의 레시피 수집 완료`);
    
    if (allRecipes.length === 0) {
      console.log('⚠️ 수집된 레시피가 없습니다.');
      return;
    }
    
    // Supabase REST API로 직접 저장
    console.log('💾 Supabase에 데이터 저장 중...');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Supabase 환경변수가 설정되지 않았습니다.");
      console.log("환경변수 확인:", {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
      process.exit(1);
    }
    
    let savedCount = 0;
    for (const recipe of allRecipes) {
      try {
        // nutrient_recipes 형식으로 변환
        const targetPpm = {
          N: recipe.macro?.N || 0,
          P: recipe.macro?.P || 0,
          K: recipe.macro?.K || 0,
          Ca: recipe.macro?.Ca || 0,
          Mg: recipe.macro?.Mg || 0,
          S: recipe.macro?.S || 0
        };
        
        const micro = {
          Fe: recipe.micro?.Fe || 2,
          Mn: recipe.micro?.Mn || 0.5,
          B: recipe.micro?.B || 0.5,
          Zn: recipe.micro?.Zn || 0.1,
          Cu: recipe.micro?.Cu || 0.05,
          Mo: recipe.micro?.Mo || 0.05
        };
        
        const nutrientRecipe = {
          crop_key: recipe.crop_key,
          stage: recipe.stage,
          target_ec: recipe.target_ec,
          target_ph: recipe.target_ph,
          macro: targetPpm,
          micro: micro,
          source_id: null, // source_id는 별도로 처리 필요
          reliability: recipe.source?.reliability_default || 0.7,
          checksum: `${recipe.crop_key}_${recipe.stage}_${recipe.source?.name || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        const res = await fetch(process.env.SUPABASE_URL + "/rest/v1/nutrient_recipes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(nutrientRecipe)
        });
        
        if (res.ok) {
          savedCount++;
          console.log(`✅ 저장 완료: ${recipe.crop_name || recipe.crop_key} (${recipe.stage})`);
        } else {
          const errorText = await res.text();
          console.error(`❌ 저장 실패: ${recipe.crop_name || recipe.crop_key}`, errorText);
        }
      } catch (error) {
        console.error(`❌ 저장 중 오류: ${recipe.crop_name || recipe.crop_key}`, error.message);
      }
    }
    
    console.log(`✅ Supabase 저장 완료: ${savedCount}/${allRecipes.length}건`);
    
    // 수집 통계 출력
    console.log('=' .repeat(50));
    console.log('📈 수집 통계:');
    
    const sourceStats = allRecipes.reduce((acc, recipe) => {
      const sourceName = recipe.source?.name || 'Unknown';
      acc[sourceName] = (acc[sourceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`  - ${source}: ${count}건`);
    });
    
    console.log('=' .repeat(50));
    console.log('🎉 실전형 영양액 자동 수집 시스템 구축 완료!');
    
  } catch (error) {
    console.error('💥 전체 수집 프로세스 실패:', error);
    process.exit(1);
  }
}

// 실행
main().catch(e => { 
  console.error('💥 예상치 못한 오류:', e); 
  process.exit(1); 
});
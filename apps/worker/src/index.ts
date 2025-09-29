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
    
    // Supabase Edge Function으로 데이터 저장
    console.log('💾 Supabase에 데이터 저장 중...');
    const res = await fetch(process.env.SUPABASE_FN_URL + "/ingest-nutrient", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SERVICE_ROLE}`
      },
      body: JSON.stringify(allRecipes)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Supabase 저장 실패:", errorText);
      process.exit(1);
    }
    
    const result = await res.json();
    console.log("✅ Supabase 저장 완료:", result);
    
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
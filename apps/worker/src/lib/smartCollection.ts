// 스마트 수집 로직 - 이미 충분한 데이터가 있는 작물은 제외
import { createClient } from '@supabase/supabase-js';

interface CropStageCount {
  crop_key: string;
  stage_count: number;
}

interface NutrientRecipe {
  crop_key: string;
  crop_name: string;
  stage: string;
  target_ec?: number;
  target_ph?: number;
  macro: Record<string, number>;
  micro: Record<string, number>;
  env: Record<string, number>;
  source: {
    name: string;
    url: string;
    org_type: 'government' | 'academic' | 'commercial' | 'other';
    reliability_default: number;
  };
  checksum: string;
}

// Supabase 클라이언트 생성
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// 현재 데이터베이스에서 작물별 성장단계 수 확인
export async function getCropStageCounts(): Promise<CropStageCount[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('nutrient_recipes')
      .select('crop_key, stage')
      .not('crop_key', 'is', null);
    
    if (error) {
      console.error('작물별 성장단계 수 조회 실패:', error);
      return [];
    }
    
    // 작물별 성장단계 수 계산
    const cropStageMap = new Map<string, Set<string>>();
    
    data?.forEach(recipe => {
      if (recipe.crop_key && recipe.stage) {
        if (!cropStageMap.has(recipe.crop_key)) {
          cropStageMap.set(recipe.crop_key, new Set());
        }
        cropStageMap.get(recipe.crop_key)!.add(recipe.stage);
      }
    });
    
    const cropStageCounts: CropStageCount[] = Array.from(cropStageMap.entries()).map(([crop_key, stages]) => ({
      crop_key,
      stage_count: stages.size
    }));
    
    console.log('📊 현재 작물별 성장단계 수:', cropStageCounts);
    return cropStageCounts;
    
  } catch (error) {
    console.error('작물별 성장단계 수 조회 중 오류:', error);
    return [];
  }
}

// 충분한 데이터가 있는 작물들 필터링 (2개 이상 성장단계)
export function filterSufficientCrops(recipes: NutrientRecipe[], maxStagesPerCrop: number = 2): NutrientRecipe[] {
  const cropStageCounts = new Map<string, number>();
  
  // 각 작물의 성장단계 수 계산
  recipes.forEach(recipe => {
    const count = cropStageCounts.get(recipe.crop_key) || 0;
    cropStageCounts.set(recipe.crop_key, count + 1);
  });
  
  // 충분한 데이터가 있는 작물들 식별
  const sufficientCrops = new Set<string>();
  cropStageCounts.forEach((count, crop_key) => {
    if (count >= maxStagesPerCrop) {
      sufficientCrops.add(crop_key);
    }
  });
  
  console.log(`🚫 충분한 데이터가 있는 작물들 (${maxStagesPerCrop}개 이상 성장단계):`, Array.from(sufficientCrops));
  
  // 충분한 데이터가 있는 작물들의 레시피 제외
  const filteredRecipes = recipes.filter(recipe => !sufficientCrops.has(recipe.crop_key));
  
  console.log(`✅ 필터링 결과: ${recipes.length}개 → ${filteredRecipes.length}개 (${recipes.length - filteredRecipes.length}개 제외)`);
  
  return filteredRecipes;
}

// 새로운 작물들에 집중하는 수집 로직
export async function getSmartCollectionTargets(): Promise<string[]> {
  try {
    const cropStageCounts = await getCropStageCounts();
    
    // 성장단계가 2개 미만인 작물들만 대상으로 선정
    const targetCrops = cropStageCounts
      .filter(crop => crop.stage_count < 2)
      .map(crop => crop.crop_key);
    
    console.log('🎯 스마트 수집 대상 작물들:', targetCrops);
    
    return targetCrops;
    
  } catch (error) {
    console.error('스마트 수집 대상 조회 실패:', error);
    return [];
  }
}

// 레시피를 작물별로 그룹화
export function groupRecipesByCrop(recipes: NutrientRecipe[]): Map<string, NutrientRecipe[]> {
  const grouped = new Map<string, NutrientRecipe[]>();
  
  recipes.forEach(recipe => {
    if (!grouped.has(recipe.crop_key)) {
      grouped.set(recipe.crop_key, []);
    }
    grouped.get(recipe.crop_key)!.push(recipe);
  });
  
  return grouped;
}

// 작물별로 최대 개수 제한하여 레시피 선택
export function limitRecipesPerCrop(recipes: NutrientRecipe[], maxPerCrop: number = 2): NutrientRecipe[] {
  const grouped = groupRecipesByCrop(recipes);
  const limitedRecipes: NutrientRecipe[] = [];
  
  grouped.forEach((cropRecipes, crop_key) => {
    // 각 작물별로 최대 개수만큼만 선택
    const selected = cropRecipes.slice(0, maxPerCrop);
    limitedRecipes.push(...selected);
    
    if (cropRecipes.length > maxPerCrop) {
      console.log(`✂️ ${crop_key}: ${cropRecipes.length}개 → ${maxPerCrop}개로 제한`);
    }
  });
  
  console.log(`📊 작물별 제한 결과: ${recipes.length}개 → ${limitedRecipes.length}개`);
  
  return limitedRecipes;
}

// 전체 스마트 수집 로직
export async function applySmartCollectionLogic(recipes: NutrientRecipe[]): Promise<NutrientRecipe[]> {
  console.log('🧠 스마트 수집 로직 적용 시작...');
  
  // 1. 현재 데이터베이스에서 충분한 데이터가 있는 작물들 확인
  const cropStageCounts = await getCropStageCounts();
  const sufficientCrops = new Set(
    cropStageCounts
      .filter(crop => crop.stage_count >= 2)
      .map(crop => crop.crop_key)
  );
  
  console.log(`🚫 제외할 작물들 (이미 2개 이상 성장단계):`, Array.from(sufficientCrops));
  
  // 2. 충분한 데이터가 있는 작물들의 레시피 제외
  const filteredRecipes = recipes.filter(recipe => !sufficientCrops.has(recipe.crop_key));
  
  // 3. 작물별로 최대 2개까지만 선택
  const limitedRecipes = limitRecipesPerCrop(filteredRecipes, 2);
  
  console.log(`✅ 스마트 수집 완료: ${recipes.length}개 → ${limitedRecipes.length}개`);
  
  return limitedRecipes;
}

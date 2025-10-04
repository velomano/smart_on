import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Recipe = {
  crop_key: string;
  crop_name?: string;
  stage: "seedling"|"vegetative"|"flowering"|"fruiting"|"ripening";
  target_ec?: number;
  target_ph?: number;
  macro: Record<string, number>;
  micro: Record<string, number>;
  ions?: Record<string, number>;
  env?: Record<string, number>;
  source?: {
    name: string;
    url: string;
    org_type: 'government' | 'academic' | 'commercial' | 'other';
    license?: string;
    reliability_default?: number;
  };
  reliability?: number;
  collected_at?: string;
  checksum: string;
};

// crop_key를 한글 crop_name으로 매핑하는 함수
function getKoreanCropName(cropKey: string): string {
  const cropMap: Record<string, string> = {
    'lettuce': '상추',
    'tomato': '토마토', 
    'strawberry': '딸기',
    'cucumber': '오이',
    'pepper': '고추',
    'basil': '바질',
    'spinach': '시금치',
    'kale': '케일',
    'broccoli': '브로콜리',
    'cabbage': '양배추',
    'carrot': '당근',
    'radish': '무',
    'chinese_cabbage': '배추',
    'chive': '부추',
    'garlic': '마늘',
    'onion': '양파'
  };
  return cropMap[cropKey] || cropKey;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const payload = (await req.json()) as Recipe[];

    console.log(`📊 ${payload.length}건의 레시피 처리 시작...`);

    let savedCount = 0;
    let skippedCount = 0;

    for (const recipe of payload) {
      // 1. crop_name을 한글로 설정
      const koreanCropName = getKoreanCropName(recipe.crop_key);
      
      // 2. 중복 확인 (crop_key + stage 조합)
      const { data: existing } = await supabase
        .from("crop_profiles")
        .select("id")
        .eq("crop_key", recipe.crop_key)
        .eq("stage", recipe.stage)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️ 건너뜀: ${koreanCropName} (${recipe.stage}) - 이미 존재`);
        skippedCount++;
        continue;
      }

      // 3. macro/micro 데이터를 target_ppm 형식으로 변환
      const targetPpm = {
        N: recipe.macro?.N || 0,
        P: recipe.macro?.P || 0,
        K: recipe.macro?.K || 0,
        Ca: recipe.macro?.Ca || 0,
        Mg: recipe.macro?.Mg || 0,
        S: recipe.macro?.S || 0
      };

      // 4. NPK 비율 계산
      const npkRatio = `${targetPpm.N}:${targetPpm.P}:${targetPpm.K}`;

      // 5. 환경 조건 정보 생성
      const growingConditions = {
        temperature: `${recipe.env?.temp || 20}°C`,
        humidity: `${recipe.env?.humidity || 65}%`,
        light_hours: `${Math.round((recipe.env?.lux || 15000) / 1000)}시간`,
        co2_level: "800-1200ppm"
      };

      // 6. 영양소 상세 정보 생성
      const nutrientsDetail = {
        nitrogen: targetPpm.N,
        phosphorus: targetPpm.P,
        potassium: targetPpm.K,
        calcium: targetPpm.Ca,
        magnesium: targetPpm.Mg,
        trace_elements: ['Fe', 'Mn', 'B', 'Zn', 'Cu', 'Mo']
      };

      // 7. 사용법 및 주의사항
      const usageNotes = [
        "주 1회 EC 측정 권장",
        "pH는 6.0-6.5 범위 유지",
        "온도가 높을 때는 EC를 낮춰 사용"
      ];

      const warnings = [
        "칼슘 결핍 시 잎 끝 갈변 현상",
        "과도한 질소는 과번무 유발"
      ];

      // 8. crop_profiles 형식으로 변환
      const cropProfile = {
        crop_key: recipe.crop_key,
        crop_name: koreanCropName,
        stage: recipe.stage,
        target_ppm: targetPpm,
        target_ec: recipe.target_ec,
        target_ph: recipe.target_ph,
        author: "자동 수집 시스템",
        source_title: recipe.source?.name || "스마트팜 데이터베이스",
        source_year: new Date(recipe.collected_at || new Date().toISOString()).getFullYear(),
        license: recipe.source?.license || "CC BY 4.0",
        description: `${koreanCropName} ${recipe.stage}에 최적화된 배양액 레시피입니다. (출처: ${recipe.source?.name || 'Unknown'})`,
        growing_conditions: growingConditions,
        nutrients_detail: nutrientsDetail,
        usage_notes: usageNotes,
        warnings: warnings,
        last_updated: new Date(recipe.collected_at || new Date().toISOString()).toISOString().split('T')[0],
        volume_l: 100,
        ec_target: recipe.target_ec,
        ph_target: recipe.target_ph,
        npk_ratio: npkRatio
      };

      // 9. crop_profiles에 저장
      const { error } = await supabase
        .from("crop_profiles")
        .insert(cropProfile);

      if (error) {
        console.error(`❌ 저장 실패: ${koreanCropName} (${recipe.stage})`, error.message);
      } else {
        savedCount++;
        console.log(`✅ 저장 완료: ${koreanCropName} (${recipe.stage}) - ${recipe.source?.name || 'Unknown'}`);
      }
    }

    console.log(`🎉 처리 완료: ${savedCount}건 저장, ${skippedCount}건 건너뜀`);

    return new Response(JSON.stringify({ 
      count: savedCount,
      skipped: skippedCount,
      total: payload.length
    }), { status: 200 });

  } catch (e) {
    console.error('💥 처리 실패:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
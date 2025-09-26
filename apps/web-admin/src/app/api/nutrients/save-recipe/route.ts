import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { 
      cropKey, 
      stage, 
      targetVolumeL, 
      waterProfileName,
      recipeName,
      recipeLines,
      adjustments,
      qc,
      createdBy
    } = await req.json();

    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 연결이 필요합니다.' 
      }, { status: 500 });
    }

    // 1. 작물 프로파일 ID 찾기
    const { data: cropProfile } = await sb
      .from('crop_profiles')
      .select('id')
      .eq('crop_key', cropKey)
      .eq('stage', stage)
      .single();

    if (!cropProfile) {
      return NextResponse.json({ 
        ok: false, 
        error: '작물 프로파일을 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    // 2. 물 프로파일 ID 찾기
    const { data: waterProfile } = await sb
      .from('water_profiles')
      .select('id')
      .eq('name', waterProfileName)
      .single();

    if (!waterProfile) {
      return NextResponse.json({ 
        ok: false, 
        error: '물 프로파일을 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    // 3. 레시피 저장
    const { data: recipe, error: recipeError } = await sb
      .from('recipes')
      .insert({
        crop_profile_id: cropProfile.id,
        water_profile_id: waterProfile.id,
        target_volume_l: targetVolumeL,
        target_ec: qc?.ec_est,
        target_ph: qc?.ph_est,
        ec_est: qc?.ec_est,
        ph_est: qc?.ph_est,
        warnings: qc?.warnings,
        status: 'saved',
        created_by: createdBy || null
      })
      .select()
      .single();

    if (recipeError) {
      console.error('레시피 저장 에러:', recipeError);
      return NextResponse.json({ 
        ok: false, 
        error: '레시피 저장에 실패했습니다.' 
      }, { status: 500 });
    }

    // 4. 레시피 라인 저장
    for (const line of recipeLines) {
      // 염류 ID 찾기
      const { data: salt } = await sb
        .from('salts')
        .select('id')
        .eq('name', line.salt)
        .single();

      if (salt) {
        await sb
          .from('recipe_lines')
          .insert({
            recipe_id: recipe.id,
            salt_id: salt.id,
            grams: line.grams,
            tank: line.tank || 'none'
          });
      }
    }

    // 5. pH 보정 저장 (있는 경우)
    if (adjustments && adjustments.length > 0) {
      for (const adjustment of adjustments) {
        // 산/염기 ID 찾기
        const { data: acidBase } = await sb
          .from('acid_bases')
          .select('id')
          .eq('name', adjustment.reagent)
          .single();

        if (acidBase) {
          await sb
            .from('adjustments')
            .insert({
              recipe_id: recipe.id,
              acid_base_id: acidBase.id,
              ml_needed: adjustment.ml,
              rationale: adjustment.rationale
            });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      recipe: {
        id: recipe.id,
        name: recipeName || `${cropKey}_${stage}_${targetVolumeL}L`,
        created_at: recipe.created_at
      }
    });

  } catch (error) {
    console.error('레시피 저장 API 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

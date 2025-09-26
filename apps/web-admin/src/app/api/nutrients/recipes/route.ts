import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 연결이 필요합니다.' 
      }, { status: 500 });
    }

    // 레시피 목록 조회 (작물 정보 포함)
    const { data: recipes, error } = await sb
      .from('recipes')
      .select(`
        id,
        target_volume_l,
        target_ec,
        target_ph,
        ec_est,
        ph_est,
        warnings,
        status,
        created_at,
        crop_profiles!inner (
          crop_key,
          crop_name,
          stage
        ),
        water_profiles!inner (
          name
        )
      `)
      .eq('status', 'saved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('레시피 조회 에러:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '레시피 조회에 실패했습니다.' 
      }, { status: 500 });
    }

    // 각 레시피의 라인 정보도 조회
    const recipesWithLines = await Promise.all(
      recipes.map(async (recipe) => {
        const { data: lines } = await sb
          .from('recipe_lines')
          .select(`
            grams,
            tank,
            salts!inner (
              name
            )
          `)
          .eq('recipe_id', recipe.id);

        return {
          ...recipe,
          lines: lines?.map((line: any) => ({
            salt: line.salts?.name || 'Unknown',
            grams: line.grams,
            tank: line.tank
          })) || []
        };
      })
    );

    return NextResponse.json({
      ok: true,
      recipes: recipesWithLines
    });

  } catch (error) {
    console.error('레시피 조회 API 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recipeId = searchParams.get('id');

    if (!recipeId) {
      return NextResponse.json({ 
        ok: false, 
        error: '레시피 ID가 필요합니다.' 
      }, { status: 400 });
    }

    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 연결이 필요합니다.' 
      }, { status: 500 });
    }

    // 레시피 삭제 (CASCADE로 관련 라인들도 자동 삭제)
    const { error } = await sb
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.error('레시피 삭제 에러:', error);
      return NextResponse.json({ 
        ok: false, 
        error: '레시피 삭제에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: '레시피가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('레시피 삭제 API 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

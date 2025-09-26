import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

export async function GET(req: NextRequest) {
  console.log('=== 데이터베이스 디버그 정보 ===');
  
  try {
    const sb = createSbServer();
    if (!sb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 클라이언트 초기화 실패' 
      }, { status: 500 });
    }

    // 1. 작물 프로파일 확인
    const { data: crops, error: cropError } = await sb
      .from('crop_profiles')
      .select('id, crop_key, crop_name, stage')
      .limit(5);

    // 2. 물 프로파일 확인
    const { data: waters, error: waterError } = await sb
      .from('water_profiles')
      .select('id, name')
      .limit(5);

    // 3. 레시피 테이블 확인
    const { data: recipes, error: recipeError } = await sb
      .from('recipes')
      .select('id, name, created_at')
      .limit(5);

    return NextResponse.json({
      ok: true,
      debug: {
        crops: {
          data: crops,
          error: cropError,
          count: crops?.length || 0
        },
        waters: {
          data: waters,
          error: waterError,
          count: waters?.length || 0
        },
        recipes: {
          data: recipes,
          error: recipeError,
          count: recipes?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('디버그 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: `디버그 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    }, { status: 500 });
  }
}

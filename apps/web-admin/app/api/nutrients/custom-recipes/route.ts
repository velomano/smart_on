import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 나만의 레시피 조회
export async function GET() {
  try {
    console.log('🔍 나만의 레시피 조회 시작');

    const { data, error } = await supabase
      .from('custom_nutrient_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 나만의 레시피 조회 실패:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log('✅ 나만의 레시피 조회 성공:', data?.length || 0, '개');

    return NextResponse.json({
      ok: true,
      recipes: data || []
    });
  } catch (error: any) {
    console.error('❌ 나만의 레시피 조회 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 나만의 레시피 저장
export async function POST(request: NextRequest) {
  try {
    console.log('💾 나만의 레시피 저장 시작');

    const body = await request.json();
    console.log('📋 저장할 레시피 데이터:', body);

    // 필수 필드 검증
    if (!body.crop || !body.stage) {
      return NextResponse.json({ 
        ok: false, 
        error: '작물명과 성장 단계는 필수입니다.' 
      }, { status: 400 });
    }

    // 레시피 데이터 준비
    const recipeData = {
      crop: body.crop,
      stage: body.stage,
      volume_l: body.volume_l || 100,
      ec_target: body.ec_target || 1.5,
      ph_target: body.ph_target || 6.0,
      npk_ratio: body.npk_ratio || '3:1:2',
      description: body.description || '',
      nutrients_detail: body.nutrients_detail || {
        nitrogen: 150,
        phosphorus: 50,
        potassium: 200,
        calcium: 100,
        magnesium: 50
      },
      growing_conditions: body.growing_conditions || {
        temperature: '22-26°C',
        humidity: '60-80%',
        light_hours: '12-16시간',
        co2_level: '400-800ppm'
      },
      usage_notes: body.usage_notes || ['주 1회 배양액 교체', 'pH 정기 측정 필요'],
      warnings: body.warnings || ['과도한 EC는 식물에 해로울 수 있습니다'],
      author: body.author || 'Unknown',
      created_at: body.created_at || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('custom_nutrient_recipes')
      .insert([recipeData])
      .select()
      .single();

    if (error) {
      console.error('❌ 나만의 레시피 저장 실패:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log('✅ 나만의 레시피 저장 성공:', data);

    return NextResponse.json({
      ok: true,
      recipe: data
    });
  } catch (error: any) {
    console.error('❌ 나만의 레시피 저장 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 나만의 레시피 삭제
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 나만의 레시피 삭제 시작');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        error: '레시피 ID가 필요합니다.' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('custom_nutrient_recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ 나만의 레시피 삭제 실패:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log('✅ 나만의 레시피 삭제 성공:', id);

    return NextResponse.json({
      ok: true,
      message: '레시피가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('❌ 나만의 레시피 삭제 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

export async function POST(req: NextRequest) {
  console.log('=== 레시피 저장 API 시작 ===');
  console.log('📡 요청 URL:', req.url);
  console.log('📡 요청 메서드:', req.method);
  
  try {
    const body = await req.json();
    console.log('📋 받은 데이터:', JSON.stringify(body, null, 2));
    console.log('📋 필수 필드 확인:', {
      cropKey: !!body.cropKey,
      stage: !!body.stage,
      targetVolumeL: !!body.targetVolumeL,
      recipeName: !!body.recipeName
    });

    const sb = createSbServer();
    if (!sb) {
      console.error('Supabase 클라이언트 초기화 실패');
      return NextResponse.json({ 
        ok: false, 
        error: '데이터베이스 연결 실패' 
      }, { status: 500 });
    }

    console.log('✅ Supabase 연결 성공');

    // 한글 stage를 영어로 변환하는 함수
    function translateStageToEnglish(stage: string): string {
      const stageMap: { [key: string]: string } = {
        '생장기': 'vegetative',
        '개화기': 'fruiting',
        '성숙기': 'mature',
        '수확기': 'harvest'
      };
      return stageMap[stage] || stage;
    }

    // 1. 작물 프로파일 찾기
    const englishStage = translateStageToEnglish(body.stage);
    console.log('작물 프로파일 조회:', { cropKey: body.cropKey, stage: body.stage, englishStage });
    
    const { data: crops, error: cropError } = await sb
      .from('crop_profiles')
      .select('id, crop_key, crop_name, stage')
      .eq('crop_key', body.cropKey)
      .eq('stage', englishStage);

    if (cropError) {
      console.error('작물 프로파일 조회 에러:', cropError);
      return NextResponse.json({ 
        ok: false, 
        error: `작물 프로파일 조회 실패: ${cropError.message}` 
      }, { status: 500 });
    }

    let cropProfile;
    
    if (!crops || crops.length === 0) {
      console.log('작물 프로파일이 없어서 새로 생성합니다:', { cropKey: body.cropKey, stage: body.stage, englishStage });
      
      // 새로운 작물 프로파일 생성
      const newCropData = {
        crop_key: body.cropKey,
        crop_name: body.cropKey, // crop_key를 crop_name으로도 사용
        stage: englishStage,
        volume_l: body.targetVolumeL || 100,
        target_ec: 1.5, // 기본값
        target_ph: 6.0, // 기본값
        target_ppm: {
          N: 150,
          P: 50,
          K: 200,
          Ca: 100,
          Mg: 50
        },
        description: `${body.cropKey} ${body.stage}에 최적화된 배양액 레시피입니다.`,
        author: '사용자 생성',
        source_title: '사용자 저장 레시피',
        source_year: new Date().getFullYear(),
        license: 'CC BY 4.0'
      };

      const { data: newCrop, error: createError } = await sb
        .from('crop_profiles')
        .insert([newCropData])
        .select('id, crop_key, crop_name, stage')
        .single();

      if (createError) {
        console.error('새 작물 프로파일 생성 실패:', createError);
        return NextResponse.json({ 
          ok: false, 
          error: `작물 프로파일 생성 실패: ${createError.message}` 
        }, { status: 500 });
      }

      cropProfile = newCrop;
      console.log('✅ 새 작물 프로파일 생성됨:', cropProfile);
    } else {
      cropProfile = crops[0];
      console.log('✅ 기존 작물 프로파일 찾음:', cropProfile);
    }

    // 2. 물 프로파일 찾기
    console.log('물 프로파일 조회:', { waterProfileName: body.waterProfileName });
    const { data: waters, error: waterError } = await sb
      .from('water_profiles')
      .select('id, name')
      .eq('name', body.waterProfileName || 'RO_Default');

    if (waterError) {
      console.error('물 프로파일 조회 에러:', waterError);
      return NextResponse.json({ 
        ok: false, 
        error: `물 프로파일 조회 실패: ${waterError.message}` 
      }, { status: 500 });
    }

    if (!waters || waters.length === 0) {
      console.error('물 프로파일 없음:', body.waterProfileName);
      return NextResponse.json({ 
        ok: false, 
        error: `물 프로파일을 찾을 수 없습니다: ${body.waterProfileName}` 
      }, { status: 404 });
    }

    const waterProfile = waters[0];
    console.log('✅ 물 프로파일 찾음:', waterProfile);

    // 3. 레시피 저장
    const recipeData = {
      crop_profile_id: cropProfile.id,
      water_profile_id: waterProfile.id,
      target_volume_l: Number(body.targetVolumeL) || 100,
      target_ec: body.qc?.ec_est || null,
      target_ph: body.qc?.ph_est || null,
      ec_est: body.qc?.ec_est || null,
      ph_est: body.qc?.ph_est || null,
      warnings: body.qc?.warnings || null,
      status: 'saved',
      created_by: null, // UUID 형식이 아니므로 일단 null로 설정
      name: body.recipeName || `${cropProfile.crop_name}_${body.stage}_${body.targetVolumeL}L`
    };

    console.log('저장할 레시피 데이터:', JSON.stringify(recipeData, null, 2));

    const { data: recipe, error: recipeError } = await sb
      .from('recipes')
      .insert(recipeData)
      .select('id, name, created_at')
      .single();

    if (recipeError) {
      console.error('레시피 저장 에러:', recipeError);
      return NextResponse.json({ 
        ok: false, 
        error: `레시피 저장 실패: ${recipeError.message}` 
      }, { status: 500 });
    }

    console.log('✅ 레시피 저장 성공:', recipe);

    // 4. recipe_lines 저장 (선택사항)
    if (body.recipeLines && body.recipeLines.length > 0) {
      console.log('레시피 라인 저장 시도...');
      
      // salts 테이블에서 salt_id 찾기
      const saltIds = await Promise.all(
        body.recipeLines.map(async (line: any) => {
          const { data: salt } = await sb
            .from('salts')
            .select('id')
            .eq('name', line.salt)
            .single();
          return salt?.id;
        })
      );

      const validLines = body.recipeLines
        .map((line: any, index: number) => ({
          recipe_id: recipe.id,
          salt_id: saltIds[index],
          grams: line.grams,
          tank: line.tank
        }))
        .filter((line: any) => line.salt_id); // salt_id가 있는 것만

      if (validLines.length > 0) {
        const { error: linesError } = await sb
          .from('recipe_lines')
          .insert(validLines);

        if (linesError) {
          console.error('레시피 라인 저장 에러:', linesError);
        } else {
          console.log('✅ 레시피 라인 저장 성공');
        }
      }
    }

    return NextResponse.json({
      ok: true,
      recipe: {
        id: recipe.id,
        name: recipe.name,
        created_at: recipe.created_at
      },
      message: '레시피가 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('API 전체 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    }, { status: 500 });
  }
}
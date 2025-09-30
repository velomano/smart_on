import { NextRequest, NextResponse } from 'next/server';
import { createSbServer } from '@/lib/db';

// 생장 단계 한글 번역 함수
function translateStage(stage: string): string {
  const stageMap: { [key: string]: string } = {
    'vegetative': '생장기',
    'flowering': '개화기', 
    'fruiting': '결실기',
    'germination': '발아기',
    'mature': '성숙기',
    'seedling': '묘목기',
    'harvest': '수확기'
  };
  return stageMap[stage] || stage;
}

// 한글 생장 단계를 영어로 역변환하는 함수
function translateStageToEnglish(stage: string): string {
  const reverseStageMap: { [key: string]: string } = {
    '생장기': 'vegetative',
    '개화기': 'flowering',
    '결실기': 'fruiting', 
    '발아기': 'germination',
    '성숙기': 'mature',
    '묘목기': 'seedling',
    '수확기': 'harvest'
  };
  return reverseStageMap[stage] || stage;
}

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 API 호출 시작:', req.url);
    const { searchParams } = new URL(req.url);
    const crop = searchParams.get('crop');
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');
    
    console.log('📋 요청 파라미터:', { crop, stage, search });

    const sb = createSbServer();
    if (!sb) {
      console.error('❌ Supabase 연결 실패');
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase 연결이 필요합니다.' 
      }, { status: 500 });
    }
    
    console.log('✅ Supabase 연결 성공');

    // crop_profiles에서 레시피 브라우징용 데이터 조회
    let query = sb
      .from('crop_profiles')
      .select(`
        id,
        crop_key,
        crop_name,
        stage,
        target_ppm,
        target_ec,
        target_ph,
        metadata
      `);

    // 필터링 적용
    if (crop) {
      query = query.eq('crop_name', crop);
    }
    if (stage) {
      // 한글 단계명을 영어로 변환하여 필터링
      const englishStage = translateStageToEnglish(stage);
      query = query.eq('stage', englishStage);
    }
    if (search) {
      query = query.or(`crop_name.ilike.%${search}%,stage.ilike.%${search}%`);
    }

    console.log('🔍 쿼리 실행 중...');
    const { data: profiles, error } = await query
      .order('crop_name', { ascending: true })
      .order('stage', { ascending: true });

    if (error) {
      console.error('❌ 작물 프로필 조회 에러:', error);
      return NextResponse.json({ 
        ok: false, 
        error: `작물 프로필 조회에 실패했습니다: ${error.message}`,
        details: error
      }, { status: 500 });
    }
    
    console.log('✅ 쿼리 성공, 프로필 개수:', profiles?.length || 0);

    // 프론트엔드에서 사용할 수 있도록 데이터 변환
    const recipes = profiles?.map(profile => {
      // target_ppm JSON에서 영양소 정보 추출
      const ppm = profile.target_ppm || {};
      const npk_ratio = `${ppm.N_NO3 || 0}:${ppm.P || 0}:${ppm.K || 0}`;
      
      // metadata에서 출처 정보 추출
      const metadata = profile.metadata || {};
      const sourceInfo = metadata.source || {};
      
      // 실제 출처 정보가 있으면 사용, 없으면 기본값
      const sourceTitle = sourceInfo.title || metadata.source_title || '스마트팜 데이터베이스';
      const sourceYear = sourceInfo.year || metadata.source_year || 2024;
      const sourceUrl = sourceInfo.url || metadata.source_url || null;
      const license = sourceInfo.license || metadata.license || 'CC BY 4.0';
      
      return {
        id: profile.id,
        crop: profile.crop_name,
        stage: translateStage(profile.stage),
        volume_l: 100, // 기본값
        ec_target: profile.target_ec,
        ph_target: profile.target_ph,
        npk_ratio: npk_ratio,
        created_at: new Date().toISOString(),
        source_title: sourceTitle,
        source_year: sourceYear,
        source_url: sourceUrl,
        license: license,
        description: `${profile.crop_name} ${translateStage(profile.stage)}에 최적화된 배양액 레시피입니다.`,
        growing_conditions: {
          temperature: getTemperatureRange(profile.crop_name),
          humidity: getHumidityRange(profile.crop_name),
          light_hours: getLightHours(profile.crop_name),
          co2_level: getCO2Level(profile.crop_name)
        },
        nutrients_detail: {
          nitrogen: ppm.N_NO3 || 0,
          phosphorus: ppm.P || 0,
          potassium: ppm.K || 0,
          calcium: ppm.Ca || 0,
          magnesium: ppm.Mg || 0,
          trace_elements: ['Fe', 'Mn', 'Zn', 'B', 'Cu', 'Mo']
        },
        usage_notes: getUsageNotes(profile.crop_name, profile.stage),
        warnings: getWarnings(profile.crop_name, profile.stage),
        author: '스마트팜 시스템',
        last_updated: '2024-09-28'
      };
    }) || [];

    return NextResponse.json({
      ok: true,
      recipes: recipes
    });

  } catch (error) {
    console.error('레시피 브라우징 API 에러:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 작물별 환경 조건 헬퍼 함수들
function getTemperatureRange(crop: string): string {
  const ranges: { [key: string]: string } = {
    '상추': '15-20°C',
    '토마토': '18-25°C',
    '오이': '20-28°C',
    '딸기': '15-22°C'
  };
  return ranges[crop] || '18-25°C';
}

function getHumidityRange(crop: string): string {
  const ranges: { [key: string]: string } = {
    '상추': '70-80%',
    '토마토': '60-70%',
    '오이': '65-75%',
    '딸기': '60-70%'
  };
  return ranges[crop] || '60-70%';
}

function getLightHours(crop: string): string {
  const ranges: { [key: string]: string } = {
    '상추': '12-14시간',
    '토마토': '14-16시간',
    '오이': '12-14시간',
    '딸기': '10-12시간'
  };
  return ranges[crop] || '12-14시간';
}

function getCO2Level(crop: string): string {
  const ranges: { [key: string]: string } = {
    '상추': '400-600ppm',
    '토마토': '800-1200ppm',
    '오이': '1000-1500ppm',
    '딸기': '600-800ppm'
  };
  return ranges[crop] || '800-1200ppm';
}

function getUsageNotes(crop: string, stage: string): string[] {
  const baseNotes = [
    '주 1회 EC 측정 권장',
    'pH는 6.0-6.5 범위 유지',
    '온도가 높을 때는 EC를 낮춰 사용'
  ];

  const cropSpecificNotes: { [key: string]: string[] } = {
    '상추': ['발아 후 3-4일부터 사용', '일주일마다 배양액 교체'],
    '토마토': ['물갈이는 2주마다 실시', '과번무 방지를 위해 질소 조절'],
    '오이': ['개화 시작과 동시에 사용', '과실 비대기에는 칼슘 강화'],
    '딸기': ['결실 시작 2주 전부터 사용', '수확 전 1주일은 EC 낮춤']
  };

  return [...baseNotes, ...(cropSpecificNotes[crop] || [])];
}

function getWarnings(crop: string, stage: string): string[] {
  const baseWarnings = [
    '칼슘 결핍 시 잎 끝 갈변 현상',
    '과도한 질소는 과번무 유발'
  ];

  const cropSpecificWarnings: { [key: string]: string[] } = {
    '상추': ['높은 EC는 잎 가장자리 타짐 유발', '과도한 질소는 질감 악화'],
    '토마토': ['칼슘 결핍 시 꽃끝썩음병 발생 가능', '칼륨 부족 시 과실 품질 저하'],
    '오이': ['칼륨 부족 시 과실 변형 발생', '과도한 질소는 꽃가루 활성 저하'],
    '딸기': ['칼슘 부족 시 과실 연화', '과도한 질소는 당도 저하']
  };

  return [...baseWarnings, ...(cropSpecificWarnings[crop] || [])];
}

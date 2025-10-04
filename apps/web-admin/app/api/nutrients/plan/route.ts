import { NextResponse } from 'next/server';
import { solveNutrients } from '@/lib/nutrients-engine/solve';
import { loaders } from '@/lib/nutrientsLoaders';

// export const runtime = 'edge';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
    console.log('🌱 양액 계산 API 요청 시작');
    console.log('📋 요청 본문:', JSON.stringify(body, null, 2));
    console.log('📋 필수 필드 확인:', {
      cropNameOrKey: !!body.cropNameOrKey,
      stage: !!body.stage,
      targetVolumeL: !!body.targetVolumeL,
      waterProfileName: !!body.waterProfileName
    });
    
    const cropNameOrKey = (body.cropNameOrKey || body.crop || '').trim();
    if (!cropNameOrKey) throw new Error('cropNameOrKey 는 필수입니다.');

    // 성장 단계 매핑 (한국어 → 영어)
    const stageMapping: { [key: string]: string } = {
      '결실기': 'fruiting',
      '생장기': 'vegetative',
      '개화기': 'flowering',
      '성숙기': 'ripening',
      '육묘기': 'seedling'
    };
    
    let mappedStage = body.stage;
    if (stageMapping[body.stage]) {
      mappedStage = stageMapping[body.stage];
      console.log(`🔄 성장 단계 매핑: "${body.stage}" → "${mappedStage}"`);
    }

    // 지원되는 작물 목록 확인
    const supportedCrops = ['상추', '토마토', '오이', '딸기', '고추', '바질'];
    if (!supportedCrops.includes(cropNameOrKey)) {
      throw new Error(`등록되지 않은 작물: ${cropNameOrKey}. 지원 작물: ${supportedCrops.join(', ')}`);
    }

    console.log('🧮 계산 시작:', { cropNameOrKey, stage: mappedStage, targetVolumeL: body.targetVolumeL });

    const result = await solveNutrients({
      cropNameOrKey,
      stage: mappedStage,
      targetVolumeL: body.targetVolumeL,
      targetEC: body.targetEC,
      targetPH: body.targetPH,
      waterProfileName: body.waterProfileName,
      allowSalts: body.allowSalts,
      forbidSalts: body.forbidSalts
    }, loaders);

    console.log('✅ 계산 완료:', {
      cropKey: result?.cropKey,
      stage: result?.stage,
      target: result?.target,
      qc: result?.qc ? 'QC 데이터 있음' : 'QC 데이터 없음'
    });
    console.log('📊 결과 요약:', JSON.stringify(result, null, 2));
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e:any) {
    console.error('API 에러:', e);
    const msg = String(e?.message || e);
    console.error('에러 스택:', e?.stack);
    return NextResponse.json({ 
      ok: false, 
      error: msg,
      details: e?.stack || 'No stack trace',
      body: body
    }, { status: 400 });
  }
}

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

    console.log('🧮 계산 시작:', { cropNameOrKey, stage: body.stage, targetVolumeL: body.targetVolumeL });

    const result = await solveNutrients({
      cropNameOrKey,
      stage: body.stage,
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

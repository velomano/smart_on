import { NextResponse } from 'next/server';
import { solveNutrients } from '@/lib/nutrients-engine/solve';
import { loaders } from '@/lib/nutrientsLoaders';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('API 요청 본문:', body);
    
    const cropNameOrKey = (body.cropNameOrKey || body.crop || '').trim();
    if (!cropNameOrKey) throw new Error('cropNameOrKey 는 필수입니다.');

    console.log('계산 시작:', { cropNameOrKey, stage: body.stage, targetVolumeL: body.targetVolumeL });

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

    console.log('계산 완료:', result);
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e:any) {
    console.error('API 에러:', e);
    const msg = String(e?.message || e);
    return NextResponse.json({ ok:false, error: msg }, { status: 400 });
  }
}

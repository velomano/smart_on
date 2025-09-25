import type { PlanParams, PlanResult, IonKey, PlanLine } from './types';

/**
 * 간단 솔버 설명:
 * - crop_profiles.target_ppm을 T, water existing W를 고려해 R = max(T - W, 0)
 * - 사용 가능한 4개 소금(CaNO3, KNO3, KH2PO4, MgSO4)만으로 근사 분해
 * - 질소/칼륨/칼슘/마그네슘/인/황 비중으로 간단히 배분 (데모용)
 * - A/B: CaNO3는 A, 인산/황/질소 기반은 B
 */
export async function solveNutrients(params: PlanParams, loaders: {
  loadCropProfile: (keyOrName: string, stage: string) => Promise<{ cropKey:string; target: Record<IonKey, number>; targetEC:number|null; targetPH:number|null }>;
  loadWaterProfile: (name: string) => Promise<{ existing: Partial<Record<IonKey, number>>; alkalinity:number; ph:number }>;
  getSaltByName: (name: string) => Promise<{ name:string; ions: Partial<Record<IonKey, number>> }>;
}): Promise<PlanResult> {
  const stage = params.stage ?? 'vegetative';
  const volumeL = params.targetVolumeL ?? 100;
  const wpName = params.waterProfileName ?? 'RO_Default';
  const { cropKey, target, targetEC, targetPH } = await loaders.loadCropProfile(params.cropNameOrKey, stage);
  const water = await loaders.loadWaterProfile(wpName);
  const need: Record<IonKey, number> = {} as any;

  (Object.keys(target) as IonKey[]).forEach(k=>{
    const t = target[k] ?? 0;
    const w = (water.existing[k] ?? 0);
    need[k] = Math.max(t - w, 0);
  });

  // salts
  const caNo3 = await loaders.getSaltByName('Calcium nitrate tetrahydrate');
  const kNo3  = await loaders.getSaltByName('Potassium nitrate');
  const kh2po4= await loaders.getSaltByName('Monopotassium phosphate');
  const mgso4 = await loaders.getSaltByName('Magnesium sulfate heptahydrate');

  // ppm_per_g_per_L = (ion_mass_fraction[%] / 100) * 1000 (mg/g) / 1 L
  const ppmPerG = (salt: {ions:Partial<Record<IonKey,number>>}) =>
    (ion: IonKey) => ((salt.ions[ion] ?? 0) / 100) * 1000;

  // 1) P는 KH2PO4로 우선 맞춤
  const g_kh2po4_per_L = need.P ? need.P / ppmPerG(kh2po4)('P') : 0;
  // 2) Mg/S는 MgSO4로
  const g_mgso4_per_L  = need.Mg ? need.Mg / ppmPerG(mgso4)('Mg') : 0;
  // 3) N_NO3와 K는 KNO3와 CaNO3로 분담
  //    K는 KNO3와 KH2PO4에서 일부 충족되므로 남은 K 계산
  const K_from_kh2po4 = g_kh2po4_per_L * ppmPerG(kh2po4)('K');
  const needK_left = Math.max((need.K ?? 0) - K_from_kh2po4, 0);

  // N은 KNO3와 CaNO3에서 제공. KNO3로 K를 먼저 맞추고, 남는 N은 CaNO3로
  const g_kno3_per_L = needK_left ? needK_left / ppmPerG(kNo3)('K') : 0;
  const N_from_kno3  = g_kno3_per_L * ppmPerG(kNo3)('N_NO3');
  const needN_left   = Math.max((need.N_NO3 ?? 0) - N_from_kno3, 0);

  const g_cano3_per_L = needN_left ? needN_left / ppmPerG(caNo3)('N_NO3') : 0;
  // Ca는 CaNO3에서 옴. Ca 부족이 남으면 경고
  const Ca_from_cano3 = g_cano3_per_L * ppmPerG(caNo3)('Ca');
  const needCa_left   = Math.max((need.Ca ?? 0) - Ca_from_cano3, 0);

  const warnings: string[] = [];
  if (needCa_left > 5) warnings.push(`Ca 잔여 요구량 ${Math.round(needCa_left)} ppm: CaCl2 등 보조염 추가 검토 필요`);
  if ((need.S ?? 0) > (g_mgso4_per_L * ppmPerG(mgso4)('S') + 1)) warnings.push('S가 남음: (MgSO4 외) 보조 황원 필요 가능');

  const lines: PlanLine[] = [
    { salt: caNo3.name, grams: round3(g_cano3_per_L * volumeL), tank: 'A' },
    { salt: kNo3.name,  grams: round3(g_kno3_per_L  * volumeL), tank: 'B' },
    { salt: kh2po4.name,grams: round3(g_kh2po4_per_L* volumeL), tank: 'B' },
    { salt: mgso4.name, grams: round3(g_mgso4_per_L * volumeL), tank: 'B' }
  ].filter(x=>x.grams>0.001);

  // 매우 단순한 EC 추정(데모): ppm 합을 1000으로 나눠 대략 mS/cm
  const total_ppm = sum(Object.values(need));
  const ec_est = params.targetEC ?? (Math.round((total_ppm/1000)*100)/100);
  const ph_est = params.targetPH ?? water.ph ?? 6.0;

  // 알칼리도 보정(데모): 50 mg/L as CaCO3 당 1N 산 약 1 mL/L 가정
  const acid_ml_per_L = water.alkalinity > 0 ? (water.alkalinity / 50) * 1.0 : 0;
  const adjustments = acid_ml_per_L > 0 ? [{ reagent:'Nitric acid 1N', ml: round1(acid_ml_per_L * volumeL), rationale:'알칼리도 중화(경험식, 현장 보정 요)' }] : [];

  return {
    cropKey,
    stage,
    target: { volumeL, EC: params.targetEC ?? targetEC ?? null, pH: params.targetPH ?? targetPH ?? null },
    lines,
    adjustments,
    qc: { ec_est, ph_est, warnings }
  };
}

const sum = (arr:number[]) => arr.reduce((a,b)=>a+(b||0),0);
const round3 = (n:number)=> Math.round(n*1000)/1000;
const round1 = (n:number)=> Math.round(n*10)/10;

import { createSbServer } from './db';
import type { IonKey } from './nutrients-engine/types';

const sb = createSbServer();


export const loaders = {
  async loadCropProfile(keyOrName: string, stage: string) {
    if (!sb) {
      throw new Error('Supabase 연결이 필요합니다. 환경변수를 확인해주세요.');
    }

    // Supabase 사용
    const { data:alias } = await sb.from('crop_alias').select('crop_key').eq('alias', keyOrName).maybeSingle();
    let cropKey = alias?.crop_key || keyOrName;

    let { data:cp } = await sb.from('crop_profiles')
      .select('*')
      .eq('crop_key', cropKey)
      .eq('stage', stage)
      .maybeSingle();

    if (!cp) {
      const { data:cp2 } = await sb.from('crop_profiles')
        .select('*')
        .eq('crop_name', keyOrName)
        .eq('stage', stage)
        .maybeSingle();
      if (cp2) { cp = cp2; cropKey = cp2.crop_key; }
    }

    if (!cp) throw new Error(`작물 프로파일을 찾을 수 없습니다: ${keyOrName} (${stage})`);

    const target = cp.target_ppm as Record<IonKey, number>;
    return { cropKey, target, targetEC: cp.target_ec, targetPH: cp.target_ph };
  },

  async loadWaterProfile(name: string) {
    if (!sb) {
      throw new Error('Supabase 연결이 필요합니다. 환경변수를 확인해주세요.');
    }

    const { data:wp, error } = await sb.from('water_profiles').select('*').eq('name', name).maybeSingle();
    if (error || !wp) return { existing: {}, alkalinity: 0, ph: 6.5 };
    return { existing: wp.existing_ions as Record<IonKey, number>, alkalinity: Number(wp.alkalinity_mg_per_l_as_caco3||0), ph: Number(wp.ph||6.5) };
  },

  async getSaltByName(name: string) {
    if (!sb) {
      throw new Error('Supabase 연결이 필요합니다. 환경변수를 확인해주세요.');
    }

    const { data:s, error } = await sb.from('salts').select('*').eq('name', name).maybeSingle();
    if (error || !s) throw new Error(`염류 미정의: ${name}`);
    return { name: s.name, ions: s.ion_contributions as Partial<Record<IonKey,number>> };
  }
};

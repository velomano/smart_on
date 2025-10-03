import { validateHardwareProfile } from "@/lib/iot/validateProfile";

export async function saveHardwareProfile(profile: any) {
  const { ok, errors } = validateHardwareProfile(profile);
  if (!ok) throw new Error(`하드웨어 프로필 검증 실패:\n- ${errors.join("\n- ")}`);
  // TODO: Supabase 저장 로직 연결
  return true;
}
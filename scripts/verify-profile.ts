import fs from "fs";
import { validateHardwareProfile } from "../apps/web-admin/lib/iot/validateProfile";

const profilePath = process.argv[2] || "packages/shared-iot/config/example.hardwareProfile.json";
const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
const { ok, errors } = validateHardwareProfile(profile);
if (!ok) {
  console.error("❌ 프로필 오류:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log("✅ 프로필 검증 통과");

// apps/worker/src/crawl/utils/save_to_db.ts
import fetch from "node-fetch";

type Recipe = Record<string, any>;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** Supabase에 배열 업서트 (중복은 무시) */
export async function upsertToSupabase(recipes: Recipe[], table = "crop_profiles") {
  if (!recipes?.length) {
    console.log("ℹ️ 업서트 건수 0 — 건너뜀");
    return { inserted: 0, skipped: 0 };
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("⚠️ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정 — DB 저장 생략");
    return { inserted: 0, skipped: recipes.length };
  }

  // 유니크 인덱스: (crop_key, stage, checksum)
  const endpoint = `${url}/rest/v1/${table}?on_conflict=crop_key,stage,checksum`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify(recipes),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Supabase 업서트 실패: ${res.status} ${txt}`);
  }

  // res.json()의 타입은 unknown이므로 안전 처리
  const data: unknown = await res.json().catch(() => []);
  const rows = Array.isArray(data) ? data as Recipe[] : [];
  const inserted = rows.length;
  const skipped = recipes.length - inserted;

  console.log(`📥 Supabase 업서트 완료 → inserted=${inserted}, skipped(dup)=${skipped}`);
  return { inserted, skipped };
}

/** JSON 백업 (선택) */
import fs from "fs";
import path from "path";

export async function saveAsJson(recipes: Recipe[], dir = "out") {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `recipes_${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(recipes, null, 2), "utf8");
  console.log(`💾 JSON 저장: ${file}`);
  return file;
}

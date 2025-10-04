// apps/worker/src/crawl/runCoverageSince2020.ts
import fetch from "node-fetch";
import crypto from "crypto";

// 기존 구현을 재사용합니다. 경로는 프로젝트에 맞게 조정하세요.
import { searchGoogleScholar, searchPubMed, searchRISS, extractNutrientInfo } from "../sources/periodCrawler"; 

// ---- 설정 ----
const PERIODS = [
  { start: "2020-01", end: "2021-12", name: "2020-2021" },
  { start: "2022-01", end: "2023-12", name: "2022-2023" },
  { start: "2024-01", end: "2025-10", name: "2024-현재" }, // 현재 월로 갱신
];

// 다양성 보장: 작물 목록과 작물당 목표 수
export const TARGET_CROPS = [
  "tomato","lettuce","strawberry","cucumber","pepper","basil","spinach","kale",
  "chinese_cabbage","radish","carrot","cabbage","broccoli","onion","garlic","chive"
];
const MAX_PER_CROP = 3; // 작물당 최대 확보 개수 (증가)

// ---- 링크 필터/유틸 ----
export function isBadLink(u: string) {
  const x = u.toLowerCase();
  return x.startsWith('https://accounts.google.com') || 
         x.includes('scholar.googleusercontent.com') ||
         x.includes('login') ||
         x.includes('signin') ||
         x.includes('auth') ||
         x.includes('captcha');
}

export function isAcademicOrInstitution(u: string) {
  const h = u.toLowerCase();
  return (
    h.includes('pubmed.ncbi.nlm.nih.gov') ||
    h.includes('researchgate.net') ||
    h.includes('academia.edu') ||
    h.includes('doi.org') ||
    h.includes('.edu') || h.includes('.ac.kr') ||
    h.includes('.go.kr') || h.includes('kci.go.kr') ||
    h.includes('koreascience') ||
    h.endsWith('.pdf') ||
    h.includes('scholar.google.com') ||
    h.includes('crossref.org') ||
    h.includes('springer.com') ||
    h.includes('wiley.com') ||
    h.includes('sciencedirect.com') ||
    h.includes('nature.com') ||
    h.includes('frontiersin.org')
  );
}

const PER_HOST_RATE_LIMIT_MS = 20000; // 훨씬 더 긴 간격 (20초)
const lastHit = new Map<string, number>();
export async function politeDelay(u: string) {
  try {
    const host = new URL(u).host;
    const now = Date.now();
    const gap = now - (lastHit.get(host) ?? 0);
    if (gap < PER_HOST_RATE_LIMIT_MS) {
      console.log(`⏳ ${host} 요청 간격 대기: ${Math.round((PER_HOST_RATE_LIMIT_MS - gap)/1000)}초`);
      await new Promise(r => setTimeout(r, PER_HOST_RATE_LIMIT_MS - gap));
    }
    lastHit.set(host, now);
  } catch {}
  // 기본 랜덤 지연: 15~30초 (매우 길게)
  const jitter = Math.random() * (30000 - 15000) + 15000;
  console.log(`⏳ 랜덤 지연: ${Math.round(jitter/1000)}초`);
  await new Promise(r => setTimeout(r, jitter));
}

export function stableChecksum(r: any) {
  const base = JSON.stringify({
    doi: r?.doi || "",
    title: (r?.title || "").trim(),
    crop: r?.crop_key || "",
    stage: r?.stage || "",
    macro: r?.macro || {}
  });
  return crypto.createHash("sha256").update(base).digest("hex");
}

// DB 현재 보유 개수(선택)
async function getExistingCountsByCrop(): Promise<Record<string, number>> {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return {};
    const r = await fetch(`${url}/rest/v1/crop_profiles?select=crop_key`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return {};
    const rows = await r.json();
    const counts: Record<string, number> = {};
    if (Array.isArray(rows)) {
      rows.forEach((it: any) => {
        counts[it.crop_key] = (counts[it.crop_key] ?? 0) + 1;
      });
    }
    return counts;
  } catch { return {}; }
}

// 메인 러너: 2020→현재 블록 순차 + 작물 커버리지 우선
export async function runCoverageSince2020(): Promise<any[]> {
  console.log("🚀 2020→현재, 커버리지 우선 수집 시작");
  console.log("=".repeat(60));

  const have = await getExistingCountsByCrop(); // {crop_key: count}
  const collected: any[] = [];
  const seen = new Set<string>();

  for (const period of PERIODS) {
    console.log(`\n📅 블록 처리: ${period.name}`);

    for (const cropKey of TARGET_CROPS) {
      if ((have[cropKey] ?? 0) >= MAX_PER_CROP) continue;
      console.log(`🌱 작물: ${cropKey} (보유 ${have[cropKey] ?? 0}/${MAX_PER_CROP})`);

      const englishKeywords = [
        `${cropKey} hydroponic nutrient solution`,
        `${cropKey} hydroponic fertilizer`,
        `${cropKey} solution EC pH`
      ];
      const koMap: Record<string,string> = {
        tomato:"토마토", lettuce:"상추", strawberry:"딸기", cucumber:"오이", pepper:"고추", basil:"바질",
        spinach:"시금치", kale:"케일", chinese_cabbage:"배추", radish:"무", carrot:"당근",
        cabbage:"양배추", broccoli:"브로콜리", onion:"양파", garlic:"마늘", chive:"부추"
      };
      const ko = koMap[cropKey] || cropKey;
      const koreanKeywords = [`${ko} 수경재배 배양액`, `${ko} 양액 EC pH`];

      async function tryLinks(links: string[]) {
        for (const link of links) {
          if ((have[cropKey] ?? 0) >= MAX_PER_CROP) break;
          if (isBadLink(link)) {
            console.log(`  ⏭️ 나쁜 링크 스킵: ${link}`);
            continue;
          }
          
          try {
            await politeDelay(link);
            const recipes = await extractNutrientInfo(link);
            for (const r of recipes) {
              if (r.crop_key !== cropKey) continue;
              if (r.crop_key === "unknown" || r.crop_name === "unknown") continue;

              r.checksum = stableChecksum(r);
              if (seen.has(r.checksum)) continue;
              seen.add(r.checksum);

              collected.push(r);
              have[cropKey] = (have[cropKey] ?? 0) + 1;
              console.log(`  ✅ ${cropKey} +1 (${have[cropKey]}/${MAX_PER_CROP}) ${r.title || r.source?.url || ""}`);
              if ((have[cropKey] ?? 0) >= MAX_PER_CROP) break;
            }
          } catch (error) {
            console.log(`  ⚠️ 링크 처리 실패: ${link} - ${error.message}`);
            continue;
          }
        }
      }

      // 우선순위: PubMed → Crossref(있으면) → Scholar → RISS
      try {
        const pmLinks = await searchPubMed(`${cropKey} hydroponic nutrient`, period);
        await tryLinks(pmLinks);
      } catch {}

      // Crossref 검색기를 구현했다면 여기서 호출
      // const crLinks = await crossrefSearch(cropKey, period);
      // await tryLinks(crLinks);

      if ((have[cropKey] ?? 0) < MAX_PER_CROP) {
        for (const kw of englishKeywords) {
          const links = await searchGoogleScholar(kw, period);
          const good = links.filter(u => isAcademicOrInstitution(u) && !isBadLink(u));
          await tryLinks(good);
          if ((have[cropKey] ?? 0) >= MAX_PER_CROP) break;
        }
      }

      if ((have[cropKey] ?? 0) < MAX_PER_CROP) {
        for (const kw of koreanKeywords) {
          const links = await searchRISS(kw, period);
          await tryLinks(links);
          if ((have[cropKey] ?? 0) >= MAX_PER_CROP) break;
        }
      }

      console.log(`  → ${cropKey} 블록 결과: ${have[cropKey] ?? 0}/${MAX_PER_CROP}`);
    }

    console.log(`✅ 블록 완료: ${period.name}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`🎉 전체 완료. 수집: ${collected.length}개, 작물 커버리지(최대 ${MAX_PER_CROP}/작물) 달성 여부 확인`);

  // 최종 중복 제거(혹시 모를 중복)
  const dedup = collected.filter((r, i, a) => i === a.findIndex(x => x.checksum === r.checksum));
  console.log(`🔄 중복 제거 후: ${dedup.length}개`);
  return dedup;
}

// 단독 실행 시
if (require.main === module) {
  runCoverageSince2020().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

// apps/worker/src/crawl/runCoverageSince2020_apiFirst.ts
// 반드시 최상단
import path from "path";
import dotenv from "dotenv";
import minimist from "minimist";
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") }); // dist 기준 apps/worker/.env

// ===== 연도 파라미터 파싱 =====
function parseYearInput() {
  const args = minimist(process.argv.slice(2));
  const nowYear = new Date().getFullYear();

  const rawFrom = process.env.START_YEAR ?? args.from ?? args.start ?? 2020;
  const rawTo = process.env.END_YEAR ?? args.to ?? args.end ?? "now";

  const startYear = Number(rawFrom);
  const endYear = (String(rawTo).toLowerCase() === "now") ? nowYear : Number(rawTo);

  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) {
    throw new Error(`연도 파라미터 형식 오류: from=${rawFrom}, to=${rawTo}`);
  }
  if (startYear > endYear) {
    throw new Error(`연도 범위 오류: 시작연도(${startYear})가 종료연도(${endYear})보다 큼`);
  }
  return { startYear, endYear, nowYear };
}

// ===== 스위치 파라미터 파싱 =====
function parseSwitchInput() {
  const args = minimist(process.argv.slice(2));
  
  return {
    allowPaywalled: args.allowPaywalled === true || args.allowPaywalled === "true",
    useScholar: args.useScholar === true || args.useScholar === "true",
    useRISS: args.useRISS === true || args.useRISS === "true",
    useKoreanSynonyms: args.useKoreanSynonyms !== false,
    useKoreanSeeds: args.useKoreanSeeds !== false,
    fixUnitConversion: args.fixUnitConversion !== false,
    relaxedAcceptance: args.relaxedAcceptance !== false,
    enhancedTableParsing: args.enhancedTableParsing !== false,
    improvedDedup: args.improvedDedup !== false,
  };
}
import fetch from "node-fetch";
import { KO_CROP, stableChecksum, isBadLink, isAcademicOrInstitution, preferDomain } from "./utils";
import { openalexSearch } from "./sources/openalex";
import { crossrefSearch } from "./sources/crossref";
import { pubmedSearch } from "./sources/pubmed";
import { resolveDOIToSafeURLs } from "./handlers/doi_handler";
import { validateRecipe, calculateReliability } from "./utils/validator";
import { saveCheckpoint, loadCheckpoint, clearCheckpoint, isUrlFailed, markUrlFailed } from "./utils/checkpoint";
import { generateMultilingualKeywords, normalizeCropName, normalizeStage, GENERIC_KO, GENERIC_EN, GENERIC_ES_PT } from "./utils/multilingual";
import { MODE } from "./config";
import { allowInstitutionFirst, isBadPublisher } from "./utils/domains";
import { europePmcResolveByPMID } from "./sources/europe_pmc";
import { SEED_SITEMAPS } from "./sources/seeds";
import { crawlSeedLinks } from "./sources/seeds_crawler";
import { BatchFlusher } from "./utils/flush";
import { saveAsJson } from "./utils/save_to_db";
import { upsertToSupabase } from "./utils/save_to_db";

// 기존 구현 재사용
import { extractNutrientInfo } from "../sources/extractNutrientInfo";
import { searchGoogleScholar, searchRISS } from "../sources/periodCrawler";

const MAX_PER_CROP = 2; // 작물당 2개씩 수집

// 스트리밍 배치 저장 시스템
const flusher = new BatchFlusher("crop_profiles", MODE.BATCH_SIZE, MODE.FLUSH_INTERVAL_MS);

// Ctrl+C 시에도 보장
process.on("SIGINT", async () => {
  console.log("⚠️ 인터럽트 감지 → 남은 배치 저장");
  await flusher.flush("final");
  process.exit(0);
});

// 배양액/수경재배 키워드 기반 검색 (영문/한글)
const NUTRIENT_KEYWORDS = [
  // 영문 키워드
  "hydroponic nutrient solution",
  "nutrient solution recipe", 
  "hydroponic fertilizer",
  "hydroponic growing medium",
  "soilless culture nutrients",
  "hydroponic EC solution",
  "nutrient film technique",
  "deep water culture nutrients",
  "yamazaki nutrient solution",
  "yamazaki hydroponic",
  
  // 한글 키워드
  "배양액 제조",
  "수경재배액",
  "양액 조성",
  "양분 용액",
  "수경재배 배양액",
  "양액 조제",
  "수경재배 영양액",
  "배양액 조성법",
  "양액 제조법",
  "수경재배용 배양액",
  "야마자키 배양액",
  "야마자키 양액",
  "야마자키 수경재배"
];

const PERIODS = [
  { start: "2024-01", end: "2025-12", name: "2024-2025" }
];

// 전체 작물과 기간으로 확장 (나중에 복구용)
const TARGET_CROPS_FULL = [
  "tomato", "lettuce", "strawberry", "cucumber", "pepper", "basil", "spinach", "kale",
  "chinese_cabbage", "radish", "carrot", "cabbage", "broccoli", "onion", "garlic", "chive"
];
const PERIODS_FULL = [
  { start: "2024-01", end: "2025-12", name: "2024-2025" }
];

async function getExistingCountsByCropStage(): Promise<Record<string, Record<string, number>>> {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return {};
    const r = await fetch(`${url}/rest/v1/crop_profiles?select=crop_key,stage`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return {};
    const rows = await r.json();
    const counts: Record<string, Record<string, number>> = {};
    if (Array.isArray(rows)) {
      rows.forEach((it: any) => {
        if (!counts[it.crop_key]) counts[it.crop_key] = {};
        counts[it.crop_key][it.stage] = (counts[it.crop_key][it.stage] ?? 0) + 1;
      });
    }
    return counts;
  } catch { return {}; }
}

async function tryLinksGeneric(links: string[], have: Record<string, number>, collected: any[], seen: Set<string>) {
  for (const link of links) {
    if (isBadLink(link)) continue;
    
    // 실패한 URL 캐시 확인
    if (isUrlFailed(link)) {
      console.log(`⏭️ 실패 캐시된 URL 스킵: ${link}`);
      continue;
    }

    // DOI면 OA 경로로 해석
    const candidates = link.includes("doi.org/")
      ? await resolveDOIToSafeURLs(link)
      : [link];

    for (const url of candidates) {
      // 기관 우선 필터링
      if (MODE.SKIP_BAD_PUBLISHERS && isBadPublisher(url)) {
        console.log(`❌ BAD 퍼블리셔 스킵: ${url}`);
        continue;
      }
      
      const isInst = allowInstitutionFirst(url);
      const isPDF = url.toLowerCase().endsWith(".pdf");
      
      if (MODE.INSTITUTION_FIRST && !isInst && !isPDF) {
        // 기관 아니면 PDF만 시도 (랜딩 스킵)
        continue;
      }

      try {
        // PubMed URL이면 Europe PMC로 재시도
        const m = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i.exec(url);
        if (MODE.PUBMED_TO_EPMC && m) {
          const pmid = m[1];
          console.log(`🔍 PubMed → Europe PMC 재시도: PMID ${pmid}`);
          const oa = await europePmcResolveByPMID(pmid);
          if (oa) {
            console.log(`✅ Europe PMC OA 발견: ${oa}`);
            // OA URL로 재귀 호출
            const oaRecipes = await extractNutrientInfo(oa);
            if (oaRecipes && oaRecipes.length > 0) {
              // OA 레시피 처리
              for (const r of oaRecipes) {
                if (!r.crop_key || r.crop_key === "unknown") continue;
                if ((have[r.crop_key] ?? 0) >= MAX_PER_CROP) continue;
                
                r.checksum = stableChecksum(r);
                if (seen.has(r.checksum)) continue;
                
                seen.add(r.checksum);
                collected.push(r);
                have[r.crop_key] = (have[r.crop_key] ?? 0) + 1;
                
                flusher.push(r);
                
                console.log(`  ✅ ${r.crop_key} +1 (${have[r.crop_key]}/${MAX_PER_CROP}) from Europe PMC`);
              }
              continue; // PubMed 처리 완료
            }
          } else {
            console.log(`❌ Europe PMC OA 없음: PMID ${pmid}`);
            continue;
          }
        }

        const recipes = await extractNutrientInfo(url);
        if (!recipes || recipes.length === 0) {
          console.log(`🧐 추출 0건: ${url}`);
          continue;
        }
        
        for (const r of recipes) {
          // 작물 식별 실패시 버림
          if (!r.crop_key || r.crop_key === "unknown") continue;

          // 작물명과 생육단계 정규화
          r.crop_name = normalizeCropName(r.crop_key);
          r.stage = normalizeStage(r.stage);

          // 작물별 캡
          if ((have[r.crop_key] ?? 0) >= MAX_PER_CROP) {
            console.log(`  ⏭️ ${r.crop_key} 이미 충분함 (${have[r.crop_key]}/${MAX_PER_CROP})`);
            continue;
          }

          // 체크섬 중복 제거
          r.checksum = stableChecksum(r);
          if (seen.has(r.checksum)) continue;

          // 검증
          const validation = validateRecipe(r);
          if (!validation.ok) {
            console.warn(`⚠️ 레시피 검증 실패: ${validation.errs.join(', ')} - ${url}`);
            continue;
          }

          // 신뢰도 점수 계산
          r.reliability = calculateReliability(r);
          
          r.checksum = stableChecksum(r);
          if (seen.has(r.checksum)) continue;

          seen.add(r.checksum);
          collected.push(r);
          
          // 스트리밍 배치 저장
          flusher.push(r);
          
          const warnings = validation.warnings.length > 0 ? ` (경고: ${validation.warnings.join(', ')})` : '';
          console.log(`  ✅ ${r.crop_key} +1 (${have[r.crop_key]}/${MAX_PER_CROP}) 신뢰도: ${r.reliability.toFixed(2)} ${warnings}`);
        }
      } catch (e: any) {
        // 403/429 등은 utils의 쿨다운 로직과 함께 조용히 스킵
        console.warn(`⚠️ 파싱 실패(${e?.message || "error"}): ${url}`);
        markUrlFailed(url);
      }

    }
  }
}

export async function runCoverageSince2020_apiFirst() {
  const { startYear, endYear, nowYear } = parseYearInput();
  const switches = parseSwitchInput();
  const periodLabel = `${startYear}-${endYear === nowYear ? "현재" : endYear}`;
  
  console.log("🚀 API 우선 커버리지 수집 시작");
  console.log("=".repeat(60));
  console.log(`📅 수집 기간: ${periodLabel} (${startYear}-01-01 ~ ${endYear}-12-31)`);
  console.log(`🔧 활성 스위치: OA해제=${switches.allowPaywalled}, Scholar=${switches.useScholar}, RISS=${switches.useRISS}, 한국어확장=${switches.useKoreanSynonyms}, 단위보정=${switches.fixUnitConversion}, 허용기준완화=${switches.relaxedAcceptance}`);

  // 체크포인트 로드
  const checkpoint = loadCheckpoint();
  let startPeriod = 0;
  let startCrop = 0;
  
  if (checkpoint) {
    console.log(`🔄 체크포인트에서 재시작: ${periodLabel} - ${checkpoint.cropKey}`);
    startPeriod = PERIODS.findIndex(p => p.name === checkpoint.period);
    // startCrop은 키워드 기반이므로 0으로 시작
  }

  // 일반 키워드 기반 수집 (작물 역추출)
  const have: Record<string, number> = {}; // crop_key별 수집 개수
  const collected: any[] = [];
  const seen = new Set<string>();

  // 1) 기관 시드 크롤링 먼저 실행
  console.log(`🌱 기관 시드 크롤링 시작 (${SEED_SITEMAPS.length}개 시드)`);
  for (const seed of SEED_SITEMAPS) {
    console.log(`🔍 시드 크롤링: ${seed}`);
    const links = await crawlSeedLinks(seed, 80);
    console.log(`📄 발견된 링크: ${links.length}개`);
    await tryLinksGeneric(links, have, collected, seen);
  }
  await flusher.flush("seeds-complete");

  // 2) 일반 키워드 + 정밀 키워드 조합
  const allKeywords = [...GENERIC_KO, ...GENERIC_EN, ...GENERIC_ES_PT, ...NUTRIENT_KEYWORDS];

  // 동적 기간 생성
  const dateRange = {
    fromISO: `${startYear}-01-01`,
    toISO: `${endYear}-12-31`,
    label: `${startYear}-01 - ${endYear}-12`,
  };

  for (let pIdx = startPeriod; pIdx < PERIODS.length; pIdx++) {
    const period = PERIODS[pIdx];
    console.log(`\n📅 블록: ${periodLabel}`);

    // 일반 키워드로 검색
    for (const keyword of allKeywords) {
      console.log(`🔍 키워드: ${keyword} (${dateRange.label})`);

      // 1) OpenAlex → Crossref → PubMed (동적 기간 사용)
      const dynamicPeriod = { start: `${startYear}-01`, end: `${endYear}-12` };
      const links = await openalexSearch(keyword, dynamicPeriod, 25);
      await tryLinksGeneric(links, have, collected, seen);
      
      const crossrefLinks = await crossrefSearch(keyword, dynamicPeriod, 25);
      await tryLinksGeneric(crossrefLinks, have, collected, seen);
      
      const pmLinks = await pubmedSearch(keyword, dynamicPeriod, 20);
      await tryLinksGeneric(pmLinks, have, collected, seen);

      // 2) Scholar 보조 (스위치에 따라 ON/OFF)
      if (switches.useScholar) {
        const sLinks = await searchGoogleScholar(keyword, dynamicPeriod);
        const good = sLinks.filter(u => !isBadLink(u));
        await tryLinksGeneric(good, have, collected, seen);
      } else {
        console.log(`⏭️ Scholar 비활성화됨 (--useScholar=false)`);
      }

      // 3) 한국 포털 (RISS) - 스위치에 따라 ON/OFF
      if (switches.useRISS && /[가-힣]/.test(keyword)) {
        const rLinks = await searchRISS(keyword, dynamicPeriod);
        await tryLinksGeneric(rLinks, have, collected, seen);
      } else if (switches.useRISS) {
        console.log(`⏭️ RISS 스킵 (영어 키워드)`);
      } else {
        console.log(`⏭️ RISS 비활성화됨 (--useRISS=false)`);
      }

      // 체크포인트 저장
      saveCheckpoint({
        period: periodLabel,
        cropKey: keyword,
        offset: 0,
        timestamp: Date.now(),
        collected: collected.length,
        errors: 0
      });
    }

    console.log(`✅ 블록 완료: ${periodLabel}`);
    
    // 블록 완료 시 배치 플러시
    await flusher.flush("period-end");
  }

  // 체크포인트 삭제 (완료)
  clearCheckpoint();

  // 최종 배치 플러시
  await flusher.flush("final");

  console.log("\n" + "=".repeat(60));
  console.log(`🎉 수집 완료: ${collected.length}개 (기간: ${periodLabel})`);
  const dedup = collected.filter((r, i, a) => i === a.findIndex(x => x.checksum === r.checksum));
  console.log(`🔄 중복 제거 후: ${dedup.length}개`);
  
  // ENV 확인
  console.log("ENV SUPABASE_URL?", !!process.env.SUPABASE_URL, " KEY?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  return dedup;
}

// 단독 실행
if (require.main === module) {
  runCoverageSince2020_apiFirst()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
}

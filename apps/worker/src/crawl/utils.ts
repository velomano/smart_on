// apps/worker/src/crawl/utils.ts
import crypto from "crypto";

export type Period = { start: string; end: string; name: string };

export const PERIODS: Period[] = [
  { start: "2020-01", end: "2021-12", name: "2020-2021" },
  { start: "2022-01", end: "2023-12", name: "2022-2023" },
  { start: "2024-01", end: "2025-10", name: "2024-현재" }, // 필요 시 현재월로 업데이트
];

export const TARGET_CROPS = [
  "tomato","lettuce","strawberry","cucumber","pepper","basil","spinach","kale",
  "chinese_cabbage","radish","carrot","cabbage","broccoli","onion","garlic","chive"
];

export const KO_CROP: Record<string,string> = {
  tomato:"토마토", lettuce:"상추", strawberry:"딸기", cucumber:"오이", pepper:"고추", basil:"바질",
  spinach:"시금치", kale:"케일", chinese_cabbage:"배추", radish:"무", carrot:"당근",
  cabbage:"양배추", broccoli:"브로콜리", onion:"양파", garlic:"마늘", chive:"부추"
};

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

const hostState = new Map<string, { cooldownUntil: number; strikes: number }>();
export async function politeDelay(urlLike: string, baseMin=3000, baseMax=8000) {
  try {
    const host = new URL(urlLike).host;
    const now = Date.now();
    const cur = hostState.get(host);
    if (cur && cur.cooldownUntil > now) {
      await new Promise(r => setTimeout(r, cur.cooldownUntil - now));
    }
  } catch {}
  const jitter = baseMin + Math.random() * (baseMax - baseMin);
  await new Promise(r => setTimeout(r, jitter));
}
export function scheduleCooldown(urlLike: string, retryAfterSec?: number) {
  let host = "unknown";
  try { host = new URL(urlLike).host; } catch {}
  const cur = hostState.get(host) || { cooldownUntil: 0, strikes: 0 };
  cur.strikes += 1;
  let ms = retryAfterSec && retryAfterSec > 0 ? retryAfterSec * 1000
    : cur.strikes === 1 ? 10*60_000
    : cur.strikes === 2 ? 60*60_000
    : 24*60*60_000;
  cur.cooldownUntil = Date.now() + ms;
  hostState.set(host, cur);
}
export function isBadLink(u: string) {
  const x = u.toLowerCase();
  return x.startsWith("https://accounts.google.com") || x.includes("scholar.googleusercontent.com");
}
// 도메인 화이트리스트/블랙리스트
export const WHITELIST = [
  "journals.ashs.org", "mdpi.com", "frontiersin.org", "plos.org", "plosone.org",
  "biomedcentral.com", "springeropen.com", "koreascience.or.kr", "kci.go.kr",
  "rda.go.kr", "scielo.br", "scielo.org", "researchsquare.com", "core.ac.uk",
  "nih.gov", "ebi.ac.uk", "europepmc.org", "ncbi.nlm.nih.gov", "ojs.*", ".ac.kr"
];

export const BLACKLIST = [
  "ssrn.com", "ieee.org", "ieeeexplore.ieee.org", "peerj-cs", "arxiv.org",
  "link.springer.com/book", "taylorfrancis.com/chapters"
];

export function preferDomain(u: string) {
  const h = new URL(u).hostname.toLowerCase();
  if (BLACKLIST.some(b => h.includes(b))) return "bad";
  if (WHITELIST.some(w => h.includes(w) || (w.startsWith("ojs.") && h.startsWith("ojs.")))) return "good";
  return "neutral";
}

export function isAcademicOrInstitution(u: string) {
  const h = u.toLowerCase();
  return (
    h.includes("pubmed.ncbi.nlm.nih.gov") ||
    h.includes("researchgate.net") ||
    h.includes("academia.edu") ||
    h.includes("doi.org") ||
    h.includes(".edu") || h.includes(".ac.kr") ||
    h.includes(".go.kr") || h.includes("kci.go.kr") ||
    h.includes("koreascience") ||
    h.endsWith(".pdf")
  );
}

// apps/worker/src/crawl/utils/rateProfile.ts
export const RATE = {
  "scholar.google.com": { min: 6000, max: 15000, concurrency: 1 },
  "pubmed.ncbi.nlm.nih.gov": { min: 3000, max: 7000, concurrency: 2 },
  "doi.org": { min: 3000, max: 6000, concurrency: 1 },
  "api.openalex.org": { min: 2000, max: 5000, concurrency: 2 },
  "api.crossref.org": { min: 2000, max: 5000, concurrency: 2 },
  "api.unpaywall.org": { min: 2000, max: 4000, concurrency: 1 },
  "www.ebi.ac.uk": { min: 2000, max: 4000, concurrency: 2 },
  "default": { min: 3000, max: 8000, concurrency: 2 }
};

// politeDelay 개선
const lastHit = new Map<string, number>();
export async function politeDelay(url: string) {
  const host = (()=>{ try{return new URL(url).host;}catch{return "default";} })();
  const prof = RATE[host] ?? RATE.default;
  const now = Date.now();
  const last = lastHit.get(host) ?? 0;
  const minGap = prof.min; // 최소 간격 보장
  const wait = Math.max(0, minGap - (now - last));
  if (wait) await new Promise(r=>setTimeout(r, wait));
  lastHit.set(host, Date.now());
  const jitter = prof.min + Math.random()*(prof.max-prof.min);
  await new Promise(r=>setTimeout(r, jitter));
}

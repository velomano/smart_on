// apps/worker/src/crawl/sources/pubmed.ts
import fetch from "node-fetch";
import { politeDelay, scheduleCooldown } from "../utils";

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function pubmedSearch(term: string, period: { start: string; end: string }, retmax=20) {
  const y1 = period.start.split("-")[0];
  const y2 = period.end.split("-")[0];
  const q = `${term} AND ${y1}:${y2}[dp]`;
  const url = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&retmax=${retmax}&term=${encodeURIComponent(q)}`;
  await politeDelay(url, 3000, 7000);
  const res = await fetch(url, { headers: { "User-Agent": "terahub-crawler (+mailto:sky3rain7@gmail.com)" } });
  if (res.status === 429) {
    const ra = res.headers.get("retry-after");
    const sec = ra ? parseInt(ra, 10) : undefined;
    scheduleCooldown(url, sec);
    return [];
  }
  if (!res.ok) return [];
  const js: any = await res.json();
  const ids: string[] = js?.esearchresult?.idlist || [];
  return ids.map(id => `https://pubmed.ncbi.nlm.nih.gov/${id}/`);
}

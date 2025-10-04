// apps/worker/src/crawl/sources/openalex.ts
import fetch from "node-fetch";
import { politeDelay } from "../utils";

const OPENALEX_BASE = "https://api.openalex.org/works";

export async function openalexSearch(query: string, period: { start: string; end: string }, rows=25) {
  // OpenAlex는 from/to_publication_date 필드 사용 + 저널 필터
  const url = `${OPENALEX_BASE}?search=${encodeURIComponent(query)}&from_publication_date=${period.start}-01&to_publication_date=${period.end}-28&per-page=${rows}&filter=type:journal-article`;
  await politeDelay(url, 3000, 7000);
  const r = await fetch(url, { headers: { "User-Agent": "terahub-crawler (+mailto:sky3rain7@gmail.com)" } });
  if (!r.ok) return [];
  const js: any = await r.json();
  const items = js?.results || [];
  // DOI 또는 외부 링크 유도
  const links: string[] = [];
  for (const it of items) {
    if (it?.doi) links.push(`https://doi.org/${it.doi}`);
    else if (it?.ids?.doi) links.push(it.ids.doi);
    else if (it?.primary_location?.source?.host_organization_name && it?.primary_location?.landing_page_url) {
      links.push(it.primary_location.landing_page_url);
    }
  }
  return [...new Set(links)];
}

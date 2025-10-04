// apps/worker/src/crawl/sources/crossref.ts
import fetch from "node-fetch";
import { politeDelay } from "../utils";

const CROSSREF_BASE = "https://api.crossref.org/works";

export async function crossrefSearch(query: string, period: { start: string; end: string }, rows=25) {
  const url = `${CROSSREF_BASE}?query=${encodeURIComponent(query)}&filter=type:journal-article,from-pub-date:${period.start}-01,until-pub-date:${period.end}-28&rows=${rows}`;
  await politeDelay(url, 3000, 7000);
  const r = await fetch(url, { headers: { "User-Agent": "terahub-crawler (+mailto:sky3rain7@gmail.com)" } });
  if (!r.ok) return [];
  const js: any = await r.json();
  const items = js?.message?.items || [];
  const links: string[] = [];
  for (const it of items) {
    if (it?.URL) links.push(it.URL);
    else if (it?.DOI) links.push(`https://doi.org/${it.DOI}`);
  }
  return [...new Set(links)];
}

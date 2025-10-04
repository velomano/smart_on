import fetch from "node-fetch";

// PMID 또는 DOI로 OA 본문 링크 찾기
export async function europePmcResolve({ pmid, doi }: { pmid?: string; doi?: string; }) {
  const q = pmid ? `EXT_ID:${pmid} AND SRC:MED` : `DOI:${encodeURIComponent(doi!)}`;
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${q}+OPEN_ACCESS:Y&format=json&pageSize=1&resultType=core`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const js: any = await r.json();
  const hit = js?.resultList?.result?.[0];
  if (!hit) return null;

  const ft = hit?.fullTextUrlList?.fullTextUrl || [];
  // PDF 우선
  const pdf = ft.find((u: any) => /pdf/i.test(u.documentStyle) || /\.pdf$/i.test(u.url));
  const html = ft.find((u: any) => /html/i.test(u.documentStyle));
  return (pdf?.url || html?.url) ? { url: pdf?.url || html?.url } : null;
}

export async function europePmcResolveByPMID(pmid: string) {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:${pmid}+AND+SRC:MED+OPEN_ACCESS:Y&format=json&pageSize=1&resultType=core`;
  const r = await fetch(url); 
  if (!r.ok) return null;
  const js: any = await r.json();
  const hit = js?.resultList?.result?.[0]; 
  if (!hit) return null;
  const ft = hit.fullTextUrlList?.fullTextUrl || [];
  const pdf = ft.find((u: any) => /pdf/i.test(u.documentStyle) || /\.pdf$/i.test(u.url));
  const html = ft.find((u: any) => /html/i.test(u.documentStyle));
  return pdf?.url || html?.url || null;
}
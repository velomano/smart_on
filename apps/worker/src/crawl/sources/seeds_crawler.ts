import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { allowInstitutionFirst } from "../utils/domains";

export async function crawlSeedLinks(url: string, limit=100) {
  try {
    const res = await fetch(url); 
    if (!res.ok) return [];
    const html = await res.text(); 
    const $ = cheerio.load(html);
    const out: string[] = [];
    
    $("a[href]").each((_,a)=> {
      const href = $(a).attr("href") || "";
      try {
        const abs = new URL(href, url).toString();
        if (abs.toLowerCase().endsWith(".pdf") || allowInstitutionFirst(abs)) {
          out.push(abs);
        }
      } catch {
        // 잘못된 URL은 무시
      }
    });
    
    return [...new Set(out)].slice(0, limit);
  } catch {
    return [];
  }
}

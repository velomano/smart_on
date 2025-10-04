// apps/worker/src/crawl/sources/unpaywall.ts
import fetch from "node-fetch";
import { politeDelay } from "../utils";

const UNPAYWALL_BASE = "https://api.unpaywall.org/v2";

export async function unpaywallByDOI(doi: string): Promise<{ oa_pdf?: string; oa_url?: string } | null> {
  try {
    const email = process.env.UNPAYWALL_EMAIL || "sky3rain7@gmail.com";
    const url = `${UNPAYWALL_BASE}/${encodeURIComponent(doi)}?email=${encodeURIComponent(email)}`;
    
    await politeDelay(url, 2000, 5000);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "terahub-crawler (+mailto:sky3rain7@gmail.com)",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ Unpaywall API 실패: ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    
    // Open Access PDF 우선
    if (data?.best_oa_location?.url_for_pdf) {
      return { oa_pdf: data.best_oa_location.url_for_pdf };
    }
    
    // Open Access URL
    if (data?.best_oa_location?.url_for_landing_page) {
      return { oa_url: data.best_oa_location.url_for_landing_page };
    }

    return null;
  } catch (error) {
    console.warn(`⚠️ Unpaywall 조회 실패: ${doi}`, error);
    return null;
  }
}

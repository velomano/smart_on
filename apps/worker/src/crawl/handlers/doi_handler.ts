// apps/worker/src/crawl/handlers/doi_handler.ts
import { unpaywallByDOI } from "../sources/unpaywall";
import { politeDelay, isAcademicOrInstitution } from "../utils";

// DOI 해석시 "도서/챕터/인텍오픈 가짜 PDF" 스킵
const BAD_DOI_HOSTS = [
  "ieee.org", "ieeexplore.ieee.org", "ssrn.com",
  "taylorfrancis.com", "link.springer.com/book",
  "intechopen.com/citation-pdf-url" // 이건 인용서지 PDF (본문 아님)
];

function isBadLanding(u: string){
  const h = u.toLowerCase();
  return BAD_DOI_HOSTS.some(b => h.includes(b));
}

// 최종적으로 파싱할 URL 목록을 반환 (OA 우선)
export async function resolveDOIToSafeURLs(doiUrl: string): Promise<string[]> {
  // 1) DOI 문자열만 추출
  const m = doiUrl.match(/doi\.org\/(.+)$/i);
  const doi = m ? decodeURIComponent(m[1]) : null;
  if (!doi) return [doiUrl];

  console.log(`🔍 DOI 해석: ${doi}`);

  // 2) Unpaywall → OA pdf/html
  const up = await unpaywallByDOI(doi);
  if (up?.oa_pdf && !isBadLanding(up.oa_pdf)) {
    console.log(`📄 Unpaywall PDF 발견: ${up.oa_pdf}`);
    return [up.oa_pdf];
  }
  if (up?.oa_url && !isBadLanding(up.oa_url)) {
    console.log(`🌐 Unpaywall URL 발견: ${up.oa_url}`);
    return [up.oa_url];
  }

  // 3) Europe PMC는 extractNutrientInfo에서 직접 처리

  // Europe PMC로도 못 찾으면 그냥 원본 DOI는 버퍼
  if (isBadLanding(doiUrl)) {
    console.log(`❌ BAD DOI 도메인 스킵: ${doiUrl}`);
    return [];
  }

  // 4) OpenAlex/Crossref에서 landing_page_url이 .edu/.gov/.ac.kr 이면 허용
  // 없으면 doi.org 자체만 반환(후단에서 .edu/.gov/.pdf 만 시도)
  console.log(`⚠️ OA 경로 없음, 원본 DOI 사용: ${doiUrl}`);
  return [doiUrl];
}

export const INSTITUTION_WHITELIST = [
  // 국제/기관
  "fao.org","un.org","scielo","who.int",
  // 저널(OA 비율 높음)
  "journals.ashs.org","mdpi.com","frontiersin.org","springeropen.com","biomedcentral.com","plos.org","plosone.org",
  // 레포지터리/PMC
  "ncbi.nlm.nih.gov","europepmc.org","core.ac.uk","researchsquare.com",
  // 국내
  "koreascience.or.kr","kci.go.kr","rda.go.kr",".ac.kr",".go.kr",
  // 대학(미국 예시)
  "cornell.edu","ucanr.edu","umn.edu","iastate.edu","extension.psu.edu","ufl.edu","osu.edu"
];

export const BAD_PUBLISHERS = [
  "ieee.org","ieeexplore.ieee.org","ssrn.com","taylorfrancis.com","link.springer.com/book","intechopen.com/citation-pdf-url"
];

export function allowInstitutionFirst(url: string) {
  const h = new URL(url).hostname.toLowerCase();
  return INSTITUTION_WHITELIST.some(d =>
    h.includes(d) || (d===".ac.kr" && h.endsWith(".ac.kr")) || (d===".go.kr" && h.endsWith(".go.kr"))
  );
}

export function isBadPublisher(url: string) {
  const u = url.toLowerCase();
  return BAD_PUBLISHERS.some(b => u.includes(b));
}

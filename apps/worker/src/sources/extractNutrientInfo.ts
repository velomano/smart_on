import fetch from "node-fetch";
import pdf from "pdf-parse";
import * as cheerio from "cheerio";
import { europePmcResolve } from "../crawl/sources/europe_pmc";
import { extractCropFromText, isFruitCrop } from "../crawl/utils/cropLexicon";

// ===== Helpers =====
function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "unknown"; }
}
function orgType(url: string): "government"|"academic"|"commercial"|"other" {
  const h = url.toLowerCase();
  if (/\.(go\.kr|gov)$/.test(h) || h.includes("rda.go.kr")) return "government";
  if (/\.(ac\.kr|edu)$/.test(h) || /(kci\.go\.kr|koreascience|researchgate|academia|pubmed)/.test(h)) return "academic";
  if (/\.(com)$/.test(h)) return "commercial";
  return "other";
}

// EC 단위 정규화 (강화): dS/m → mS/cm(×10), μS/cm → mS/cm(÷1000)
function normalizeEC(value: number, unit?: string): { ec: number; unit: string; note?: string } {
  if (!unit) {
    // 단위 없을 때 휴리스틱: 20 이상이면 µS/cm로 가정
    if (value >= 20 && value <= 5000) {
      return { ec: value/1000, unit: "mS/cm", note: "assumed µS/cm" };
    }
    return { ec: value, unit: "mS/cm" };
  }
  
  const u = unit.toLowerCase();
  if (u.includes("ds/m")) return { ec: value * 10, unit: "mS/cm" }; // dS/m → mS/cm
  if (u.includes("μs") || u.includes("us") || u.includes("µs")) return { ec: value / 1000, unit: "mS/cm" }; // µS/cm → mS/cm
  if (u.includes("ms")) return { ec: value, unit: "mS/cm" };
  
  // 의심스러운 값 체크
  if (value > 0 && value < 0.1 && !u.includes('us') && !u.includes('μs')) {
    return { ec: value, unit: "mS/cm", note: "suspicious low value" };
  }
  
  return { ec: value, unit: "mS/cm" };
}

// pH 0–14 sanity
function sanePH(v?: number) { return (v!=null && v>=3 && v<=9) ? v : undefined; }

// % → ppm(≈mg/L) 단순 변환 가정. (작물/논문 문맥에 따라 보수적으로 사용)
function percentToPpm(x: number){ return x*10000; }

// ===== Dictionaries =====
const CROP_MAP: Record<string,string> = {
  "토마토":"tomato","tomato":"tomato","solanum lycopersicum":"tomato",
  "상추":"lettuce","lettuce":"lettuce","lactuca sativa":"lettuce",
  "딸기":"strawberry","strawberry":"strawberry","fragaria":"strawberry",
  "오이":"cucumber","cucumber":"cucumber","cucumis sativus":"cucumber",
  "고추":"pepper","pepper":"pepper","capsicum":"pepper",
  "바질":"basil","basil":"basil","ocimum basilicum":"basil",
  "시금치":"spinach","spinach":"spinach","spinacia oleracea":"spinach",
  "케일":"kale","kale":"kale",
  "배추":"chinese_cabbage","napa cabbage":"chinese_cabbage","brassica rapa":"chinese_cabbage",
  "무":"radish","radish":"radish",
  "당근":"carrot","carrot":"carrot",
  "양배추":"cabbage","cabbage":"cabbage",
  "브로콜리":"broccoli","broccoli":"broccoli",
  "양파":"onion","onion":"onion",
  "마늘":"garlic","garlic":"garlic",
  "부추":"chive","chive":"chive","allium tuberosum":"chive",
  // 야마자키 배양액 관련 작물들
  "야마자키":"yamazaki","yamazaki":"yamazaki",
  "야마자키 배양액":"yamazaki","yamazaki nutrient":"yamazaki",
};

const STAGE_MAP: Record<string,string> = {
  "유묘기":"seedling","묘":"seedling","seedling":"seedling",
  "생장기":"vegetative","영양생장":"vegetative","vegetative":"vegetative",
  "개화기":"flowering","화아분화":"flowering","flowering":"flowering","bloom":"flowering",
  "결실기":"fruiting","과실비대":"fruiting","fruiting":"fruiting",
  "성숙기":"ripening","ripening":"ripening","수확기":"ripening"
};

// ===== Regexes (단위 보정 강화) =====
const reEC = /\bEC[:\s]*([0-9]*\.?[0-9]+)\s*(mS\/cm|µS\/cm|uS\/cm|ms\/cm|us\/cm|μS\/cm|dS\/m)?/i;
const rePH = /\bpH[:\s]*([0-9]*\.?[0-9]+)/i;

// 다국어 NPK/EC/pH 패턴 추가 (과수 용어 포함)
const reEC2 = /(electrical\s+conductivity|condutividade elétrica|conductividad eléctrica|전기전도도|점적관수|관비|fertigation)\D{0,10}([0-9]+(?:\.[0-9]+)?)\s*(mS\/?cm|dS\/?m|μS\/?cm|uS\/?cm)?/i;
const rePH2 = /\b(pH|acidez|수소이온농도)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i;
const reNPKes = /(nitrógeno|nitrogenio|nitrogenio|nitrogenio|nitrogen|질소|NO3-N|NH4-N)\D{0,3}([0-9.]+).*?(fósforo|fosforo|phosphorus|인산|P2O5)\D{0,3}([0-9.]+).*?(potasio|potássio|potassium|칼륨|K2O)\D{0,3}([0-9.]+)/is;

// 과수 전용 패턴
const reFruitNutrients = /(배지|코코피트|rockwool|substrate|양액재배|점적|관비|fertigation)/i;
const reFruitUnits = /(mg\/L|ppm|mM|mS\/cm|dS\/m|μS\/cm)/i;

// ex) N 150 mg/L, P 50 ppm, K 200 ppm  |  N:P:K = 150:50:200  |  질소 150 인산 50 칼륨 200
const reNPK1 = /\bN\D{0,3}([0-9]+(?:\.[0-9]+)?)\s*(ppm|mg\/?L|percent|%?)\b.*?\bP\D{0,3}([0-9]+(?:\.[0-9]+)?)\s*(ppm|mg\/?L|percent|%?)\b.*?\bK\D{0,3}([0-9]+(?:\.[0-9]+)?)\s*(ppm|mg\/?L|percent|%?)\b/si;
const reNPK2 = /\bN\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)\s*[-:;,/]\s*P\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*[-:;,/]\s*K\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i;
const reNPK3 = /(질소)\D{0,3}([0-9]+(?:\.[0-9]+)?)\b.*?(인산)\D{0,3}([0-9]+(?:\.[0-9]+)?)\b.*?(칼륨)\D{0,3}([0-9]+(?:\.[0-9]+)?)/si;

const reCrop = new RegExp(
  Object.keys(CROP_MAP).map(s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join("|"),
  "i"
);

const reStage = new RegExp(
  Object.keys(STAGE_MAP).map(s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join("|"),
  "i"
);

// ===== Core Parser =====
async function fetchText(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (/pdf/i.test(ct) || url.toLowerCase().endsWith(".pdf")) {
    const buf = Buffer.from(await res.arrayBuffer());
    const parsed = await pdf(buf);
    return parsed.text || "";
  }
  const html = await res.text();
  // HTML → 텍스트(본문 위주)
  try {
    const $ = cheerio.load(html);
    $("script,style,noscript").remove();
    const text = $("body").text().replace(/\s+\n/g,"\n").replace(/\n{2,}/g,"\n").trim();
    return text || html;
  } catch {
    return html;
  }
}

// NPK 후보 여러 패턴 → ppm으로 통일
function extractNPK(text: string){
  // pattern 1 (with units)
  let m = reNPK1.exec(text);
  const toPpm = (val: number, unit?: string) => {
    const u = (unit||"").toLowerCase();
    if (u.includes("percent") || u === "%") return percentToPpm(val);
    if (u.includes("mg")) return val; // mg/L ≈ ppm
    // ppm 또는 단위 없음 → 그대로
    return val;
  };
  if (m) {
    const n = toPpm(parseFloat(m[1]), m[2]);
    const p = toPpm(parseFloat(m[3]), m[4]);
    const k = toPpm(parseFloat(m[5]), m[6]);
    return { N:n, P:p, K:k };
  }
  // pattern 2 (ratio with numbers)
  m = reNPK2.exec(text);
  if (m) {
    return { N: parseFloat(m[1]), P: parseFloat(m[2]), K: parseFloat(m[3]) };
  }
  // pattern 3 (Korean words)
  m = reNPK3.exec(text);
  if (m) {
    return { N: parseFloat(m[2]), P: parseFloat(m[4]), K: parseFloat(m[6]) };
  }
  return null;
}

function extractCrop(text: string){
  const m = reCrop.exec(text);
  if (!m) return { key:"unknown", name:"unknown" };
  const hit = m[0].toLowerCase();
  // find map key that matches (case-insensitive)
  const found = Object.keys(CROP_MAP).find(k => k.toLowerCase() === hit) || hit;
  const key = CROP_MAP[found] || "unknown";
  // 한글 표시명 역맵
  const name = Object.entries(CROP_MAP).find(([ko,en]) => en===key && /[가-힣]/.test(ko))?.[0] || key;
  return { key, name };
}

function extractStage(text: string){
  const m = reStage.exec(text);
  if (!m) return "vegetative";
  const hit = m[0];
  return STAGE_MAP[hit] || STAGE_MAP[hit.toLowerCase()] || "vegetative";
}

function isValidRecipe(r: any){
  const hasNPK = r?.macro && r.macro.N>0 && r.macro.P>0 && r.macro.K>0;
  const okCrop = r?.crop_key && r.crop_key!=="unknown" && r.crop_name!=="unknown";
  return okCrop && hasNPK;
}

// 텍스트 길이/키워드 힌트로 "본문 맞는지" 판별
const isLikelyFulltext = (txt: string) => {
  if (!txt || txt.length < 3000) return false; // 초록/메타만
  const hits = /hydropon|soilless|nutrient\s+solution|양액|배양액|수경재배/i.test(txt);
  return hits;
};

// ===== Exported main =====
export async function extractNutrientInfo(url: string): Promise<any[]> {
  // PubMed URL이면 PMID 추출 → Europe PMC로 OA 찾고 재귀 파싱
  const pubmedRe = /https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\//i;
  const m = pubmedRe.exec(url);
  if (m) {
    const pmid = m[1];
    console.log(`🔍 PubMed → Europe PMC 재시도: PMID ${pmid}`);
    const ep = await europePmcResolve({ pmid });
    if (ep?.url) {
      // OA 본문으로 재시도
      console.log(`✅ Europe PMC OA 발견: ${ep.url}`);
      return await extractNutrientInfo(ep.url);
    } else {
      console.log(`❌ Europe PMC OA 없음: PMID ${pmid}`);
      return [];
    }
  }

  let text = await fetchText(url);
  console.log(`🧪 parsed length=${text?.length || 0} from ${url}`);

  // 본문이 빈약하면 PDF 링크 찾아 재시도
  if (!isLikelyFulltext(text) && !/\.pdf$/i.test(url)) {
    try {
      console.log(`🔍 본문 빈약 → PDF 링크 검색: ${url}`);
      const html = await (await fetch(url)).text();
      const $ = cheerio.load(html);
      const pdfHref = $('a[href$=".pdf"]').attr("href");
      if (pdfHref) {
        const next = new URL(pdfHref, url).toString();
        console.log(`📄 PDF 링크 발견 → 재시도: ${next}`);
        text = await fetchText(next);
      }
    } catch (e) {
      console.log(`⚠️ PDF 링크 검색 실패: ${url}`);
    }
  }

  // 기본 필드 (과수 작물 지원)
  const cropResult = extractCropFromText(text);
  const crop_key = cropResult.crop_key;
  const crop_name = cropResult.crop_name;
  const stage = extractStage(text);

  // EC / pH (다국어 패턴 포함)
  const ecM = reEC.exec(text);
  const phM = rePH.exec(text);
  const ecM2 = reEC2.exec(text);
  const phM2 = rePH2.exec(text);
  
  const ecResult = ecM ? normalizeEC(parseFloat(ecM[1]), ecM[2]) 
    : (ecM2 ? normalizeEC(parseFloat(ecM2[2]), ecM2[3]) : undefined);
  const target_ec = ecResult?.ec;
  const target_ph = sanePH(phM ? parseFloat(phM[1]) : (phM2 ? parseFloat(phM2[2]) : undefined));

  // NPK (테이블 힌트 포함)
  const tableHint = /table\s*[\d]+|표\s*[\d]+|table\s*[:\-]|표\s*[:\-]/i.test(text);
  let npk = extractNPK(text);
  
  if (!npk && tableHint) {
    // 테이블 라인 단위로 N P K 값이 열로 나오는 경우
    const lines = text.split(/\r?\n/).slice(0, 5000);
    for (const line of lines) {
      const m = /N\D{0,3}([0-9.]{1,6})\D+P\D{0,3}([0-9.]{1,6})\D+K\D{0,3}([0-9.]{1,6})/.exec(line);
      if (m) { 
        npk = { N:+m[1], P:+m[2], K:+m[3] }; 
        console.log(`📊 테이블에서 NPK 발견: ${line.trim()}`);
        break; 
      }
    }
  }

  const recipe = {
    crop_key,
    crop_name,
    stage,
    target_ppm: npk || { N:0,P:0,K:0 }, // target_ppm 필드 추가
    target_ec,
    target_ph,
    macro: npk || { N:0,P:0,K:0 },
    micro: { Fe:2.0,Mn:0.5,B:0.5,Zn:0.05,Cu:0.02,Mo:0.01 },
    env: { temp:20, humidity:65, lux:15000 },
    source: {
      name: getDomain(url),
      url,
      org_type: orgType(url),
      license: "Academic",
      reliability_default: 0.9
    },
    reliability: 0.9,
    collected_at: new Date().toISOString()
  };

  const out: any[] = [];
  
  // 최소 신뢰 필터: EC 또는 pH 중 하나 + NPK 세트가 있을 때만 저장 (완화된 기준)
  const hasNPK = npk && npk.N>0 && npk.P>0 && npk.K>0;
  const hasECorPH = !!target_ec || !!target_ph;
  const hasPartialNPK = npk && (npk.N>0 || npk.P>0 || npk.K>0); // 부분 NPK도 허용
  
  // crop_key unknown이면 역보정(텍스트에 학명만 있는 경우 대비)
  if (recipe.crop_key === "unknown") {
    // tomato/lettuce/... 키워드 존재 시 보정
    const guess = /tomato|lettuce|strawberry|cucumber|pepper|basil|spinach|kale|brassica|allium/i.exec(text)?.[0]?.toLowerCase();
    // 간단 맵
    const map: any = { brassica:"chinese_cabbage", allium:"chive" };
    if (guess) {
      recipe.crop_key = map[guess] || guess;
      recipe.crop_name = CROP_MAP[recipe.crop_key] || recipe.crop_key;
      console.log(`🔧 작물명 역보정: unknown → ${recipe.crop_key}`);
    }
  }
  
  // 과수 전용 완화 기준
  const isFruit = isFruitCrop(recipe.crop_key);
  const hasECRange = !!target_ec;
  const hasPHRange = !!target_ph;
  const hasAnyNutrient = npk && (npk.N > 0 || npk.P > 0 || npk.K > 0);
  const hasFruitContext = reFruitNutrients.test(text);
  
  // 과수 전용 완화 조건: EC/pH + 영양소 중 2개 이상
  const fruitRelaxedOk = isFruit && (
    (hasECRange && hasPHRange) || 
    (hasECRange && hasAnyNutrient) || 
    (hasPHRange && hasAnyNutrient) ||
    (hasFruitContext && hasAnyNutrient)
  );
  
  // 기존 완화된 허용 기준
  const relaxedAcceptance = (target_ec && hasPartialNPK) || (target_ph && hasPartialNPK);
  const strictAcceptance = recipe.crop_key!=="unknown" && hasNPK && hasECorPH;
  
  if (strictAcceptance || relaxedAcceptance || fruitRelaxedOk) {
    out.push(recipe);
    let acceptanceType = "strict";
    if (fruitRelaxedOk) acceptanceType = "fruit-relaxed";
    else if (relaxedAcceptance) acceptanceType = "relaxed";
    
    console.log(`✅ 유효 레시피 추출 (${acceptanceType}): ${recipe.crop_key} ${stage} (EC:${target_ec}, pH:${target_ph}, N:${npk?.N}, P:${npk?.P}, K:${npk?.K})${isFruit ? " 🍎" : ""}`);
  } else {
    console.log(`🧐 추출 0건: ${url} - 이유: ${recipe.crop_key==="unknown" ? "crop없음" : ""} ${!hasPartialNPK ? "NPK없음" : ""} ${!hasECorPH ? "EC/pH없음" : ""}`.trim());
  }

  return out;
}

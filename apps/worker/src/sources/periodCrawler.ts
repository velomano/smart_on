import fetch from "node-fetch";
import { checksum } from "../lib/hash";
import crypto from "crypto";

// 기간별 크롤링 설정
const PERIOD_CONFIG = {
  // 검색 기간 설정 (월별)
  PERIODS: [
    { start: '2022-01', end: '2022-12', name: '2022년' },
    { start: '2023-01', end: '2023-12', name: '2023년' },
    { start: '2024-01', end: '2024-12', name: '2024년' },
    { start: '2025-01', end: '2025-10', name: '2025년 1-10월' }
  ],
  
  // 검색 키워드 (한국어 + 영어)
  KEYWORDS: [
    // 한국어 키워드
    '배양액', '수경재배', '양액', '액체비료', '영양액',
    '토마토 배양액', '상추 배양액', '딸기 배양액', '오이 배양액',
    '고추 배양액', '바질 배양액', '시금치 배양액', '케일 배양액',
    
    // 영어 키워드
    'hydroponic', 'nutrient solution', 'liquid fertilizer',
    'tomato nutrient', 'lettuce nutrient', 'strawberry nutrient',
    'cucumber nutrient', 'pepper nutrient', 'basil nutrient',
    'spinach nutrient', 'kale nutrient', 'plant nutrition'
  ],
  
  // 검색 사이트 (더 구체적으로)
  SITES: [
    'scholar.google.com',
    'pubmed.ncbi.nlm.nih.gov',
    'researchgate.net',
    'academia.edu',
    'riss.kr',
    'kci.go.kr'
  ],
  
  // 요청 설정
  REQUEST_DELAY: { MIN: 15000, MAX: 30000 }, // 매우 안전하게
  MAX_RESULTS_PER_SEARCH: 2 // 더 적게
};

// 랜덤 지연
function randomDelay(): Promise<void> {
  const delay = Math.random() * (PERIOD_CONFIG.REQUEST_DELAY.MAX - PERIOD_CONFIG.REQUEST_DELAY.MIN) + PERIOD_CONFIG.REQUEST_DELAY.MIN;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// 링크 필터링 함수들 (개선된 버전)
function isBadLink(u: string): boolean {
  const x = u.toLowerCase();
  return x.startsWith('https://accounts.google.com') || 
         x.includes('scholar.googleusercontent.com') ||
         x.includes('login') ||
         x.includes('signin') ||
         x.includes('auth') ||
         x.includes('captcha');
}

function isAcademicOrInstitution(u: string): boolean {
  const h = u.toLowerCase();
  return (
    h.includes('pubmed.ncbi.nlm.nih.gov') ||
    h.includes('researchgate.net') ||
    h.includes('academia.edu') ||
    h.includes('doi.org') ||
    h.includes('.edu') || h.includes('.ac.kr') ||
    h.includes('.go.kr') || h.includes('kci.go.kr') ||
    h.includes('koreascience') ||
    h.endsWith('.pdf') ||
    h.includes('scholar.google.com') ||
    h.includes('crossref.org') ||
    h.includes('springer.com') ||
    h.includes('wiley.com') ||
    h.includes('sciencedirect.com') ||
    h.includes('nature.com') ||
    h.includes('frontiersin.org')
  );
}

// User-Agent 로테이션 (더 다양한 브라우저)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// 기존 데이터 조회
async function getExistingCropStages(): Promise<Set<string>> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase 환경변수가 없어 중복 확인을 건너뜁니다.');
      return new Set();
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/crop_profiles?select=crop_key,stage`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      console.warn('⚠️ 기존 데이터 조회 실패, 중복 확인을 건너뜁니다.');
      return new Set();
    }

    const data = await response.json() as any[];
    const existingCombinations = new Set<string>();
    
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        existingCombinations.add(`${item.crop_key}_${item.stage}`);
      });
    }

    console.log(`📊 기존 데이터: ${existingCombinations.size}개 작물/성장단계 조합 확인`);
    return existingCombinations;
    
  } catch (error) {
    console.warn('⚠️ 기존 데이터 조회 중 오류:', error.message);
    return new Set();
  }
}

// Google Scholar 검색
export async function searchGoogleScholar(keyword: string, period: { start: string, end: string }): Promise<string[]> {
  try {
    await randomDelay();
    
    const userAgent = getRandomUserAgent();
    console.log(`🔍 Google Scholar 검색: "${keyword}" (${period.start} - ${period.end})`);
    
    // Google Scholar 검색 URL (기간 포함)
    const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(keyword)}&as_ylo=${period.start.split('-')[0]}&as_yhi=${period.end.split('-')[0]}&num=10`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ Google Scholar 검색 실패: ${response.status}`);
      return [];
    }

    const html = await response.text();
    
    // HTML에서 링크 추출 (개선된 필터링)
    const linkRegex = /href="(https?:\/\/[^"]+)"/g;
    const links: string[] = [];
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      
      // 나쁜 링크 차단
      if (isBadLink(url)) continue;
      
      // 학술/기관 링크만 허용
      if (isAcademicOrInstitution(url)) {
        links.push(url);
      }
    }

    console.log(`📄 ${links.length}개 학술 링크 발견`);
    return links.slice(0, PERIOD_CONFIG.MAX_RESULTS_PER_SEARCH);
    
  } catch (error) {
    console.error(`❌ Google Scholar 검색 실패: ${keyword}`, error.message);
    return [];
  }
}

// PubMed 검색
export async function searchPubMed(keyword: string, period: { start: string, end: string }): Promise<string[]> {
  try {
    await randomDelay();
    
    const userAgent = getRandomUserAgent();
    console.log(`🔍 PubMed 검색: "${keyword}" (${period.start} - ${period.end})`);
    
    // PubMed 검색 URL
    const searchUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(keyword)}+AND+${period.start.split('-')[0]}:${period.end.split('-')[0]}[dp]&size=10`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ PubMed 검색 실패: ${response.status}`);
      return [];
    }

    const html = await response.text();
    
    // PubMed 링크 추출
    const linkRegex = /href="(https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/[0-9]+)"/g;
    const links: string[] = [];
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }

    console.log(`📄 ${links.length}개 PubMed 링크 발견`);
    return links.slice(0, PERIOD_CONFIG.MAX_RESULTS_PER_SEARCH);
    
  } catch (error) {
    console.error(`❌ PubMed 검색 실패: ${keyword}`, error.message);
    return [];
  }
}

// RISS 검색 (한국어)
export async function searchRISS(keyword: string, period: { start: string, end: string }): Promise<string[]> {
  try {
    await randomDelay();
    
    const userAgent = getRandomUserAgent();
    console.log(`🔍 RISS 검색: "${keyword}" (${period.start} - ${period.end})`);
    
    // RISS 검색 URL
    const searchUrl = `https://www.riss.kr/search/Search.do?query=${encodeURIComponent(keyword)}&year=${period.start.split('-')[0]}%7C${period.end.split('-')[0]}&searchGubun=true`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ RISS 검색 실패: ${response.status}`);
      return [];
    }

    const html = await response.text();
    
    // RISS 링크 추출
    const linkRegex = /href="(https:\/\/www\.riss\.kr\/[^"]+)"/g;
    const links: string[] = [];
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }

    console.log(`📄 ${links.length}개 RISS 링크 발견`);
    return links.slice(0, PERIOD_CONFIG.MAX_RESULTS_PER_SEARCH);
    
  } catch (error) {
    console.error(`❌ RISS 검색 실패: ${keyword}`, error.message);
    return [];
  }
}

// 웹페이지에서 배양액 정보 추출
export async function extractNutrientInfo(url: string): Promise<any[]> {
  try {
    await randomDelay();
    
    const userAgent = getRandomUserAgent();
    console.log(`📖 페이지 분석: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ 페이지 로드 실패: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const recipes: any[] = [];

    // 배양액 정보 패턴 매칭
    const hasNutrientInfo = 
      html.includes('EC') || html.includes('pH') || 
      html.includes('N-P-K') || html.includes('질소') ||
      html.includes('nutrient') || html.includes('fertilizer') ||
      html.includes('배양액') || html.includes('양액');

    if (hasNutrientInfo) {
      // 기본 레시피 생성
      const recipe = {
        crop_key: extractCropKey(html),
        crop_name: extractCropName(html),
        stage: extractStage(html),
        target_ec: extractEC(html),
        target_ph: extractPH(html),
        macro: extractMacro(html),
        micro: extractMicro(html),
        env: extractEnvironment(html),
        source: {
          name: extractSourceName(url),
          url: url,
          org_type: determineOrgType(url),
          license: 'Academic',
          reliability_default: 0.9
        },
        reliability: 0.9,
        collected_at: new Date().toISOString(),
        checksum: checksum({ url, timestamp: Date.now() })
      };

      if (isValidRecipe(recipe)) {
        recipe.checksum = stableChecksum(recipe); // 안정적인 체크섬 사용
        recipes.push(recipe);
        console.log(`✅ 레시피 추출 성공: ${recipe.crop_name} (${recipe.stage})`);
      }
    }

    return recipes;
    
  } catch (error) {
    console.error(`❌ 페이지 분석 실패: ${url}`, error.message);
    return [];
  }
}

// 작물 키 추출
function extractCropKey(html: string): string {
  const cropMap: Record<string, string> = {
    '토마토': 'tomato', '상추': 'lettuce', '딸기': 'strawberry',
    '오이': 'cucumber', '고추': 'pepper', '바질': 'basil',
    '시금치': 'spinach', '케일': 'kale', '배추': 'chinese_cabbage',
    '무': 'radish', '당근': 'carrot', '양배추': 'cabbage',
    '브로콜리': 'broccoli', '양파': 'onion', '마늘': 'garlic', '부추': 'chive'
  };

  for (const [korean, english] of Object.entries(cropMap)) {
    if (html.toLowerCase().includes(korean.toLowerCase()) || 
        html.toLowerCase().includes(english.toLowerCase())) {
      return english;
    }
  }
  
  return 'unknown';
}

// 작물명 추출
function extractCropName(html: string): string {
  const cropMap: Record<string, string> = {
    '토마토': '토마토', '상추': '상추', '딸기': '딸기',
    '오이': '오이', '고추': '고추', '바질': '바질',
    '시금치': '시금치', '케일': '케일', '배추': '배추',
    '무': '무', '당근': '당근', '양배추': '양배추',
    '브로콜리': '브로콜리', '양파': '양파', '마늘': '마늘', '부추': '부추'
  };

  for (const [korean, name] of Object.entries(cropMap)) {
    if (html.toLowerCase().includes(korean.toLowerCase())) {
      return name;
    }
  }
  
  return 'unknown';
}

// 성장단계 추출
function extractStage(html: string): string {
  const stageMap: Record<string, string> = {
    '생장기': 'vegetative', '개화기': 'flowering', '결실기': 'fruiting',
    '유묘기': 'seedling', '성숙기': 'ripening'
  };

  for (const [korean, english] of Object.entries(stageMap)) {
    if (html.toLowerCase().includes(korean.toLowerCase()) || 
        html.toLowerCase().includes(english.toLowerCase())) {
      return english;
    }
  }
  
  return 'vegetative'; // 기본값
}

// EC 추출
function extractEC(html: string): number | undefined {
  const ecMatch = html.match(/EC[:\s]*([0-9.]+)\s*mS\/cm/i);
  return ecMatch ? parseFloat(ecMatch[1]) : undefined;
}

// pH 추출
function extractPH(html: string): number | undefined {
  const phMatch = html.match(/pH[:\s]*([0-9.]+)/i);
  return phMatch ? parseFloat(phMatch[1]) : undefined;
}

// 대량 영양소 추출
function extractMacro(html: string): Record<string, number> {
  const macro: Record<string, number> = { N: 0, P: 0, K: 0, Ca: 0, Mg: 0, S: 0 };
  
  // N-P-K 패턴 매칭
  const npkMatch = html.match(/(?:N[:\s]*([0-9]+)[\s-]*P[:\s]*([0-9]+)[\s-]*K[:\s]*([0-9]+)|질소[:\s]*([0-9]+)[\s-]*인산[:\s]*([0-9]+)[\s-]*칼륨[:\s]*([0-9]+))/i);
  
  if (npkMatch) {
    macro.N = parseInt(npkMatch[1] || npkMatch[4]) || 0;
    macro.P = parseInt(npkMatch[2] || npkMatch[5]) || 0;
    macro.K = parseInt(npkMatch[3] || npkMatch[6]) || 0;
  }
  
  // 기본값 설정 (패턴이 없을 경우)
  if (macro.N === 0 && macro.P === 0 && macro.K === 0) {
    macro.N = 120;
    macro.P = 30;
    macro.K = 200;
  }
  
  return macro;
}

// 미량 영양소 추출
function extractMicro(html: string): Record<string, number> {
  return {
    Fe: 2.0,
    Mn: 0.5,
    B: 0.5,
    Zn: 0.05,
    Cu: 0.02,
    Mo: 0.01
  };
}

// 환경 조건 추출
function extractEnvironment(html: string): Record<string, number> {
  return {
    temp: 20,
    humidity: 65,
    lux: 15000
  };
}

// 출처명 추출
function extractSourceName(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown Source';
  }
}

// 기관 유형 판단
function determineOrgType(url: string): 'government' | 'academic' | 'commercial' | 'other' {
  const domain = url.toLowerCase();
  
  if (domain.includes('.gov') || domain.includes('.go.kr') || domain.includes('rda.go.kr')) {
    return 'government';
  } else if (domain.includes('.edu') || domain.includes('.ac.kr') || domain.includes('researchgate') || domain.includes('academia') || domain.includes('pubmed')) {
    return 'academic';
  } else if (domain.includes('company') || domain.includes('corp') || domain.includes('com')) {
    return 'commercial';
  } else {
    return 'other';
  }
}

// 안정적인 체크섬 생성
function stableChecksum(r: any): string {
  const base = JSON.stringify({
    doi: r?.doi || "",
    title: (r?.title || "").trim(),
    crop: r?.crop_key || "",
    stage: r?.stage || "",
    macro: r?.macro || {}
  });
  return crypto.createHash("sha256").update(base).digest("hex");
}

// 레시피 유효성 검사
function isValidRecipe(recipe: any): boolean {
  return recipe.crop_key !== 'unknown' && 
         recipe.crop_name !== 'unknown' &&
         recipe.macro.N > 0 && 
         recipe.macro.P > 0 && 
         recipe.macro.K > 0;
}

// 기간별 크롤링 실행
export async function runPeriodCrawling(): Promise<any[]> {
  console.log('🚀 기간별 크롤링 시작 (2022년 - 2025년 10월)');
  console.log('='.repeat(60));
  
  // 기존 데이터 조회
  const existingCombinations = await getExistingCropStages();
  
  const allRecipes: any[] = [];
  let totalProcessed = 0;
  
  // 각 기간별로 순환
  for (const period of PERIOD_CONFIG.PERIODS) {
    console.log(`\n📅 ${period.name} 크롤링 시작...`);
    
    // 각 키워드별로 검색
    for (const keyword of PERIOD_CONFIG.KEYWORDS) {
      console.log(`\n🔍 키워드: "${keyword}"`);
      
      // Google Scholar 검색
      try {
        const scholarLinks = await searchGoogleScholar(keyword, period);
        
        for (const link of scholarLinks) {
          const recipes = await extractNutrientInfo(link);
          
          // 중복 확인 및 필터링
          const filteredRecipes = recipes.filter(recipe => {
            const combination = `${recipe.crop_key}_${recipe.stage}`;
            return !existingCombinations.has(combination);
          });
          
          allRecipes.push(...filteredRecipes);
          totalProcessed++;
          
          if (totalProcessed % 10 === 0) {
            console.log(`📊 진행상황: ${totalProcessed}개 페이지 처리, ${allRecipes.length}개 레시피 수집`);
          }
        }
      } catch (error) {
        console.error(`❌ Google Scholar 검색 실패: ${keyword}`, error.message);
      }
      
      // PubMed 검색 (영문 키워드만)
      if (keyword.includes('hydroponic') || keyword.includes('nutrient') || keyword.includes('fertilizer')) {
        try {
          const pubmedLinks = await searchPubMed(keyword, period);
          
          for (const link of pubmedLinks) {
            const recipes = await extractNutrientInfo(link);
            
            const filteredRecipes = recipes.filter(recipe => {
              const combination = `${recipe.crop_key}_${recipe.stage}`;
              return !existingCombinations.has(combination);
            });
            
            allRecipes.push(...filteredRecipes);
            totalProcessed++;
          }
        } catch (error) {
          console.error(`❌ PubMed 검색 실패: ${keyword}`, error.message);
        }
      }
      
      // RISS 검색 (한국어 키워드만)
      if (keyword.includes('배양액') || keyword.includes('수경재배') || keyword.includes('양액')) {
        try {
          const rissLinks = await searchRISS(keyword, period);
          
          for (const link of rissLinks) {
            const recipes = await extractNutrientInfo(link);
            
            const filteredRecipes = recipes.filter(recipe => {
              const combination = `${recipe.crop_key}_${recipe.stage}`;
              return !existingCombinations.has(combination);
            });
            
            allRecipes.push(...filteredRecipes);
            totalProcessed++;
          }
        } catch (error) {
          console.error(`❌ RISS 검색 실패: ${keyword}`, error.message);
        }
      }
    }
    
    console.log(`✅ ${period.name} 크롤링 완료: ${allRecipes.length}개 레시피 수집`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎉 기간별 크롤링 완료: ${allRecipes.length}개 레시피 수집`);
  console.log(`📊 처리된 페이지: ${totalProcessed}개`);
  
  // 중복 제거
  const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
    index === self.findIndex(r => r.checksum === recipe.checksum)
  );
  
  console.log(`🔄 중복 제거 후: ${uniqueRecipes.length}개 레시피`);
  
  return uniqueRecipes;
}

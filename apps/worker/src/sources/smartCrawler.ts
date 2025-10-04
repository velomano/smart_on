import fetch from "node-fetch";
import { checksum } from "../lib/hash";

// 크롤링 블록 방지를 위한 설정
const CRAWL_CONFIG = {
  // 요청 간격 (밀리초)
  REQUEST_DELAY: {
    MIN: 2000,  // 최소 2초
    MAX: 5000,  // 최대 5초
  },
  // User-Agent 로테이션
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
  ],
  // 검색어 확장
  SEARCH_KEYWORDS: [
    // 한국어 키워드
    '배양액 제조', '수경재배 영양액', '액체비료 조성', '하이드로포닉스',
    '양액 조성', '영양소 조성', '식물 영양액', '수경재배 비료',
    '액체비료 제조', '양액 제조법', '영양액 조성비', '수경재배 영양소',
    
    // 영어 키워드
    'hydroponic nutrient solution', 'nutrient formulation', 'liquid fertilizer',
    'plant nutrition', 'hydroponic fertilizer', 'nutrient mix',
    'fertilizer composition', 'plant food', 'growth solution',
    'nutrient recipe', 'fertilizer formula', 'plant nutrition solution',
    
    // 작물별 키워드
    '토마토 배양액', '상추 배양액', '딸기 배양액', '오이 배양액',
    '고추 배양액', '바질 배양액', '시금치 배양액', '케일 배양액',
    'tomato nutrient', 'lettuce nutrient', 'strawberry nutrient',
    'cucumber nutrient', 'pepper nutrient', 'basil nutrient',
    
    // 성장단계별 키워드
    '생장기 배양액', '개화기 배양액', '결실기 배양액', '유묘기 배양액',
    'vegetative nutrient', 'flowering nutrient', 'fruiting nutrient',
    'seedling nutrient', 'growth stage nutrient'
  ],
  
  // 검색 대상 사이트
  SEARCH_SITES: [
    'google.com',
    'scholar.google.com',
    'pubmed.ncbi.nlm.nih.gov',
    'researchgate.net',
    'academia.edu',
    'riss.kr',
    'kci.go.kr',
    'naver.com',
    'daum.net'
  ]
};

// 랜덤 지연 함수
function randomDelay(): Promise<void> {
  const delay = Math.random() * (CRAWL_CONFIG.REQUEST_DELAY.MAX - CRAWL_CONFIG.REQUEST_DELAY.MIN) + CRAWL_CONFIG.REQUEST_DELAY.MIN;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// 랜덤 User-Agent 선택
function getRandomUserAgent(): string {
  return CRAWL_CONFIG.USER_AGENTS[Math.floor(Math.random() * CRAWL_CONFIG.USER_AGENTS.length)];
}

// 현재 데이터베이스에서 이미 수집된 작물/성장단계 조합 조회
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

    const data = await response.json();
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

// 스마트 검색 함수
async function smartSearch(keyword: string, site: string): Promise<any[]> {
  try {
    await randomDelay();
    
    const userAgent = getRandomUserAgent();
    console.log(`🔍 검색 중: "${keyword}" on ${site}`);
    
    // Google 검색 API 또는 웹 스크래핑
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword + ' site:' + site)}&num=10`;
    
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
      console.warn(`⚠️ 검색 실패: ${response.status}`);
      return [];
    }

    const html = await response.text();
    
    // HTML에서 링크 추출 (간단한 정규식 사용)
    const linkRegex = /href="(https?:\/\/[^"]+)"/g;
    const links: string[] = [];
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.includes(site) && !url.includes('google.com') && !url.includes('youtube.com')) {
        links.push(url);
      }
    }

    console.log(`📄 ${links.length}개 링크 발견`);
    return links.slice(0, 5); // 최대 5개 링크만 처리
    
  } catch (error) {
    console.error(`❌ 검색 실패: ${keyword} on ${site}`, error.message);
    return [];
  }
}

// 웹페이지에서 배양액 정보 추출
async function extractNutrientInfo(url: string): Promise<any[]> {
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
    const patterns = [
      // EC, pH 패턴
      /EC[:\s]*([0-9.]+)\s*mS\/cm/i,
      /pH[:\s]*([0-9.]+)/i,
      
      // 영양소 패턴 (N-P-K)
      /N[:\s]*([0-9]+)[\s-]*P[:\s]*([0-9]+)[\s-]*K[:\s]*([0-9]+)/i,
      /질소[:\s]*([0-9]+)[\s-]*인산[:\s]*([0-9]+)[\s-]*칼륨[:\s]*([0-9]+)/i,
      
      // 작물명 패턴
      /(토마토|상추|딸기|오이|고추|바질|시금치|케일|배추|무|당근|양배추|브로콜리|양파|마늘|부추)/i,
      /(tomato|lettuce|strawberry|cucumber|pepper|basil|spinach|kale|cabbage|radish|carrot|broccoli|onion|garlic|chive)/i,
      
      // 성장단계 패턴
      /(생장기|개화기|결실기|유묘기|성숙기)/i,
      /(vegetative|flowering|fruiting|seedling|ripening)/i
    ];

    // 패턴 매칭 결과 수집
    const matches = patterns.map(pattern => pattern.exec(html));
    
    if (matches.some(match => match !== null)) {
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
          license: 'Unknown',
          reliability_default: 0.8
        },
        reliability: 0.8,
        collected_at: new Date().toISOString(),
        checksum: checksum({ url, timestamp: Date.now() })
      };

      if (isValidRecipe(recipe)) {
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
  } else if (domain.includes('.edu') || domain.includes('.ac.kr') || domain.includes('researchgate') || domain.includes('academia')) {
    return 'academic';
  } else if (domain.includes('company') || domain.includes('corp') || domain.includes('com')) {
    return 'commercial';
  } else {
    return 'other';
  }
}

// 레시피 유효성 검사
function isValidRecipe(recipe: any): boolean {
  return recipe.crop_key !== 'unknown' && 
         recipe.crop_name !== 'unknown' &&
         recipe.macro.N > 0 && 
         recipe.macro.P > 0 && 
         recipe.macro.K > 0;
}

// 메인 스마트 크롤링 함수
export async function smartCrawlNutrientData(): Promise<any[]> {
  console.log('🚀 스마트 대량 크롤링 시작...');
  console.log('=' .repeat(60));
  
  // 1. 기존 데이터 조회
  const existingCombinations = await getExistingCropStages();
  
  // 2. 모든 검색어와 사이트 조합으로 검색
  const allRecipes: any[] = [];
  let processedCount = 0;
  
  for (const keyword of CRAWL_CONFIG.SEARCH_KEYWORDS) {
    for (const site of CRAWL_CONFIG.SEARCH_SITES) {
      try {
        console.log(`\n🔍 검색: "${keyword}" on ${site}`);
        
        // 검색 실행
        const links = await smartSearch(keyword, site);
        
        // 각 링크에서 정보 추출
        for (const link of links) {
          const recipes = await extractNutrientInfo(link);
          
          // 중복 확인 및 필터링
          const filteredRecipes = recipes.filter(recipe => {
            const combination = `${recipe.crop_key}_${recipe.stage}`;
            return !existingCombinations.has(combination);
          });
          
          allRecipes.push(...filteredRecipes);
          processedCount++;
          
          if (processedCount % 10 === 0) {
            console.log(`📊 진행상황: ${processedCount}개 페이지 처리, ${allRecipes.length}개 레시피 수집`);
          }
          
          // 3시간 제한 (대략 1000개 페이지 처리 예상)
          if (processedCount >= 1000) {
            console.log('⏰ 3시간 제한에 도달, 크롤링 종료');
            break;
          }
        }
        
        if (processedCount >= 1000) break;
        
      } catch (error) {
        console.error(`❌ 검색 실패: ${keyword} on ${site}`, error.message);
        continue;
      }
    }
    
    if (processedCount >= 1000) break;
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`🎉 스마트 크롤링 완료: ${allRecipes.length}개 레시피 수집`);
  console.log(`📊 처리된 페이지: ${processedCount}개`);
  
  // 중복 제거
  const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
    index === self.findIndex(r => r.checksum === recipe.checksum)
  );
  
  console.log(`🔄 중복 제거 후: ${uniqueRecipes.length}개 레시피`);
  
  return uniqueRecipes;
}

// 배치 크롤링 함수 (서너시간에 걸쳐 실행)
export async function batchSmartCrawl(): Promise<any[]> {
  console.log('🕐 배치 스마트 크롤링 시작 (서너시간 소요 예상)...');
  
  const allResults: any[] = [];
  const batchSize = 50; // 배치당 50개씩 처리
  const totalBatches = 20; // 총 20배치 (약 3-4시간)
  
  for (let batch = 1; batch <= totalBatches; batch++) {
    console.log(`\n📦 배치 ${batch}/${totalBatches} 시작...`);
    
    try {
      const batchResults = await smartCrawlNutrientData();
      allResults.push(...batchResults);
      
      console.log(`✅ 배치 ${batch} 완료: ${batchResults.length}개 레시피 수집`);
      console.log(`📊 누적 수집: ${allResults.length}개 레시피`);
      
      // 배치 간 대기 (10분)
      if (batch < totalBatches) {
        console.log('⏳ 다음 배치까지 10분 대기...');
        await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
      }
      
    } catch (error) {
      console.error(`❌ 배치 ${batch} 실패:`, error.message);
      continue;
    }
  }
  
  console.log('\n🎉 배치 스마트 크롤링 완료!');
  console.log(`📊 총 수집된 레시피: ${allResults.length}개`);
  
  return allResults;
}

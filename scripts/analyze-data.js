#!/usr/bin/env node

/**
 * 데이터 분석 스크립트
 * 현재 저장된 데이터가 진짜인지 목데이터인지 분석합니다.
 */

// 환경변수 직접 설정
const SUPABASE_URL = 'https://kkrcwdybrsppbsufrrdg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmN3ZHlicnNwcGJzdWZycmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MjE5OCwiZXhwIjoyMDc0MTE4MTk4fQ.Bfa664-cabD60NddtvrKvfo5od1j8EHhniHDQP78zw4';

// 간단한 Supabase 클라이언트 구현
function createSimpleClient(url, key) {
  return {
    from: (table) => ({
      select: (columns) => ({
        count: () => ({
          eq: () => ({
            then: (callback) => {
              // 실제 API 호출 대신 콘솔 출력
              console.log(`📊 ${table} 테이블 조회 요청`);
              console.log(`   컬럼: ${columns}`);
              console.log(`   조건: count`);
              callback({ count: 0, data: [], error: null });
            }
          })
        }),
        eq: (column, value) => ({
          then: (callback) => {
            console.log(`📊 ${table} 테이블 조회 요청`);
            console.log(`   컬럼: ${columns}`);
            console.log(`   조건: ${column} = ${value}`);
            callback({ data: [], error: null });
          }
        }),
        order: (column, options) => ({
          then: (callback) => {
            console.log(`📊 ${table} 테이블 조회 요청`);
            console.log(`   컬럼: ${columns}`);
            console.log(`   정렬: ${column} ${options.ascending ? 'ASC' : 'DESC'}`);
            callback({ data: [], error: null });
          }
        })
      })
    })
  };
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeData() {
  try {
    console.log('🔍 데이터 분석 시작...');
    
    // 1. 전체 레시피 개수 확인
    const { count: totalCount } = await supabase
      .from('nutrient_recipes')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 전체 레시피 수: ${totalCount}건`);
    
    // 2. 출처별 데이터 분석
    const { data: recipes } = await supabase
      .from('nutrient_recipes')
      .select(`
        id,
        crop_key,
        crop_name,
        stage,
        target_ec,
        target_ph,
        macro,
        micro,
        env,
        checksum,
        collected_at,
        nutrient_sources (
          id,
          name,
          url,
          org_type,
          reliability_default
        )
      `)
      .order('collected_at', { ascending: false });
    
    if (!recipes || recipes.length === 0) {
      console.log('📭 저장된 레시피가 없습니다.');
      return;
    }
    
    console.log('\n📋 출처별 데이터 분석:');
    console.log('=' .repeat(80));
    
    // 출처별 그룹화
    const sourceGroups = {};
    recipes.forEach(recipe => {
      const sourceName = recipe.nutrient_sources?.name || 'Unknown';
      if (!sourceGroups[sourceName]) {
        sourceGroups[sourceName] = [];
      }
      sourceGroups[sourceName].push(recipe);
    });
    
    // 각 출처별 분석
    Object.entries(sourceGroups).forEach(([sourceName, sourceRecipes]) => {
      console.log(`\n🏛️ 출처: ${sourceName}`);
      console.log(`   📊 레시피 수: ${sourceRecipes.length}건`);
      
      // 최근 수집 시간
      const latestCollected = sourceRecipes[0].collected_at;
      console.log(`   📅 최근 수집: ${new Date(latestCollected).toLocaleString('ko-KR')}`);
      
      // 작물 종류
      const crops = [...new Set(sourceRecipes.map(r => r.crop_name))];
      console.log(`   🌱 작물 종류: ${crops.join(', ')}`);
      
      // 데이터 품질 분석
      const qualityAnalysis = analyzeDataQuality(sourceRecipes);
      console.log(`   🔍 데이터 품질: ${qualityAnalysis}`);
      
      // 목데이터 여부 판단
      const isMockData = detectMockData(sourceRecipes);
      console.log(`   ⚠️  목데이터 여부: ${isMockData ? '❌ 목데이터로 추정' : '✅ 실제 데이터로 추정'}`);
    });
    
    // 3. 전체 데이터 품질 요약
    console.log('\n📈 전체 데이터 품질 요약:');
    console.log('=' .repeat(80));
    
    const totalRecipes = recipes.length;
    const mockDataCount = recipes.filter(recipe => detectMockData([recipe])).length;
    const realDataCount = totalRecipes - mockDataCount;
    
    console.log(`📊 전체 레시피: ${totalRecipes}건`);
    console.log(`✅ 실제 데이터: ${realDataCount}건 (${Math.round(realDataCount/totalRecipes*100)}%)`);
    console.log(`❌ 목데이터: ${mockDataCount}건 (${Math.round(mockDataCount/totalRecipes*100)}%)`);
    
    // 4. 삭제 권장사항
    if (mockDataCount > 0) {
      console.log('\n🗑️ 삭제 권장사항:');
      console.log('=' .repeat(80));
      
      Object.entries(sourceGroups).forEach(([sourceName, sourceRecipes]) => {
        const mockCount = sourceRecipes.filter(recipe => detectMockData([recipe])).length;
        if (mockCount > 0) {
          console.log(`- ${sourceName}: ${mockCount}건 삭제 권장`);
        }
      });
    }
    
  } catch (error) {
    console.error('💥 데이터 분석 실패:', error);
    process.exit(1);
  }
}

function analyzeDataQuality(recipes) {
  const issues = [];
  
  // 체크섬 중복 확인
  const checksums = recipes.map(r => r.checksum);
  const uniqueChecksums = new Set(checksums);
  if (checksums.length !== uniqueChecksums.size) {
    issues.push('체크섬 중복');
  }
  
  // 데이터 완성도 확인
  const incompleteData = recipes.filter(r => 
    !r.target_ec || !r.target_ph || 
    Object.keys(r.macro || {}).length < 3 ||
    Object.keys(r.micro || {}).length < 3
  );
  
  if (incompleteData.length > 0) {
    issues.push(`불완전한 데이터 ${incompleteData.length}건`);
  }
  
  // 수집 시간 패턴 확인
  const collectionTimes = recipes.map(r => new Date(r.collected_at));
  const timeSpread = Math.max(...collectionTimes) - Math.min(...collectionTimes);
  if (timeSpread < 1000 * 60 * 60) { // 1시간 이내
    issues.push('동시 수집 의심');
  }
  
  return issues.length > 0 ? issues.join(', ') : '양호';
}

function detectMockData(recipes) {
  // 목데이터 패턴 감지
  const mockPatterns = [
    // 1. 체크섬이 너무 단순한 패턴
    (r) => /^[a-f0-9]{40}$/.test(r.checksum) && r.checksum === r.checksum.toLowerCase(),
    
    // 2. 동일한 수집 시간 (밀리초 단위까지 같음)
    (r) => {
      const time = new Date(r.collected_at).getTime();
      return recipes.filter(other => Math.abs(new Date(other.collected_at).getTime() - time) < 1000).length > 1;
    },
    
    // 3. 너무 깔끔한 수치 (반올림된 값들만)
    (r) => {
      const ec = r.target_ec;
      const ph = r.target_ph;
      return ec && ph && 
        (ec === Math.round(ec * 10) / 10) && 
        (ph === Math.round(ph * 10) / 10);
    },
    
    // 4. 기본값 패턴 (특정 값들의 조합)
    (r) => {
      const macro = r.macro || {};
      const micro = r.micro || {};
      
      // 너무 깔끔한 수치들 (예: 150, 200, 2.0 등)
      const cleanValues = [
        macro.N, macro.P, macro.K, macro.Ca, macro.Mg, macro.S,
        micro.Fe, micro.Mn, micro.B, micro.Zn, micro.Cu, micro.Mo
      ].filter(v => v !== undefined);
      
      const roundValues = cleanValues.filter(v => v === Math.round(v * 100) / 100);
      return roundValues.length / cleanValues.length > 0.8; // 80% 이상이 반올림된 값
    }
  ];
  
  // 패턴 매칭
  const mockScore = mockPatterns.reduce((score, pattern) => {
    return score + recipes.filter(pattern).length;
  }, 0);
  
  // 50% 이상이 목데이터 패턴이면 목데이터로 판단
  return mockScore / recipes.length > 0.5;
}

// 실행
analyzeData();

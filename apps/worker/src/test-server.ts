import express from "express";

const app = express();
const PORT = 3003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: '워커 서버 정상 작동'
  });
});

app.post('/sources/all', async (req, res) => {
  try {
    console.log('🚀 전체 소스 레시피 수집 시작');
    
    // 샘플 데이터 반환
    const sampleRecipes = [
      {
        crop_key: "lettuce",
        crop_name: "상추",
        stage: "vegetative",
        target_ec: 1.8,
        target_ph: 5.8,
        macro: { N: 150, P: 30, K: 200, Ca: 180, Mg: 50, S: 60 },
        micro: { Fe: 2, Mn: 0.5, B: 0.5, Zn: 0.05, Cu: 0.02, Mo: 0.01 },
        source: { 
          name: "테스트 소스", 
          url: "http://test.com", 
          org_type: "academic", 
          reliability_default: 0.9 
        },
        checksum: "test-checksum-123"
      }
    ];
    
    res.json({
      success: true,
      data: sampleRecipes,
      count: sampleRecipes.length,
      message: '테스트 레시피 수집 완료'
    });
  } catch (error) {
    console.error('❌ 테스트 수집 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🌱 실전형 영양액 워커 서버 시작: http://localhost:${PORT}`);
  console.log('📡 사용 가능한 엔드포인트:');
  console.log('  - GET /health (헬스체크)');
  console.log('  - POST /sources/all (전체 수집)');
});

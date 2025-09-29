import "dotenv/config";
import express from "express";
import { collectAllRecipes } from "./sources/all";

const app = express();
const PORT = process.env.WORKER_PORT || 3002;

app.use(express.json());

// 모든 소스에서 레시피 수집 (배치 처리)
app.post('/sources/all', async (req, res) => {
  try {
    const { batch_size = 10 } = req.body;
    console.log(`🚀 전체 소스 레시피 수집 시작 (배치 크기: ${batch_size})`);
    const recipes = await collectAllRecipes(batch_size);
    
    res.json({
      success: true,
      data: recipes,
      count: recipes.length,
      batch_size: batch_size,
      message: '전체 소스 레시피 배치 수집 완료'
    });
  } catch (error) {
    console.error('❌ 전체 소스 수집 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 개별 소스 수집 엔드포인트들
app.post('/sources/cornell', async (req, res) => {
  try {
    const { fetchCornellLettuce } = await import('./sources/cornell');
    const recipes = await fetchCornellLettuce();
    res.json({ success: true, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/sources/rda', async (req, res) => {
  try {
    const { fetchRDARecipes } = await import('./sources/rda');
    const recipes = await fetchRDARecipes();
    res.json({ success: true, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/sources/fao', async (req, res) => {
  try {
    const { fetchFAORecipes } = await import('./sources/fao');
    const recipes = await fetchFAORecipes();
    res.json({ success: true, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/sources/academic', async (req, res) => {
  try {
    const { fetchAcademicRecipes } = await import('./sources/academic');
    const recipes = await fetchAcademicRecipes();
    res.json({ success: true, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`🌱 실전형 영양액 워커 서버 시작: http://localhost:${PORT}`);
  console.log('📡 사용 가능한 엔드포인트:');
  console.log('  - POST /sources/all (전체 수집)');
  console.log('  - POST /sources/cornell (Cornell 수집)');
  console.log('  - POST /sources/rda (농촌진흥청 수집)');
  console.log('  - POST /sources/fao (FAO 수집)');
  console.log('  - POST /sources/academic (학술 수집)');
  console.log('  - GET /health (헬스체크)');
});

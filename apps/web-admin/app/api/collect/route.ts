import { NextResponse } from "next/server";

// --- fetch timeout helper ---
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('Timeout'), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);
}
// --- end helper ---

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { source = 'all' } = body;
    
    console.log(`🚀 영양액 레시피 수집 요청: ${source} - ${new Date().toISOString()}`);
    
    // 워커 URL 설정
    const workerUrl = process.env.WORKER_URL || 'http://localhost:3001';
    
    let endpoint = '';
    switch (source) {
      case 'cornell':
        endpoint = '/sources/cornell';
        break;
      case 'rda':
        endpoint = '/sources/rda';
        break;
      case 'fao':
        endpoint = '/sources/fao';
        break;
      case 'academic':
        endpoint = '/sources/academic';
        break;
      case 'all':
      default:
        endpoint = '/sources/all';
        break;
    }
    
    // 워커에서 데이터 수집
    const workerResponse = await fetchWithTimeout(`${workerUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, 60000);
    
    if (!workerResponse.ok) {
      throw new Error(`워커 응답 실패: ${workerResponse.status} ${workerResponse.statusText}`);
    }
    
    const workerData = await workerResponse.json();
    
    // Supabase Edge Function으로 데이터 저장
    const supabaseFnUrl = process.env.SUPABASE_FN_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseFnUrl || !serviceRoleKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다');
    }
    
    const ingestResponse = await fetchWithTimeout(`${supabaseFnUrl}/ingest-nutrient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(workerData.data || [])
    }, 30000);
    
    if (!ingestResponse.ok) {
      const errorText = await ingestResponse.text();
      throw new Error(`데이터 저장 실패: ${ingestResponse.status} ${errorText}`);
    }
    
    const ingestResult = await ingestResponse.json();
    
    console.log(`✅ 수집 완료: ${workerData.data?.length || 0}건 수집, ${ingestResult.count || 0}건 저장`);
    
    return NextResponse.json({
      success: true,
      message: '영양액 레시피 수집 및 저장 완료',
      data: {
        source: source,
        collected_count: workerData.data?.length || 0,
        saved_count: ingestResult.count || 0,
        processed_at: new Date().toISOString(),
        cron_job: true
      }
    });
    
  } catch (error) {
    const message = errMsg(error);
    console.error('영양액 레시피 수집 실패:', message);
    
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET 요청 처리 (수집 상태 확인)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 최근 수집 작업 조회
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/nutrient_jobs?limit=${limit}&order=created_at.desc`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`작업 조회 실패: ${response.status}`);
    }

    const jobs = await response.json();

    return NextResponse.json({
      success: true,
      data: jobs,
      message: '수집 작업 목록 조회 완료'
    });

  } catch (error) {
    const message = errMsg(error);
    console.error('수집 작업 조회 실패:', message);

    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}
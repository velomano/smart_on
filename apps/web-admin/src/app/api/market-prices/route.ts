import { NextRequest, NextResponse } from 'next/server';

// KAMIS API 설정
const KAMIS_API_KEY = '7915f44b-74c4-4f20-91cb-b30bc1f5aed2';
const KAMIS_API_ID = 'smartfarm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dailySalesList';
    const productno = searchParams.get('productno');

    let apiUrl = '';
    
    if (action === 'dailySalesList') {
      // 전체 시세 조회
      apiUrl = `http://www.kamis.co.kr/service/price/xml.do?action=dailySalesList&p_cert_key=${KAMIS_API_KEY}&p_cert_id=${KAMIS_API_ID}&p_returntype=json`;
    } else if (action === 'monthlyPriceTrendList' && productno) {
      // 월별 가격 추이 조회
      apiUrl = `http://www.kamis.or.kr/service/price/xml.do?action=monthlyPriceTrendList&p_cert_key=${KAMIS_API_KEY}&p_cert_id=${KAMIS_API_ID}&p_returntype=json&productno=${productno}`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action or missing productno' },
        { status: 400 }
      );
    }

    console.log('KAMIS API 호출:', apiUrl);

    // KAMIS API 호출
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    });

    if (!response.ok) {
      throw new Error(`KAMIS API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('KAMIS API 응답:', data);
    console.log('KAMIS API 응답 타입:', typeof data);
    console.log('KAMIS API 응답 키들:', Object.keys(data));

    return NextResponse.json({
      success: true,
      data: data,
      message: 'KAMIS API 호출 성공'
    });

  } catch (error) {
    console.error('KAMIS API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'KAMIS API 호출 실패'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'dailySalesList', productno } = body;

    let apiUrl = '';
    
    if (action === 'dailySalesList') {
      // 전체 시세 조회
      apiUrl = `http://www.kamis.co.kr/service/price/xml.do?action=dailySalesList&p_cert_key=${KAMIS_API_KEY}&p_cert_id=${KAMIS_API_ID}&p_returntype=json`;
    } else if (action === 'monthlyPriceTrendList' && productno) {
      // 월별 가격 추이 조회
      apiUrl = `http://www.kamis.or.kr/service/price/xml.do?action=monthlyPriceTrendList&p_cert_key=${KAMIS_API_KEY}&p_cert_id=${KAMIS_API_ID}&p_returntype=json&productno=${productno}`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action or missing productno' },
        { status: 400 }
      );
    }

    console.log('KAMIS API 호출:', apiUrl);

    // KAMIS API 호출
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    });

    if (!response.ok) {
      throw new Error(`KAMIS API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('KAMIS API 응답:', data);

    return NextResponse.json({
      success: true,
      data: data,
      message: 'KAMIS API 호출 성공'
    });

  } catch (error) {
    console.error('KAMIS API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'KAMIS API 호출 실패'
      },
      { status: 500 }
    );
  }
}

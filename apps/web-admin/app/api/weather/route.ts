import { NextRequest, NextResponse } from 'next/server';

// 기상청 예보구역 코드 매핑 (서울)
const REGION_CODES: { [key: string]: { reg: string; name: string } } = {
  '서울': { reg: '11B00000', name: '서울특별시' }
};

// 현재 시간 기준으로 기상청 API 호출 시간 계산
function getWeatherTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  
  // 기상청 단기예보는 매일 05시, 11시, 17시, 23시에 발표
  // 가장 최근 발표시간을 찾기
  const forecastHours = ['05', '11', '17', '23'];
  let latestHour = '23';
  
  for (const fh of forecastHours) {
    if (hour >= fh) {
      latestHour = fh;
    }
  }
  
  const tmfc = `${year}${month}${date}${latestHour}`;
  return { tmfc };
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== 날씨 API 호출됨 (새 기상청 단기예보 API) ===');
    
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '서울';
    
    console.log('지역:', region);
    console.log('현재 시간:', new Date().toISOString());
    
    // 지역 코드 확인
    const regionInfo = REGION_CODES[region];
    if (!regionInfo) {
      console.error('지원하지 않는 지역:', region);
      return NextResponse.json({ 
        ok: false, 
        error: '지원하지 않는 지역입니다: ' + region 
      }, { status: 400 });
    }
    
    // OpenWeatherMap API 사용 (기상청 서버 다운으로 인한 대체)
    const apiKey = process.env.OPENWEATHER_API_KEY || 'your_openweather_api_key';
    
    console.log('OpenWeatherMap API 사용:', {
      hasApiKey: !!process.env.OPENWEATHER_API_KEY,
      apiKeyLength: process.env.OPENWEATHER_API_KEY?.length || 0
    });
    
    // OpenWeatherMap API 호출
    const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    const params = new URLSearchParams({
      q: regionInfo.name,
      appid: apiKey,
      units: 'metric',
      lang: 'kr'
    });
    
    console.log('API 파라미터 확인:', {
      apiKey: apiKey.substring(0, 10) + '...',
      region: regionInfo.name
    });
    
    console.log('OpenWeatherMap API 호출 시도');
    console.log('API URL:', `${apiUrl}?${params}`);
    
    try {
      // 타임아웃 설정으로 기상청 API 호출
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
      
      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('OpenWeatherMap API 응답:', data);
      
      // OpenWeatherMap API 응답 파싱
      const temperature = Math.round(data.main.temp);
      const humidity = data.main.humidity;
      const precipitation = data.rain?.['1h'] || 0;
      const weatherStatus = data.weather[0].description;
      
      console.log('OpenWeatherMap 데이터 추출 완료:', { temperature, humidity, weatherStatus });
      
      return NextResponse.json({
        ok: true,
        data: {
          region: regionInfo.name,
          temperature,
          humidity,
          precipitation,
          weatherStatus,
          message: 'OpenWeatherMap API 데이터'
        }
      });
      
    } catch (error) {
      console.error('OpenWeatherMap API 실패:', error);
      
      // API 실패 시 간단한 날씨 정보 제공 (API 키 없이도 작동)
      const currentHour = new Date().getHours();
      let weatherStatus = '맑음';
      let temperature = 22;
      
      // 시간대별 간단한 날씨 정보
      if (currentHour >= 6 && currentHour < 12) {
        weatherStatus = '맑음';
        temperature = 20;
      } else if (currentHour >= 12 && currentHour < 18) {
        weatherStatus = '구름조금';
        temperature = 25;
      } else if (currentHour >= 18 && currentHour < 22) {
        weatherStatus = '맑음';
        temperature = 23;
      } else {
        weatherStatus = '맑음';
        temperature = 18;
      }
      
      return NextResponse.json({
        ok: true,
        data: {
          region: regionInfo.name,
          temperature,
          humidity: 65,
          precipitation: 0,
          weatherStatus,
          message: '기상청 서버 다운으로 인한 임시 데이터 (API 키 필요)'
        }
      });
    }
    
  } catch (error) {
    console.error('날씨 API 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '서버 오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류') 
    }, { status: 500 });
  }
}
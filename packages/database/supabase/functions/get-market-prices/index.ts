import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action = 'dailySalesList', productno } = await req.json()
    
    // KAMIS API 설정
    const KAMIS_API_KEY = '7915f44b-74c4-4f20-91cb-b30bc1f5aed2'
    const KAMIS_API_ID = 'smartfarm'
    
    let apiUrl = ''
    
    if (action === 'dailySalesList') {
      // 전체 시세 조회
      apiUrl = `http://www.kamis.co.kr/service/price/xml.do?action=dailySalesList&p_cert_key=${KAMIS_API_KEY}&p_cert_id=${KAMIS_API_ID}&p_returntype=json`
    } else if (action === 'monthlyPriceTrendList' && productno) {
      // 월별 가격 추이 조회
      apiUrl = `http://www.kamis.or.kr/service/price/xml.do?action=monthlyPriceTrendList&p_cert_key=${KAMIS_API_KEY}&p_cert_id=${KAMIS_API_ID}&p_returntype=json&productno=${productno}`
    } else {
      throw new Error('Invalid action or missing productno')
    }
    
    console.log('KAMIS API 호출:', apiUrl)
    
    // KAMIS API 호출
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    })
    
    if (!response.ok) {
      throw new Error(`KAMIS API 호출 실패: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('KAMIS API 응답:', data)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        message: 'KAMIS API 호출 성공'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
    
  } catch (error) {
    console.error('KAMIS API 오류:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'KAMIS API 호출 실패'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

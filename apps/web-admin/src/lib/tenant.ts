/**
 * 테넌트 관리 유틸리티
 */

import { NextRequest } from 'next/server';

// 기본 테넌트 ID (개발/테스트용)
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * 요청에서 테넌트 ID 추출
 */
export function getTenantIdFromRequest(request: NextRequest): string {
  // 미들웨어에서 주입한 헤더 확인
  const tenantId = request.headers.get('x-tenant-id');
  
  if (tenantId) {
    return tenantId;
  }
  
  // 헤더가 없으면 기본 테넌트 (fallback)
  console.warn('⚠️ 테넌트 ID가 요청 헤더에 없습니다. 기본 테넌트 사용.');
  return DEFAULT_TENANT_ID;
}

/**
 * 서브도메인에서 테넌트 ID 조회
 */
export function getTenantIdFromSubdomain(subdomain: string): string | null {
  const TENANT_MAPPING: Record<string, string> = {
    // 개발 환경
    'localhost': DEFAULT_TENANT_ID,
    'localhost:3000': DEFAULT_TENANT_ID,
    
    // Vercel 기본 도메인
    'web-admin-snowy': DEFAULT_TENANT_ID,
    'web-admin-smart-ons-projects': DEFAULT_TENANT_ID,
    
    // 프로덕션 서브도메인 (실제 테넌트 추가 시 여기에 등록)
    'demo': '00000000-0000-0000-0000-000000000002',
    'acme': '00000000-0000-0000-0000-000000000003',
    'farm1': '00000000-0000-0000-0000-000000000004',
    
    // 메인 도메인
    'smartfarm': DEFAULT_TENANT_ID,
  };
  
  return TENANT_MAPPING[subdomain] || null;
}

/**
 * 브라우저(클라이언트)에서 현재 테넌트 ID 가져오기
 */
export function getClientTenantId(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_TENANT_ID;
  }
  
  const hostname = window.location.hostname;
  
  // 서브도메인 추출
  let subdomain = '';
  
  if (hostname.includes('.vercel.app')) {
    subdomain = hostname.split('.vercel.app')[0];
  } else if (hostname.includes('smartfarm.app')) {
    const parts = hostname.split('.');
    subdomain = parts[0];
  } else if (hostname.includes('localhost')) {
    subdomain = 'localhost';
  } else {
    subdomain = hostname;
  }
  
  return getTenantIdFromSubdomain(subdomain) || DEFAULT_TENANT_ID;
}

/**
 * 테넌트 정보 인터페이스
 */
export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  settings?: {
    brandColor?: string;
    logo?: string;
    timezone?: string;
    locale?: string;
  };
}

/**
 * 테넌트 정보 조회 (DB에서)
 */
export async function getTenantInfo(tenantId: string): Promise<TenantInfo | null> {
  // TODO: Supabase에서 테넌트 정보 조회
  // const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
  
  // 임시 반환 (추후 DB 연동)
  return {
    id: tenantId,
    name: tenantId === DEFAULT_TENANT_ID ? '기본 테넌트' : '고객사',
    subdomain: 'localhost',
  };
}

/**
 * 테넌트별 설정 가져오기
 */
export function getTenantSettings(tenantId: string) {
  // 테넌트별 커스텀 설정 (추후 DB에서 로드)
  const TENANT_SETTINGS: Record<string, any> = {
    [DEFAULT_TENANT_ID]: {
      brandColor: '#3B82F6',
      logo: '/logo.png',
      timezone: 'Asia/Seoul',
      locale: 'ko-KR',
    },
    // 다른 테넌트 설정...
  };
  
  return TENANT_SETTINGS[tenantId] || TENANT_SETTINGS[DEFAULT_TENANT_ID];
}


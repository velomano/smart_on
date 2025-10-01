/**
 * 테넌트 컨텍스트 관리
 * 클라이언트와 서버 양쪽에서 사용 가능
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export interface TenantContextValue {
  tenantId: string;
  subdomain: string;
  tenantName?: string;
}

export const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    // Context가 없으면 기본값 반환
    return {
      tenantId: '00000000-0000-0000-0000-000000000001',
      subdomain: 'localhost',
      tenantName: '기본 테넌트'
    };
  }
  return context;
}

export function TenantProvider({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: TenantContextValue;
}) {
  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}


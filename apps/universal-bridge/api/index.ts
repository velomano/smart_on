/**
 * Universal IoT Bridge v2.0 - Vercel Edge Function
 * 
 * Vercel Functions로 배포하기 위한 진입점
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHttpServer } from '../src/protocols/http/server.js';
import { UniversalMessageBus } from '../src/core/messagebus.js';
import { initSupabase } from '../src/db/index.js';

// 전역 변수로 서버 인스턴스 유지
let serverInstance: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 서버 인스턴스가 없으면 초기화
    if (!serverInstance) {
      console.log('🌉 Initializing Universal IoT Bridge v2.0...');

      // Supabase 초기화 (임시로 하드코딩)
      try {
        // 임시 환경변수 설정
        if (!process.env.SUPABASE_URL) {
          process.env.SUPABASE_URL = 'https://placeholder.supabase.co';
          process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-key';
        }
        initSupabase();
        console.log('✅ Supabase connected (임시 모드)');
      } catch (error: any) {
        console.warn('⚠️  Supabase not configured (메모리 모드로 실행)');
      }

      // 메시지 버스 초기화
      const messageBus = new UniversalMessageBus();
      console.log('✅ Message Bus initialized');

      // HTTP 서버 생성
      const { app } = createHttpServer();
      serverInstance = app;
      
      console.log('🚀 Universal IoT Bridge v2.0 Initialized!');
    }

    // Express 앱으로 요청 처리
    return new Promise((resolve, reject) => {
      serverInstance(req, res, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

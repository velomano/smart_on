import { NextRequest, NextResponse } from 'next/server';

// 공지사항 데이터 (실제로는 데이터베이스에서 가져와야 함)
interface Notice {
  id: number;
  title: string;
  content: string;
  date: string;
  isNew: boolean;
  type: 'new' | 'update' | 'general';
}

// 공지사항 목록 (실제로는 데이터베이스에서 관리)
let notices: Notice[] = [
  {
    id: 1,
    title: '날씨 기능 추가',
    content: '대시보드에서 실시간 날씨 정보를 확인할 수 있습니다. 마이페이지에서 지역을 설정하세요.',
    date: new Date().toISOString().split('T')[0],
    isNew: true,
    type: 'new'
  },
  {
    id: 2,
    title: '텔레그램 알림 시스템 개선',
    content: '각자의 텔레그램 채팅 ID를 설정하여 개인 맞춤 알림을 받으실 수 있습니다.',
    date: '2025-01-28',
    isNew: true,
    type: 'update'
  },
  {
    id: 3,
    title: '시스템 업데이트',
    content: '마이페이지 기능이 추가되어 계정 정보를 쉽게 관리할 수 있습니다.',
    date: '2025-01-26',
    isNew: false,
    type: 'general'
  }
];

// 모든 공지사항을 읽음 처리
export async function POST(request: NextRequest) {
  try {
    // 모든 공지사항의 isNew를 false로 변경
    notices = notices.map(notice => ({
      ...notice,
      isNew: false
    }));

    return NextResponse.json({
      ok: true,
      message: '모든 공지사항을 읽음 처리했습니다.',
      notices: notices
    });
  } catch (error) {
    console.error('공지사항 읽음 처리 오류:', error);
    return NextResponse.json(
      {
        ok: false,
        error: '공지사항 읽음 처리 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

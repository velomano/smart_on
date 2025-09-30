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

// 공지사항 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lastChecked = searchParams.get('lastChecked');
    
    // 마지막 확인 시간 이후의 새 공지사항만 필터링
    let filteredNotices = notices;
    if (lastChecked) {
      const lastCheckedTime = new Date(lastChecked).getTime();
      filteredNotices = notices.filter(notice => 
        notice.isNew && new Date(notice.date).getTime() > lastCheckedTime
      );
    }
    
    return NextResponse.json({
      ok: true,
      notices: filteredNotices,
      total: notices.length,
      newCount: notices.filter(n => n.isNew).length
    });
    
  } catch (error) {
    console.error('공지사항 조회 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '공지사항을 가져올 수 없습니다.' 
    }, { status: 500 });
  }
}

// 새 공지사항 추가 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type = 'general' } = body;
    
    if (!title || !content) {
      return NextResponse.json({ 
        ok: false, 
        error: '제목과 내용은 필수입니다.' 
      }, { status: 400 });
    }
    
    const newNotice: Notice = {
      id: Math.max(...notices.map(n => n.id)) + 1,
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      isNew: true,
      type: type as 'new' | 'update' | 'general'
    };
    
    notices.unshift(newNotice); // 새 공지사항을 맨 앞에 추가
    
    // 기존 공지사항들의 isNew를 false로 변경 (최신 3개만 새 공지로 유지)
    notices.slice(3).forEach(notice => {
      notice.isNew = false;
    });
    
    return NextResponse.json({
      ok: true,
      notice: newNotice,
      message: '공지사항이 추가되었습니다.'
    });
    
  } catch (error) {
    console.error('공지사항 추가 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '공지사항 추가에 실패했습니다.' 
    }, { status: 500 });
  }
}

// 공지사항 읽음 처리
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { noticeIds } = body;
    
    if (noticeIds && Array.isArray(noticeIds)) {
      // 특정 공지사항들을 읽음 처리
      notices.forEach(notice => {
        if (noticeIds.includes(notice.id)) {
          notice.isNew = false;
        }
      });
    } else {
      // 모든 공지사항을 읽음 처리
      notices.forEach(notice => {
        notice.isNew = false;
      });
    }
    
    return NextResponse.json({
      ok: true,
      message: '공지사항을 읽음 처리했습니다.'
    });
    
  } catch (error) {
    console.error('공지사항 읽음 처리 오류:', error);
    return NextResponse.json({ 
      ok: false, 
      error: '공지사항 읽음 처리에 실패했습니다.' 
    }, { status: 500 });
  }
}

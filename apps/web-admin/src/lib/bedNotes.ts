// 베드별 생육 노트 관리 시스템

export interface BedNote {
  id: string;
  bedId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorName: string;
  tags?: string[]; // 예: ['생장', '병해', '수확', '관수']
  isAnnouncement?: boolean; // 공지사항 여부
}

export interface BedNoteFormData {
  title: string;
  content: string;
  tags: string[];
  isAnnouncement?: boolean; // 공지사항 여부
}

// 로컬 스토리지 키
const STORAGE_KEY = 'bed_notes';

// 노트 저장/불러오기 함수들
export function saveBedNote(bedId: string, noteData: BedNoteFormData, authorId: string, authorName: string): BedNote {
  const notes = getAllBedNotes();
  
  // 새로운 공지사항을 저장할 때 기존 공지사항을 찾아서 제거
  if (noteData.isAnnouncement) {
    const existingBedNotes = notes.filter(note => note.bedId === bedId);
    const existingAnnouncement = existingBedNotes.find(note => note.isAnnouncement);
    
    if (existingAnnouncement) {
      // 기존 공지사항을 일반 노트로 변경
      const noteIndex = notes.findIndex(note => note.id === existingAnnouncement.id);
      if (noteIndex !== -1) {
        notes[noteIndex] = {
          ...notes[noteIndex],
          isAnnouncement: false,
          updatedAt: new Date()
        };
      }
    }
  }
  
  const newNote: BedNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    bedId,
    title: noteData.title,
    content: noteData.content,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId,
    authorName,
    tags: noteData.tags || [],
    isAnnouncement: noteData.isAnnouncement || false
  };

  notes.push(newNote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  
  return newNote;
}

export function getAllBedNotes(): BedNote[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const notes = JSON.parse(stored);
    // 날짜 객체로 변환
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt)
    }));
  } catch (error) {
    console.error('노트 데이터 로드 실패:', error);
    return [];
  }
}

export function getBedNotes(bedId: string): BedNote[] {
  const allNotes = getAllBedNotes()
    .filter(note => note.bedId === bedId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  // 공지사항을 최상단으로 이동하고 나머지는 날짜순으로 정렬
  const announcements = allNotes.filter(note => note.isAnnouncement);
  const regularNotes = allNotes.filter(note => !note.isAnnouncement);
  
  return [...announcements, ...regularNotes];
}

export function updateBedNote(noteId: string, noteData: BedNoteFormData): BedNote | null {
  const notes = getAllBedNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) return null;
  
  const updatedNote = {
    ...notes[noteIndex],
    title: noteData.title,
    content: noteData.content,
    tags: noteData.tags || [],
    isAnnouncement: noteData.isAnnouncement || false,
    updatedAt: new Date()
  };
  
  notes[noteIndex] = updatedNote;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  
  return updatedNote;
}

export function deleteBedNote(noteId: string): boolean {
  const notes = getAllBedNotes();
  const filteredNotes = notes.filter(note => note.id !== noteId);
  
  if (filteredNotes.length === notes.length) return false; // 삭제할 노트가 없음
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNotes));
  return true;
}

// 노트 통계
export function getBedNoteStats(bedId: string) {
  const notes = getBedNotes(bedId);
  const totalNotes = notes.length;
  const recentNotes = notes.slice(0, 2); // 최근 2개
  
  return {
    totalNotes,
    recentNotes,
    lastUpdated: notes.length > 0 ? notes[0].createdAt : null
  };
}

// 태그 관련 유틸리티
export const COMMON_TAGS = [
  '🌱 생장',
  '💧 관수',
  '🌡️ 온도',
  '💡 조명',
  '🌿 수확',
  '🐛 병해',
  '🌱 정식',
  '✂️ 정지',
  '📊 측정',
  '🔧 관리'
];

export function getTagColor(tag: string): string {
  const colorMap: Record<string, string> = {
    '🌱 생장': 'bg-green-100 text-green-900',
    '💧 관수': 'bg-blue-100 text-blue-900',
    '🌡️ 온도': 'bg-red-100 text-red-900',
    '💡 조명': 'bg-yellow-100 text-yellow-900',
    '🌿 수확': 'bg-purple-100 text-purple-900',
    '🐛 병해': 'bg-red-100 text-red-900',
    '🌱 정식': 'bg-green-100 text-green-900',
    '✂️ 정지': 'bg-orange-100 text-orange-900',
    '📊 측정': 'bg-indigo-100 text-indigo-900',
    '🔧 관리': 'bg-gray-100 text-gray-900'
  };
  
  return colorMap[tag] || 'bg-gray-100 text-gray-900';
}

// 공지 노트 관련 유틸리티 함수
export function getBedAnnouncement(bedId: string): BedNote | null {
  const notes = getBedNotes(bedId);
  const announcement = notes.find(note => note.isAnnouncement);
  return announcement || null;
}

export function canCreateAnnouncement(userRole: string): boolean {
  return userRole === 'system_admin' || userRole === 'team_leader';
}

export function hasExistingAnnouncement(bedId: string): boolean {
  return getBedAnnouncement(bedId) !== null;
}

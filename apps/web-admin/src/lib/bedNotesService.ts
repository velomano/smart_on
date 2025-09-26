// 📝 베드 노트 데이터베이스 서비스  
// localStorage bedNotes.ts에서 실제 DB로 전환

import { createSbServer } from './db';
import { BedNote, BedNoteFormData } from './bedNotes';

export class BedNotesService {
  private supabase: ReturnType<typeof createSbServer> | null;

  constructor() {
    this.supabase = createSbServer();
    if (!this.supabase) {
      console.warn('Supabase 연결이 필요합니다. 기능이 제한됩니다.');
    }
  }

  // 📖 특정 베드의 노트 읽기
  async getBedNotes(bedId: string, userId?: string): Promise<BedNote[]> {
    try {
      if (!this.supabase) return [];
      
      let query = this.supabase
        .from('bed_notes')
        .select('*')
        .eq('bed_id', bedId)
        .order('created_at', { ascending: false });

      // 특정 사용자의 노트만 조회할 경우
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: notes, error } = await query;

      if (error) {
        console.error('베드 노트 조회 실패:', error);
        return [];
      }

      return notes?.map(note => ({
        id: note.id,
        bedId: note.bed_id,
        title: note.title,
        content: note.content || '',
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
        authorId: note.author_id,
        authorName: note.author_name,
        tags: note.tags || [],
        isAnnouncement: note.is_announcement || false
      })) || [];

    } catch (error: any) {
      console.error('베드 노트 조회 API 에러:', error);
      return [];
    }
  }

  // 📝 노트 저장/생성
  async saveBedNote(bedId: string, bedName: string, noteData: BedNoteFormData, userId: string, userName: string): Promise<BedNote | null> {
    try {
      // 새로운 공지사항을 저장할 때 기존 공지사항을 일반 노트로 변경
      if (noteData.isAnnouncement) {
        await this.convertExistingAnnouncementToRegular(bedId, userId);
      }

      if (!this.supabase) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return null;
      }

      const { data: newNote, error } = await this.supabase
        .from('bed_notes')
        .insert({
          bed_id: bedId,
          bed_name: bedName,
          user_id: userId,
          title: noteData.title,
          content: noteData.content || '',
          is_announcement: noteData.isAnnouncement || false,
          tags: noteData.tags || [],
          author_id: userId,
          author_name: userName
        })
        .select()
        .single();

      if (error) {
        console.error('베드 노트 저장 실패:', error);
        return null;
      }

      return {
        id: newNote.id,
        bedId: newNote.bed_id,
        title: newNote.title,
        content: newNote.content || '',
        createdAt: new Date(newNote.created_at),
        updatedAt: new Date(newNote.updated_at),
        authorId: newNote.author_id,
        authorName: newNote.author_name,
        tags: newNote.tags || [],
        isAnnouncement: newNote.is_announcement || false
      };

    } catch (error: any) {
      console.error('베드 노트 저장 API 에러:', error);
      return null;
    }
  }

  // ✏️ 노트 수정
  async updateBedNote(noteId: string, noteData: BedNoteFormData, userId: string): Promise<BedNote | null> {
    try {
      // 공지사항으로 변경할 때 기존 공지사항 처리
      if (noteData.isAnnouncement) {
        const noteToUpdate = await this.getBedNoteById(noteId);
        if (noteToUpdate) {
          await this.convertExistingAnnouncementToRegular(noteToUpdate.bedId, userId);
        }
      }

      if (!this.supabase) return null;

      const { data: updatedNote, error } = await this.supabase
        .from('bed_notes')
        .update({
          title: noteData.title,
          content: noteData.content || '',
          is_announcement: noteData.isAnnouncement || false,
          tags: noteData.tags || []
        })
        .eq('id', noteId)
        .eq('user_id', userId) // 본인 노트만 수정 가능
        .select()
        .single();

      if (error) {
        console.error('베드 노트 수정 실패:', error);
        return null;
      }

      return {
        id: updatedNote.id,
        bedId: updatedNote.bed_id,
        title: updatedNote.title,
        content: updatedNote.content || '',
        createdAt: new Date(updatedNote.created_at),
        updatedAt: new Date(updatedNote.updated_at),
        authorId: updatedNote.author_id,
        authorName: updatedNote.author_name,
        tags: updatedNote.tags || [],
        isAnnouncement: updatedNote.is_announcement || false
      };

    } catch (error: any) {
      console.error('베드 노트 수정 API 에러:', error);
      return null;
    }
  }

  // 🗑️ 노트 삭제
  async deleteBedNote(noteId: string, userId: string): Promise<boolean> {
    try {
      if (!this.supabase) return false;

      const { error } = await this.supabase
        .from('bed_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId); // 본인 노트만 삭제 가능

      if (error) {
        console.error('베드 노트 삭제 실패:', error);
        return false;
      }

      return true;

    } catch (error: any) {
      console.error('베드 노트 삭제 API 에러:', error);
      return false;
    }
  }

  // 📊 노트 통계
  async getBedNoteStats(bedId: string, userId?: string): Promise<{ totalNotes: number; recentNotes: BedNote[] }> {
    try {
      const notes = await this.getBedNotes(bedId, userId);
      
      // 최근 노트 5개 제한
      const recentNotes = notes.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      ).slice(0, 5);

      return {
        totalNotes: notes.length,
        recentNotes
      };

    } catch (error: any) {
      console.error('베드 노트 통계 조회 실패:', error);
      return { totalNotes: 0, recentNotes: [] };
    }
  }

  // 📢 베드 공지사항 조회
  async getBedAnnouncement(bedId: string): Promise<BedNote | null> {
    try {
      if (!this.supabase) return null;

      const { data: announcement, error } = await this.supabase
        .from('bed_notes')
        .select('*')
        .eq('bed_id', bedId)
        .eq('is_announcement', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !announcement) {
        return null;
      }

      return {
        id: announcement.id,
        bedId: announcement.bed_id,
        title: announcement.title,
        content: announcement.content || '',
        createdAt: new Date(announcement.created_at),
        updatedAt: new Date(announcement.updated_at),
        authorId: announcement.author_id,
        authorName: announcement.author_name,
        tags: announcement.tags || [],
        isAnnouncement: true
      };

    } catch (error: any) {
      console.error('베드 공지사항 조회 실패:', error);
      return null;
    }
  }

  // 🔧 공지사항 변경 처리 내부 헬퍼
  private async convertExistingAnnouncementToRegular(bedId: string, userId: string): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase
      .from('bed_notes')
      .update({ is_announcement: false })
      .eq('bed_id', bedId)
      .eq('user_id', userId) // 본인 노트만
      .eq('is_announcement', true);

    if (error) {
      console.warn('기존 공지사항을 일반 노트로 변경 실패:', error);
    }
  }

  // 📖 특정 노트 ID로 조회
  private async getBedNoteById(noteId: string): Promise<BedNote | null> {
    try {
      if (!this.supabase) return null;

      const { data: note, error } = await this.supabase
        .from('bed_notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error || !note) {
        return null;
      }

      return {
        id: note.id,
        bedId: note.bed_id,
        title: note.title,
        content: note.content || '',
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
        authorId: note.author_id,
        authorName: note.author_name,
        tags: note.tags || [],
        isAnnouncement: note.is_announcement || false
      };

    } catch (error: any) {
      console.error('노트 단일 조회 실패:', error);
      return null;
    }
  }

  // 🔄 localStorage에서 DB로 마이그레이션
  async migrateFromLocalStorage(userId: string): Promise<{ success: boolean; migratedCount?: number; error?: string }> {
    try {
      if (typeof window === 'undefined') {
        return { success: true };
      }

      const storedNotes = localStorage.getItem('bed_notes');
      if (!storedNotes) {
        return { success: true, migratedCount: 0 };
      }

      const notes: any[] = JSON.parse(storedNotes);
      let migratedCount = 0;

      // 해당 사용자의 노트들만 선택
      const userNotes = notes.filter(note => note.authorId === userId);

      if (!this.supabase) {
        return { success: false, error: 'Supabase 연결이 필요합니다.' };
      }

      for (const note of userNotes) {
        try {
          await this.supabase
            .from('bed_notes')
            .insert({
              bed_id: note.bedId,
              user_id: userId,
              title: note.title,
              content: note.content || '',
              is_announcement: note.isAnnouncement || false,
              tags: note.tags || [],
              author_id: userId,
              author_name: note.authorName
            });

          migratedCount++;
        } catch (error: any) {
          console.warn('노트 마이그레이션 실패:', note.title, error.message);
        }
      }

      // 성공한 경우 localStorage에서 제거 (선택사항)
      if (migratedCount > 0) {
        localStorage.removeItem('bed_notes');
      }

      return { success: true, migratedCount };

    } catch (error: any) {
      console.error('베드 노트 마이그레이션 API 에러:', error);
      return { success: false, error: error.message };
    }
  }
}

// 🌐 전역 서비스 인스턴스
export const bedNotesService = new BedNotesService();
export default bedNotesService;

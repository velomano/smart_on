'use client';

import React, { useState, useEffect } from 'react';
import { BedNote, BedNoteFormData, saveBedNote, getBedNotes, updateBedNote, deleteBedNote, COMMON_TAGS, getTagColor, canCreateAnnouncement, hasExistingAnnouncement } from '../lib/bedNotes';
import { getCurrentUser } from '../../lib/auth';

interface BedNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  bedId: string;
  bedName: string;
  authorId: string;
  authorName: string;
}

interface NoteFormProps {
  note?: BedNote;
  onSubmit: (data: BedNoteFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

function NoteForm({ note, onSubmit, onCancel, isEditing = false }: NoteFormProps) {
  const [formData, setFormData] = useState<BedNoteFormData>({
    title: note?.title || '',
    content: note?.content || '',
    tags: note?.tags || [],
    isAnnouncement: note?.isAnnouncement || false
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      } finally {
        setCheckingUser(false);
      }
    };
    checkUser();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    onSubmit(formData);
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isEditing ? '노트 수정' : '새 노트 작성'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
            placeholder="예: 토마토 생장 관찰"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
            placeholder="생육 상황, 관리 내용, 특이사항 등을 기록하세요..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            태그 (선택사항)
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  formData.tags.includes(tag)
                    ? getTagColor(tag)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 공지 체크박스 - 권한이 있는 사용자만 표시 */}
        {!checkingUser && currentUser && canCreateAnnouncement(currentUser.role) && (
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input
              type="checkbox"
              id="isAnnouncement"
              checked={formData.isAnnouncement || false}
              onChange={(e) => setFormData(prev => ({ ...prev, isAnnouncement: e.target.checked }))}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-yellow-300 rounded"
            />
            <label htmlFor="isAnnouncement" className="text-sm font-medium text-yellow-800 flex items-center">
              <span className="mr-2">📢</span>
              공지사항으로 설정 (베드 최상단에 표시)
            </label>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {isEditing ? '수정' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BedNoteModal({ isOpen, onClose, bedId, bedName, authorId, authorName }: BedNoteModalProps) {
  const [notes, setNotes] = useState<BedNote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<BedNote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, bedId]);

  const loadNotes = () => {
    const bedNotes = getBedNotes(bedId);
    setNotes(bedNotes);
  };

  const handleCreateNote = async (data: BedNoteFormData) => {
    setLoading(true);
    try {
      saveBedNote(bedId, data, authorId, authorName);
      loadNotes();
      setShowForm(false);
    } catch (error) {
      console.error('노트 저장 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (data: BedNoteFormData) => {
    if (!editingNote) return;
    
    setLoading(true);
    try {
      updateBedNote(editingNote.id, data);
      loadNotes();
      setEditingNote(null);
    } catch (error) {
      console.error('노트 수정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('정말 이 노트를 삭제하시겠습니까?')) return;
    
    setLoading(true);
    try {
      deleteBedNote(noteId);
      loadNotes();
    } catch (error) {
      console.error('노트 삭제 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              📝 {bedName} 생육 노트
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              총 {notes.length}개의 노트
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {showForm || editingNote ? (
            <NoteForm
              note={editingNote || undefined}
              onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
              onCancel={() => {
                setShowForm(false);
                setEditingNote(null);
              }}
              isEditing={!!editingNote}
            />
          ) : (
            <>
              {/* 새 노트 버튼 */}
              <div className="mb-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>새 노트 작성</span>
                </button>
              </div>

              {/* 노트 목록 */}
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      아직 노트가 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      첫 번째 생육 노트를 작성해보세요
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      노트 작성하기
                    </button>
                  </div>
                ) : (
                  notes.map(note => (
                    <div 
                      key={note.id} 
                      className={`rounded-lg p-4 border ${
                        note.isAnnouncement 
                          ? 'bg-yellow-50 border-yellow-300 border-2' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {note.title}
                            </h4>
                            {note.isAnnouncement && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                📢 공지
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span>👤 {note.authorName}</span>
                            <span>📅 {note.createdAt.toLocaleDateString('ko-KR')}</span>
                            {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                              <span>✏️ 수정됨</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingNote(note)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {note.tags.map(tag => (
                            <span
                              key={tag}
                              className={`px-2 py-1 rounded-full text-xs ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, getCurrentUser } from '../lib/auth';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
    phone: '',
    preferred_team: ''
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.is_approved && currentUser.is_active) {
        setIsAuthenticated(true);
        router.push('/');
      } else {
        setIsAuthenticated(false);
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const result = await signIn({
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          // 사용자 정보 확인
          const user = await getCurrentUser();
          if (user && user.is_approved) {
            router.push('/');
          } else {
            setError('계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.');
          }
        } else {
          setError(result.error || '로그인에 실패했습니다.');
        }
      } else {
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          company: formData.company,
          phone: formData.phone,
          preferred_team: formData.preferred_team
        });

        if (result.success) {
          setError('');
          alert('회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
          setIsLogin(true);
          setFormData({
            email: '',
            password: '',
            name: '',
            company: '',
            phone: '',
            preferred_team: ''
          });
        } else {
          setError(result.error || '회원가입에 실패했습니다.');
        }
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 로딩 중이거나 이미 인증된 경우 처리
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <span className="text-3xl">🌱</span>
          </div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            TeraHub
          </h2>
          <p className="text-base text-gray-600 font-semibold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
            {isLogin ? '로그인' : '회원가입'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 p-8">
          <style jsx>{`
            input, select {
              color: #000000 !important;
            }
            input::placeholder, select::placeholder {
              color: #6b7280 !important;
            }
          `}</style>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    이름 *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black !important"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                    회사명
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black !important"
                    placeholder="스마트팜 주식회사"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    연락처
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black !important"
                    placeholder="010-1234-5678"
                  />
                </div>

                <div>
                  <label htmlFor="preferred_team" className="block text-sm font-semibold text-gray-700 mb-2">
                    조 선택 *
                  </label>
                  <select
                    id="preferred_team"
                    name="preferred_team"
                    required={!isLogin}
                    value={formData.preferred_team}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black !important"
                  >
                    <option value="">조를 선택하세요</option>
                    <option value="1조">1조</option>
                    <option value="2조">2조</option>
                    <option value="3조">3조</option>
                    <option value="admin_assign">관리자 배정</option>
                  </select>
                </div>
              </>
            )}

            <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  이메일 또는 사용자 ID *
                </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="test1 또는 test1@test.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                전체 이메일 또는 @ 앞부분만 입력하세요 (예: test1, test2, test3...)
              </p>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 *
                </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  처리 중...
                </div>
              ) : (
                isLogin ? '로그인' : '회원가입'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  name: '',
                  company: '',
                  phone: '',
                  preferred_team: ''
                });
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
            >
              {isLogin ? '회원가입하기' : '로그인하기'}
            </button>
          </div>

          {!isLogin && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-700">
                      <strong>회원가입 안내:</strong><br />
                      회원가입 후 관리자 승인이 필요합니다. 승인 완료 후 로그인할 수 있습니다.
                    </p>
            </div>
          )}

          {isLogin && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-700">
                      <strong>테스트 계정 (간편 로그인):</strong><br />
                      관리자: test1 / 123456<br />
                   1농장 농장장: test2 / 123456<br />
                   1농장 팀원: test3 / 123456<br />
                   2농장 농장장: test4 / 123456<br />
                   2농장 팀원: test5 / 123456<br />
                   3농장 농장장: test6 / 123456<br />
                   3농장 팀원: test7 / 123456<br />
                      <span className="text-xs text-gray-600 mt-2 block">
                        💡 @ 앞부분만 입력하거나 전체 이메일을 입력하세요
                      </span>
                    </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

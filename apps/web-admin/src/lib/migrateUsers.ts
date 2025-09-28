// localStorage 사용자들을 Supabase로 마이그레이션하는 스크립트
import { getSupabaseClient } from './supabase';

interface LocalStorageUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenant_id?: string;
  team_id?: string;
  team_name?: string;
  preferred_team?: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  company?: string;
  phone?: string;
}

export const migrateUsersToSupabase = async () => {
  try {
    // localStorage에서 사용자 데이터 로드
    const storedUsers = localStorage.getItem('mock_users');
    if (!storedUsers) {
      console.log('localStorage에 사용자 데이터가 없습니다.');
      return;
    }

    const users: LocalStorageUser[] = JSON.parse(storedUsers);
    console.log(`마이그레이션할 사용자 수: ${users.length}`);

    const supabase = getSupabaseClient();
    const migratedUsers = [];
    const failedUsers = [];

    for (const user of users) {
      try {
        console.log(`사용자 마이그레이션 시작: ${user.email}`);

        // Supabase Auth에 사용자 등록
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: 'defaultPassword123!', // 기본 비밀번호
          options: {
            data: {
              name: user.name,
              company: user.company,
              phone: user.phone,
              preferred_team: user.preferred_team
            }
          }
        });

        if (authError) {
          console.error(`사용자 ${user.email} Auth 등록 실패:`, authError);
          failedUsers.push({ user, error: authError.message });
          continue;
        }

        if (authData.user) {
          // users 테이블에 사용자 정보 저장
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: user.email,
              name: user.name,
              company: user.company,
              phone: user.phone,
              is_approved: user.is_approved,
              is_active: user.is_active
            });

          if (insertError) {
            console.error(`사용자 ${user.email} 테이블 저장 실패:`, insertError);
            failedUsers.push({ user, error: insertError.message });
            continue;
          }

          // memberships 테이블에 권한 정보 저장
          if (user.tenant_id) {
            const { error: membershipError } = await supabase
              .from('memberships')
              .insert({
                user_id: authData.user.id,
                tenant_id: user.tenant_id,
                role: user.role
              });

            if (membershipError) {
              console.error(`사용자 ${user.email} 멤버십 저장 실패:`, membershipError);
            }
          }

          migratedUsers.push({
            email: user.email,
            name: user.name,
            role: user.role,
            supabaseId: authData.user.id
          });

          console.log(`사용자 ${user.email} 마이그레이션 완료`);
        }
      } catch (error) {
        console.error(`사용자 ${user.email} 마이그레이션 중 오류:`, error);
        failedUsers.push({ user, error: String(error) });
      }
    }

    console.log('=== 마이그레이션 결과 ===');
    console.log(`성공: ${migratedUsers.length}명`);
    console.log(`실패: ${failedUsers.length}명`);
    
    if (migratedUsers.length > 0) {
      console.log('성공한 사용자들:', migratedUsers);
    }
    
    if (failedUsers.length > 0) {
      console.log('실패한 사용자들:', failedUsers);
    }

    return {
      success: true,
      migrated: migratedUsers,
      failed: failedUsers
    };

  } catch (error) {
    console.error('마이그레이션 중 오류:', error);
    return {
      success: false,
      error: String(error)
    };
  }
};

// 브라우저 콘솔에서 실행할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  (window as any).migrateUsersToSupabase = migrateUsersToSupabase;
}


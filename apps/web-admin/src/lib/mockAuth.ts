// 임시 Mock 인증 시스템 (개발용)
// 실제 Supabase Auth 설정이 완료되면 이 파일을 삭제하고 auth.ts를 사용하세요

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: 'system_admin' | 'team_leader' | 'team_member';
  tenant_id?: string;
  team_id?: string; // 배정된 조 ID
  team_name?: string; // 배정된 조 이름
  preferred_team?: string; // 선호 조
  is_approved?: boolean;
  is_active?: boolean; // 활성/비활성 상태
  created_at?: string; // 생성일
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
  preferred_team?: string; // 조 선호도
}

export interface SignInData {
  email: string;
  password: string;
}

// 기본 사용자 데이터 (영구 저장)
const defaultUsers: AuthUser[] = [
  {
    id: 'mock-admin-001',
    email: 'admin@smartfarm.com',
    name: '시스템 관리자',
    role: 'system_admin',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-operator-001',
    email: 'sky3rain7@gmail.com',
    name: '최종 관리자',
    role: 'system_admin',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-user-001',
    email: 'user@smartfarm.com',
    name: '1조 조원',
    role: 'team_member',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-001',
    team_name: '1조',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-test-001',
    email: 'test1@test.com',
    name: '테스트 관리자',
    role: 'system_admin',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-test-002',
    email: 'test2@test.com',
    name: '테스트 조장',
    role: 'team_leader',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-001',
    team_name: '1조',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-test-003',
    email: 'test3@test.com',
    name: '테스트 조원',
    role: 'team_member',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-001',
    team_name: '1조',
    is_approved: true,
    is_active: true
  }
];

// 로컬 스토리지에서 사용자 데이터 로드
const loadUsersFromStorage = (): AuthUser[] => {
  if (typeof window === 'undefined') return defaultUsers;
  
  try {
    const stored = localStorage.getItem('mock_users');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // 기존 사용자 데이터에 is_active와 is_approved 속성 추가
        return parsed.map(user => ({
          ...user,
          is_active: user.is_active !== undefined ? user.is_active : true,
          is_approved: user.is_approved !== undefined ? user.is_approved : true
        }));
      }
    }
    } catch {
    console.error('Error loading users from storage');
  }
  
  return defaultUsers;
};

// 사용자 데이터를 로컬 스토리지에 저장
const saveUsersToStorage = (users: AuthUser[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('mock_users', JSON.stringify(users));
    } catch {
    console.error('Error saving users to storage');
  }
};

// 동적으로 사용자 데이터 로드
let mockUsers = loadUsersFromStorage();

// sky3rain7@gmail.com 계정의 조 정보 강제 제거
const cleanUserData = (users: AuthUser[]): AuthUser[] => {
  return users.map(user => {
    if (user.email === 'sky3rain7@gmail.com') {
      return {
        ...user,
        team_id: undefined,
        team_name: undefined,
        role: 'system_admin'
      };
    }
    return user;
  });
};

// 사용자 데이터 정리
mockUsers = cleanUserData(mockUsers);
saveUsersToStorage(mockUsers);

// Mock 비밀번호 (실제로는 해시화되어야 함)
const mockPasswords: { [key: string]: string } = {
  'admin@smartfarm.com': '123456',
  'sky3rain7@gmail.com': 'sky1005',
  'user@smartfarm.com': '123456'
};

// 로그인
export const signIn = async (data: SignInData) => {
  // 실제 환경에서는 네트워크 지연을 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500));

  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();
  
  const user = mockUsers.find(u => u.email === data.email);
  const password = mockPasswords[data.email];

  if (!user || password !== data.password) {
    return { success: false, error: 'Invalid login credentials' };
  }

  if (!user.is_active) {
    return { success: false, error: '계정이 비활성화되었습니다. 관리자에게 문의하세요.' };
  }

  // sky3rain7@gmail.com 계정의 조 정보 제거
  const cleanUser = user.email === 'sky3rain7@gmail.com' ? {
    ...user,
    team_id: undefined,
    team_name: undefined,
    role: 'system_admin'
  } : user;

  // 로컬 스토리지에 사용자 정보 저장
  localStorage.setItem('mock_user', JSON.stringify(cleanUser));
  
  return { success: true, user: cleanUser };
};

// 회원가입
export const signUp = async (data: SignUpData) => {
  await new Promise(resolve => setTimeout(resolve, 500));

  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();

  // 이미 존재하는 이메일인지 확인
  const existingUser = mockUsers.find(u => u.email === data.email);
  if (existingUser) {
    return { success: false, error: '이미 존재하는 이메일입니다.' };
  }

  // 새 사용자 생성 (승인 대기 상태)
  const newUser: AuthUser = {
    id: `mock-user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role: 'team_member', // 기본적으로 조원으로 설정
    preferred_team: data.preferred_team,
    is_approved: false,
    is_active: true
  };

  // 사용자 추가 및 영구 저장
  mockUsers.push(newUser);
  mockPasswords[data.email] = data.password;
  saveUsersToStorage(mockUsers);

  return { success: true, user: newUser };
};

// 로그아웃
export const signOut = async () => {
  try {
    localStorage.removeItem('mock_user');
    // 페이지 새로고침을 통해 상태 초기화
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return { success: true };
    } catch {
    console.error('Logout error');
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  await new Promise(resolve => setTimeout(resolve, 100));

  const storedUser = localStorage.getItem('mock_user');
  if (!storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser);
    // is_active 속성이 없으면 기본값 true로 설정
    if (user.is_active === undefined) {
      user.is_active = true;
    }
    // is_approved 속성이 없으면 기본값 true로 설정
    if (user.is_approved === undefined) {
      user.is_approved = true;
    }
    return user;
  } catch {
    return null;
  }
};

// 승인 대기 중인 사용자 목록 가져오기 (관리자용)
export const getPendingUsers = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();
  const pendingUsers = mockUsers.filter(u => !u.is_approved).map(user => ({
    ...user,
    created_at: user.created_at || new Date().toISOString()
  }));
  return { success: true, users: pendingUsers };
};

// 사용자 승인 (관리자용)
export const approveUser = async (userId: string, role: 'system_admin' | 'team_leader' | 'team_member', tenantId?: string, teamId?: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));

  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();
  
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    user.is_approved = true;
    user.role = role;
    user.is_active = true;
    if (tenantId) {
      user.tenant_id = tenantId;
    }
    if (teamId) {
      user.team_id = teamId;
      // 조 이름 설정
      const teamNames: { [key: string]: string } = {
        'team-001': '1조',
        'team-002': '2조',
        'team-003': '3조'
      };
      user.team_name = teamNames[teamId] || teamId;
    }
    
    // 변경사항 영구 저장
    saveUsersToStorage(mockUsers);
  }

  return { success: true };
};

// 사용자 거부 (관리자용)
export const rejectUser = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));

  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();
  
  const index = mockUsers.findIndex(u => u.id === userId);
  if (index > -1) {
    mockUsers.splice(index, 1);
    
    // 변경사항 영구 저장
    saveUsersToStorage(mockUsers);
  }

  return { success: true };
};

// 테넌트 목록 가져오기 (관리자용)
export const getTenants = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    success: true,
    tenants: [
      { id: '00000000-0000-0000-0000-000000000001', name: '스마트팜 시스템', created_at: new Date().toISOString() }
    ]
  };
};

// 조 목록 가져오기 (관리자용)
export const getTeams = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    success: true,
    teams: [
      { id: 'team-001', name: '1조', created_at: new Date().toISOString() },
      { id: 'team-002', name: '2조', created_at: new Date().toISOString() },
      { id: 'team-003', name: '3조', created_at: new Date().toISOString() }
    ]
  };
};

// 승인된 사용자 목록 가져오기 (관리자용)
export const getApprovedUsers = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();
  const approvedUsers = mockUsers.filter(u => u.is_approved);
  
  // sky3rain7@gmail.com 계정의 조 정보 강제 제거
  const cleanedUsers = approvedUsers.map(user => {
    if (user.email === 'sky3rain7@gmail.com') {
      return {
        ...user,
        team_id: undefined,
        team_name: undefined,
        role: 'system_admin',
        is_active: user.is_active ?? true,
        created_at: user.created_at || new Date().toISOString()
      };
    }
    return {
      ...user,
      is_active: user.is_active ?? true,
      created_at: user.created_at || new Date().toISOString()
    };
  });
  
  return { success: true, users: cleanedUsers };
};

// 사용자 정보 업데이트 (관리자용)
export const updateUser = async (userId: string, updates: Partial<AuthUser>) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    mockUsers = loadUsersFromStorage();
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // sky3rain7@gmail.com 계정의 조 정보 강제 제거
    if (mockUsers[userIndex].email === 'sky3rain7@gmail.com') {
      updates.team_id = undefined;
      updates.team_name = undefined;
      updates.role = 'system_admin';
    }
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
    saveUsersToStorage(mockUsers);
    
    return { success: true };
    } catch {
    return { success: false, error: '사용자 업데이트에 실패했습니다.' };
  }
};

// 사용자 삭제 (관리자용)
export const deleteUser = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    mockUsers = loadUsersFromStorage();
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // sky3rain7@gmail.com 계정은 삭제 불가
    if (mockUsers[userIndex].email === 'sky3rain7@gmail.com') {
      return { success: false, error: '최종 관리자 계정은 삭제할 수 없습니다.' };
    }
    
    mockUsers.splice(userIndex, 1);
    saveUsersToStorage(mockUsers);
    
    return { success: true };
    } catch {
    return { success: false, error: '사용자 삭제에 실패했습니다.' };
  }
};

// 하이브리드 인증 시스템 (개발/운영 환경 지원)
// 개발 환경: 미리 생성된 테스트 계정 사용
// 운영 환경: Supabase Auth + 승인 시스템 사용

// 환경 설정 - 배포 환경에서도 Mock 인증 사용
const isDevelopment = process.env.NODE_ENV === 'development';
const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

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
    name: '1농장 팀원',
    role: 'team_member',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-001',
    team_name: '1농장',
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
    name: '테스트 농장장',
    role: 'team_leader',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-001',
    team_name: '1농장',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-test-003',
    email: 'test3@test.com',
    name: '테스트 팀원',
    role: 'team_member',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-001',
    team_name: '1농장',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-test-004',
    email: 'test4@test.com',
    name: '2농장 농장장',
    role: 'team_leader',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-002',
    team_name: '2농장',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-test-005',
    email: 'test5@test.com',
    name: '2농장 팀원',
    role: 'team_member',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-002',
    team_name: '2농장',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-test-006',
    email: 'test6@test.com',
    name: '3농장 농장장',
    role: 'team_leader',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-003',
    team_name: '3농장',
    is_approved: true,
    is_active: true
  },
  {
    id: 'mock-test-007',
    email: 'test7@test.com',
    name: '3농장 팀원',
    role: 'team_member',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    team_id: 'team-003',
    team_name: '3농장',
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
        const loadedUsers = parsed.map(user => ({
          ...user,
          is_active: user.is_active !== undefined ? user.is_active : true,
          is_approved: user.is_approved !== undefined ? user.is_approved : true
        }));
        console.log('로컬 스토리지에서 로드된 사용자들:', loadedUsers);
        return loadedUsers;
      }
    }
    } catch {
    console.error('Error loading users from storage');
  }
  
  console.log('기본 사용자 데이터 사용:', defaultUsers);
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

// 디버깅을 위해 초기 사용자 데이터 확인
console.log('초기 mockUsers:', mockUsers);

// 로컬 스토리지 강제 초기화 (개발용)
if (typeof window !== 'undefined') {
  localStorage.removeItem('mock_users');
  mockUsers = cleanUserData(defaultUsers);
  saveUsersToStorage(mockUsers);
  console.log('로컬 스토리지 초기화 후 mockUsers:', mockUsers);
}

// 로컬 스토리지 초기화 함수 (디버깅용)
export const resetMockUsers = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mock_users');
    mockUsers = cleanUserData(defaultUsers);
    saveUsersToStorage(mockUsers);
    console.log('Mock 사용자 데이터 초기화 완료:', mockUsers);
  }
};

// Mock 비밀번호 (실제로는 해시화되어야 함)
const mockPasswords: { [key: string]: string } = {
  'admin@smartfarm.com': '123456',
  'sky3rain7@gmail.com': 'sky1005',
  'user@smartfarm.com': '123456',
  'test1@test.com': '123456',
  'test2@test.com': '123456',
  'test3@test.com': '123456',
  'test4@test.com': '123456',
  'test5@test.com': '123456',
  'test6@test.com': '123456',
  'test7@test.com': '123456'
};

// 환경별 인증 함수 선택
const getAuthFunctions = () => {
  if (useMockAuth) {
    return {
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getCurrentUser: mockGetCurrentUser,
      getPendingUsers: mockGetPendingUsers,
      approveUser: mockApproveUser,
      rejectUser: mockRejectUser,
      getTenants: mockGetTenants,
      getTeams: mockGetTeams,
      getApprovedUsers: mockGetApprovedUsers,
      updateUser: mockUpdateUser,
      deleteUser: mockDeleteUser
    };
  } else {
    // Mock 인증만 사용 (Supabase 연결 시에도)
    return {
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getCurrentUser: mockGetCurrentUser,
      getPendingUsers: mockGetPendingUsers,
      approveUser: mockApproveUser,
      rejectUser: mockRejectUser,
      getTenants: mockGetTenants,
      getTeams: mockGetTeams,
      getApprovedUsers: mockGetApprovedUsers,
      updateUser: mockUpdateUser,
      deleteUser: mockDeleteUser
    };
  }
};

// Mock 인증 함수들
const mockSignIn = async (data: SignInData) => {
  // 실제 환경에서는 네트워크 지연을 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500));

  // 배포 환경에서 Mock 데이터 초기화 확인
  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem('mock_users');
    if (!storedUsers) {
      // Mock 데이터가 없으면 초기화
      localStorage.setItem('mock_users', JSON.stringify(mockUsers));
      localStorage.setItem('mock_passwords', JSON.stringify(mockPasswords));
    }
  }

  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();
  
  // 이메일 형식 처리: @가 없으면 @test.com을 추가
  let emailToSearch = data.email;
  if (!emailToSearch.includes('@')) {
    emailToSearch = `${data.email}@test.com`;
  }
  
  const user = mockUsers.find(u => u.email === emailToSearch);
  const password = mockPasswords[emailToSearch];

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

// Mock 회원가입
const mockSignUp = async (data: SignUpData) => {
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
    role: 'team_member', // 기본적으로 팀원으로 설정
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

// Mock 로그아웃
const mockSignOut = async () => {
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

// Mock 현재 사용자 정보 가져오기
const mockGetCurrentUser = async (): Promise<AuthUser | null> => {
  await new Promise(resolve => setTimeout(resolve, 100));

  const storedUser = localStorage.getItem('mock_user');
  if (!storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser);
    
    // test7@test.com 계정의 경우 올바른 데이터로 강제 업데이트
    if (user.email === 'test7@test.com') {
      const correctUser = {
        ...user,
        name: '3농장 팀원',
        team_id: 'team-003',
        team_name: '3농장',
        role: 'team_member'
      };
      localStorage.setItem('mock_user', JSON.stringify(correctUser));
      return correctUser;
    }
    
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

// Mock 승인 대기 중인 사용자 목록 가져오기 (관리자용)
const mockGetPendingUsers = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();
  const pendingUsers = mockUsers.filter(u => !u.is_approved).map(user => ({
    ...user,
    created_at: user.created_at || new Date().toISOString()
  }));
  return { success: true, users: pendingUsers };
};

// Mock 사용자 승인 (관리자용)
const mockApproveUser = async (userId: string, role: 'system_admin' | 'team_leader' | 'team_member', tenantId?: string, teamId?: string) => {
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

// Mock 사용자 거부 (관리자용)
const mockRejectUser = async (userId: string) => {
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

// Mock 테넌트 목록 가져오기 (관리자용)
const mockGetTenants = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    success: true,
    tenants: [
      { id: '00000000-0000-0000-0000-000000000001', name: '스마트팜 시스템', created_at: new Date().toISOString() }
    ]
  };
};

// Mock 조 목록 가져오기 (관리자용)
const mockGetTeams = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    success: true,
    teams: [
      { id: 'team-001', name: '1농장', created_at: new Date().toISOString() },
      { id: 'team-002', name: '2농장', created_at: new Date().toISOString() },
      { id: 'team-003', name: '3농장', created_at: new Date().toISOString() }
    ],
    devices: [
      {
        id: 'device-1',
        farm_id: 'team-001',
        type: 'sensor_gateway',
        status: { online: true },
        meta: {
          location: '1농장-베드1',
          crop_name: '토마토',
          growing_method: '담액식'
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'device-2',
        farm_id: 'team-001',
        type: 'sensor_gateway',
        status: { online: true },
        meta: {
          location: '1농장-베드2',
          crop_name: '상추',
          growing_method: 'NFT식'
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'device-3',
        farm_id: 'team-002',
        type: 'sensor_gateway',
        status: { online: false },
        meta: {
          location: '2농장-베드1',
          crop_name: '딸기',
          growing_method: '점적식'
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'device-4',
        farm_id: 'team-002',
        type: 'sensor_gateway',
        status: { online: true },
        meta: {
          location: '2농장-베드2',
          crop_name: '오이',
          growing_method: '분무식'
        },
        created_at: new Date().toISOString()
      }
    ],
    sensors: [
      { id: 'sensor-1', device_id: 'device-1', type: 'temperature', unit: '°C', created_at: new Date().toISOString() },
      { id: 'sensor-2', device_id: 'device-1', type: 'humidity', unit: '%', created_at: new Date().toISOString() },
      { id: 'sensor-3', device_id: 'device-2', type: 'temperature', unit: '°C', created_at: new Date().toISOString() },
      { id: 'sensor-4', device_id: 'device-2', type: 'humidity', unit: '%', created_at: new Date().toISOString() },
      { id: 'sensor-5', device_id: 'device-3', type: 'temperature', unit: '°C', created_at: new Date().toISOString() },
      { id: 'sensor-6', device_id: 'device-4', type: 'temperature', unit: '°C', created_at: new Date().toISOString() },
      { id: 'sensor-7', device_id: 'device-4', type: 'humidity', unit: '%', created_at: new Date().toISOString() }
    ],
    sensorReadings: [
      { id: 'reading-1', sensor_id: 'sensor-1', value: 25.5, unit: '°C', ts: new Date().toISOString() },
      { id: 'reading-2', sensor_id: 'sensor-2', value: 65.2, unit: '%', ts: new Date().toISOString() },
      { id: 'reading-3', sensor_id: 'sensor-3', value: 24.8, unit: '°C', ts: new Date().toISOString() },
      { id: 'reading-4', sensor_id: 'sensor-4', value: 68.1, unit: '%', ts: new Date().toISOString() },
      { id: 'reading-5', sensor_id: 'sensor-5', value: 23.2, unit: '°C', ts: new Date().toISOString() },
      { id: 'reading-6', sensor_id: 'sensor-6', value: 26.1, unit: '°C', ts: new Date().toISOString() },
      { id: 'reading-7', sensor_id: 'sensor-7', value: 62.8, unit: '%', ts: new Date().toISOString() }
    ]
  };
};

// Mock 승인된 사용자 목록 가져오기 (관리자용)
const mockGetApprovedUsers = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 현재 사용자 데이터 다시 로드
  mockUsers = loadUsersFromStorage();
  const approvedUsers = mockUsers.filter(u => u.is_approved);
  
  console.log('Mock 승인된 사용자들 (필터링 전):', approvedUsers);
  
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
  
  console.log('Mock 승인된 사용자들 (정리 후):', cleanedUsers);
  
  return { success: true, users: cleanedUsers };
};

// Mock 사용자 정보 업데이트 (관리자용)
const mockUpdateUser = async (userId: string, updates: Partial<AuthUser>) => {
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

// Mock 사용자 삭제 (관리자용)
const mockDeleteUser = async (userId: string) => {
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

// 환경별 인증 함수 export
const authFunctions = getAuthFunctions();

export const signIn = authFunctions.signIn;
// 사용자 설정 관리 함수들
const getUserSettingsInternal = (userId: string) => {
  if (typeof window === 'undefined') return {};
  const settings = localStorage.getItem(`user_settings_${userId}`);
  return settings ? JSON.parse(settings) : {
    showTeamBedsOnDashboard: true,
    showAllBedsInBedManagement: false
  };
};

const saveUserSettings = (userId: string, settings: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`user_settings_${userId}`, JSON.stringify(settings));
};

export const getUserSettings = (userId: string) => {
  return getUserSettingsInternal(userId);
};

export const updateUserSettings = (userId: string, settings: any) => {
  const currentSettings = getUserSettingsInternal(userId);
  const newSettings = { ...currentSettings, ...settings };
  saveUserSettings(userId, newSettings);
  return newSettings;
};

export const signUp = authFunctions.signUp;
export const signOut = authFunctions.signOut;
export const getCurrentUser = authFunctions.getCurrentUser;
export const getPendingUsers = authFunctions.getPendingUsers;
export const approveUser = authFunctions.approveUser;
export const rejectUser = authFunctions.rejectUser;
export const getTenants = authFunctions.getTenants;
export const getTeams = authFunctions.getTeams;
export const getApprovedUsers = authFunctions.getApprovedUsers;
export const updateUser = authFunctions.updateUser;
export const deleteUser = authFunctions.deleteUser;

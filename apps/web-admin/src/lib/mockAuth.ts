// Mock Authentication System
// This replaces Supabase authentication when the service is unavailable

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: 'system_admin' | 'team_leader' | 'team_member';
  tenant_id?: string;
  team_id?: string;
  team_name?: string;
  preferred_team?: string;
  is_approved?: boolean;
  is_active?: boolean;
  created_at?: string;
  company?: string;
  phone?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
  preferred_team?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Mock users data
const mockUsers: AuthUser[] = [
  {
    id: 'mock-user-001',
    email: 'admin@smartfarm.com',
    name: '시스템 관리자',
    role: 'system_admin',
    tenant_id: 'mock-tenant-001',
    is_approved: true,
    is_active: true,
    created_at: new Date().toISOString(),
    company: '스마트팜',
    phone: '010-0000-0000'
  },
  {
    id: 'mock-user-002',
    email: 'leader@smartfarm.com',
    name: '농장장',
    role: 'team_leader',
    tenant_id: 'mock-tenant-001',
    team_id: 'mock-team-001',
    team_name: '1농장',
    is_approved: true,
    is_active: true,
    created_at: new Date().toISOString(),
    company: '스마트팜',
    phone: '010-0000-0001'
  },
  {
    id: 'mock-user-003',
    email: 'member@smartfarm.com',
    name: '팀원',
    role: 'team_member',
    tenant_id: 'mock-tenant-001',
    team_id: 'mock-team-001',
    team_name: '1농장',
    is_approved: true,
    is_active: true,
    created_at: new Date().toISOString(),
    company: '스마트팜',
    phone: '010-0000-0002'
  },
  {
    id: 'mock-user-004',
    email: 'sky3rain7@gmail.com',
    name: '테스트 사용자',
    role: 'system_admin',
    tenant_id: 'mock-tenant-001',
    is_approved: true,
    is_active: true,
    created_at: new Date().toISOString(),
    company: '개발자',
    phone: '010-0000-0003'
  }
];

// Mock authentication state
let currentUser: AuthUser | null = null;

// Mock sign in
export const signIn = async (data: SignInData) => {
  try {
    console.log('Mock Auth: Sign in attempt for', data.email);
    
    // Find user by email
    const user = mockUsers.find(u => u.email === data.email);
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    if (!user.is_approved || !user.is_active) {
      return { success: false, error: '승인되지 않은 사용자이거나 비활성화된 계정입니다.' };
    }
    
    // Set current user
    currentUser = user;
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_current_user', JSON.stringify(user));
    }
    
    console.log('Mock Auth: Sign in successful for', user.name);
    return { success: true, user };
  } catch (error: any) {
    console.error('Mock Auth: Sign in error', error);
    return { success: false, error: error.message };
  }
};

// Mock get current user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    // Return current user if available
    if (currentUser) {
      return currentUser;
    }
    
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_current_user');
      if (stored) {
        const user = JSON.parse(stored);
        currentUser = user;
        return user;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('Mock Auth: Get current user error', error);
    return null;
  }
};

// Mock sign out
export const signOut = async () => {
  try {
    console.log('Mock Auth: Sign out');
    
    // Clear current user
    currentUser = null;
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_current_user');
    }
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Mock Auth: Sign out error', error);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
};

// Mock sign up
export const signUp = async (data: SignUpData) => {
  try {
    console.log('Mock Auth: Sign up attempt for', data.email);
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === data.email);
    if (existingUser) {
      return { success: false, error: '이미 등록된 이메일입니다.' };
    }
    
    // Create new user
    const newUser: AuthUser = {
      id: `mock-user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: 'team_member',
      tenant_id: 'mock-tenant-001',
      is_approved: false, // Requires approval
      is_active: true,
      created_at: new Date().toISOString(),
      company: data.company,
      phone: data.phone,
      preferred_team: data.preferred_team
    };
    
    // Add to mock users
    mockUsers.push(newUser);
    
    console.log('Mock Auth: Sign up successful for', newUser.name);
    return { success: true, message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.' };
  } catch (error: any) {
    console.error('Mock Auth: Sign up error', error);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
};

// Mock get pending users
export const getPendingUsers = async () => {
  try {
    return mockUsers.filter(user => !user.is_approved && user.is_active);
  } catch (error) {
    console.error('Mock Auth: Get pending users error', error);
    return [];
  }
};

// Mock approve user
export const approveUser = async (userId: string) => {
  try {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.is_approved = true;
      console.log('Mock Auth: User approved', user.name);
      return { success: true };
    }
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  } catch (error: any) {
    console.error('Mock Auth: Approve user error', error);
    return { success: false, error: '사용자 승인 중 오류가 발생했습니다.' };
  }
};

// Mock reject user
export const rejectUser = async (userId: string) => {
  try {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.is_active = false;
      console.log('Mock Auth: User rejected', user.name);
      return { success: true };
    }
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  } catch (error: any) {
    console.error('Mock Auth: Reject user error', error);
    return { success: false, error: '사용자 거부 중 오류가 발생했습니다.' };
  }
};

// Mock get approved users
export const getApprovedUsers = async () => {
  try {
    return mockUsers.filter(user => user.is_approved && user.is_active);
  } catch (error) {
    console.error('Mock Auth: Get approved users error', error);
    return [];
  }
};

// Mock get tenants
export const getTenants = async () => {
  try {
    return [
      {
        id: 'mock-tenant-001',
        name: '스마트팜 테넌트',
        created_at: new Date().toISOString()
      }
    ];
  } catch (error) {
    console.error('Mock Auth: Get tenants error', error);
    return [];
  }
};

// Mock get teams
export const getTeams = async () => {
  try {
    return {
      success: true,
      teams: [
        {
          id: 'mock-team-001',
          tenant_id: 'mock-tenant-001',
          name: '1농장',
          description: '1번 농장 팀',
          team_code: 'FARM001',
          location: '서울시 강남구',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-team-002',
          tenant_id: 'mock-tenant-001',
          name: '2농장',
          description: '2번 농장 팀',
          team_code: 'FARM002',
          location: '서울시 서초구',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-team-003',
          tenant_id: 'mock-tenant-001',
          name: '3농장',
          description: '3번 농장 팀',
          team_code: 'FARM003',
          location: '서울시 송파구',
          created_at: new Date().toISOString()
        }
      ],
      devices: [
        {
          id: 'bed-001',
          name: '1농장 A베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 80 },
          farm_id: 'mock-team-001',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-002',
          name: '1농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 60 },
          farm_id: 'mock-team-001',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-003',
          name: '2농장 A베드',
          type: 'sensor_gateway',
          status: { online: false, brightness: 0 },
          farm_id: 'mock-team-002',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-004',
          name: '2농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 70 },
          farm_id: 'mock-team-002',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-005',
          name: '3농장 A베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 90 },
          farm_id: 'mock-team-003',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-006',
          name: '3농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 50 },
          farm_id: 'mock-team-003',
          created_at: new Date().toISOString()
        }
      ],
      sensors: [
        {
          id: 'sensor-001',
          name: '온도센서',
          type: 'temperature',
          unit: '°C',
          device_id: 'bed-001',
          value: 24.5,
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'sensor-002',
          name: '습도센서',
          type: 'humidity',
          unit: '%',
          device_id: 'bed-001',
          value: 65.2,
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'sensor-003',
          name: 'pH센서',
          type: 'ph',
          unit: 'pH',
          device_id: 'bed-001',
          value: 6.8,
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'sensor-004',
          name: 'EC센서',
          type: 'ec',
          unit: 'mS/cm',
          device_id: 'bed-001',
          value: 1.8,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ],
      sensorReadings: [
        {
          id: 'reading-001',
          sensor_id: 'sensor-001',
          value: 24.5,
          unit: '°C',
          timestamp: new Date().toISOString(),
          metadata: {}
        },
        {
          id: 'reading-002',
          sensor_id: 'sensor-002',
          value: 65.2,
          unit: '%',
          timestamp: new Date().toISOString(),
          metadata: {}
        },
        {
          id: 'reading-003',
          sensor_id: 'sensor-003',
          value: 6.8,
          unit: 'pH',
          timestamp: new Date().toISOString(),
          metadata: {}
        },
        {
          id: 'reading-004',
          sensor_id: 'sensor-004',
          value: 1.8,
          unit: 'mS/cm',
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ]
    };
  } catch (error) {
    console.error('Mock Auth: Get teams error', error);
    return {
      success: false,
      teams: []
    };
  }
};

// Mock update user
export const updateUser = async (userId: string, data: Partial<AuthUser>) => {
  try {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      Object.assign(user, data);
      console.log('Mock Auth: User updated', user.name);
      return { success: true };
    }
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  } catch (error: any) {
    console.error('Mock Auth: Update user error', error);
    return { success: false, error: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
};

// Mock delete user
export const deleteUser = async (userId: string) => {
  try {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.is_active = false;
      console.log('Mock Auth: User deleted', user.name);
      return { success: true };
    }
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  } catch (error: any) {
    console.error('Mock Auth: Delete user error', error);
    return { success: false, error: '사용자 삭제 중 오류가 발생했습니다.' };
  }
};

// Mock user settings
const getUserSettingsInternal = (userId: string) => {
  if (typeof window === 'undefined') return {};
  const settings = localStorage.getItem(`user_settings_${userId}`);
  return settings ? JSON.parse(settings) : {
    showTeamBedsOnDashboard: true,
    showAllBedsInBedManagement: false,
    showOnlyMyFarm: false
  };
};

const saveUserSettings = (userId: string, settings: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`user_settings_${userId}`, JSON.stringify(settings));
};

export const getUserSettings = (userId: string) => {
  return getUserSettingsInternal(userId);
};

export const updateUserSettings = async (userId: string, settings: any) => {
  try {
    const currentSettings = getUserSettingsInternal(userId);
    const newSettings = { ...currentSettings, ...settings };
    saveUserSettings(userId, newSettings);
    console.log('Mock Auth: User settings updated for', userId);
    return newSettings;
  } catch (error) {
    console.error('Mock Auth: Update user settings error', error);
    const currentSettings = getUserSettingsInternal(userId);
    const newSettings = { ...currentSettings, ...settings };
    saveUserSettings(userId, newSettings);
    return newSettings;
  }
};

// Mock reset users (for development)
export const resetMockUsers = async () => {
  try {
    // Reset to default users
    mockUsers.length = 0;
    mockUsers.push(
      {
        id: 'mock-user-001',
        email: 'admin@smartfarm.com',
        name: '시스템 관리자',
        role: 'system_admin',
        tenant_id: 'mock-tenant-001',
        is_approved: true,
        is_active: true,
        created_at: new Date().toISOString(),
        company: '스마트팜',
        phone: '010-0000-0000'
      },
      {
        id: 'mock-user-002',
        email: 'leader@smartfarm.com',
        name: '농장장',
        role: 'team_leader',
        tenant_id: 'mock-tenant-001',
        team_id: 'mock-team-001',
        team_name: '1농장',
        is_approved: true,
        is_active: true,
        created_at: new Date().toISOString(),
        company: '스마트팜',
        phone: '010-0000-0001'
      },
      {
        id: 'mock-user-003',
        email: 'member@smartfarm.com',
        name: '팀원',
        role: 'team_member',
        tenant_id: 'mock-tenant-001',
        team_id: 'mock-team-001',
        team_name: '1농장',
        is_approved: true,
        is_active: true,
        created_at: new Date().toISOString(),
        company: '스마트팜',
        phone: '010-0000-0002'
      },
      {
        id: 'mock-user-004',
        email: 'sky3rain7@gmail.com',
        name: '테스트 사용자',
        role: 'system_admin',
        tenant_id: 'mock-tenant-001',
        is_approved: true,
        is_active: true,
        created_at: new Date().toISOString(),
        company: '개발자',
        phone: '010-0000-0003'
      }
    );
    
    console.log('Mock Auth: Users reset to default');
    return { success: true };
  } catch (error: any) {
    console.error('Mock Auth: Reset users error', error);
    return { success: false, error: '사용자 초기화 중 오류가 발생했습니다.' };
  }
};

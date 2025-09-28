// Supabase 인증 시스템
import { getSupabaseClient } from './supabase';

// 임시 타입 정의 (Supabase 타입 생성 전까지 사용)
interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  tenant_id?: string;
  team_id?: string;
  team_name?: string;
  preferred_team?: string;
  is_approved?: boolean;
  is_active?: boolean;
  company?: string;
  phone?: string;
  avatar_url?: string;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
  approved_at?: string;
  approved_by?: string;
}

// Supabase 인증만 사용 (Mock 인증 완전 제거)

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
  company?: string; // 회사명
  phone?: string; // 전화번호
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

// Supabase 로그인
// Supabase 에러 메시지를 한글로 변환
const translateAuthError = (errorMessage: string): string => {
  const errorMap: { [key: string]: string } = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email not confirmed': '이메일 인증이 완료되지 않았습니다.',
    'User not found': '사용자를 찾을 수 없습니다.',
    'Invalid email': '올바르지 않은 이메일 형식입니다.',
    'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다.',
    'User already registered': '이미 등록된 사용자입니다.',
    'Too many requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    'Network error': '네트워크 오류가 발생했습니다.',
    'Server error': '서버 오류가 발생했습니다.',
    'Invalid refresh token': '인증 토큰이 만료되었습니다. 다시 로그인해주세요.'
  };

  // 정확한 매칭 시도
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }

  // 부분 매칭 시도
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // 기본 메시지
  return `로그인 중 오류가 발생했습니다: ${errorMessage}`;
};

export const signIn = async (data: SignInData) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) {
      return { success: false, error: translateAuthError(authError.message) };
    }

    if (authData.user) {
      // Supabase users 테이블에서 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single() as { data: DatabaseUser | null; error: any };

      if (userError) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
      }

      if (!userData) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
      }

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: (userData.role as 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
        tenant_id: userData.tenant_id,
        is_approved: userData.is_approved,
        is_active: userData.is_active,
        created_at: userData.created_at
      };

      return { success: true, user };
    }

    return { success: false, error: '로그인에 실패했습니다.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Supabase 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    // 사용자 기본 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single() as { data: DatabaseUser | null; error: any };

    if (userError || !userData) {
      return null;
    }

    // 팀 정보 조회 (memberships 테이블에서)
    console.log('🔍 getCurrentUser authUser.id:', authUser.id);
    const { data: membershipData, error: membershipError } = await supabase
      .from('memberships')
      .select('role, tenant_id, team_id')
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    console.log('🔍 getCurrentUser membershipData:', membershipData);
    console.log('🔍 getCurrentUser membershipError:', membershipError);

    let teamId = null;
    let teamName = null;
    let role = userData.role;

    if (membershipError) {
      console.error('memberships 로드 오류:', membershipError);
      // membership이 없는 경우 기본값 사용
    } else if (membershipData) {
      console.log('🔍 getCurrentUser membershipData:', membershipData);
      teamId = membershipData.team_id;
      console.log('🔍 getCurrentUser teamId 설정:', teamId);
      
      // team_id가 있으면 teams 테이블에서 팀 이름 조회
      if (teamId) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name')
          .eq('id', teamId)
          .maybeSingle();
        
        if (teamData) {
          teamName = teamData.name;
        }
      }
      
      // memberships 테이블의 role을 우선 사용 (더 정확함)
      if (membershipData.role) {
        role = membershipData.role === 'owner' ? 'system_admin' :
               membershipData.role === 'operator' ? 'team_leader' :
               membershipData.role === 'viewer' ? 'team_member' : userData.role;
      }
    } else {
      console.log('🔍 getCurrentUser membershipData가 null입니다');
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: (role as 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
      tenant_id: userData.tenant_id,
      team_id: teamId,
      team_name: teamName,
      is_approved: userData.is_approved,
      is_active: userData.is_active,
      created_at: userData.created_at
    };
  } catch (error: any) {
    console.error('Supabase 사용자 조회 오류:', error);
    return null;
  }
};

// Supabase 로그아웃
export const signOut = async () => {
  try {
    console.log('Supabase 로그아웃 시작');
    
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase 로그아웃 오류:', error);
      return { success: false, error: error.message };
    }
    
    // 페이지 새로고침을 통해 상태 초기화
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    console.log('Supabase 로그아웃 성공');
    return { success: true };
  } catch (error: any) {
    console.error('Supabase 로그아웃 중 오류:', error);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
};

// Supabase 회원가입
export const signUp = async (data: SignUpData) => {
  try {
    const supabase = getSupabaseClient();
    
    // Supabase Auth로 사용자 등록
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          company: data.company,
          phone: data.phone,
          preferred_team: data.preferred_team
        }
      }
    });

    if (authError) {
      return { success: false, error: translateAuthError(authError.message) };
    }

    if (authData.user) {
      // users 테이블에 사용자 정보 저장
      const { error: userError } = await (supabase as any)
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          company: data.company,
          phone: data.phone,
          preferred_team: data.preferred_team,
          is_approved: false, // 승인 대기 상태
          is_active: true
        });

      if (userError) {
        return { success: false, error: '사용자 정보 저장에 실패했습니다.' };
      }

      return { success: true, message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.' };
    }

    return { success: false, error: '회원가입에 실패했습니다.' };
  } catch (error: any) {
    console.error('회원가입 중 오류:', error);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
};

// 승인 대기 사용자 조회
export const getPendingUsers = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as { data: DatabaseUser[] | null; error: any };

    if (error) {
      return [];
    }

    return pendingUsers || [];
  } catch (error) {
    console.error('승인 대기 사용자 조회 오류:', error);
    return [];
  }
};

// 사용자 승인
export const approveUser = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await (supabase as any)
      .from('users')
      .update({ 
        is_approved: true,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 승인에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 승인 중 오류가 발생했습니다.' };
  }
};

// 사용자 거부
export const rejectUser = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await (supabase as any)
      .from('users')
      .update({ 
        is_active: false 
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 거부에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 거부 중 오류가 발생했습니다.' };
  }
};

// 승인된 사용자 조회
export const getApprovedUsers = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: approvedUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as { data: DatabaseUser[] | null; error: any };

    if (error) {
      return [];
    }

    if (!approvedUsers) {
      return [];
    }

    // 각 사용자의 팀 정보 조회
    const usersWithTeamInfo = await Promise.all(
      approvedUsers.map(async (user) => {
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('role, tenant_id, team_id')
          .eq('user_id', user.id)
          .maybeSingle();

        let teamId = null;
        let teamName = null;
        let role = user.role;

        if (membershipError) {
          console.error(`사용자 ${user.email} memberships 로드 오류:`, membershipError);
          // membership이 없는 경우 기본값 사용
        } else if (membershipData) {
          teamId = membershipData.team_id;
          
          // team_id가 있으면 teams 테이블에서 팀 이름 조회
          if (teamId) {
            const { data: teamData } = await supabase
              .from('teams')
              .select('name')
              .eq('id', teamId)
              .maybeSingle();
            
            if (teamData) {
              teamName = teamData.name;
            }
          }
          
          // memberships 테이블의 role을 우선 사용
          if (membershipData.role) {
            role = membershipData.role === 'owner' ? 'system_admin' :
                   membershipData.role === 'operator' ? 'team_leader' :
                   membershipData.role === 'viewer' ? 'team_member' : user.role;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: (role as 'system_admin' | 'team_leader' | 'team_member') || 'team_member',
          tenant_id: user.tenant_id,
          team_id: teamId,
          team_name: teamName,
          is_approved: user.is_approved,
          is_active: user.is_active,
          created_at: user.created_at,
          company: user.company,
          phone: user.phone
        } as AuthUser;
      })
    );

    return usersWithTeamInfo;
  } catch (error) {
    console.error('승인된 사용자 조회 오류:', error);
    return [];
  }
};

// 테넌트 목록 조회
export const getTenants = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .order('name');

    if (error) {
      return [];
    }

    return tenants || [];
  } catch (error) {
    console.error('테넌트 조회 오류:', error);
    return [];
  }
};

// 팀 목록 조회
export const getTeams = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // 실제 Supabase에서 teams 조회
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    // 실제 Supabase에서 devices 조회
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .order('name');

    // 실제 Supabase에서 sensors 조회
    const { data: sensors, error: sensorsError } = await supabase
      .from('sensors')
      .select('*')
      .order('name');

    // 실제 Supabase에서 sensor_readings 조회 (최신 데이터만)
    const { data: sensorReadings, error: readingsError } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000); // 최근 1000개만

    if (teamsError) {
      console.log('teams 테이블 조회 실패:', teamsError.message);
    }
    if (devicesError) {
      console.log('devices 테이블 조회 실패:', devicesError.message);
    }
    if (sensorsError) {
      console.log('sensors 테이블 조회 실패:', sensorsError.message);
    }
    if (readingsError) {
      console.log('sensor_readings 테이블 조회 실패:', readingsError.message);
    }

    return {
      success: true,
      teams: teams || [
        {
          id: '00000000-0000-0000-0000-000000000001',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '1농장',
          description: '1번 농장 팀',
          team_code: 'FARM001',
          location: '서울시 강남구',
          created_at: new Date().toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '2농장',
          description: '2번 농장 팀',
          team_code: 'FARM002',
          location: '서울시 서초구',
          created_at: new Date().toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          name: '3농장',
          description: '3번 농장 팀',
          team_code: 'FARM003',
          location: '서울시 송파구',
          created_at: new Date().toISOString()
        }
      ],
      devices: devices || [
        {
          id: 'bed-001',
          name: '1농장 A베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 80 },
          farm_id: '00000000-0000-0000-0000-000000000001',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-002',
          name: '1농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 60 },
          farm_id: '00000000-0000-0000-0000-000000000001',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-003',
          name: '2농장 A베드',
          type: 'sensor_gateway',
          status: { online: false, brightness: 0 },
          farm_id: '00000000-0000-0000-0000-000000000002',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-004',
          name: '2농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 70 },
          farm_id: '00000000-0000-0000-0000-000000000002',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-005',
          name: '3농장 A베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 90 },
          farm_id: '00000000-0000-0000-0000-000000000003',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-006',
          name: '3농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 50 },
          farm_id: '00000000-0000-0000-0000-000000000003',
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
    }

    return {
      success: true,
      teams: teams || [],
      devices: [
        {
          id: 'bed-001',
          name: '1농장 A베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 80 },
          farm_id: '00000000-0000-0000-0000-000000000001',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-002',
          name: '1농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 60 },
          farm_id: '00000000-0000-0000-0000-000000000001',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-003',
          name: '2농장 A베드',
          type: 'sensor_gateway',
          status: { online: false, brightness: 0 },
          farm_id: '00000000-0000-0000-0000-000000000002',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-004',
          name: '2농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 70 },
          farm_id: '00000000-0000-0000-0000-000000000002',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-005',
          name: '3농장 A베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 90 },
          farm_id: '00000000-0000-0000-0000-000000000003',
          created_at: new Date().toISOString()
        },
        {
          id: 'bed-006',
          name: '3농장 B베드',
          type: 'sensor_gateway',
          status: { online: true, brightness: 50 },
          farm_id: '00000000-0000-0000-0000-000000000003',
          created_at: new Date().toISOString()
        }
      ],
      sensors: [
        {
          id: 'sensor-001',
          name: '온도 센서',
          type: 'temperature',
          device_id: 'bed-001',
          min_value: 10,
          max_value: 40,
          unit: '°C',
          created_at: new Date().toISOString()
        },
        {
          id: 'sensor-002',
          name: '습도 센서',
          type: 'humidity',
          device_id: 'bed-001',
          min_value: 30,
          max_value: 90,
          unit: '%',
          created_at: new Date().toISOString()
        },
        {
          id: 'sensor-003',
          name: 'EC 센서',
          type: 'ec',
          device_id: 'bed-001',
          min_value: 0.5,
          max_value: 3.0,
          unit: 'mS/cm',
          created_at: new Date().toISOString()
        },
        {
          id: 'sensor-004',
          name: 'pH 센서',
          type: 'ph',
          device_id: 'bed-001',
          min_value: 5.0,
          max_value: 7.0,
          unit: '',
          created_at: new Date().toISOString()
        },
        {
          id: 'sensor-005',
          name: '조도 센서',
          type: 'light',
          device_id: 'bed-001',
          min_value: 0,
          max_value: 10000,
          unit: 'lux',
          created_at: new Date().toISOString()
        },
        {
          id: 'sensor-006',
          name: '수온 센서',
          type: 'water_temperature',
          device_id: 'bed-001',
          min_value: 10,
          max_value: 30,
          unit: '°C',
          created_at: new Date().toISOString()
        }
      ],
      sensorReadings: []
    };
  } catch (error) {
    console.error('팀 조회 오류:', error);
    return {
      success: false,
      teams: [],
      devices: [],
      sensors: [],
      sensorReadings: []
    };
  }
};

// 사용자 정보 업데이트
export const updateUser = async (userId: string, data: Partial<AuthUser>) => {
  try {
    const supabase = getSupabaseClient();
    
    // AuthUser에서 데이터베이스 테이블에 존재하는 필드만 추출
    const dbData: Record<string, any> = {};
    
    // 데이터베이스 테이블에 존재하는 필드들만 매핑
    if (data.name !== undefined) dbData.name = data.name;
    if (data.email !== undefined) dbData.email = data.email;
    if (data.role !== undefined) dbData.role = data.role;
    if (data.tenant_id !== undefined) dbData.tenant_id = data.tenant_id;
    if (data.team_id !== undefined) dbData.team_id = data.team_id;
    if (data.team_name !== undefined) dbData.team_name = data.team_name;
    if (data.preferred_team !== undefined) dbData.preferred_team = data.preferred_team;
    if (data.is_approved !== undefined) dbData.is_approved = data.is_approved;
    if (data.is_active !== undefined) dbData.is_active = data.is_active;
    if (data.company !== undefined) dbData.company = data.company;
    if (data.phone !== undefined) dbData.phone = data.phone;
    
    const { error } = await (supabase as any)
      .from('users')
      .update(dbData)
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 정보 업데이트에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
};

// 사용자 삭제
export const deleteUser = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await (supabase as any)
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 삭제에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 삭제 중 오류가 발생했습니다.' };
  }
};

// 사용자 설정 관리 함수들
const getUserSettingsInternal = (userId: string) => {
  if (typeof window === 'undefined') return {};
  const settings = localStorage.getItem(`user_settings_${userId}`);
  return settings ? JSON.parse(settings) : {
    showTeamBedsOnDashboard: true,
    showAllBedsInBedManagement: false,
    showOnlyMyFarm: false // 기본값은 모든 농장 표시
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
    // Supabase에 설정 저장 시도
    const supabase = getSupabaseClient();
    
    // 기존 설정 조회
    const { data: existingSettings, error: fetchError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single() as { data: any | null; error: any };

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // 테이블이 없거나 데이터가 없는 경우 - localStorage만 사용
        console.log('user_settings 테이블이 없거나 데이터가 없음, localStorage 사용');
        const currentSettings = getUserSettingsInternal(userId);
        const newSettings = { ...currentSettings, ...settings };
        saveUserSettings(userId, newSettings);
        return newSettings;
      } else if (fetchError.code === 'PGRST205') {
        // 테이블이 존재하지 않는 경우 - localStorage만 사용
        console.log('user_settings 테이블이 존재하지 않음, localStorage 사용');
        const currentSettings = getUserSettingsInternal(userId);
        const newSettings = { ...currentSettings, ...settings };
        saveUserSettings(userId, newSettings);
        return newSettings;
      } else {
        // 기타 오류 - localStorage 백업
        console.error('기존 설정 조회 오류:', fetchError);
        const currentSettings = getUserSettingsInternal(userId);
        const newSettings = { ...currentSettings, ...settings };
        saveUserSettings(userId, newSettings);
        return newSettings;
      }
    }

    // dashboard_preferences에 showOnlyMyFarm 추가
    const dashboardPrefs = existingSettings?.dashboard_preferences || {};
    const updatedDashboardPrefs = {
      ...dashboardPrefs,
      showOnlyMyFarm: settings.showOnlyMyFarm
    };

    const settingsUpdate = {
      user_id: userId,
      ...existingSettings,
      dashboard_preferences: updatedDashboardPrefs,
      updated_at: new Date().toISOString()
    };

    const { error: insertOrUpdateError } = existingSettings
      ? await (supabase as any)
          .from('user_settings')
          .update(settingsUpdate)
          .eq('user_id', userId)
      : await (supabase as any)
          .from('user_settings')
          .insert(settingsUpdate);

    if (insertOrUpdateError) {
      console.error('사용자 설정 업데이트 오류:', insertOrUpdateError);
      // localStorage 백업
      const currentSettings = getUserSettingsInternal(userId);
      const newSettings = { ...currentSettings, ...settings };
      saveUserSettings(userId, newSettings);
      return newSettings;
    }

    // localStorage에도 백업
    saveUserSettings(userId, settings);
    
    console.log('사용자 설정 업데이트 성공:', settings);
    return settings;
  } catch (error) {
    console.error('사용자 설정 업데이트 중 오류:', error);
    // localStorage 백업
    const currentSettings = getUserSettingsInternal(userId);
    const newSettings = { ...currentSettings, ...settings };
    saveUserSettings(userId, newSettings);
    return newSettings;
  }
};
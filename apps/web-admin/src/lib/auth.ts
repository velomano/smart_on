import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseClient: any = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

// 데이터베이스 사용자 타입
export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  company?: string;
  phone?: string;
}

// 애플리케이션 사용자 타입
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'system_admin' | 'team_leader' | 'team_member';
  tenant_id: string;
  team_id?: string | null;
  team_name?: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  company?: string;
  phone?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

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

// Supabase 로그인
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

      // 계정 상태 확인
      if (!userData.is_active) {
        return { success: false, error: '비활성화된 계정입니다. 관리자에게 문의하세요.' };
      }

      if (!userData.is_approved) {
        return { success: false, error: '승인 대기 중인 계정입니다. 승인 후 로그인할 수 있습니다.' };
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
          phone: data.phone
        }
      }
    });

    if (authError) {
      return { success: false, error: translateAuthError(authError.message) };
    }

    if (authData.user) {
      // users 테이블에 사용자 정보 저장
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          company: data.company,
          phone: data.phone,
          role: 'team_member', // 기본 역할
          tenant_id: '00000000-0000-0000-0000-000000000001', // 기본 테넌트
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

// 현재 사용자 조회
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

// 승인된 사용자 목록 조회
export const getApprovedUsers = async () => {
  try {
    console.log('🚀 getApprovedUsers 함수 시작');
    const supabase = getSupabaseClient();
    
    const { data: approvedUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as { data: DatabaseUser[] | null; error: any };

    console.log('🚀 getApprovedUsers Supabase 쿼리 결과:', {
      data: approvedUsers?.length || 0,
      error: error
    });

    if (error) {
      console.log('🚀 getApprovedUsers 오류 발생:', error);
      return [];
    }

    if (!approvedUsers) {
      console.log('🚀 getApprovedUsers 데이터 없음');
      return [];
    }

    // 각 사용자의 팀 정보 조회
    const usersWithTeamInfo = await Promise.all(
      approvedUsers.map(async (user) => {
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('role, tenant_id, team_id') // Simplified select
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle for defensive coding

        console.log(`🔍 getApprovedUsers - ${user.email}:`, {
          membershipData,
          membershipError,
          userId: user.id
        });

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
              .maybeSingle(); // Use maybeSingle for defensive coding
            
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

    console.log('🚀 getApprovedUsers 최종 결과:', usersWithTeamInfo.length, '명');
    console.log('🚀 getApprovedUsers 팀별 분포:', usersWithTeamInfo.map(u => ({
      email: u.email,
      team_id: u.team_id,
      team_name: u.team_name
    })));
    console.log('🚀 getApprovedUsers 반환값:', usersWithTeamInfo);
    return usersWithTeamInfo;
  } catch (error) {
    console.error('승인된 사용자 조회 오류:', error);
    return [];
  }
};

// 팀 목록 조회
export const getTeams = async () => {
  try {
    const supabase = getSupabaseClient();

    // 병렬 조회 - 실제 Supabase 스키마에 맞게 수정
    const [
      { data: teams, error: teamsError },
      { data: devices, error: devicesError },
      { data: sensors, error: sensorsError },
      { data: sensorReadings, error: readingsError },
    ] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('devices').select('*'), // name 컬럼이 없으므로 정렬 제거
      supabase.from('sensors').select('*'), // name 컬럼이 없으므로 정렬 제거
      supabase.from('sensor_readings')
        .select('*')
        .order('ts', { ascending: false }) // created_at 대신 ts 사용
        .limit(1000),
    ]);

    if (teamsError)   console.log('teams 테이블 조회 실패:', teamsError.message);
    if (devicesError) console.log('devices 테이블 조회 실패:', devicesError.message);
    if (sensorsError) console.log('sensors 테이블 조회 실패:', sensorsError.message);
    if (readingsError)console.log('sensor_readings 테이블 조회 실패:', readingsError.message);

    console.log('🔍 Supabase 데이터 조회 결과:', {
      teams: teams?.length || 0,
      devices: devices?.length || 0,
      sensors: sensors?.length || 0,
      readings: sensorReadings?.length || 0
    });

    // 폴백 데이터
    const fallbackTeams = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        name: '1농장',
        description: '1번 농장 팀',
        team_code: 'FARM001',
        location: '서울시 강남구',
        created_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        name: '2농장',
        description: '2번 농장 팀',
        team_code: 'FARM002',
        location: '서울시 서초구',
        created_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        name: '3농장',
        description: '3번 농장 팀',
        team_code: 'FARM003',
        location: '서울시 송파구',
        created_at: new Date().toISOString(),
      },
    ];

    const fallbackDevices = [
      { id: 'bed-001', type: 'sensor_gateway', farm_id: '00000000-0000-0000-0000-000000000001', bed_id: null, vendor: 'Tuya', tuya_device_id: 'device001', status: { online: true,  brightness: 80 }, meta: { name: '1농장 A베드' }, created_at: new Date().toISOString() },
      { id: 'bed-002', type: 'sensor_gateway', farm_id: '00000000-0000-0000-0000-000000000001', bed_id: null, vendor: 'Tuya', tuya_device_id: 'device002', status: { online: true,  brightness: 60 }, meta: { name: '1농장 B베드' }, created_at: new Date().toISOString() },
      { id: 'bed-003', type: 'sensor_gateway', farm_id: '00000000-0000-0000-0000-000000000002', bed_id: null, vendor: 'Tuya', tuya_device_id: 'device003', status: { online: false, brightness: 0  }, meta: { name: '2농장 A베드' }, created_at: new Date().toISOString() },
      { id: 'bed-004', type: 'sensor_gateway', farm_id: '00000000-0000-0000-0000-000000000002', bed_id: null, vendor: 'Tuya', tuya_device_id: 'device004', status: { online: true,  brightness: 70 }, meta: { name: '2농장 B베드' }, created_at: new Date().toISOString() },
      { id: 'bed-005', type: 'sensor_gateway', farm_id: '00000000-0000-0000-0000-000000000003', bed_id: null, vendor: 'Tuya', tuya_device_id: 'device005', status: { online: true,  brightness: 90 }, meta: { name: '3농장 A베드' }, created_at: new Date().toISOString() },
      { id: 'bed-006', type: 'sensor_gateway', farm_id: '00000000-0000-0000-0000-000000000003', bed_id: null, vendor: 'Tuya', tuya_device_id: 'device006', status: { online: true,  brightness: 50 }, meta: { name: '3농장 B베드' }, created_at: new Date().toISOString() },
    ];

    const fallbackSensors = [
      { id: 'sensor-001', device_id: 'bed-001', type: 'temperature', unit: '°C',    meta: { name: '온도센서', value: 24.5, status: 'active' }, created_at: new Date().toISOString() },
      { id: 'sensor-002', device_id: 'bed-001', type: 'humidity',    unit: '%',     meta: { name: '습도센서', value: 65.2, status: 'active' }, created_at: new Date().toISOString() },
      { id: 'sensor-003', device_id: 'bed-001', type: 'ph',          unit: 'pH',    meta: { name: 'pH센서',   value: 6.8,  status: 'active' }, created_at: new Date().toISOString() },
      { id: 'sensor-004', device_id: 'bed-001', type: 'ec',          unit: 'mS/cm', meta: { name: 'EC센서',   value: 1.8,  status: 'active' }, created_at: new Date().toISOString() },
    ];

    const fallbackReadings = [
      { id: 1, sensor_id: 'sensor-001', value: 24.5, ts: new Date().toISOString(), quality: 1 },
      { id: 2, sensor_id: 'sensor-002', value: 65.2, ts: new Date().toISOString(), quality: 1 },
      { id: 3, sensor_id: 'sensor-003', value: 6.8,  ts: new Date().toISOString(), quality: 1 },
      { id: 4, sensor_id: 'sensor-004', value: 1.8,  ts: new Date().toISOString(), quality: 1 },
    ];

    const result = {
      success: true,
      teams:          teams && teams.length > 0 ? teams : fallbackTeams,
      devices:        devices && devices.length > 0 ? devices : fallbackDevices,
      sensors:        sensors && sensors.length > 0 ? sensors : fallbackSensors,
      sensorReadings: sensorReadings && sensorReadings.length > 0 ? sensorReadings : fallbackReadings,
    };

    console.log('🔍 getTeams 최종 반환값:', {
      success: result.success,
      teamsCount: result.teams.length,
      devicesCount: result.devices.length,
      sensorsCount: result.sensors.length,
      readingsCount: result.sensorReadings.length
    });

    return result;
  } catch (error) {
    console.error('팀 조회 오류:', error);
    return { success: false, teams: [], devices: [], sensors: [], sensorReadings: [] };
  }
};

// 사용자 정보 업데이트
export const updateUser = async (userId: string, data: Partial<AuthUser>) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId);

    if (error) {
      return { success: false, error: '사용자 정보 업데이트에 실패했습니다.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
};

// 로그아웃
export const signOut = async () => {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('로그아웃 오류:', error);
  }
};

// 사용자 설정 조회
export const getUserSettings = (userId: string) => {
  if (typeof window === 'undefined') return {};
  
  try {
    const settings = localStorage.getItem(`user_settings_${userId}`);
    return settings ? JSON.parse(settings) : {};
  } catch (error) {
    console.error('사용자 설정 조회 오류:', error);
    return {};
  }
};

// 사용자 설정 업데이트
export const updateUserSettings = (userId: string, settings: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`user_settings_${userId}`, JSON.stringify(settings));
  } catch (error) {
    console.error('사용자 설정 저장 오류:', error);
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
    
    const { error } = await supabase
      .from('users')
      .update({ 
        is_approved: true,
        updated_at: new Date().toISOString()
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
    
    const { error } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
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

// 사용자 삭제 (비활성화)
export const deleteUser = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
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

// Mock 사용자 리셋 (개발용)
export const resetMockUsers = async () => {
  // Supabase에서는 mock 데이터 리셋이 필요 없음
  console.log('Mock 사용자 리셋은 Supabase 환경에서는 지원되지 않습니다.');
  return { success: true };
};

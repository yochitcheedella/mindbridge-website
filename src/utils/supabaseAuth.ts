/**
 * MindBridge AI — Supabase Authentication & Profile Management
 * Architecture: auth.uid() is the single identity key throughout the entire application.
 * Real names are strictly display information — never used as foreign keys or query filters.
 */
import { supabase } from './supabaseClient';
import { setAuth, clearAuth, type UserRole, type AuthState } from './auth';

export type ProfileRole = UserRole | 'counsellor';

export interface UserProfile {
  id: string;
  email: string;
  real_name: string;
  alias: string;
  role: ProfileRole;
  college_name?: string;
  department?: string;
  year?: string;
  phone?: string;
  created_at?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  realName: string;
  alias?: string;
  role?: UserRole;
  collegeName?: string;
  department?: string;
  year?: string;
  phone?: string;
}

/**
 * Retrieves the currently authenticated Supabase Auth user.
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error('Error fetching Supabase user:', err);
    return null;
  }
}

/**
 * Fetches the user's profile from public.profiles using auth.uid() (user.id).
 * Strictly queries by id = user.id to completely avoid duplicate-name collisions.
 */
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  try {
    let targetId = userId;
    if (!targetId) {
      const user = await getCurrentUser();
      if (!user) return null;
      targetId = user.id;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error) {
      console.warn('Profile fetch warning (may be using offline/fallback profile):', error.message);
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return null;
  }
}

/**
 * Synchronizes the Supabase profile into the application's local auth state
 * so legacy headers, layouts, and components seamlessly recognize the user.
 */
export function syncProfileToLocalAuth(profile: UserProfile, token: string = 'supabase-session-token'): AuthState {
  const normalizedRole: UserRole = 
    profile.role === 'counsellor' ? 'psychologist' :
    profile.role === 'admin' ? 'admin' :
    profile.role === 'super_admin' ? 'super_admin' :
    profile.role === 'psychologist' ? 'psychologist' :
    'student';

  const authState: AuthState = {
    access_token: token,
    role: normalizedRole,
    email: profile.email,
    anonymous_alias: profile.alias || 'StarlightSeeker',
    original_name: profile.real_name,
    name: profile.real_name,
    department: profile.department,
    year: profile.year,
    college_name: profile.college_name,
    phone: profile.phone,
    institution: profile.college_name || 'Vishnu Institute of Technology',
  };

  setAuth(authState, profile.email);
  return authState;
}

/**
 * Signs up a new user via Supabase Auth.
 * Name and display metadata are passed in options.data so the Supabase trigger
 * on_auth_user_created automatically creates public.profiles with id = auth.users.id.
 */
export async function signUpWithSupabase(params: SignUpParams): Promise<{ user: any; profile: UserProfile | null; error?: string }> {
  try {
    const { email, password, realName, alias, role = 'student', collegeName, department, year, phone } = params;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          real_name: realName,
          alias: alias || 'StarlightSeeker',
          role: role === 'psychologist' ? 'counsellor' : role,
          college_name: collegeName || 'Vishnu Institute of Technology (VIT)',
          department: department || 'General',
          year: year || '1st Year',
          phone: phone || '',
        },
      },
    });

    if (error) {
      return { user: null, profile: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, profile: null, error: 'Registration failed. Please try again.' };
    }

    // Try fetching the created profile
    let profile = await getUserProfile(data.user.id);
    if (!profile) {
      // If trigger is delayed or running offline, construct local profile
      profile = {
        id: data.user.id,
        email: data.user.email || email,
        real_name: realName,
        alias: alias || 'StarlightSeeker',
        role,
        college_name: collegeName,
        department,
        year,
        phone,
      };
    }

    const token = data.session?.access_token || 'supabase-registered-token';
    syncProfileToLocalAuth(profile, token);

    return { user: data.user, profile };
  } catch (err: any) {
    console.error('Sign up error:', err);
    return { user: null, profile: null, error: err.message || 'An unexpected registration error occurred.' };
  }
}

/**
 * Signs in an existing user via Supabase Auth.
 * Retrieves authenticated user.id and queries profiles where id = user.id.
 */
export async function signInWithSupabase(email: string, password: string): Promise<{ profile: UserProfile | null; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { profile: null, error: error.message };
    }

    if (!data.user) {
      return { profile: null, error: 'Sign in failed. No user returned.' };
    }

    // Single Identity Key: Retrieve profile using user.id
    let profile = await getUserProfile(data.user.id);
    if (!profile) {
      // Fallback from user metadata if table row is being populated
      const meta = data.user.user_metadata || {};
      profile = {
        id: data.user.id,
        email: data.user.email || email,
        real_name: meta.real_name || 'MindBridge User',
        alias: meta.alias || 'StarlightSeeker',
        role: meta.role || 'student',
        college_name: meta.college_name,
        department: meta.department,
        year: meta.year,
        phone: meta.phone,
      };
    }

    const token = data.session?.access_token || 'supabase-session-token';
    syncProfileToLocalAuth(profile, token);

    return { profile };
  } catch (err: any) {
    console.error('Sign in error:', err);
    return { profile: null, error: err.message || 'An unexpected login error occurred.' };
  }
}

/**
 * Fully terminates the authenticated Supabase session and purges local storage.
 */
export async function signOutSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut warning:', err);
  } finally {
    clearAuth();
    // Purge legacy role storage
    try {
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('admin');
    } catch (_) {}
  }
}

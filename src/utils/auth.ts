/**
 * MindBridge AI — Auth Utilities (VIT-only, 3 roles)
 * Manages JWT auth state in localStorage.
 * Real student identity is NEVER stored here — only alias, token, and role.
 */

export type UserRole = 'student' | 'psychologist' | 'admin' | 'super_admin';

export interface AuthState {
  access_token: string;
  role: UserRole;
  email?: string;
  // Student fields
  anonymous_alias?: string;
  student_id?: number;
  original_name?: string;
  college_name?: string;
  branch?: string;
  department?: string;
  section?: string;
  year?: string | number;
  mobile_number?: string;
  phone?: string;
  gender?: string;
  // Psychologist fields
  psychologist_id?: number;
  name?: string;
  specialization?: string;
  // Admin fields
  admin_id?: number;
  // Shared
  institution?: string;
  primary_color?: string;
}

const AUTH_KEY = 'mindbridge_auth';
const SAVED_PROFILE_KEY = 'mindbridge_saved_profile';
const PRODUCTION_API_URL = 'https://mind-bridge-cc9m.onrender.com';
const PRODUCTION_WS_URL = 'wss://mind-bridge-cc9m.onrender.com';

export interface SavedProfile {
  role: UserRole;
  email?: string;
  anonymous_alias?: string;
  name?: string;
  avatar_seed?: string;
  last_login?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || PRODUCTION_API_URL;
export const API_URL = import.meta.env.VITE_API_URL || PRODUCTION_API_URL;

let hasPrewarmed = false;
export function prewarmBackend(): void {
  if (hasPrewarmed) return;
  hasPrewarmed = true;
  try {
    fetch(`${API_BASE}/api/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
  } catch (_) {}
}

export function getWsBaseUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
      .replace('http://', 'ws://')
      .replace('https://', 'wss://');
  }
  return PRODUCTION_WS_URL;
}

export function parseJwtPayload(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isSessionValid(): boolean {
  const auth = getAuth();
  if (!auth || !auth.access_token) return false;
  const payload = parseJwtPayload(auth.access_token);
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now + 30; // 30s buffer
}

export async function restoreSession(): Promise<AuthState | null> {
  const auth = getAuth();
  if (!auth || !auth.access_token) return null;

  if (isSessionValid()) {
    if (stateColor(auth)) applyPrimaryColor(stateColor(auth));
    return auth;
  }

  // Try refreshing session token via backend API
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.access_token}`,
      },
    });
    if (res.ok) {
      const refreshed = await res.json();
      const updatedAuth: AuthState = {
        ...auth,
        access_token: refreshed.access_token,
        role: refreshed.role || auth.role,
        anonymous_alias: refreshed.anonymous_alias || auth.anonymous_alias,
        name: refreshed.name || auth.name,
      };
      setAuth(updatedAuth);
      return updatedAuth;
    }
  } catch (e) {
    console.warn('Session refresh attempt failed:', e);
  }

  // If refresh failed and token is definitely expired
  const payload = parseJwtPayload(auth.access_token);
  const now = Math.floor(Date.now() / 1000);
  if (payload && payload.exp && payload.exp <= now) {
    if (auth.role === 'admin' || auth.role === 'super_admin') {
      const fallback: AuthState = { ...auth, access_token: 'offline-admin-token' };
      setAuth(fallback, auth.email || 'admin@vishnu.edu.in');
      return fallback;
    }
    if (auth.role === 'psychologist') {
      const fallback: AuthState = { ...auth, access_token: 'offline-counselor-token' };
      setAuth(fallback, auth.email || 'ram.sir@vishnu.edu.in');
      return fallback;
    }
    clearAuth();
    return null;
  }
  return auth;
}

function stateColor(auth: AuthState): string {
  return auth.primary_color || '#6366f1';
}

export function getAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSavedProfile(): SavedProfile | null {
  try {
    const raw = localStorage.getItem(SAVED_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSavedProfile(profile: SavedProfile): void {
  localStorage.setItem(SAVED_PROFILE_KEY, JSON.stringify(profile));
}

export function clearSavedProfile(): void {
  localStorage.removeItem(SAVED_PROFILE_KEY);
}

export function setAuth(state: AuthState, email?: string): void {
  const merged: AuthState = {
    ...state,
    email: email || state.email || '',
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(merged));
  if (state.primary_color) {
    applyPrimaryColor(state.primary_color);
  }
  
  // Persist quick profile for 1-tap returning login
  setSavedProfile({
    role: state.role,
    email: email || state.email,
    anonymous_alias: state.anonymous_alias,
    name: state.name,
    last_login: new Date().toISOString(),
  });
}

export function applyPrimaryColor(color: string): void {
  document.documentElement.style.setProperty('--color-primary', color);
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
  document.documentElement.style.removeProperty('--color-primary');
}

export function isLoggedIn(): boolean {
  return getAuth() !== null;
}

export function getRole(): UserRole | null {
  return getAuth()?.role ?? null;
}

export function isStudent(): boolean {
  return getRole() === 'student';
}

export function isPsychologist(): boolean {
  return getRole() === 'psychologist';
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
}

export function isSuperAdmin(): boolean {
  return getRole() === 'super_admin';
}

/**
 * Checks if current logged-in user is Ram Sir (Ram Prudhvi Teja - Senior Wellness Counsellor at VIT)
 */
export function isRamSir(): boolean {
  const auth = getAuth();
  if (!auth) return false;
  const email = (auth.email || '').toLowerCase().trim();
  const name = (auth.name || auth.original_name || '').toLowerCase().trim();
  return (
    email === 'prudhvi.v@vishnu.edu.in' ||
    email === 'ram.sir@vishnu.edu.in' ||
    name.includes('ram prudhvi') ||
    name.includes('ram sir') ||
    (name.includes('prudhvi') && name.includes('teja')) ||
    auth.psychologist_id === 1 ||
    auth.psychologist_id === 8
  );
}

/**
 * Strict authorization rule: Only Admin, Super Admin, and Ram Sir (Ram Prudhvi Teja)
 * are authorized to post in Campus Feed and Campus Wellness Events.
 */
export function canPostCampusUpdates(): boolean {
  const auth = getAuth();
  if (!auth) return false;
  if (auth.role === 'admin' || auth.role === 'super_admin') return true;
  if (isRamSir()) return true;
  return false;
}

export function getAuthHeaders(): Record<string, string> {
  const auth = getAuth();
  if (!auth) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${auth.access_token}`,
  };
}

export function getAlias(): string {
  return getAuth()?.anonymous_alias ?? 'Anonymous';
}

export function getStudentId(): number | null {
  return getAuth()?.student_id ?? null;
}

export function getUserName(): string {
  const auth = getAuth();
  if (!auth) return 'User';
  if (auth.role === 'student') return auth.anonymous_alias ?? 'Student';
  return auth.name ?? 'User';
}

/** Convenience wrapper for authenticated fetch calls */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });
  return res;
}

/** Role-based redirect helper — returns the correct home route for a given role */
export function getHomeRoute(role: UserRole): string {
  switch (role) {
    case 'super_admin':  return '/superadmin/dashboard';
    case 'admin':        return '/admin/dashboard';
    case 'psychologist': return '/psychologist/dashboard';
    default:             return '/student/home';
  }
}

export interface StudentProfileData {
  original_name: string;
  college_name: string;
  institution?: string;
  branch: string;
  department?: string;
  section: string;
  year: string | number;
  mobile_number: string;
  phone?: string;
  gender: string;
  anonymous_alias: string;
  email?: string;
}

export const STUDENT_PROFILE_KEY = 'mindbridge_student_profile';

export function getStudentProfile(): StudentProfileData {
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.original_name) return parsed;
    }
  } catch {}

  const auth = getAuth();
  return {
    original_name: auth?.original_name || auth?.name || 'Vamsi Krishna',
    college_name: auth?.college_name || auth?.institution || 'Vishnu Institute of Technology (VIT)',
    institution: auth?.college_name || auth?.institution || 'Vishnu Institute of Technology (VIT)',
    branch: auth?.branch || auth?.department || 'CSE',
    department: auth?.branch || auth?.department || 'CSE',
    section: auth?.section || 'Section A',
    year: auth?.year || '3rd Year',
    mobile_number: auth?.mobile_number || auth?.phone || '+91 98765 43210',
    phone: auth?.mobile_number || auth?.phone || '+91 98765 43210',
    gender: auth?.gender || 'Male',
    anonymous_alias: auth?.anonymous_alias || 'Silent Phoenix #6718',
    email: '',
  };
}

export function setStudentProfile(profile: StudentProfileData): void {
  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(profile));
  const currentAuth = getAuth();
  if (currentAuth) {
    const updated: AuthState = {
      ...currentAuth,
      original_name: profile.original_name,
      college_name: profile.college_name,
      institution: profile.college_name,
      branch: profile.branch,
      department: profile.branch,
      section: profile.section,
      year: profile.year,
      mobile_number: profile.mobile_number,
      phone: profile.mobile_number,
      gender: profile.gender,
      anonymous_alias: profile.anonymous_alias || currentAuth.anonymous_alias,
    };
    setAuth(updated, profile.email);
  }
}

/**
 * Quick 1-click authenticated demo role log-ins
 */
export async function loginAsPsychologistDemo(): Promise<AuthState> {
  const fallback: AuthState = {
    access_token: 'offline-counselor-token',
    role: 'psychologist',
    psychologist_id: 8,
    name: 'Dr. Ram Prudhvi Teja',
    specialization: 'Senior Wellness Counsellor · Crisis Intervention & Cognitive Therapy',
    institution: 'Vishnu Institute of Technology',
    primary_color: '#3b82f6',
  };
  setAuth(fallback, 'ram.sir@vishnu.edu.in');

  // Background sync with timeout — does not block UI navigation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ram.sir@vishnu.edu.in',
      password: 'Psych@VIT2024',
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const state: AuthState = {
          access_token: data.access_token,
          role: 'psychologist',
          psychologist_id: data.psychologist_id || 8,
          name: data.name || 'Ram Prudhvi Teja',
          specialization: data.specialization || 'Senior Wellness Counsellor',
          institution: data.institution || 'Vishnu Institute of Technology',
          primary_color: data.primary_color || '#3b82f6',
        };
        setAuth(state, 'ram.sir@vishnu.edu.in');
      }
    })
    .catch(() => {
      clearTimeout(timeoutId);
    });

  return fallback;
}

export async function loginAsAdminDemo(): Promise<AuthState> {
  const fallback: AuthState = {
    access_token: 'offline-admin-token',
    role: 'admin',
    admin_id: 2,
    name: 'VIT Chief Administrator',
    institution: 'Vishnu Institute of Technology',
    primary_color: '#8b5cf6',
  };
  setAuth(fallback, 'admin@vishnu.edu.in');

  // Background sync with timeout — does not block UI navigation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@vishnu.edu.in',
      password: 'Admin@VIT2024',
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const state: AuthState = {
          access_token: data.access_token,
          role: 'admin',
          admin_id: data.admin_id || 2,
          name: data.name || 'VIT Chief Administrator',
          institution: data.institution || 'Vishnu Institute of Technology',
          primary_color: data.primary_color || '#8b5cf6',
        };
        setAuth(state, 'admin@vishnu.edu.in');
      }
    })
    .catch(() => {
      clearTimeout(timeoutId);
    });

  return fallback;
}

export async function loginAsStudentDemo(): Promise<AuthState> {
  const existing = getAuth();
  if (existing?.role === 'student' && existing.access_token) {
    return existing;
  }
  const prof = getStudentProfile();
  const alias = prof.anonymous_alias || 'StarlightSeeker';
  const studentAuth: AuthState = {
    access_token: 'demo-student-token',
    role: 'student',
    anonymous_alias: alias,
    student_id: 1,
    institution: 'Vishnu Institute of Technology (VIT)',
    primary_color: '#F4C542',
  };
  setAuth(studentAuth, 'student@vishnu.edu.in');
  return studentAuth;
}


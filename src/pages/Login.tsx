import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Shield, Mail, Lock, Eye, EyeOff, Building2,
  HeartHandshake, AlertCircle, LifeBuoy, ArrowRight, CheckCircle2,
  UserCheck, UserX, RefreshCw
} from 'lucide-react';
import {
  setAuth,
  getAuth,
  isLoggedIn,
  isSessionValid,
  getSavedProfile,
  clearSavedProfile,
  type SavedProfile,
  API_URL,
  getHomeRoute,
  loginAsPsychologistDemo,
  loginAsAdminDemo,
  loginAsStudentDemo,
  prewarmBackend
} from '../utils/auth';

export default function Login() {
  const [searchParams] = useSearchParams();
  const isExplicitLogout = searchParams.get('logout') === 'true';
  const roleParam = searchParams.get('role') as 'student' | 'psychologist' | 'admin' | null;
  const navigate = useNavigate();

  // Silently wake Render backend on login page visit
  useEffect(() => {
    prewarmBackend();
  }, []);

  const [savedProfile, setSavedProfileState] = useState<SavedProfile | null>(() => getSavedProfile());
  const [showDirectForm, setShowDirectForm] = useState(false);

  const initialRole: 'student' | 'psychologist' | 'admin' = 
    roleParam || 
    (savedProfile?.role === 'admin' || savedProfile?.role === 'super_admin' 
      ? 'admin' 
      : savedProfile?.role === 'psychologist' 
      ? 'psychologist' 
      : 'student');

  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'psychologist' | 'admin'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update role and default email when tab switches
  const handleSelectRoleTab = (tab: 'student' | 'psychologist' | 'admin') => {
    setActiveRoleTab(tab);
    setError('');
    if (tab === 'admin') {
      setEmail('admin@vishnu.edu.in');
      setPassword('admin123');
    } else if (tab === 'psychologist') {
      setEmail('prudhvi.v@vishnu.edu.in');
      setPassword('counselor123');
    } else {
      if (savedProfile?.role === 'student' && savedProfile.email) {
        setEmail(savedProfile.email);
      } else {
        setEmail('student.demo@vishnu.edu.in');
      }
      setPassword('student123');
    }
  };

  // Pre-fill email from saved profile if available and not explicitly on staff tab
  useEffect(() => {
    if (roleParam) {
      handleSelectRoleTab(roleParam);
    } else if (savedProfile?.email && !roleParam) {
      setEmail(savedProfile.email);
    }
  }, [savedProfile, roleParam]);

  const handleContinueAsSaved = async () => {
    const currentAuth = getAuth();
    if (currentAuth) {
      navigate(getHomeRoute(currentAuth.role));
      return;
    }
    // If no active token, switch to credentials form with email prefilled
    setShowDirectForm(true);
  };

  const handleForgetProfile = () => {
    clearSavedProfile();
    setSavedProfileState(null);
    setShowDirectForm(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s maximum wait

    try {
      const cleanEmail = email.trim();
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Authentication failed. Please check your credentials.');
      }

      const data = await res.json();

      setAuth({
        access_token: data.access_token,
        role: data.role,
        anonymous_alias: data.anonymous_alias,
        student_id: data.student_id,
        psychologist_id: data.psychologist_id,
        admin_id: data.admin_id,
        name: data.name,
        specialization: data.specialization,
        institution: data.institution,
        primary_color: data.primary_color,
      }, cleanEmail);

      navigate(getHomeRoute(data.role));
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeoutOrNetwork = err.name === 'AbortError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');

      // If offline, warming up, or role demo tab:
      if (activeRoleTab === 'admin' || (isTimeoutOrNetwork && email.toLowerCase().includes('admin'))) {
        const adminAuth = await loginAsAdminDemo();
        navigate(getHomeRoute(adminAuth.role));
        return;
      } else if (activeRoleTab === 'psychologist' || (isTimeoutOrNetwork && (email.toLowerCase().includes('prudhvi') || email.toLowerCase().includes('counselor') || email.toLowerCase().includes('ram.sir')))) {
        const psychAuth = await loginAsPsychologistDemo();
        navigate(getHomeRoute(psychAuth.role));
        return;
      } else if (isTimeoutOrNetwork) {
        // Instant verified student session fallback when Render is sleeping
        const studentAuth = await loginAsStudentDemo();
        navigate(getHomeRoute(studentAuth.role));
        return;
      }
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (targetRole: 'student' | 'psychologist' | 'admin') => {
    setLoading(true);
    setError('');
    try {
      if (targetRole === 'psychologist') {
        await loginAsPsychologistDemo();
        navigate('/psychologist/dashboard');
      } else if (targetRole === 'admin') {
        await loginAsAdminDemo();
        navigate('/admin/dashboard');
      } else {
        await loginAsStudentDemo();
        navigate('/student/home');
      }
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = savedProfile?.anonymous_alias || savedProfile?.name || 'MindBridge User';
  const roleBadge = savedProfile?.role ? savedProfile.role.toUpperCase() : 'STUDENT';

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] flex flex-col items-center justify-center relative overflow-hidden px-4 py-8 selection:bg-[#F4C542] selection:text-[#111111]">
      {/* Subtle SVES brand ambient warmth */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#F4C542]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[450px] h-[450px] bg-[#F4C542]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 space-y-6">
        {/* Main Card */}
        <div className="bg-[#FFFFFF] p-7 sm:p-9 rounded-3xl border-2 border-[#111111] shadow-xl relative overflow-hidden">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <Link 
              to="/" 
              title="Return to MindBridge Home"
              className="w-20 h-20 rounded-2xl bg-[#FFFFFF] p-2 flex items-center justify-center mb-3 shadow-xs border-2 border-[#111111] hover:scale-105 hover:bg-[#FAFAFA] transition-all group cursor-pointer"
            >
              <img src="/vishnu_wellness_logo.png" alt="Vishnu Wellness Centre" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
            </Link>
            
            <h1 className="text-2xl font-black text-[#111111] tracking-tight font-heading">
              MindBridge AI
            </h1>
            <p className="text-[#111111]/70 font-semibold text-xs mt-1">
              Vishnu Wellness Centre · Anonymous Mental Wellbeing
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4C542]/20 border border-[#111111] text-[#111111] text-[10px] font-mono font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-ping" />
              <span>Official Institutional Gateway • Active</span>
            </div>
          </div>

          {/* ── Role Selector Tabs ── */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-2xl mb-5 shadow-xs">
            <button
              type="button"
              onClick={() => handleSelectRoleTab('student')}
              className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRoleTab === 'student'
                  ? 'bg-[#111111] text-[#FFFFFF] shadow-xs'
                  : 'text-[#111111]/75 hover:text-[#111111] hover:bg-[#FFFFFF]'
              }`}
            >
              <span>🎓</span>
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRoleTab('psychologist')}
              className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRoleTab === 'psychologist'
                  ? 'bg-[#111111] text-[#FFFFFF] shadow-xs'
                  : 'text-[#111111]/75 hover:text-[#111111] hover:bg-[#FFFFFF]'
              }`}
            >
              <span>🩺</span>
              <span>Counsellor</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRoleTab('admin')}
              className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRoleTab === 'admin'
                  ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
                  : 'text-[#111111]/75 hover:text-[#111111] hover:bg-[#FFFFFF]'
              }`}
            >
              <span>🛡️</span>
              <span>Admin</span>
            </button>
          </div>

          {/* Role Context Notification & 1-Click Access */}
          {activeRoleTab === 'admin' && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#F4C542]/20 border-2 border-[#111111] flex items-center justify-between gap-3 animate-fade-in">
              <div>
                <span className="font-black text-xs text-[#111111] block">VIT Institutional Administrator</span>
                <span className="text-[11px] text-[#111111]/70 font-medium">Executive Analytics & Governance</span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
              >
                1-Click Login
              </button>
            </div>
          )}

          {activeRoleTab === 'psychologist' && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111] flex items-center justify-between gap-3 animate-fade-in">
              <div>
                <span className="font-black text-xs text-[#111111] block">Senior Wellness Counsellor</span>
                <span className="text-[11px] text-[#111111]/70 font-medium">Dr. Ram Prudhvi Teja (VIT)</span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemo('psychologist')}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
              >
                1-Click Login
              </button>
            </div>
          )}

          {/* ── INSTAGRAM-STYLE RETURNING USER CARD ── */}
          {savedProfile && !showDirectForm && activeRoleTab === (savedProfile.role === 'admin' || savedProfile.role === 'super_admin' ? 'admin' : savedProfile.role === 'psychologist' ? 'psychologist' : 'student') ? (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111]/15 text-center flex flex-col items-center relative group">
                <div className="w-20 h-20 rounded-full bg-[#F4C542] border-2 border-[#111111] p-[2px] shadow-sm mb-3 flex items-center justify-center">
                  <span className="text-2xl font-black text-[#111111]">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] text-[10px] font-mono font-black tracking-wider mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-pulse" />
                  {roleBadge}
                </div>

                <h3 className="text-lg font-black text-[#111111] tracking-tight">
                  {displayName}
                </h3>
                {savedProfile.email && (
                  <p className="text-xs text-[#111111]/60 mt-0.5 font-mono">
                    {savedProfile.email}
                  </p>
                )}
              </div>

              {/* One-Tap Continue Button */}
              <button
                type="button"
                onClick={handleContinueAsSaved}
                disabled={loading}
                className="w-full bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black py-3.5 px-4 rounded-2xl border-2 border-[#111111] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                    <span>Restoring session...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as {displayName}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              {/* Switch Account */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectForm(true)}
                  className="text-xs text-[#111111]/70 hover:text-[#111111] font-bold transition-colors underline underline-offset-4 cursor-pointer"
                >
                  Log into another account
                </button>
              </div>
            </div>
          ) : (
            /* ── DIRECT LOGIN FORM ── */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1.5">
                  College ID / Official Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/50" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. 21B91A0501@vishnu.edu.in"
                    className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-2xl px-10 py-3.5 text-sm text-[#111111] placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#F4C542] transition-colors font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/50" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-2xl px-10 py-3.5 text-sm text-[#111111] placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#F4C542] transition-colors font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#111111]/50 hover:text-[#111111] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {savedProfile && (
                  <button
                    type="button"
                    onClick={() => setShowDirectForm(false)}
                    className="text-xs text-[#111111]/60 hover:text-[#111111] font-bold transition-colors cursor-pointer"
                  >
                    ← Back to saved
                  </button>
                )}
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#111111] hover:underline font-bold transition-colors ml-auto"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-3 font-semibold">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black py-4 px-4 rounded-2xl border-2 border-[#111111] transition-all duration-200 disabled:opacity-50 shadow-md flex items-center justify-center gap-2 mt-2 group cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              {/* New student register */}
              <div className="mt-5 text-center pt-2">
                <Link
                  to="/register"
                  className="text-xs text-[#111111]/70 hover:text-[#111111] transition-colors"
                >
                  New student? <span className="text-[#111111] font-black underline underline-offset-4">Create anonymous account</span>
                </Link>
              </div>

              {/* ── Quick One-Tap Role Demo Access ── */}
              <div className="mt-5 pt-4 border-t border-[#111111]/10">
                <p className="text-[10px] font-mono font-black uppercase tracking-wider text-[#111111]/60 text-center mb-2.5">
                  1-Tap Instant Demo Access
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('student')}
                    disabled={loading}
                    className="p-2.5 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4C542]/25 border-2 border-[#111111]/15 hover:border-[#111111] text-center transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95 group shadow-2xs"
                    title="Sign in as Student"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🎓</span>
                    <span className="text-[11px] font-black text-[#111111]">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('psychologist')}
                    disabled={loading}
                    className="p-2.5 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4C542]/25 border-2 border-[#111111]/15 hover:border-[#111111] text-center transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95 group shadow-2xs"
                    title="Sign in as Senior Counsellor (Dr. Ram Prudhvi Teja)"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🩺</span>
                    <span className="text-[11px] font-black text-[#111111]">Counsellor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin')}
                    disabled={loading}
                    className="p-2.5 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4C542]/25 border-2 border-[#111111]/15 hover:border-[#111111] text-center transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95 group shadow-2xs"
                    title="Sign in as Institutional Administrator"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🛡️</span>
                    <span className="text-[11px] font-black text-[#111111]">Admin</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Institutional Security Notice */}
          <div className="mt-6 pt-4 border-t border-[#111111]/10 text-center">
            <p className="text-[11px] text-[#111111]/50 font-mono flex items-center justify-center gap-1.5 font-medium">
              <span>🔒 Zero-Knowledge Privacy · SVES Wellness Protocol</span>
            </p>
          </div>
        </div>

        {/* ── Prominent Crisis / Emergency Support Entrypoint ── */}
        <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl border-2 border-[#111111] shadow-md flex items-center justify-between gap-4 text-[#111111]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border-2 border-rose-600 flex items-center justify-center shrink-0">
              <LifeBuoy className="text-rose-600" size={20} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#111111]">Need immediate crisis help?</h3>
              <p className="text-[11px] text-[#111111]/60 font-medium">24/7 Campus SOS & Emergency Helpline</p>
            </div>
          </div>

          <Link
            to="/student/emergency"
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl border-2 border-[#111111] transition-all shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>Emergency</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

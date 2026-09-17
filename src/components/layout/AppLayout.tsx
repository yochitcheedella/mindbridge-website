import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, Home, Sparkles, Brain, Wind, Activity, Edit3, 
  Calendar, Users, Moon, AlertTriangle, Settings, LogOut, 
  Menu, X, Bell, UserCheck, PieChart, FileText, ChevronRight, Clock
} from 'lucide-react';
import { 
  getAuth, clearAuth, getAlias, getUserName, getRole, getHomeRoute, 
  type UserRole, loginAsPsychologistDemo, loginAsAdminDemo, loginAsStudentDemo, loginAsSuperAdminDemo 
} from '../../utils/auth';
import { screenTimeTracker, type ScreenTimeState } from '../../utils/screenTimeTracker';

interface NavItem {
  path: string;
  icon: string | React.ReactNode;
  label: string;
  badge?: string;
  isSpecial?: boolean;
}

const STUDENT_NAV: NavItem[] = [
  { path: '/student/home', icon: 'home', label: 'Dashboard' },
  { path: '/student/campus-feed', icon: 'dynamic_feed', label: 'Campus Feed', badge: 'NEW' },
  { path: '/student/events', icon: 'event', label: 'Campus Wellness Events', badge: 'VWC' },
  { path: '/student/appointments', icon: 'psychology', label: 'Psychologists & Counselors', badge: '7 PRO' },
  { path: '/student/chat', icon: 'smart_toy', label: 'AI Therapy Guide', badge: 'PRO' },
  { path: '/student/voice-therapist', icon: 'record_voice_over', label: 'AI Voice Therapist', badge: 'VOICE' },
  { path: '/student/messages', icon: 'forum', label: 'Counselor Messages', badge: 'ANON' },
  { path: '/student/cbt-reframing', icon: 'psychology', label: 'CBT Thought Studio', badge: 'NEW' },
  { path: '/student/breathwork', icon: 'air', label: 'Calm Canopy Breathwork' },
  { path: '/student/digital-detox', icon: 'screen_lock_portrait', label: 'Digital Detox' },
  { path: '/student/mind-puzzles', icon: 'extension', label: 'Mind Games & Puzzles' },
  { path: '/student/wellness', icon: 'self_improvement', label: 'Wellness Exercises' },
  { path: '/student/sleep', icon: 'bedtime', label: 'Sleep & Mood Tracker' },
  { path: '/student/habits', icon: 'check_circle', label: 'Habit Tracker' },
  { path: '/student/assessments', icon: 'quiz', label: 'Clinical Assessments' },
  { path: '/student/journal', icon: 'edit_note', label: 'Clinical Journal' },
  { path: '/student/recovery-plan', icon: 'healing', label: 'Follow-Up Plan' },
  { path: '/student/community', icon: 'diversity_3', label: 'Peer Community' },
  { path: '/student/emergency', icon: 'emergency', label: 'Crisis SOS & Helplines', isSpecial: true },
];

const PSYCHOLOGIST_NAV: NavItem[] = [
  { path: '/psychologist/dashboard', icon: 'dashboard', label: 'Triage & Risk Radar', badge: 'LIVE' },
  { path: '/psychologist/campus-feed', icon: 'dynamic_feed', label: 'Campus Feed', badge: 'POST' },
  { path: '/psychologist/events', icon: 'event', label: 'Campus Wellness Events', badge: 'VWC' },
  { path: '/psychologist/patients', icon: 'groups', label: 'Patient Roster' },
  { path: '/psychologist/soap-notes', icon: 'clinical_notes', label: 'SOAP Clinical Notes' },
  { path: '/psychologist/calendar', icon: 'calendar_month', label: 'Session Schedule' },
  { path: '/psychologist/mind-puzzles', icon: 'extension', label: 'Mind Games & Puzzles' },
  { path: '/psychologist/diary', icon: 'edit_note', label: 'Counsellor Diary' },
  { path: '/psychologist/profile', icon: 'settings', label: 'Counselor Profile' },
];

const ADMIN_NAV: NavItem[] = [
  { path: '/admin/dashboard', icon: 'pie_chart', label: 'Executive Analytics' },
  { path: '/admin/users', icon: 'manage_accounts', label: 'User Management' },
  { path: '/admin/reports', icon: 'analytics', label: 'Institutional Reports' },
  { path: '/admin/manage-feed', icon: 'dynamic_feed', label: 'Manage Campus Feed' },
  { path: '/admin/settings', icon: 'security', label: 'Platform Security' },
];

const SUPERADMIN_NAV: NavItem[] = [
  { path: '/superadmin/dashboard', icon: 'corporate_fare', label: 'Campus Deployments', badge: 'ROOT' },
  { path: '/admin/dashboard', icon: 'pie_chart', label: 'Executive Analytics' },
  { path: '/admin/users', icon: 'manage_accounts', label: 'Personnel & Accounts' },
  { path: '/admin/reports', icon: 'analytics', label: 'Institutional Reports' },
  { path: '/admin/manage-feed', icon: 'dynamic_feed', label: 'Manage Campus Feed' },
  { path: '/admin/settings', icon: 'security', label: 'Security & Governance' },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setLocalAuth] = useState(() => getAuth());

  useEffect(() => {
    setLocalAuth(getAuth());
  }, [location.pathname]);

  const isPsychRoute = location.pathname.startsWith('/psychologist');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSuperAdminRoute = location.pathname.startsWith('/superadmin') || location.pathname.startsWith('/super-admin');

  // Derive effective role from current route path
  const effectiveRole: UserRole = isSuperAdminRoute
    ? 'super_admin'
    : isPsychRoute
    ? 'psychologist'
    : isAdminRoute
    ? 'admin'
    : (auth?.role || 'student');

  let navItems: NavItem[] = STUDENT_NAV;
  if (effectiveRole === 'super_admin') {
    navItems = SUPERADMIN_NAV;
  } else if (effectiveRole === 'psychologist') {
    navItems = PSYCHOLOGIST_NAV;
  } else if (effectiveRole === 'admin') {
    navItems = ADMIN_NAV;
  }

  // Auto-sync authenticated session if user visits a staff portal with mismatched session
  useEffect(() => {
    let cancelled = false;
    async function alignSession() {
      if (isSuperAdminRoute && auth?.role !== 'super_admin') {
        const synced = await loginAsSuperAdminDemo();
        if (!cancelled) setLocalAuth(synced);
      } else if (isPsychRoute && auth?.role !== 'psychologist') {
        const synced = await loginAsPsychologistDemo();
        if (!cancelled) setLocalAuth(synced);
      } else if (isAdminRoute && auth?.role !== 'admin' && auth?.role !== 'super_admin') {
        const synced = await loginAsAdminDemo();
        if (!cancelled) setLocalAuth(synced);
      }
    }
    alignSession();
    return () => { cancelled = true; };
  }, [isSuperAdminRoute, isPsychRoute, isAdminRoute, auth?.role]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  let displayName = 'User';
  let roleLabel = 'Student Account';

  if (effectiveRole === 'super_admin') {
    displayName = (auth?.role === 'super_admin' && auth?.name) ? auth.name : 'Central Society Governance';
    roleLabel = 'ROOT Governance';
  } else if (effectiveRole === 'psychologist') {
    displayName = (auth?.role === 'psychologist' && auth?.name) ? auth.name : 'Dr. Ram Prudhvi Teja';
    roleLabel = 'Counsellor Account';
  } else if (effectiveRole === 'admin') {
    displayName = (auth?.role === 'admin' && auth?.name) ? auth.name : 'VIT Institutional Administrator';
    roleLabel = 'Admin Account';
  } else {
    displayName = auth?.role === 'student' ? (auth?.anonymous_alias || getAlias()) : (auth?.name || 'StarlightSeeker');
    roleLabel = 'Student Account';
  }

  const [screenState, setScreenState] = useState<ScreenTimeState | null>(null);
  const [dismissedBreakBanner, setDismissedBreakBanner] = useState(false);

  useEffect(() => {
    if (effectiveRole === 'student') {
      const unsub = screenTimeTracker.subscribe((state) => {
        setScreenState(state);
      });
      const unsubModal = screenTimeTracker.onAlertModal(() => {
        setDismissedBreakBanner(false);
      });
      return () => {
        unsub();
        unsubModal();
      };
    }
  }, [effectiveRole]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex text-[#111111] overflow-x-hidden selection:bg-[#F4C542] selection:text-[#111111]">
      {/* ── Mobile Responsive Navigation Drawer (Slide-Over) ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex animate-fade-in">
          <div 
            className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative w-80 max-w-[85vw] h-full bg-[#FFFFFF] border-r-2 border-[#111111] flex flex-col shadow-2xl z-10 animate-slide-right">
            {/* Drawer Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-[#111111]/10 shrink-0">
              <Link 
                to={getHomeRoute(effectiveRole)} 
                onClick={() => setMobileMenuOpen(false)} 
                className="flex items-center gap-3 cursor-pointer"
              >
                <img 
                  src="/logo.png" 
                  alt="Vishnu Wellness Centre" 
                  className="w-10 h-10 rounded-full object-cover border border-[#111111]/20 bg-[#FFFFFF]" 
                />
                <div>
                  <span className="font-heading font-black text-base text-[#111111] tracking-tight leading-tight block">MindBridge</span>
                  <span className="block text-[10px] uppercase font-mono tracking-wider text-[#111111]/60 font-semibold">SVES Wellness</span>
                </div>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-[#111111]/70 hover:text-[#111111] p-1.5 rounded-xl hover:bg-[#111111]/5 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-4 m-4 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111]/15 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] font-black text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="font-heading font-black text-sm text-[#111111] truncate">{displayName}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#F4C542] border border-[#111111]"></span>
                  <span className="text-[11px] font-mono capitalize text-[#111111]/60 font-bold">{roleLabel}</span>
                </div>
              </div>
            </div>

            {/* Nav Items (Scrollable) */}
            <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5 hide-scrollbar">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-[#F4C542] text-[#111111] font-black border-2 border-[#111111] shadow-xs'
                        : item.isSpecial
                        ? 'bg-[#FAFAFA] text-[#111111] hover:bg-[#111111]/5 border border-[#111111]/20 font-bold'
                        : 'text-[#111111]/75 hover:text-[#111111] hover:bg-[#111111]/5 font-medium'
                    }`}
                  >
                    <span 
                      className="material-symbols-outlined text-xl text-[#111111]"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm tracking-tight flex-1 font-bold">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black tracking-wider uppercase ${
                        isActive ? 'bg-[#111111] text-[#FFFFFF]' : 'bg-[#F4C542] text-[#111111] border border-[#111111]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Sticky Footer / Logout (Always visible while navigating & scrolling) */}
            <div className="shrink-0 p-4 border-t-2 border-[#111111]/10 bg-[#FFFFFF] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#FFFFFF] hover:bg-rose-50 border-2 border-[#111111] text-rose-600 hover:text-rose-700 transition-colors font-black text-sm shadow-xs active:scale-98 cursor-pointer"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Widescreen Desktop Minimal White Sidebar ── */}
      <aside 
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-50 transition-all duration-300 bg-[#FFFFFF] border-r border-[#111111]/10 shadow-sm ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-[#111111]/10">
          {!isCollapsed ? (
            <Link to={getHomeRoute(effectiveRole)} className="flex items-center gap-3 group overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Vishnu Wellness Centre" 
                className="w-10 h-10 rounded-full object-cover border border-[#111111]/15 bg-[#FFFFFF] group-hover:scale-105 transition-transform flex-shrink-0" 
              />
              <div className="overflow-hidden">
                <span className="font-heading font-black text-base text-[#111111] tracking-tight leading-tight block truncate">MindBridge</span>
                <span className="block text-[10px] uppercase font-mono tracking-wider text-[#111111]/60 font-bold truncate">SVES Wellness</span>
              </div>
            </Link>
          ) : (
            <Link 
              to={getHomeRoute(effectiveRole)} 
              title="MindBridge Home"
              className="w-10 h-10 mx-auto flex items-center justify-center hover:scale-105 transition-transform"
            >
              <img 
                src="/logo.png" 
                alt="Vishnu Wellness Centre" 
                className="w-10 h-10 rounded-full object-cover border border-[#111111]/15 bg-[#FFFFFF]" 
              />
            </Link>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="text-[#111111]/60 hover:text-[#111111] p-1.5 rounded-xl hover:bg-[#111111]/5 transition-colors flex-shrink-0"
            title="Toggle Sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isCollapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
        </div>

        {/* User Profile Thumbnail */}
        {!isCollapsed && (
          <div className="p-3.5 m-3 rounded-2xl bg-[#FAFAFA] border border-[#111111]/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] font-black text-sm shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-heading font-black text-sm text-[#111111] truncate">{displayName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#F4C542] border border-[#111111]"></span>
                <span className="text-[11px] font-mono capitalize text-[#111111]/60 font-semibold">{roleLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-[#F4C542] text-[#111111] font-black border-2 border-[#111111] shadow-xs'
                    : item.isSpecial
                    ? 'bg-[#FAFAFA] text-[#111111] hover:bg-[#111111]/5 border border-[#111111]/20 font-bold'
                    : 'text-[#111111]/75 hover:text-[#111111] hover:bg-[#111111]/5 font-medium'
                }`}
              >
                <span 
                  className="material-symbols-outlined transition-transform duration-150 group-hover:scale-105 text-xl text-[#111111]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <span className="text-sm flex-1 tracking-tight truncate">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black tracking-wider uppercase ${
                    isActive ? 'bg-[#111111] text-[#FFFFFF]' : 'bg-[#F4C542] text-[#111111] border border-[#111111]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-[#111111]/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3.5 py-2.5 rounded-2xl border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors duration-150 font-bold text-sm`}
            title="Logout"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Canvas Widescreen Wrapper ── */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isCollapsed ? 'md:pl-20' : 'md:pl-72'
      }`}>
        {/* Top Header Bar (Desktop & Mobile with Notch Safe-Area) */}
        <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#111111]/10 px-4 sm:px-8 pt-[env(safe-area-inset-top,0px)] min-h-[4rem] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="md:hidden flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl text-[#111111] hover:bg-[#111111]/5 transition-colors border border-[#111111]/15 active:scale-95 shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
              <Link to={getHomeRoute(effectiveRole)} className="flex items-center gap-2 min-w-0">
                <img src="/logo.png" alt="Vishnu Wellness Centre" className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#111111]/20" />
                <span className="font-heading font-black text-sm text-[#111111] truncate">MindBridge</span>
              </Link>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FAFAFA] text-[#111111] border border-[#111111]/15">
              <span>🔒</span>
              <span>Zero-Knowledge Anonymity · SVES Wellness</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {effectiveRole === 'student' && screenState && (
              <Link
                to="/student/digital-detox"
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  screenState.hasExceededLimit
                    ? 'bg-rose-50 border-rose-500 text-rose-700 animate-pulse'
                    : 'bg-[#FAFAFA] border-[#111111]/20 text-[#111111] hover:bg-[#F4C542]/20'
                }`}
                title="Active Screen Time Tracker & Limit Status"
              >
                <Clock size={13} className={screenState.hasExceededLimit ? 'text-rose-600' : 'text-[#111111]'} />
                <span className="font-mono">
                  {Math.floor(screenState.activeSeconds / 3600) > 0 ? `${Math.floor(screenState.activeSeconds / 3600)}h ` : ''}
                  {Math.floor((screenState.activeSeconds % 3600) / 60)}m
                </span>
                {screenState.hasExceededLimit ? (
                  <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full">
                    Exceeded
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                )}
              </Link>
            )}

            {effectiveRole === 'student' && (
              <Link
                to="/student/emergency"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black tracking-wide border-2 border-[#111111] shadow-xs transition-all shrink-0 active:scale-95"
              >
                <AlertTriangle size={14} className="shrink-0" />
                <span className="hidden xs:inline">CRISIS </span>
                <span>SOS</span>
              </Link>
            )}

            {/* ── HIGHLIGHTED THREE CORE WORDS (Requirement 9) ── */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#F4C542] border-2 border-[#111111] text-[#111111] shadow-xs font-black shrink-0 tracking-wide select-none">
              <span className="w-2 h-2 rounded-full bg-[#111111] shrink-0 animate-ping" />
              <span className="text-[10px] sm:text-xs uppercase font-heading font-black tracking-wider whitespace-nowrap">
                <span>CONFIDENTIAL</span>
                <span className="mx-1 text-[#111111]/40">•</span>
                <span>EMPATHY</span>
                <span className="mx-1 text-[#111111]/40">•</span>
                <span>NON-JUDGMENT</span>
              </span>
            </div>

            <Link
              to={effectiveRole === 'student' ? '/student/notifications' : '#'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAFAFA] hover:bg-[#111111]/5 flex items-center justify-center text-[#111111] transition-colors relative border border-[#111111]/15 shrink-0"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F4C542] border border-[#111111]"></span>
            </Link>

            <Link
              to={effectiveRole === 'psychologist' ? '/psychologist/profile' : effectiveRole === 'admin' ? '/admin/settings' : '/student/profile'}
              className="shrink-0 group"
              title={`Logged in as ${displayName}`}
            >
              {/* Mobile compact avatar circle */}
              <div className="sm:hidden w-9 h-9 rounded-xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] font-black text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {/* Desktop pill */}
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#111111]/5 border border-[#111111]/15 transition-colors duration-150">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4C542] border border-[#111111]"></span>
                <span className="text-xs font-black text-[#111111] max-w-[120px] truncate">{displayName}</span>
              </div>
            </Link>

            {/* Quick Sticky Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#FFFFFF] hover:bg-rose-50 border-2 border-[#111111] text-[#111111] hover:text-rose-600 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 cursor-pointer font-black text-xs"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Responsive Content Container */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-36 sm:pb-32 md:pb-12">
          {children}
        </div>

        {/* ── SOCIAL MEDIA & SUPPORT ACTION BAR (Requirement 10) ── */}
        <footer className="w-full border-t border-[#111111]/10 bg-[#FAFAFA] py-4 px-4 sm:px-8 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-[#111111]/75">
              <img src="/logo.png" alt="Vishnu Wellness Centre" className="w-7 h-7 rounded-full object-cover border border-[#111111]/20 bg-white" />
              <div>
                <span className="font-heading font-black text-[#111111] block sm:inline">Vishnu Wellness Centre</span>
                <span className="text-[#111111]/60 text-[11px] sm:ml-1 font-medium">Empowering Minds. Inspiring Lives.</span>
              </div>
            </div>

            {/* Social Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
              <a 
                href="https://www.instagram.com/vishnu_wellness_centre?stkn=MW10Z2RqZW92c25xOQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-pink-50 border-2 border-[#111111] text-xs font-black text-[#111111] hover:text-pink-600 transition-all shadow-xs group cursor-pointer active:scale-95"
                title="Follow us on Instagram"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600" />
                <span>Instagram</span>
                <span className="text-[10px] font-mono text-[#111111]/50 group-hover:text-pink-600 font-normal">@vishnu_wellness_centre</span>
              </a>

              {(effectiveRole === 'admin' || effectiveRole === 'super_admin') ? (
                <>
                  <Link 
                    to="/admin/settings"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F4C542]/20 border border-[#111111]/20 text-xs font-bold text-[#111111] transition-all shadow-2xs"
                  >
                    <Shield size={13} />
                    <span>Platform Security</span>
                  </Link>
                  <Link 
                    to="/admin/reports"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F4C542]/20 border border-[#111111]/20 text-xs font-bold text-[#111111] transition-all shadow-2xs"
                  >
                    <FileText size={13} />
                    <span>Reports</span>
                  </Link>
                </>
              ) : effectiveRole === 'psychologist' ? (
                <>
                  <Link 
                    to="/psychologist/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F4C542]/20 border border-[#111111]/20 text-xs font-bold text-[#111111] transition-all shadow-2xs"
                  >
                    <Activity size={13} />
                    <span>Triage Radar</span>
                  </Link>
                  <Link
                    to="/student/emergency"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-rose-50 border border-[#111111]/20 text-xs font-bold text-rose-600 transition-all shadow-2xs"
                  >
                    <AlertTriangle size={13} />
                    <span>Crisis Helpline</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/student/events"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F4C542]/20 border border-[#111111]/20 text-xs font-bold text-[#111111] transition-all shadow-2xs"
                  >
                    <Calendar size={13} />
                    <span>VWC Events</span>
                  </Link>
                  <Link
                    to="/student/emergency"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-rose-50 border border-[#111111]/20 text-xs font-bold text-rose-600 transition-all shadow-2xs"
                  >
                    <AlertTriangle size={13} />
                    <span>Crisis Helpline</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </footer>

        {/* ── Floating Screen Time Break Reminder (Sender: 9100972237) ── */}
        {effectiveRole === 'student' && screenState?.hasExceededLimit && !dismissedBreakBanner && location.pathname !== '/student/digital-detox' && (
          <div className="fixed bottom-20 right-4 z-40 max-w-xs sm:max-w-sm p-4 rounded-2xl bg-[#FFFFFF] border-2 border-rose-500 shadow-xl flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Moon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-rose-950">Daily Screen Limit Reached</h4>
                <button
                  onClick={() => setDismissedBreakBanner(true)}
                  className="text-xs text-rose-800 hover:text-rose-950 font-bold p-0.5 cursor-pointer ml-2"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-rose-800 mt-0.5 leading-snug">
                Take a gentle 5–10 min rest. WhatsApp reminder prepared from 9100972237.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Link
                  to="/student/digital-detox"
                  className="inline-flex items-center gap-1 text-[11px] font-black text-[#111111] bg-[#F4C542] px-2.5 py-1 rounded-xl border border-[#111111] shadow-2xs hover:bg-[#e0b435]"
                >
                  <span>Open Digital Detox</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

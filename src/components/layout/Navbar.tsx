import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const STUDENT_NAV = [
  { path: '/student/home',         icon: 'home',       label: 'Home' },
  { path: '/student/journal',      icon: 'edit_note',  label: 'Journal' },
  { path: '/student/appointments', icon: 'event',      label: 'Sessions' },
  { path: '/student/chat',         icon: 'chat',       label: 'AI Guide' },
  { path: '/student/emergency',    icon: 'emergency',  label: 'SOS', isAlert: true },
];

const PSYCHOLOGIST_NAV = [
  { path: '/psychologist/dashboard', icon: 'dashboard',      label: 'Clinical' },
  { path: '/psychologist/patients',  icon: 'groups',         label: 'Patients' },
  { path: '/psychologist/soap-notes',icon: 'clinical_notes', label: 'Records' },
  { path: '/psychologist/calendar',  icon: 'calendar_month', label: 'Schedule' },
];

const ADMIN_NAV = [
  { path: '/admin/dashboard', icon: 'pie_chart', label: 'Analytics' },
  { path: '/admin/users',     icon: 'groups',    label: 'Personnel' },
  { path: '/admin/reports',   icon: 'bar_chart', label: 'Reports' },
  { path: '/admin/settings',  icon: 'settings',  label: 'Security' },
];

const SUPERADMIN_NAV = [
  { path: '/superadmin/dashboard', icon: 'corporate_fare', label: 'Campuses' },
  { path: '/admin/dashboard',      icon: 'pie_chart',      label: 'Analytics' },
  { path: '/admin/users',          icon: 'groups',         label: 'Personnel' },
  { path: '/admin/reports',        icon: 'bar_chart',      label: 'Reports' },
  { path: '/admin/settings',       icon: 'settings',       label: 'Security' },
];

export function Navbar() {
  const location = useLocation();

  let navItems: typeof STUDENT_NAV = [];
  if (location.pathname.startsWith('/student')) {
    navItems = STUDENT_NAV;
  } else if (location.pathname.startsWith('/psychologist')) {
    navItems = PSYCHOLOGIST_NAV;
  } else if (location.pathname.startsWith('/admin')) {
    navItems = ADMIN_NAV;
  } else if (location.pathname.startsWith('/superadmin')) {
    navItems = SUPERADMIN_NAV;
  }

  if (navItems.length === 0) return null;

  return (
    <nav className="md:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-50 rounded-2xl flex justify-around items-center min-h-[3.75rem] py-1 px-1 bg-[#FFFFFF] border-2 border-[#111111] shadow-lg font-sans">
      {navItems.map(({ path, icon, label, isAlert }: any) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`
              flex flex-col items-center justify-center py-1.5 px-2 rounded-xl active:scale-95 transition-all duration-150 flex-1 relative max-w-[72px]
              ${isActive
                ? 'bg-[#F4C542] text-[#111111] font-black border border-[#111111]'
                : isAlert 
                  ? 'text-[#111111] font-black bg-[#FAFAFA] border border-[#111111]/30 hover:bg-[#F4C542]' 
                  : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5 font-semibold'
              }
            `}
          >
            <span 
              className={`material-symbols-outlined text-[21px] mb-0.5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} 
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {icon}
            </span>
            <span className="text-[10px] tracking-tight font-bold truncate max-w-full">
              {label}
            </span>
            {isActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#111111]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
export default Navbar;

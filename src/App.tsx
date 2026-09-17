import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { AppLayout } from './components/layout/AppLayout';
import { getAuth, applyPrimaryColor, getHomeRoute, restoreSession, isSessionValid } from './utils/auth';

// ── Auth Pages ─────────────────────────────────────────────────────────────────
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ── Student Pages ──────────────────────────────────────────────────────────────
import StudentDashboard from './pages/StudentDashboard';
import AIChat from './pages/AIChat';
import MoodTracker from './pages/MoodTracker';
import Journal from './pages/Journal';
import Appointments from './pages/Appointments';
import WellnessExercises from './pages/WellnessExercises';
import HabitTracker from './pages/HabitTracker';
import Assessments from './pages/Assessments';
import SleepTracker from './pages/SleepTracker';
import FollowUpPlan from './pages/FollowUpPlan';
import Notifications from './pages/Notifications';
import VoiceTherapist from './pages/VoiceTherapist';
import EmergencyResponse from './pages/EmergencyResponse';
import ProfileSettings from './pages/ProfileSettings';
import Community from './pages/Community';
import CampusFeed from './pages/CampusFeed';

// ── NEW Mindblowing & Clinical Student Pages ───────────────────────────────────
import CognitiveReframing from './pages/CognitiveReframing';
import InteractiveBreathwork from './pages/InteractiveBreathwork';

// ── Psychologist Pages ─────────────────────────────────────────────────────────
import PsychologistDashboard from './pages/PsychologistDashboard';
import PsychologistPatients from './pages/PsychologistPatients';
import PsychologistCalendar from './pages/PsychologistCalendar';
import ClinicalSOAPNotes from './pages/ClinicalSOAPNotes';

// ── Admin Pages ────────────────────────────────────────────────────────────────
import AdminAnalytics from './pages/AdminAnalytics';
import AdminUsers from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';
import AnonymousAudioCall from './pages/AnonymousAudioCall';
import CounselorChat from './pages/CounselorChat';
import AdminFeedManager from './pages/AdminFeedManager';

// ── NEW Institutional Features: Super Admin, Digital Detox & Mind Puzzles ────
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import DigitalDetox from './pages/DigitalDetox';
import MindPuzzles from './pages/MindPuzzles';

import LandingPage from './pages/LandingPage';
import StudentEvents from './pages/StudentEvents';
import { AppSplashScreen } from './components/common/AppSplashScreen';
import ProtectedRoute from './components/auth/ProtectedRoute';

const withLayout = (element: React.ReactNode, allowedRoles?: string[]) => {
  const content = <AppLayout>{element}</AppLayout>;
  if (allowedRoles && allowedRoles.length > 0) {
    return <ProtectedRoute allowedRoles={allowedRoles}>{content}</ProtectedRoute>;
  }
  return content;
};

function App() {
  const [showSplash, setShowSplash] = React.useState(() => {
    // Check if launched as installed PWA / mobile standalone
    return window.matchMedia('(display-mode: standalone)').matches;
  });
  const [sessionResolved, setSessionResolved] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    // Startup Session Check (Instagram-style persistent authentication)
    let isMounted = true;
    async function initSession() {
      try {
        const session = await restoreSession();
        if (session?.primary_color) {
          applyPrimaryColor(session.primary_color);
        }
      } finally {
        if (isMounted) {
          setSessionResolved(true);
        }
      }
    }

    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeAuth = getAuth();
  const hasValidSession = Boolean(activeAuth && isSessionValid());
  const isExplicitLogout = location.search.includes('logout=true');

  return (
    <>
      {showSplash && (
        <AppSplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <Routes>
        {/* ── Public Institutional Website Landing Page ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Auth (No Sidebar / Layout) ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Student Routes (Wrapped in Widescreen AppLayout) ── */}
        <Route path="/student/home"            element={withLayout(<StudentDashboard />, ['student'])} />
        <Route path="/student/events"          element={withLayout(<StudentEvents />, ['student'])} />
        <Route path="/student/chat"            element={withLayout(<AIChat />, ['student'])} />
        <Route path="/student/messages"        element={<ProtectedRoute allowedRoles={['student']}><CounselorChat /></ProtectedRoute>} />
        <Route path="/student/counselor-chat"  element={<ProtectedRoute allowedRoles={['student']}><CounselorChat /></ProtectedRoute>} />
        <Route path="/student/cbt-reframing"   element={withLayout(<CognitiveReframing />, ['student'])} />
        <Route path="/student/breathwork"      element={withLayout(<InteractiveBreathwork />, ['student'])} />
        <Route path="/student/digital-detox"   element={withLayout(<DigitalDetox />, ['student'])} />
        <Route path="/student/mind-puzzles"    element={withLayout(<MindPuzzles />, ['student'])} />
        <Route path="/student/mood"            element={withLayout(<MoodTracker />, ['student'])} />
        <Route path="/student/journal"         element={withLayout(<Journal />, ['student'])} />
        <Route path="/student/appointments"    element={withLayout(<Appointments />, ['student'])} />
        <Route path="/student/wellness"        element={withLayout(<WellnessExercises />, ['student'])} />
        <Route path="/student/habits"          element={withLayout(<HabitTracker />, ['student'])} />
        <Route path="/student/assessments"     element={withLayout(<Assessments />, ['student'])} />
        <Route path="/student/sleep"           element={withLayout(<SleepTracker />, ['student'])} />
        <Route path="/student/recovery-plan"   element={withLayout(<FollowUpPlan />, ['student'])} />
        <Route path="/student/notifications"   element={withLayout(<Notifications />, ['student'])} />
        <Route path="/student/voice-therapist" element={withLayout(<VoiceTherapist />, ['student'])} />
        <Route path="/student/community"       element={withLayout(<Community />, ['student'])} />
        <Route path="/student/campus-feed"     element={withLayout(<CampusFeed />, ['student'])} />
        <Route path="/student/emergency"       element={withLayout(<EmergencyResponse />, ['student'])} />
        <Route path="/student/profile"         element={withLayout(<ProfileSettings />, ['student'])} />

        {/* ── Psychologist Routes ── */}
        <Route path="/psychologist/dashboard"    element={withLayout(<PsychologistDashboard />, ['psychologist', 'counsellor'])} />
        <Route path="/psychologist/campus-feed"  element={withLayout(<CampusFeed />, ['psychologist', 'counsellor'])} />
        <Route path="/psychologist/events"       element={withLayout(<StudentEvents />, ['psychologist', 'counsellor'])} />
        <Route path="/psychologist/patients"     element={withLayout(<PsychologistPatients />, ['psychologist', 'counsellor'])} />
        <Route path="/psychologist/soap-notes"   element={withLayout(<ClinicalSOAPNotes />, ['psychologist', 'counsellor'])} />
        <Route path="/psychologist/calendar"     element={withLayout(<PsychologistCalendar />, ['psychologist', 'counsellor'])} />
        <Route path="/psychologist/mind-puzzles" element={withLayout(<MindPuzzles />, ['psychologist', 'counsellor'])} />
        <Route path="/psychologist/diary"        element={withLayout(<Journal />, ['psychologist', 'counsellor'])} />
        <Route path="/psychologist/profile"      element={withLayout(<ProfileSettings />, ['psychologist', 'counsellor'])} />

        {/* ── Admin Routes ── */}
        <Route path="/admin"            element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/"           element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"  element={withLayout(<AdminAnalytics />, ['admin', 'super_admin'])} />
        <Route path="/admin/users"      element={withLayout(<AdminUsers />, ['admin', 'super_admin'])} />
        <Route path="/admin/reports"    element={withLayout(<AdminReports />, ['admin', 'super_admin'])} />
        <Route path="/admin/settings"   element={withLayout(<ProfileSettings />, ['admin', 'super_admin'])} />
        <Route path="/admin/manage-feed" element={withLayout(<AdminFeedManager />, ['admin', 'super_admin'])} />

        {/* ── Super Admin Routes ── */}
        <Route path="/superadmin"           element={<Navigate to="/superadmin/dashboard" replace />} />
        <Route path="/superadmin/"          element={<Navigate to="/superadmin/dashboard" replace />} />
        <Route path="/superadmin/dashboard" element={withLayout(<SuperAdminDashboard />, ['super_admin'])} />
        <Route path="/super-admin"          element={<Navigate to="/superadmin/dashboard" replace />} />
        <Route path="/super-admin/dashboard" element={<Navigate to="/superadmin/dashboard" replace />} />

        {/* ── Role Base Fallbacks ── */}
        <Route path="/student"      element={<Navigate to="/student/home" replace />} />
        <Route path="/student/"     element={<Navigate to="/student/home" replace />} />
        <Route path="/psychologist" element={<Navigate to="/psychologist/dashboard" replace />} />
        <Route path="/psychologist/" element={<Navigate to="/psychologist/dashboard" replace />} />

        {/* ── Anonymous Audio Call (Full screen distraction-free) ── */}
        <Route path="/call/:appointmentId" element={<AnonymousAudioCall />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Mobile Floating Bottom Navbar (hidden during active call) */}
      {!location.pathname.startsWith('/call/') && <Navbar />}
    </>
  );
}

export default App;

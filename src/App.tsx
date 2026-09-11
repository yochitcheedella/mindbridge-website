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

// ── NEW Institutional Features: Super Admin, Digital Detox & Mind Puzzles ────
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import DigitalDetox from './pages/DigitalDetox';
import MindPuzzles from './pages/MindPuzzles';

import LandingPage from './pages/LandingPage';
import { AppSplashScreen } from './components/common/AppSplashScreen';

const withLayout = (element: React.ReactNode) => (
  <AppLayout>
    {element}
  </AppLayout>
);

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
        <Route
          path="/"
          element={
            hasValidSession ? (
              <Navigate to={getHomeRoute(activeAuth!.role)} replace />
            ) : (
              <LandingPage />
            )
          }
        />

        {/* ── Auth (No Sidebar / Layout) ── */}
        <Route 
          path="/login"          
          element={
            hasValidSession && !isExplicitLogout ? (
              <Navigate to={getHomeRoute(activeAuth!.role)} replace />
            ) : (
              <Login />
            )
          } 
        />
        <Route 
          path="/register"       
          element={
            hasValidSession && !isExplicitLogout ? (
              <Navigate to={getHomeRoute(activeAuth!.role)} replace />
            ) : (
              <Register />
            )
          } 
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Student Routes (Wrapped in Widescreen AppLayout) ── */}
        <Route path="/student/home"            element={withLayout(<StudentDashboard />)} />
        <Route path="/student/chat"            element={withLayout(<AIChat />)} />
        <Route path="/student/messages"        element={<CounselorChat />} />
        <Route path="/student/counselor-chat"  element={<CounselorChat />} />
        <Route path="/student/cbt-reframing"   element={withLayout(<CognitiveReframing />)} />
        <Route path="/student/breathwork"      element={withLayout(<InteractiveBreathwork />)} />
        <Route path="/student/digital-detox"   element={withLayout(<DigitalDetox />)} />
        <Route path="/student/mind-puzzles"    element={withLayout(<MindPuzzles />)} />
        <Route path="/student/mood"            element={withLayout(<MoodTracker />)} />
        <Route path="/student/journal"         element={withLayout(<Journal />)} />
        <Route path="/student/appointments"    element={withLayout(<Appointments />)} />
        <Route path="/student/wellness"        element={withLayout(<WellnessExercises />)} />
        <Route path="/student/habits"          element={withLayout(<HabitTracker />)} />
        <Route path="/student/assessments"     element={withLayout(<Assessments />)} />
        <Route path="/student/sleep"           element={withLayout(<SleepTracker />)} />
        <Route path="/student/recovery-plan"   element={withLayout(<FollowUpPlan />)} />
        <Route path="/student/notifications"   element={withLayout(<Notifications />)} />
        <Route path="/student/voice-therapist" element={withLayout(<VoiceTherapist />)} />
        <Route path="/student/community"       element={withLayout(<Community />)} />
        <Route path="/student/emergency"       element={withLayout(<EmergencyResponse />)} />
        <Route path="/student/profile"         element={withLayout(<ProfileSettings />)} />

        {/* ── Psychologist Routes ── */}
        <Route path="/psychologist/dashboard"  element={withLayout(<PsychologistDashboard />)} />
        <Route path="/psychologist/patients"   element={withLayout(<PsychologistPatients />)} />
        <Route path="/psychologist/soap-notes" element={withLayout(<ClinicalSOAPNotes />)} />
        <Route path="/psychologist/calendar"   element={withLayout(<PsychologistCalendar />)} />
        <Route path="/psychologist/profile"    element={withLayout(<ProfileSettings />)} />

        {/* ── Admin Routes ── */}
        <Route path="/admin/dashboard"  element={withLayout(<AdminAnalytics />)} />
        <Route path="/admin/users"      element={withLayout(<AdminUsers />)} />
        <Route path="/admin/reports"    element={withLayout(<AdminReports />)} />
        <Route path="/admin/settings"   element={withLayout(<ProfileSettings />)} />

        {/* ── Super Admin Routes ── */}
        <Route path="/superadmin/dashboard" element={withLayout(<SuperAdminDashboard />)} />

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

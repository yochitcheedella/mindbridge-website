import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Brain, Wind, Zap, 
  ArrowRight, CheckCircle2, Shield, ShieldAlert, Award, Flame, Smile,
  Calendar, MessageSquare, PhoneCall, BookOpen, Clock, Heart, Users,
  X, Globe, Info, Lock, ChevronRight
} from 'lucide-react';
import { getAlias, apiFetch, isLoggedIn } from '../utils/auth';
import { OFFICIAL_COUNSELORS, VISHNU_WELLNESS_CENTRE, type CounselorData } from '../data/counselors';

import DailyFlashcardsModal from '../components/flashcards/DailyFlashcardsModal';
import CounselorFlashcard from '../components/flashcards/CounselorFlashcard';
import StudentScreeningModal, { type ScreeningSubmission } from '../components/clinical/StudentScreeningModal';
import SessionFeedbackModal from '../components/clinical/SessionFeedbackModal';
import ShareWorkModal from '../components/clinical/ShareWorkModal';
import { isTodayFlashcardsCompleted } from '../data/defaultFlashcards';

const MOOD_CONFIG = [
  { score: 5, icon: 'sentiment_very_satisfied', label: 'Thriving' },
  { score: 4, icon: 'sentiment_satisfied',      label: 'Calm' },
  { score: 3, icon: 'sentiment_neutral',        label: 'Balanced' },
  { score: 2, icon: 'sentiment_dissatisfied',   label: 'Stressed' },
  { score: 1, icon: 'sentiment_very_dissatisfied',label: 'Overwhelmed' },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [wellnessScore, setWellnessScore] = useState(78);
  const [streakDays, setStreakDays] = useState(5);
  const [dailyChallengeComplete, setDailyChallengeComplete] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [flashcardsDoneToday, setFlashcardsDoneToday] = useState(() => isTodayFlashcardsCompleted());
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showShareWorkModal, setShowShareWorkModal] = useState(false);
  const [latestScreening, setLatestScreening] = useState<ScreeningSubmission | null>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_screening_results');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      }
    } catch {}
    return null;
  });
  const [consentChecks, setConsentChecks] = useState({
    privacy: true,
    anonymous: true,
    aiRole: true,
    crisisSafety: true,
  });
  const [savingConsent, setSavingConsent] = useState(false);
  const [upcomingAppt, setUpcomingAppt] = useState<any | null>(null);
  const [counselors, setCounselors] = useState<CounselorData[]>(OFFICIAL_COUNSELORS);
  const [activeModalCounselor, setActiveModalCounselor] = useState<CounselorData | null>(null);
  const alias = getAlias();

  useEffect(() => {
    if (isLoggedIn()) {
      // Check consent
      const localConsent = localStorage.getItem('mindbridge_consent_accepted');
      if (!localConsent) {
        apiFetch('/api/auth/consent/status')
          .then(r => r.json())
          .then(data => {
            if (!data.has_consented) {
              setShowConsent(true);
            } else {
              localStorage.setItem('mindbridge_consent_accepted', 'true');
            }
          })
          .catch(() => {
            if (!localConsent) setShowConsent(true);
          });
      }

      apiFetch('/api/mood/today')
        .then(r => r.json())
        .then(data => {
          if (data.score) {
            setSelectedMood(data.score);
            setWellnessScore(Math.min(100, Math.round(data.score * 18 + 15)));
          }
        })
        .catch(() => {});

      // Fetch upcoming confirmed counseling appointment
      apiFetch('/api/appointments/mine')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const confirmed = data.find((a: any) => a.status === 'confirmed');
            if (confirmed) {
              setUpcomingAppt(confirmed);
            }
          }
        })
        .catch(() => {});

      // Fetch professional counselors & merge with brochure data
      apiFetch('/api/appointments/psychologists')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const merged = OFFICIAL_COUNSELORS.map(official => {
              const match = data.find((b: any) => 
                b.name.trim().toLowerCase() === official.name.trim().toLowerCase() ||
                official.name.trim().toLowerCase().includes(b.name.trim().toLowerCase())
              );
              return match ? { ...official, id: match.id } : official;
            });
            setCounselors(merged);
          }
        })
        .catch(() => {});
    }
    const savedStreak = localStorage.getItem('mindbridge_streak_days');
    if (savedStreak) setStreakDays(parseInt(savedStreak, 10));
  }, []);

  const handleAcceptConsent = async () => {
    setSavingConsent(true);
    try {
      if (isLoggedIn()) {
        await apiFetch('/api/auth/consent', {
          method: 'POST',
          body: JSON.stringify({
            policy_version: 'v1.4-vishnu',
            accepted_privacy: consentChecks.privacy,
            accepted_anonymous_policy: consentChecks.anonymous,
            accepted_crisis_terms: consentChecks.crisisSafety,
          }),
        });
      }
      localStorage.setItem('mindbridge_consent_accepted', 'true');
      setShowConsent(false);
    } catch {
      localStorage.setItem('mindbridge_consent_accepted', 'true');
      setShowConsent(false);
    } finally {
      setSavingConsent(false);
    }
  };

  const handleMoodSelect = async (score: number) => {
    setSelectedMood(score);
    setWellnessScore(Math.min(100, Math.round(score * 18 + 15)));
    try {
      if (isLoggedIn()) {
        await apiFetch('/api/mood/log', { method: 'POST', body: JSON.stringify({ score, note: 'Logged via interactive dashboard' }) });
      }
    } catch {}
    const newStreak = streakDays + 1;
    setStreakDays(newStreak);
    localStorage.setItem('mindbridge_streak_days', String(newStreak));
  };

  const handleCompleteChallenge = () => {
    setDailyChallengeComplete(true);
    setWellnessScore(prev => Math.min(100, prev + 5));
  };

  const firstName = alias || 'Student';
  const circumference = 175.93;
  const strokeDashoffset = circumference - (wellnessScore / 100) * circumference;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto pb-20 text-[#111111]">
      {/* ── Top Welcome Canopy ── */}
      <div className="rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] text-xs font-mono font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#111111]" />
              <span>Anonymous Institutional Shield Active</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] text-[11px] font-mono font-bold">
              <span>SVES Verified</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
            Welcome back, <span>{firstName}</span>
          </h1>
          <div className="flex items-center gap-2 pt-0.5 pb-1">
            <span className="w-2 h-2 rounded-full bg-[#F4C542] border border-[#111111]" />
            <span className="font-mono text-[11px] text-[#111111]/70 font-bold uppercase tracking-widest">
              {VISHNU_WELLNESS_CENTRE.name} · {VISHNU_WELLNESS_CENTRE.institution}
            </span>
          </div>
          <p className="text-sm text-[#111111]/70 max-w-xl leading-relaxed">
            Your calm space for mental wellness, resilience, and emotional equilibrium.
          </p>
        </div>

        {/* Vitality Ring & Streak */}
        <div className="flex items-center gap-6 bg-[#FAFAFA] p-5 rounded-2xl border border-[#111111]/15 shrink-0">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 absolute top-0 left-0 transform -rotate-90" viewBox="0 0 64 64">
              <circle className="text-[#111111]/10 stroke-current" cx="32" cy="32" fill="transparent" r="28" strokeWidth="5" />
              <circle 
                className="text-[#F4C542] stroke-current transition-all duration-1000 ease-out" 
                cx="32" cy="32" fill="transparent" r="28" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" strokeWidth="5"
              />
            </svg>
            <div className="flex flex-col items-center justify-center z-10">
              <span className="font-heading font-black text-2xl text-[#111111] leading-none">{wellnessScore}</span>
              <span className="font-mono text-[9px] uppercase font-black text-[#111111]">Vitality</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[#111111] font-heading font-black text-sm mb-1">
              <Flame size={18} className="fill-[#F4C542] text-[#111111]" />
              <span>{streakDays}-Day Resilience</span>
            </div>
            <p className="text-xs text-[#111111]/60 max-w-[150px] leading-snug">
              Consistent daily reflection keeps emotional regulation well tuned.
            </p>
          </div>
        </div>
      </div>

      {/* ── Upcoming Confirmed Session Reminder ── */}
      {upcomingAppt && (
        <div className="p-5 sm:p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F4C542] border-2 border-[#111111] text-[#111111] flex items-center justify-center shrink-0">
              <span className="text-3xl">🧠</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#111111] bg-[#F4C542] px-2.5 py-0.5 rounded-full border border-[#111111]">
                  Confirmed Session
                </span>
                <span className="w-2 h-2 rounded-full bg-[#111111]" />
              </div>
              <h3 className="text-xl font-black font-heading text-[#111111]">{upcomingAppt.psychologist_name}</h3>
              <p className="text-xs text-[#111111]/60 font-semibold">Wellness Counsellor</p>
              
              <div className="flex items-center gap-2 mt-2 text-xs text-[#111111] font-mono font-bold">
                <Clock size={14} className="text-[#111111]" />
                <span>
                  {new Date(upcomingAppt.slot_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • {new Date(upcomingAppt.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => navigate(`/student/messages?appointmentId=${upcomingAppt.id}`)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#FFFFFF] hover:bg-[#111111]/5 text-[#111111] font-bold text-sm border border-[#111111] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageSquare size={16} />
              <span>Message</span>
            </button>
            <button
              onClick={() => navigate(`/call/${upcomingAppt.id}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-sm border-2 border-[#111111] transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
            >
              <PhoneCall size={16} />
              <span>Start Session</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SVES STUDENT WELLBEING SCREENING FORM (REQ 14) ── */}
      <div className="p-6 sm:p-7 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4C542]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-[#F4C542] text-[#111111] border border-[#111111]">
              Mandatory Wellbeing Screening
            </span>
            {latestScreening ? (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black border ${
                (latestScreening.riskTier || latestScreening.risk_level) === 'High' 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : (latestScreening.riskTier || latestScreening.risk_level) === 'Medium'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-green-100 text-green-900 border-green-300'
              }`}>
                ✓ Completed ({(latestScreening.riskTier || latestScreening.risk_level || 'Low')} Risk Tier · DASS Score {latestScreening.dassScores?.total ?? latestScreening.dass_scores?.total ?? 0})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FAFAFA] text-[#111111] border border-[#111111]/20">
                Action Recommended
              </span>
            )}
            <span className="text-[11px] font-mono text-[#111111]/60">38 Clinical Questions · Bilingual EN/TE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#111111] tracking-tight flex items-center gap-2">
            <span>🛡️</span>
            <span>Student Wellbeing &amp; Triage Assessment</span>
          </h2>
          <p className="text-sm text-[#111111]/70 leading-relaxed font-medium">
            Confidential DASS-21 psychological screening aligned with Sri Vishnu Educational Society clinical protocols. Automatically stratifies support needs and connects you directly with campus counsellors.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 z-10">
          <button
            onClick={() => setShowScreeningModal(true)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-sm border-2 border-[#111111] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{latestScreening ? 'Retake / Update Screening' : 'Take Wellbeing Screening'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ── QUICK ACTION DOCK: RAPPORT SHARING (REQ 6) & SESSION FEEDBACK (REQ 11, 12) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Share Work Card (Req 6) */}
        <div className="p-5 sm:p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                Therapeutic Rapport
              </span>
            </div>
            <h3 className="text-lg font-heading font-black text-[#111111] flex items-center gap-2">
              <span>✍️</span>
              <span>Share Work with Your Counsellor</span>
            </h3>
            <p className="text-xs text-[#111111]/70 leading-relaxed">
              Share private creative poems, diary entries, or milestones with your counsellor before your session to deepen 1-on-1 rapport.
            </p>
          </div>
          <button
            onClick={() => setShowShareWorkModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FAFAFA] hover:bg-[#F4C542] text-[#111111] font-black text-xs border border-[#111111] shrink-0 self-center transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Share Work
          </button>
        </div>

        {/* Give Session Feedback Card (Req 11 & 12) */}
        <div className="p-5 sm:p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#FAFAFA] px-2 py-0.5 rounded-full border border-[#111111]/20">
                Non-Star Feedback
              </span>
            </div>
            <h3 className="text-lg font-heading font-black text-[#111111] flex items-center gap-2">
              <span>🌱</span>
              <span>Session Resonance Feedback</span>
            </h3>
            <p className="text-xs text-[#111111]/70 leading-relaxed">
              Rate your recent counselling experience using our innovative Emotive Resonance Matrix and 10-point Therapeutic Pulse.
            </p>
          </div>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shrink-0 self-center transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Give Feedback
          </button>
        </div>
      </div>

      {/* ── DAILY WELLNESS 5 FLASHCARDS HERO CARD ── */}
      <div className="p-6 sm:p-7 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-[#F4C542] text-[#111111] border border-[#111111]">
              Daily Habit
            </span>
            {flashcardsDoneToday && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FAFAFA] text-[#111111] border border-[#111111]/20">
                ✓ Completed Today
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight flex items-center gap-2">
            <span>🧠</span>
            <span>5 New Flashcards</span>
          </h2>
          <p className="text-sm font-medium text-[#111111]/70 max-w-lg leading-relaxed">
            Curated daily cognitive insights from Vishnu Wellness Centre counsellors and AI. Learn something useful in less than 2 minutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => setShowFlashcardsModal(true)}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-sm tracking-wide border-2 border-[#111111] transition-all shadow-xs active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{flashcardsDoneToday ? 'Review Flashcards' : 'Start Flashcards'}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── 7 DEDICATED WELLNESS COUNSELLORS ── */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#111111]/15 bg-[#FFFFFF] space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111111]/10 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#111111] p-0.5 bg-white shrink-0">
              <img 
                src={VISHNU_WELLNESS_CENTRE.logo_url} 
                alt="Vishnu Wellness Centre" 
                className="w-full h-full object-contain rounded-full" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#111111] font-black bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                  {VISHNU_WELLNESS_CENTRE.institution}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#111111]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111111] mt-0.5">
                Our 7 Dedicated Wellness Counsellors
              </h2>
              <p className="text-xs text-[#111111]/60 font-medium">
                Tap any counsellor to view their complete bio &amp; book a session
              </p>
            </div>
          </div>
          
          <Link
            to="/student/appointments"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs uppercase tracking-wider border-2 border-[#111111] transition-all shadow-xs shrink-0 self-start sm:self-auto active:scale-95"
          >
            <span>Book Counsellor</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* 7 Counselors Flashcards Grid (Req 1) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {counselors.map((c) => (
            <CounselorFlashcard 
              key={c.name}
              counselor={c}
              onViewBio={setActiveModalCounselor}
              isCompact={true}
            />
          ))}
        </div>
      </div>

      {/* ── 3-Column Interactive Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Daily Mood & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Daily Mood Pulse */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-black text-[#111111] flex items-center gap-2">
                <Smile className="text-[#111111]" size={22} />
                <span>Daily Mood Pulse</span>
              </h2>
              {selectedMood && <CheckCircle2 className="text-[#111111]" size={18} />}
            </div>
            <p className="text-xs text-[#111111]/60">
              Select how you feel right now:
            </p>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
              {MOOD_CONFIG.map((m) => {
                const isActive = selectedMood === m.score;
                return (
                  <button
                    key={m.score}
                    onClick={() => handleMoodSelect(m.score)}
                    className={`flex flex-col items-center justify-center py-2 px-1 sm:p-2.5 rounded-2xl border-2 transition-all duration-150 group cursor-pointer ${
                      isActive
                        ? 'bg-[#F4C542] border-[#111111] text-[#111111] font-black scale-105 shadow-xs'
                        : 'bg-[#FAFAFA] border-[#111111]/15 hover:border-[#111111] text-[#111111]/70 hover:text-[#111111]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl sm:text-2xl mb-1">
                      {m.icon}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-tight truncate w-full text-center leading-tight">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedMood && (
              <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 text-xs text-[#111111] flex items-center justify-between animate-fade-in font-bold">
                <span>Mood pulse logged! +5 Vitality</span>
                <Link to="/student/mood" className="font-black hover:underline flex items-center gap-1 text-[#111111]">
                  <span>Trends</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions (Quick Chat & Journal) */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/student/journal')}
              className="bg-[#FFFFFF] rounded-2xl border border-[#111111]/15 p-4 flex flex-col items-start gap-3 hover:bg-[#FAFAFA] transition-all group shadow-xs cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 flex items-center justify-center group-hover:bg-[#F4C542] transition-colors">
                <BookOpen className="text-[#111111]" size={18} />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-heading font-black text-sm text-[#111111]">Daily Journal</span>
                <span className="text-[10px] text-[#111111]/50 mt-0.5">Private reflections</span>
              </div>
            </button>

            <button 
              onClick={() => navigate('/student/chat')}
              className="bg-[#FFFFFF] rounded-2xl border border-[#111111]/15 p-4 flex flex-col items-start gap-3 hover:bg-[#FAFAFA] transition-all group shadow-xs cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 flex items-center justify-center group-hover:bg-[#F4C542] transition-colors">
                <MessageSquare className="text-[#111111]" size={18} />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-heading font-black text-sm text-[#111111]">AI Guide Chat</span>
                <span className="text-[10px] text-[#111111]/50 mt-0.5">24/7 empathetic listener</span>
              </div>
            </button>
          </div>

          {/* ── DIGITAL DETOX & MIND PUZZLE GAMES WIDGETS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Digital Detox Card */}
            <div 
              onClick={() => navigate('/student/digital-detox')}
              className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] hover:bg-[#FAFAFA] transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F4C542] border border-[#111111] text-[#111111] flex items-center justify-center">
                    <Flame size={18} className="fill-[#111111]" />
                  </div>
                  <span className="text-[10px] font-black text-[#111111] bg-[#FAFAFA] px-2 py-0.5 rounded-full border border-[#111111]/20">
                    🔥 3d Streak
                  </span>
                </div>
                <h3 className="font-heading font-black text-sm text-[#111111]">
                  Digital Detox
                </h3>
                <p className="text-[11px] text-[#111111]/60 mt-1 leading-snug">
                  Screen: 4h 32m · Take 10m break
                </p>
              </div>
              <button className="mt-3 px-3 py-1.5 rounded-xl bg-[#F4C542] text-[#111111] font-black text-[11px] border border-[#111111] flex items-center justify-center gap-1">
                <span>Begin Digital Detox</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Mind Puzzle Games Card */}
            <div 
              onClick={() => navigate('/student/mind-puzzles')}
              className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] hover:bg-[#FAFAFA] transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F4C542] border border-[#111111] text-[#111111] flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <span className="text-[10px] font-black text-[#111111] bg-[#FAFAFA] px-2 py-0.5 rounded-full border border-[#111111]/20">
                    6 Games
                  </span>
                </div>
                <h3 className="font-heading font-black text-sm text-[#111111]">
                  Mind Puzzles
                </h3>
                <p className="text-[11px] text-[#111111]/60 mt-1 leading-snug">
                  Memory, Word & Number games
                </p>
              </div>
              <button className="mt-3 px-3 py-1.5 rounded-xl bg-[#F4C542] text-[#111111] font-black text-[11px] border border-[#111111] flex items-center justify-center gap-1">
                <span>Play Mind Puzzle</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Stress & Burnout Radar */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-[#111111]">Stress Radar</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] text-[10px] font-mono font-bold">Stable</span>
            </div>
            <h3 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
              <Zap className="text-[#F4C542] fill-[#F4C542]" size={18} />
              <span>Cognitive Fatigue Level</span>
            </h3>
            <div className="w-full bg-[#FAFAFA] border border-[#111111]/15 h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#111111] h-full w-2/5 rounded-full transition-all duration-1000" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#111111]/70 font-semibold">
              <span>Status: Low Burnout</span>
              <Link to="/student/assessments" className="text-[#111111] font-black hover:underline flex items-center gap-1">
                <span>Check Score</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Clinical Suites (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-black text-[#111111] flex items-center gap-2">
              <Sparkles className="text-[#F4C542]" size={20} />
              <span>Evidence-Based Clinical Suites</span>
            </h2>
            <span className="text-xs font-mono text-[#111111]/50 font-bold">Self-Regulation</span>
          </div>

          {/* Feature 1: Thought Reframing */}
          <div 
            onClick={() => navigate('/student/cbt-reframing')}
            className="p-5 sm:p-6 rounded-3xl border-2 border-[#111111] hover:bg-[#FAFAFA] transition-all duration-200 group cursor-pointer shadow-xs bg-[#FFFFFF]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] font-bold group-hover:scale-105 transition-transform">
                <Brain size={24} />
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] font-mono font-black text-xs uppercase tracking-wider">
                CBT Protocol
              </span>
            </div>
            <div className="mt-4 space-y-1.5">
              <h3 className="text-lg font-heading font-black text-[#111111]">
                Thought Reframing Studio
              </h3>
              <p className="text-xs text-[#111111]/70 leading-relaxed font-medium">
                Deconstruct academic anxiety and imposter syndrome into logical equilibrium using clinical AI guidance.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#111111]/10 flex items-center justify-between text-xs font-black text-[#111111]">
              <span>Launch Reframing Engine</span>
              <ArrowRight size={15} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature 2: Guided Breathwork */}
          <div 
            onClick={() => navigate('/student/breathwork')}
            className="p-5 sm:p-6 rounded-3xl border-2 border-[#111111] hover:bg-[#FAFAFA] transition-all duration-200 group cursor-pointer shadow-xs bg-[#FFFFFF]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] font-bold group-hover:scale-105 transition-transform">
                <Wind size={24} />
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] font-mono font-black text-xs uppercase tracking-wider">
                Somatic Relief
              </span>
            </div>
            <div className="mt-4 space-y-1.5">
              <h3 className="text-lg font-heading font-black text-[#111111]">
                Guided Breathwork Canopy
              </h3>
              <p className="text-xs text-[#111111]/70 leading-relaxed font-medium">
                4-4-4-4 Box Breathing and 4-7-8 soothing visuals engineered to lower heart rate and calm panic before exams.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#111111]/10 flex items-center justify-between text-xs font-black text-[#111111]">
              <span>Enter Breathwork Canopy</span>
              <ArrowRight size={15} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* COLUMN 3: Daily Challenge & Crisis SOS (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Daily Challenge */}
          <div className="p-5 sm:p-6 rounded-3xl border border-[#111111]/15 bg-[#FFFFFF] space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-[#111111] text-xs font-mono font-black uppercase tracking-wider">
              <Award size={16} />
              <span>Daily Quest</span>
            </div>
            <h3 className="font-heading font-black text-[#111111] text-sm leading-snug">
              "15-Minute Outdoor Decompression"
            </h3>
            <p className="text-xs text-[#111111]/70 leading-relaxed font-medium">
              Step away from screen light. Take a peaceful walk outside to reset mental bandwidth.
            </p>

            <button
              onClick={handleCompleteChallenge}
              disabled={dailyChallengeComplete}
              className={`w-full py-2.5 px-4 rounded-2xl font-heading font-black text-xs flex items-center justify-center gap-2 transition-all border-2 border-[#111111] cursor-pointer ${
                dailyChallengeComplete
                  ? 'bg-[#FAFAFA] text-[#111111] opacity-70'
                  : 'bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] active:scale-95'
              }`}
            >
              {dailyChallengeComplete ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Quest Complete (+5 Vitality)!</span>
                </>
              ) : (
                <>
                  <Award size={16} />
                  <span>Mark Quest Complete</span>
                </>
              )}
            </button>
          </div>

          {/* Emergency SOS Crisis Safeguard */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] text-left space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-[#111111] font-mono font-black text-xs uppercase tracking-wider">
              <ShieldAlert size={16} />
              <span>24/7 Crisis Support</span>
            </div>
            <h3 className="font-heading font-black text-[#111111] text-base">In Acute Distress or Crisis?</h3>
            <p className="text-xs text-[#111111]/70 leading-relaxed font-medium">
              Connect instantly with professional counselors or emergency intervention hotlines. 100% confidential.
            </p>
            <button
              onClick={() => navigate('/student/emergency')}
              className="w-full py-3 rounded-2xl bg-[#111111] hover:bg-black text-[#FFFFFF] font-heading font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              Open Crisis SOS Portal
            </button>
          </div>
        </div>

      </div>

      {/* ── COUNSELOR FULL BIO MODAL ── */}
      {activeModalCounselor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-[#FFFFFF] text-[#111111] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-[#111111] p-6 sm:p-8 shadow-2xl relative animate-scale-in hide-scrollbar space-y-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveModalCounselor(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#111111]/20 hover:bg-[#111111]/5 text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header: Photo, Name, Specialization, Campus */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <img 
                src={activeModalCounselor.full_photo_url || activeModalCounselor.avatar_url} 
                alt={activeModalCounselor.name} 
                className="w-28 h-36 object-cover rounded-2xl border-2 border-[#111111] shadow-md shrink-0 bg-[#FAFAFA]"
                onError={(e) => { (e.target as HTMLImageElement).src = activeModalCounselor.avatar_url; }}
              />
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4C542] border border-[#111111] text-[#111111] text-[10px] font-mono font-black">
                  <span>{activeModalCounselor.institution}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-[#111111]">{activeModalCounselor.name}</h3>
                <p className="text-xs sm:text-sm text-[#111111]/70 font-bold">{activeModalCounselor.specialization}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] font-black font-mono">
                    ● Available for Booking
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111]/80 font-bold">
                    ⭐ {activeModalCounselor.experience} Experience
                  </span>
                </div>
              </div>
            </div>

            {/* Quote / Motto */}
            {activeModalCounselor.quote && (
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 text-sm text-[#111111] italic font-serif leading-relaxed text-center">
                “{activeModalCounselor.quote.replace('♡', '').trim()}”
              </div>
            )}

            {/* Ways I Can Support You (Focus Areas) */}
            {activeModalCounselor.focus_areas && activeModalCounselor.focus_areas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#F4C542]" />
                  <span>Ways I Can Support You</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalCounselor.focus_areas.map((area, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] font-bold">
                      {area.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#111111]/10">
              <button 
                onClick={() => setActiveModalCounselor(null)}
                className="flex-1 py-3 px-4 rounded-2xl border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] text-sm font-bold transition-all text-center"
              >
                Back
              </button>
              <button 
                onClick={() => {
                  const cId = activeModalCounselor.id;
                  setActiveModalCounselor(null);
                  navigate(`/student/appointments?counselorId=${cId}`);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-sm font-black border-2 border-[#111111] transition-all shadow-xs text-center"
              >
                Book Counsellor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANDATORY INFORMED CONSENT MODAL ── */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFFFF] text-[#111111] w-full max-w-lg rounded-3xl border-2 border-[#111111] p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center gap-3 border-b border-[#111111]/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111]">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-[#111111]">Informed Consent &amp; Privacy</h3>
                <p className="text-xs text-[#111111]/60 font-mono">Sri Vishnu Educational Society</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#111111]/80 font-medium">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecks.anonymous}
                  onChange={e => setConsentChecks(prev => ({ ...prev, anonymous: e.target.checked }))}
                  className="mt-0.5 rounded text-[#F4C542] focus:ring-[#111111]"
                />
                <span>I understand my counseling interactions are conducted under end-to-end zero-knowledge anonymous protection.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecks.privacy}
                  onChange={e => setConsentChecks(prev => ({ ...prev, privacy: e.target.checked }))}
                  className="mt-0.5 rounded text-[#F4C542] focus:ring-[#111111]"
                />
                <span>I agree to the institutional wellbeing policy and digital data safeguards.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecks.crisisSafety}
                  onChange={e => setConsentChecks(prev => ({ ...prev, crisisSafety: e.target.checked }))}
                  className="mt-0.5 rounded text-[#F4C542] focus:ring-[#111111]"
                />
                <span>I know that 24/7 crisis support and verified human psychotherapists are reachable at any time.</span>
              </label>
            </div>

            <button
              onClick={handleAcceptConsent}
              disabled={
                savingConsent ||
                !consentChecks.privacy ||
                !consentChecks.anonymous ||
                !consentChecks.crisisSafety
              }
              className="w-full py-3.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-sm border-2 border-[#111111] shadow-xs disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingConsent ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                  <span>Recording Consent...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Acknowledge &amp; Enter MindBridge</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Daily Flashcards Modal */}
      <DailyFlashcardsModal
        isOpen={showFlashcardsModal}
        onClose={() => setShowFlashcardsModal(false)}
        onCompleted={() => setFlashcardsDoneToday(true)}
      />

      {/* Student Wellbeing Screening Modal (Req 14) */}
      <StudentScreeningModal
        isOpen={showScreeningModal}
        onClose={() => setShowScreeningModal(false)}
        onCompleted={(sub: ScreeningSubmission) => setLatestScreening(sub)}
      />

      {/* Session Feedback Modal with Unique Non-Star Rating (Req 11 & 12) */}
      <SessionFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Share Work with Counsellor Modal (Req 6) */}
      <ShareWorkModal
        isOpen={showShareWorkModal}
        onClose={() => setShowShareWorkModal(false)}
      />
    </div>
  );
}

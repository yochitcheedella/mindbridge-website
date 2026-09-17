import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Flame, Clock, ShieldCheck, Play, Pause, RotateCcw, 
  CheckCircle2, Sparkles, AlertCircle, Moon, BookOpen, Coffee, Award,
  Bell, ChevronRight, BarChart2, Heart, Check, Phone, Edit3, Send,
  Sliders, Plus, X, Volume2, Shield, ArrowUpRight, Zap
} from 'lucide-react';
import { getStudentProfile, setStudentProfile } from '../utils/auth';
import { 
  screenTimeTracker, 
  type ScreenTimeState 
} from '../utils/screenTimeTracker';
import { 
  VWC_DISPATCHER_DISPLAY, 
  VWC_DISPATCHER_PHONE,
  formatDisplayPhone,
  getWhatsAppLogs,
  getWhatsAppUrl,
  type WhatsAppDispatchLog
} from '../utils/whatsapp';

interface DetoxChallenge {
  id: string;
  title: string;
  duration: string;
  description: string;
  category: string;
  completed: boolean;
}

const DEFAULT_CHALLENGES: DetoxChallenge[] = [
  {
    id: 'ch-1',
    title: '10 min Phone-Free Eye Rest',
    duration: '10 min',
    description: 'Place your phone face down, step away from screens, and rest your eyes using 20-20-20 rule.',
    category: 'Relaxation',
    completed: true,
  },
  {
    id: 'ch-2',
    title: '20 min Focused Study Session',
    duration: '20 min',
    description: 'Pomodoro focus with zero notifications or social tabs open.',
    category: 'Academic',
    completed: false,
  },
  {
    id: 'ch-3',
    title: '30 min Social Media Pause',
    duration: '30 min',
    description: 'Keep Instagram, YouTube, and WhatsApp closed during study hours.',
    category: 'Detox',
    completed: false,
  },
  {
    id: 'ch-4',
    title: 'Night Wind-Down & Sleep Prep',
    duration: '45 min',
    description: 'Turn on blue light filter and stop scrolling 45 mins before bedtime.',
    category: 'Sleep',
    completed: false,
  },
];

export default function DigitalDetox() {
  // ── Screen Time Tracker State ──
  const [screenState, setScreenState] = useState<ScreenTimeState>(() => screenTimeTracker.getState());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakModalMessage, setBreakModalMessage] = useState('');
  const [lastDispatchedUrl, setLastDispatchedUrl] = useState('');

  // ── Student Profile & WhatsApp Phone ──
  const [profile, setProfile] = useState(() => getStudentProfile());
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState(profile.mobile_number || profile.phone || '');
  const [phoneSaveSuccess, setPhoneSaveSuccess] = useState(false);

  // ── Challenges State ──
  const [challenges, setChallenges] = useState<DetoxChallenge[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_detox_challenges');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_CHALLENGES;
  });
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeDuration, setNewChallengeDuration] = useState('15 min');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');

  // ── Focus Session Timer State ──
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number>(600); // 10 mins
  const [initialSeconds, setInitialSeconds] = useState<number>(600);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // ── Streak State ──
  const [streak, setStreak] = useState<number>(() => {
    try {
      const s = localStorage.getItem('mindbridge_detox_streak');
      if (s) return parseInt(s, 10);
    } catch {}
    return 3;
  });

  // ── WhatsApp Logs ──
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppDispatchLog[]>(() => getWhatsAppLogs());
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

  // ── Breathing Exercise State in Break Modal ──
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Subscribe to real-time Screen Time Tracker
  useEffect(() => {
    const unsubscribe = screenTimeTracker.subscribe((state) => {
      setScreenState(state);
    });

    const unsubscribeModal = screenTimeTracker.onAlertModal((state, url, msg) => {
      setShowBreakModal(true);
      if (url) setLastDispatchedUrl(url);
      setBreakModalMessage(msg || `You have reached your daily screen time limit of ${Math.floor(state.limitMinutes / 60)}h ${state.limitMinutes % 60}m.`);
      setWhatsappLogs(getWhatsAppLogs());
    });

    return () => {
      unsubscribe();
      unsubscribeModal();
    };
  }, []);

  // Sync Challenges to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('mindbridge_detox_challenges', JSON.stringify(challenges));
    } catch (e) {
      console.warn('Failed to save challenges:', e);
    }
  }, [challenges]);

  // Focus Session Countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && activeTimerSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (activeTimerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      setSessionCompleted(true);
      screenTimeTracker.playGentleChime();
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('mindbridge_detox_streak', newStreak.toString());
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeTimerSeconds, streak]);

  // Breathing animation rhythm
  useEffect(() => {
    if (!showBreakModal) return;
    const cycle = () => {
      setBreathPhase('Inhale');
      setTimeout(() => {
        setBreathPhase('Hold');
        setTimeout(() => {
          setBreathPhase('Exhale');
        }, 3000);
      }, 4000);
    };
    cycle();
    const interval = setInterval(cycle, 11000);
    return () => clearInterval(interval);
  }, [showBreakModal]);

  // Handle Save Phone
  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPhoneInput.trim();
    if (!trimmed) return;

    const updated = {
      ...profile,
      mobile_number: trimmed,
      phone: trimmed,
    };
    setStudentProfile(updated);
    setProfile(updated);
    setIsEditingPhone(false);
    setPhoneSaveSuccess(true);
    setTimeout(() => setPhoneSaveSuccess(false), 4000);
  };

  // Handle Setting Daily Goal
  const handleSetLimit = (mins: number) => {
    screenTimeTracker.setLimitMinutes(mins);
    setShowGoalModal(false);
  };

  // Handle Test Alert
  const handleTestScreenTimeAlert = () => {
    const res = screenTimeTracker.triggerScreenTimeAlert(true);
    setLastDispatchedUrl(res.url);
    setBreakModalMessage(res.message);
    setShowBreakModal(true);
    setWhatsappLogs(getWhatsAppLogs());
  };

  const handleAdd30Minutes = () => {
    screenTimeTracker.addActiveMinutes(30);
  };

  const handleSimulateLimitExceeded = () => {
    const res = screenTimeTracker.simulateLimitExceeded();
    setLastDispatchedUrl(res.url);
    setBreakModalMessage(res.message);
    setShowBreakModal(true);
    setWhatsappLogs(getWhatsAppLogs());
  };

  const handleResetScreenTime = () => {
    screenTimeTracker.resetTodayScreenTime();
  };

  // Challenge Actions
  const toggleChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const handleAddChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChallengeTitle.trim()) return;
    const newCh: DetoxChallenge = {
      id: `ch-${Date.now()}`,
      title: newChallengeTitle.trim(),
      duration: newChallengeDuration,
      description: newChallengeDesc.trim() || 'Mindful digital boundary challenge.',
      category: 'Custom',
      completed: false,
    };
    setChallenges((prev) => [newCh, ...prev]);
    setNewChallengeTitle('');
    setNewChallengeDesc('');
    setShowAddChallenge(false);
  };

  // Focus Session Handlers
  const startFocusSession = (minutes: number) => {
    const secs = minutes * 60;
    setInitialSeconds(secs);
    setActiveTimerSeconds(secs);
    setSessionActive(true);
    setTimerRunning(true);
    setSessionCompleted(false);
  };

  const formatSecsToHms = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  const formatTimeTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Screen time statistics
  const currentMinutes = Math.floor(screenState.activeSeconds / 60);
  const limitMinutes = screenState.limitMinutes;
  const isOverLimit = currentMinutes >= limitMinutes;
  const percentageUsed = Math.min(Math.round((currentMinutes / limitMinutes) * 100), 200);

  const completedCount = challenges.filter((c) => c.completed).length;
  const progressPercent = challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] pb-36 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#111111]/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#111111]">
              Digital Detox &amp; Screen Time Detection
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4C542]/20 text-[#111111] border border-[#F4C542] text-[11px] font-bold inline-flex items-center gap-1">
              <Flame size={12} className="text-[#111111] fill-[#111111]" />
              {streak} Day Streak
            </span>
          </div>
          <p className="text-xs text-[#111111]/60 mt-0.5 font-medium">
            Real-time active screen tracking, mindful focus pomodoro, and automated WhatsApp break alerts from {VWC_DISPATCHER_DISPLAY}.
          </p>
        </div>

        {/* Live Detector Status & Test Alert */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${screenState.isIdle ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{screenState.isIdle ? 'Detector Paused (Idle)' : 'Detector Online (Tracking)'}</span>
          </div>
          <button
            onClick={handleTestScreenTimeAlert}
            className="px-3 py-1.5 rounded-xl border-2 border-[#111111] bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Simulate Screen Time Exceeded to test WhatsApp message"
          >
            <Send size={13} />
            <span>Test WhatsApp Alert</span>
          </button>
        </div>
      </div>

      {/* ── PHONE / WHATSAPP CONFIGURATION BANNER ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#128C7E] flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
                WhatsApp Well-Being Alerts
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#111111]/5 text-[10px] font-bold border border-[#111111]/10">
                From: {VWC_DISPATCHER_DISPLAY}
              </span>
            </div>
            {isEditingPhone ? (
              <form onSubmit={handleSavePhone} className="flex items-center gap-2 mt-2">
                <input
                  type="tel"
                  value={newPhoneInput}
                  onChange={(e) => setNewPhoneInput(e.target.value)}
                  placeholder="Enter 10-digit WhatsApp Number"
                  className="px-3 py-1.5 rounded-xl border-2 border-[#111111] text-xs font-bold w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#111111] text-[#FFFFFF] text-xs font-bold hover:bg-[#333333] transition-all cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#111111]/20 text-xs font-bold hover:bg-[#111111]/5 cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-black text-[#111111]">
                  Target Phone: <span className="font-mono text-[#128C7E]">{formatDisplayPhone(profile.mobile_number || profile.phone || '')}</span>
                </p>
                <button
                  onClick={() => {
                    setNewPhoneInput(profile.mobile_number || profile.phone || '');
                    setIsEditingPhone(true);
                  }}
                  className="p-1 rounded-lg hover:bg-[#111111]/5 text-[#111111]/60 hover:text-[#111111] transition-all cursor-pointer"
                  title="Edit phone number"
                >
                  <Edit3 size={13} />
                </button>
              </div>
            )}
            <p className="text-[11px] text-[#111111]/60 mt-0.5">
              Polite reminders to unplug and take restorative eye breaks are sent to this WhatsApp number when your daily limit is reached.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {phoneSaveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">
              ✓ Phone updated
            </span>
          )}
          <button
            onClick={() => setShowLogsDrawer(!showLogsDrawer)}
            className="px-3 py-1.5 rounded-xl border border-[#111111]/20 bg-white hover:bg-[#111111]/5 text-xs font-bold text-[#111111] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Clock size={13} />
            <span>Alert History ({whatsappLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ── DISPATCH LOGS EXPANDABLE ACCORDION ── */}
      {showLogsDrawer && (
        <div className="p-4 rounded-3xl bg-[#111111]/5 border border-[#111111]/15 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#111111]/10">
            <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
              Recent WhatsApp Dispatches from {VWC_DISPATCHER_DISPLAY}
            </span>
            <button
              onClick={() => setShowLogsDrawer(false)}
              className="text-xs font-bold text-[#111111]/60 hover:text-[#111111] cursor-pointer"
            >
              Close ✕
            </button>
          </div>
          {whatsappLogs.length === 0 ? (
            <p className="text-xs text-[#111111]/50 italic py-2">
              No WhatsApp messages dispatched yet. Click "Test WhatsApp Alert" to preview.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {whatsappLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-2xl bg-[#FFFFFF] border border-[#111111]/10 text-xs flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                      <span>{log.type === 'screen_time_alert' ? '🌿 Screen Time Alert' : log.type === 'test_alert' ? '🧪 Test Alert' : '🗓️ Booking Reminder'}</span>
                      <span className="text-[10px] text-[#111111]/50 font-normal">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#111111]/70 truncate max-w-md">
                      To: {log.recipientName} ({formatDisplayPhone(log.recipientPhone)})
                    </p>
                  </div>
                  <a
                    href={log.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] hover:text-[#FFFFFF] text-[#128C7E] font-bold text-[11px] border border-[#25D366]/40 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>Open in WhatsApp</span>
                    <ArrowUpRight size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Real-Time Screen Time Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Today's Screen Time (LIVE TICKER) */}
        <div className={`p-5 rounded-3xl bg-[#FFFFFF] border-2 shadow-xs flex flex-col justify-between transition-all ${
          isOverLimit ? 'border-rose-500 bg-rose-50/20' : 'border-[#111111]'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]/60">
                Today's Active Screen Time
              </span>
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOverLimit ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOverLimit ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-[#111111]">
                {formatSecsToHms(screenState.activeSeconds)}
              </span>
              {isOverLimit ? (
                <span className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                  +{currentMinutes - limitMinutes}m over
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {limitMinutes - currentMinutes}m left
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[11px] font-medium text-[#111111]/70 mb-1">
              <span>Limit: {Math.floor(limitMinutes / 60)}h {limitMinutes % 60 > 0 ? `${limitMinutes % 60}m` : ''}</span>
              <span className={`font-bold ${isOverLimit ? 'text-rose-600' : 'text-[#111111]'}`}>
                {percentageUsed}% used
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#111111]/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverLimit ? 'bg-rose-500' : percentageUsed > 75 ? 'bg-amber-500' : 'bg-[#F4C542]'
                }`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick Simulation & Testing Controls */}
          <div className="mt-3 pt-2.5 border-t border-[#111111]/10 flex items-center justify-between gap-1">
            <button
              onClick={handleAdd30Minutes}
              className="px-2 py-1 rounded-lg bg-[#111111]/5 hover:bg-[#111111]/10 text-[10px] font-bold text-[#111111] transition-all cursor-pointer"
              title="Add 30 minutes to active screen time for quick testing"
            >
              +30m Time
            </button>
            <button
              onClick={handleSimulateLimitExceeded}
              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Instantly exceed limit to test audio chime and alert modal"
            >
              <Zap size={10} />
              <span>Simulate Breach</span>
            </button>
            <button
              onClick={handleResetScreenTime}
              className="px-2 py-1 rounded-lg hover:bg-[#111111]/10 text-[10px] font-bold text-[#111111]/60 hover:text-[#111111] transition-all cursor-pointer flex items-center gap-0.5"
              title="Reset today's screen time to 0"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Daily Goal & Adjust Controls */}
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/15 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]/60">
                Daily Screen Goal
              </span>
              <button
                onClick={() => setShowGoalModal(true)}
                className="text-[11px] font-bold text-[#111111] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sliders size={12} />
                <span>Adjust</span>
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-[#111111]">
                {Math.floor(limitMinutes / 60)}h {limitMinutes % 60 > 0 ? `${limitMinutes % 60}m` : '00m'}
              </span>
              <span className="text-xs font-bold text-[#111111]/60">Target</span>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSetLimit(15)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                limitMinutes === 15 ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#111111]/20 hover:bg-[#111111]/5'
              }`}
            >
              15m (Test)
            </button>
            <button
              onClick={() => handleSetLimit(120)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                limitMinutes === 120 ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#111111]/20 hover:bg-[#111111]/5'
              }`}
            >
              2h
            </button>
            <button
              onClick={() => handleSetLimit(210)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                limitMinutes === 210 ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#111111]/20 hover:bg-[#111111]/5'
              }`}
            >
              3.5h
            </button>
            <button
              onClick={() => handleSetLimit(240)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                limitMinutes === 240 ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#111111]/20 hover:bg-[#111111]/5'
              }`}
            >
              4h
            </button>
          </div>
        </div>

        {/* Streak & Rank */}
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/15 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]/60">
                Mindfulness Discipline
              </span>
              <p className="text-3xl font-black text-[#111111] mt-2 flex items-center gap-1.5">
                🔥 {streak} Days
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#F4C542]/20 border border-[#F4C542] text-[#111111] flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
          <p className="text-xs text-[#111111]/75 font-semibold mt-4">
            Consistent healthy boundaries improve REM sleep cycles by up to 28%.
          </p>
        </div>
      </div>

      {/* ── OVER-LIMIT WARNING BANNER ── */}
      {isOverLimit && (
        <div className="p-4 rounded-3xl bg-rose-50 border-2 border-rose-500 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-900">
                Daily Screen Limit Reached ({Math.floor(limitMinutes / 60)}h {limitMinutes % 60 > 0 ? `${limitMinutes % 60}m` : ''})
              </h3>
              <p className="text-xs text-rose-800 font-medium">
                A polite break reminder has been prepared for your WhatsApp. Please consider taking a 5–10 min screen rest.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowBreakModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Mindful Break Guide
            </button>
            <button
              onClick={handleTestScreenTimeAlert}
              className="px-3.5 py-1.5 rounded-xl border border-rose-400 bg-white text-rose-900 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
            >
              Open WhatsApp Alert
            </button>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE FOCUS SESSION / POMODORO ── */}
      <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#111111] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-heading font-black text-[#111111] flex items-center gap-2">
              <Sparkles size={18} className="text-[#111111]" />
              <span>Interactive Focus &amp; Rest Timer</span>
            </h2>
            <p className="text-xs text-[#111111]/60">
              Put your device aside and enter deep study or tranquil rest.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => startFocusSession(10)}
              className="px-3 py-1.5 rounded-xl border border-[#111111] bg-white hover:bg-[#F4C542] text-[#111111] text-xs font-bold transition-all cursor-pointer"
            >
              10 Min Break
            </button>
            <button
              onClick={() => startFocusSession(20)}
              className="px-3 py-1.5 rounded-xl border border-[#111111] bg-white hover:bg-[#F4C542] text-[#111111] text-xs font-bold transition-all cursor-pointer"
            >
              20 Min Study
            </button>
            <button
              onClick={() => startFocusSession(30)}
              className="px-3 py-1.5 rounded-xl border border-[#111111] bg-white hover:bg-[#F4C542] text-[#111111] text-xs font-bold transition-all cursor-pointer"
            >
              30 Min Deep Focus
            </button>
          </div>
        </div>

        {/* Focus Timer Display */}
        <div className="flex flex-col items-center justify-center py-6 bg-[#111111]/5 rounded-2xl border border-[#111111]/10">
          <div className="relative flex items-center justify-center w-40 h-40">
            {timerRunning && (
              <div className="absolute inset-0 rounded-full border-4 border-[#F4C542] animate-ping opacity-75" />
            )}
            <div className="w-36 h-36 rounded-full bg-[#FFFFFF] border-4 border-[#111111] flex flex-col items-center justify-center shadow-xs">
              <span className="text-3xl font-black font-mono text-[#111111] tracking-tight">
                {formatTimeTimer(activeTimerSeconds)}
              </span>
              <span className="text-[10px] font-black text-[#111111]/50 uppercase tracking-wider mt-0.5">
                {timerRunning ? 'Session Active' : 'Remaining'}
              </span>
            </div>
          </div>

          {sessionCompleted ? (
            <div className="mt-5 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-[#111111] font-black text-xs bg-[#F4C542] px-5 py-2.5 rounded-full border-2 border-[#111111] animate-scale-up">
                <CheckCircle2 size={16} />
                <span>Phenomenal work! Focus session completed &amp; streak extended!</span>
              </div>
              <button
                onClick={() => {
                  setSessionCompleted(false);
                  setActiveTimerSeconds(initialSeconds);
                }}
                className="text-xs font-bold underline text-[#111111]/70 hover:text-[#111111] mt-1 cursor-pointer"
              >
                Start another session
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black text-[#111111] border-2 border-[#111111] flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 ${
                  timerRunning ? 'bg-[#FFFFFF] hover:bg-[#111111]/5' : 'bg-[#F4C542] hover:bg-[#e0b435]'
                }`}
              >
                {timerRunning ? <Pause size={15} /> : <Play size={15} />}
                <span>{timerRunning ? 'Pause Session' : 'Begin Digital Detox'}</span>
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setActiveTimerSeconds(initialSeconds);
                  setSessionCompleted(false);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#111111] bg-[#FFFFFF] border border-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2-COLUMN: RECOMMENDED CHALLENGES & USAGE BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Recommended Daily Detox Challenges (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-heading font-black text-[#111111]">Daily Detox Challenges</h2>
              <p className="text-xs text-[#111111]/60">
                {completedCount} of {challenges.length} completed today ({progressPercent}%)
              </p>
            </div>
            <button
              onClick={() => setShowAddChallenge(true)}
              className="px-3 py-1.5 rounded-xl border border-[#111111]/20 hover:border-[#111111] bg-white text-xs font-bold text-[#111111] flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus size={14} />
              <span>Add Goal</span>
            </button>
          </div>

          <div className="w-full h-2 bg-[#111111]/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#F4C542] transition-all duration-500 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-2.5">
            {challenges.map((c) => (
              <div
                key={c.id}
                onClick={() => toggleChallenge(c.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  c.completed 
                    ? 'bg-[#F4C542]/10 border-2 border-[#111111]' 
                    : 'bg-[#FFFFFF] border border-[#111111]/15 hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#111111]/10 ${
                      c.completed 
                        ? 'bg-[#F4C542] text-[#111111] font-bold' 
                        : 'bg-[#111111]/5 text-[#111111]'
                    }`}
                  >
                    {c.category === 'Relaxation' && <Coffee size={16} />}
                    {c.category === 'Academic' && <BookOpen size={16} />}
                    {c.category === 'Detox' && <Smartphone size={16} />}
                    {c.category === 'Sleep' && <Moon size={16} />}
                    {c.category === 'Custom' && <Sparkles size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs font-bold ${c.completed ? 'line-through text-[#111111]/50' : 'text-[#111111]'}`}>
                        {c.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#111111]/5 text-[#111111] text-[10px] font-bold border border-[#111111]/10">
                        {c.duration}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#111111]/60 mt-0.5 leading-snug">
                      {c.description}
                    </p>
                  </div>
                </div>

                <div 
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    c.completed 
                      ? 'bg-[#F4C542] border-[#111111] text-[#111111]' 
                      : 'border-[#111111]/30'
                  }`}
                >
                  {c.completed && <Check size={14} className="stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Screen Time Breakdown & Weekly Trend (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/15 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-[#111111] flex items-center gap-2">
              <BarChart2 size={16} />
              <span>Category Distribution</span>
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>MindBridge Wellness &amp; Reflection</span>
                  <span className="font-mono">45%</span>
                </div>
                <div className="h-2 bg-[#111111]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[45%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Academic LMS &amp; Research</span>
                  <span className="font-mono">35%</span>
                </div>
                <div className="h-2 bg-[#111111]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F4C542] rounded-full w-[35%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Messaging &amp; Campus Groups</span>
                  <span className="font-mono">15%</span>
                </div>
                <div className="h-2 bg-[#111111]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[15%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Passive Scrolling</span>
                  <span className="font-mono">5%</span>
                </div>
                <div className="h-2 bg-[#111111]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full w-[5%]" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#111111]/10 flex items-center justify-between text-[11px] text-[#111111]/60">
              <span>Healthy digital balance maintained</span>
              <span className="font-bold text-emerald-700">Optimal Range</span>
            </div>
          </div>

          {/* Weekly History Comparison */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/15 space-y-3 shadow-xs">
            <h3 className="text-sm font-black text-[#111111]">7-Day Screen Time Trend</h3>
            <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-4">
              {[
                { day: 'M', hours: 3.2, over: false },
                { day: 'T', hours: 2.8, over: false },
                { day: 'W', hours: 4.1, over: true },
                { day: 'T', hours: 3.0, over: false },
                { day: 'F', hours: 2.4, over: false },
                { day: 'S', hours: 4.5, over: true },
                { day: 'Today', hours: (currentMinutes / 60).toFixed(1), over: isOverLimit },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-[#111111]/60">{item.hours}h</span>
                  <div 
                    className={`w-full rounded-lg transition-all ${
                      item.over ? 'bg-rose-500' : 'bg-[#F4C542]'
                    }`}
                    style={{ height: `${Math.min(Math.max((Number(item.hours) / 5) * 100, 15), 100)}%` }}
                  />
                  <span className="text-[10px] font-bold text-[#111111]/80">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: CUSTOM GOAL SETTER ── */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#111111] max-w-sm w-full space-y-4 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-heading font-black text-[#111111] flex items-center gap-2">
                <Sliders size={18} />
                <span>Set Daily Screen Goal</span>
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 rounded-lg hover:bg-[#111111]/10 text-[#111111] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#111111]/60">
              When your active screen time exceeds this limit, a polite reminder is dispatched to your WhatsApp from {VWC_DISPATCHER_DISPLAY}.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSetLimit(15)}
                className="p-3 rounded-xl border border-[#111111] hover:bg-[#F4C542] text-xs font-bold text-left cursor-pointer transition-all"
              >
                <div className="font-black">15 Minutes</div>
                <div className="text-[10px] text-[#111111]/60">Quick Test Alert</div>
              </button>
              <button
                onClick={() => handleSetLimit(60)}
                className="p-3 rounded-xl border border-[#111111] hover:bg-[#F4C542] text-xs font-bold text-left cursor-pointer transition-all"
              >
                <div className="font-black">1 Hour</div>
                <div className="text-[10px] text-[#111111]/60">Strict Boundary</div>
              </button>
              <button
                onClick={() => handleSetLimit(180)}
                className="p-3 rounded-xl border border-[#111111] hover:bg-[#F4C542] text-xs font-bold text-left cursor-pointer transition-all"
              >
                <div className="font-black">3 Hours</div>
                <div className="text-[10px] text-[#111111]/60">Moderate Balance</div>
              </button>
              <button
                onClick={() => handleSetLimit(210)}
                className="p-3 rounded-xl border border-[#111111] hover:bg-[#F4C542] text-xs font-bold text-left cursor-pointer transition-all"
              >
                <div className="font-black">3h 30m</div>
                <div className="text-[10px] text-[#111111]/60">Recommended</div>
              </button>
            </div>

            <div className="pt-2 border-t border-[#111111]/10">
              <label className="text-[11px] font-bold text-[#111111] block mb-1">
                Or enter custom limit in minutes:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customGoalInput}
                  onChange={(e) => setCustomGoalInput(e.target.value)}
                  placeholder="e.g. 90"
                  className="px-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-bold flex-1"
                />
                <button
                  onClick={() => {
                    const mins = parseInt(customGoalInput, 10);
                    if (mins > 0) handleSetLimit(mins);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#333333] cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CUSTOM CHALLENGE ── */}
      {showAddChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <form onSubmit={handleAddChallenge} className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#111111] max-w-sm w-full space-y-4 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-heading font-black text-[#111111] flex items-center gap-2">
                <Plus size={18} />
                <span>Add Detox Challenge</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddChallenge(false)}
                className="p-1 rounded-lg hover:bg-[#111111]/10 text-[#111111] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Challenge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening Walk without Phone"
                  value={newChallengeTitle}
                  onChange={(e) => setNewChallengeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Target Duration</label>
                <select
                  value={newChallengeDuration}
                  onChange={(e) => setNewChallengeDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-bold"
                >
                  <option value="10 min">10 min</option>
                  <option value="15 min">15 min</option>
                  <option value="20 min">20 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="60 min">1 hour</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What will you do during this detox time?"
                  value={newChallengeDesc}
                  onChange={(e) => setNewChallengeDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#111111]/10">
              <button
                type="button"
                onClick={() => setShowAddChallenge(false)}
                className="px-4 py-2 rounded-xl border border-[#111111]/20 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] border-2 border-[#111111] text-xs font-black text-[#111111]"
              >
                Add Challenge
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: MINDFUL BREAK & WHATSAPP EXCEEDED LIMIT REMINDER ── */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border-3 border-[#111111] max-w-md w-full space-y-5 shadow-2xl animate-scale-up text-center relative">
            <button
              onClick={() => setShowBreakModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#111111]/10 text-[#111111] cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Mindful Breathing Sphere */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-28 h-28 rounded-full bg-[#F4C542]/20 border-4 border-[#F4C542] flex flex-col items-center justify-center relative transition-all duration-1000 animate-pulse">
                <Sparkles size={28} className="text-[#111111]" />
                <span className="text-xs font-black text-[#111111] mt-1 font-mono uppercase tracking-wider">
                  {breathPhase}
                </span>
              </div>
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-[#F4C542]/30 border border-[#111111]/20 text-[#111111] text-[11px] font-black uppercase tracking-wider">
                🌿 MindBridge Digital Well-Being
              </span>
              <h2 className="text-lg sm:text-xl font-heading font-black text-[#111111] mt-2">
                Time to Rest Your Eyes &amp; Recharge
              </h2>
              <p className="text-xs text-[#111111]/70 mt-1 leading-relaxed">
                You have reached your daily screen time boundary. Step away from your display, practice the 20-20-20 rule, and drink some water.
              </p>
            </div>

            {/* WhatsApp Dispatch Verification Box */}
            <div className="p-3.5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-[#128C7E]">
                <span className="flex items-center gap-1.5">
                  <Smartphone size={14} />
                  <span>WhatsApp Alert Dispatched Automatically</span>
                </span>
                <span className="text-[10px] bg-[#25D366]/20 px-2 py-0.5 rounded-full font-mono">
                  From: {VWC_DISPATCHER_DISPLAY}
                </span>
              </div>
              <p className="text-[11px] text-[#111111]/70">
                A polite break reminder has been automatically sent to your registered number ({formatDisplayPhone(profile.mobile_number || profile.phone || '')}). No action or permission needed!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={lastDispatchedUrl || getWhatsAppUrl(profile.mobile_number || profile.phone || '', breakModalMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1ebd59] text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Send size={14} />
                <span>View WhatsApp Alert</span>
              </a>
              <button
                onClick={() => {
                  setShowBreakModal(false);
                  startFocusSession(10);
                }}
                className="py-3 px-4 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] border-2 border-[#111111] text-xs font-black text-[#111111] cursor-pointer"
              >
                10m Screen Break
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

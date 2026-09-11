import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Flame, Clock, ShieldCheck, Play, Pause, RotateCcw, 
  CheckCircle2, Sparkles, AlertCircle, Moon, BookOpen, Coffee, Award,
  Bell, ChevronRight, BarChart2, Heart, Check
} from 'lucide-react';

interface DetoxChallenge {
  id: string;
  title: string;
  duration: string;
  description: string;
  icon: any;
  category: string;
  completed: boolean;
}

const INITIAL_CHALLENGES: DetoxChallenge[] = [
  {
    id: 'ch-1',
    title: '10 min Phone-Free Break',
    duration: '10 min',
    description: 'Place your phone face down, step away from screens, and rest your eyes.',
    icon: Coffee,
    category: 'Relaxation',
    completed: true,
  },
  {
    id: 'ch-2',
    title: '20 min Focused Study Session',
    duration: '20 min',
    description: 'Pomodoro focus with zero notifications or social tabs open.',
    icon: BookOpen,
    category: 'Academic',
    completed: false,
  },
  {
    id: 'ch-3',
    title: '30 min No-Social-Media Challenge',
    duration: '30 min',
    description: 'Keep Instagram, YouTube, and WhatsApp closed during study hours.',
    icon: Smartphone,
    category: 'Detox',
    completed: false,
  },
  {
    id: 'ch-4',
    title: 'Night Wind-Down & Sleep Prep',
    duration: '45 min',
    description: 'Turn on blue light filter and stop scrolling 45 mins before bedtime.',
    icon: Moon,
    category: 'Sleep',
    completed: false,
  },
];

export default function DigitalDetox() {
  const [challenges, setChallenges] = useState<DetoxChallenge[]>(INITIAL_CHALLENGES);
  const [streak, setStreak] = useState<number>(3);
  
  // Interactive Focus Session Timer State
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number>(600); // 10 mins
  const [initialSeconds, setInitialSeconds] = useState<number>(600);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && activeTimerSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (activeTimerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      setSessionCompleted(true);
      setStreak((s) => s + 1);
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeTimerSeconds]);

  const toggleChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const startFocusSession = (minutes: number) => {
    const secs = minutes * 60;
    setInitialSeconds(secs);
    setActiveTimerSeconds(secs);
    setSessionActive(true);
    setTimerRunning(true);
    setSessionCompleted(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const completedCount = challenges.filter((c) => c.completed).length;
  const progressPercent = Math.round((completedCount / challenges.length) * 100);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] pb-36 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pb-5 border-b border-[#111111]/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#111111]">
              Digital Detox
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4C542]/20 text-[#111111] border border-[#F4C542] text-[11px] font-bold inline-flex items-center gap-1">
              <Flame size={12} className="text-[#111111] fill-[#111111]" />
              {streak} Day Streak
            </span>
          </div>
          <p className="text-xs text-[#111111]/60 mt-0.5 font-medium">
            Balance your screen time, recharge your focus, and protect sleep quality.
          </p>
        </div>
      </div>

      {/* ── Screen Time Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Today's Screen Time */}
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]/50">
              Today's Screen Time
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-[#111111]">4h 32m</span>
              <span className="text-xs font-bold text-[#111111]/60">+1h 02m over</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] font-medium text-[#111111]/60 mb-1">
              <span>Target Goal: 3h 30m</span>
              <span className="text-[#111111] font-bold">129% used</span>
            </div>
            <div className="w-full h-2 bg-[#111111]/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#F4C542] rounded-full w-[85%]" />
            </div>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]/50">
              Daily Goal
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-[#111111]">3h 30m</span>
              <span className="text-xs font-bold text-[#111111]/60">Healthy limit</span>
            </div>
          </div>
          <p className="text-xs text-[#111111]/60 mt-4 leading-relaxed">
            Reducing 45 minutes of evening social scrolling improves REM sleep by 28%.
          </p>
        </div>

        {/* Streak & Rank */}
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]/50">
                Detox Champion
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
            Great discipline! 2 more days to reach the 5-day Mindfulness Badge.
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE FOCUS SESSION ── */}
      <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#111111]/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-heading font-black text-[#111111] flex items-center gap-2">
              <Sparkles size={18} className="text-[#111111]" />
              <span>Instant Focus Session</span>
            </h2>
            <p className="text-xs text-[#111111]/60">
              Put your device aside and enter deep study or tranquil rest.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            {/* Pulsing ring during active timer */}
            {timerRunning && (
              <div className="absolute inset-0 rounded-full border-4 border-[#F4C542] animate-ping" />
            )}
            <div className="w-36 h-36 rounded-full bg-[#FFFFFF] border-4 border-[#111111] flex flex-col items-center justify-center shadow-sm">
              <span className="text-3xl font-black font-mono text-[#111111] tracking-tight">
                {formatTime(activeTimerSeconds)}
              </span>
              <span className="text-[10px] font-black text-[#111111]/50 uppercase tracking-wider mt-0.5">
                {timerRunning ? 'Focus Active' : 'Remaining'}
              </span>
            </div>
          </div>

          {sessionCompleted ? (
            <div className="mt-4 flex items-center gap-2 text-[#111111] font-black text-xs bg-[#F4C542] px-4 py-2 rounded-full border-2 border-[#111111] animate-scale-up">
              <CheckCircle2 size={16} />
              <span>Phenomenal work! Focus session completed & streak extended!</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black text-[#111111] border-2 border-[#111111] flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#111111] bg-[#FFFFFF] border border-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RECOMMENDED DAILY DETOX CHALLENGES ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-heading font-black text-[#111111]">Recommended Challenges</h2>
            <p className="text-xs text-[#111111]/60">
              {completedCount} of {challenges.length} completed today ({progressPercent}%)
            </p>
          </div>
          <div className="w-24 h-2 bg-[#111111]/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#F4C542] transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {challenges.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                onClick={() => toggleChallenge(c.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  c.completed 
                    ? 'bg-[#F4C542]/10 border-2 border-[#111111]' 
                    : 'bg-[#FFFFFF] border border-[#111111]/15 hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#111111]/10 ${
                      c.completed 
                        ? 'bg-[#F4C542] text-[#111111] font-bold' 
                        : 'bg-[#111111]/5 text-[#111111]'
                    }`}
                  >
                    <Icon size={18} />
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
            );
          })}
        </div>
      </div>
    </div>
  );
}

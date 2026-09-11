import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wind, Play, Pause, RotateCcw, Leaf, Sparkles, Eye, Hand, Ear, Zap, Moon, Trophy, Star, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';

// ─── Breathing exercise definitions ───────────────────────────────────────────
interface BreathPhase {
  label: string;
  duration: number; // seconds
  scale: number;    // circle scale target
  color: string;
}

const EXERCISES = {
  box: {
    name: 'Box Breathing',
    tagline: 'Calm your nervous system',
    description: 'Used by Navy SEALs & first responders. Inhale → Hold → Exhale → Hold — each for 4 seconds.',
    totalCycles: 4,
    phases: [
      { label: 'Inhale',   duration: 4, scale: 1.3, color: '#a1f3c3' },
      { label: 'Hold',     duration: 4, scale: 1.3, color: '#8dd9f0' },
      { label: 'Exhale',   duration: 4, scale: 1.0, color: '#b4a1f3' },
      { label: 'Hold',     duration: 4, scale: 1.0, color: '#f0d98d' },
    ] as BreathPhase[],
  },
  four78: {
    name: '4-7-8 Breathing',
    tagline: 'Fall asleep faster',
    description: 'Dr. Andrew Weil\'s technique for sleep & anxiety. Inhale 4s → Hold 7s → Exhale 8s.',
    totalCycles: 3,
    phases: [
      { label: 'Inhale',   duration: 4, scale: 1.3, color: '#a1f3c3' },
      { label: 'Hold',     duration: 7, scale: 1.3, color: '#f0d98d' },
      { label: 'Exhale',   duration: 8, scale: 1.0, color: '#b4a1f3' },
    ] as BreathPhase[],
  },
};

// ─── 5-4-3-2-1 Grounding technique ────────────────────────────────────────────
const GROUNDING_STEPS = [
  { num: 5, sense: 'See',   icon: Eye,   prompt: 'Name 5 things you can see right now.' },
  { num: 4, sense: 'Touch', icon: Hand,  prompt: 'Feel 4 textures around you.' },
  { num: 3, sense: 'Hear',  icon: Ear,   prompt: 'Notice 3 sounds in your environment.' },
  { num: 2, sense: 'Smell', icon: Leaf,  prompt: 'Identify 2 scents (or recall favourites).' },
  { num: 1, sense: 'Taste', icon: Zap,   prompt: 'Notice 1 taste — a sip of water helps.' },
];

// ─── Guided Meditation sessions ────────────────────────────────────────────────
const MEDITATIONS = [
  {
    id: 'body-scan',
    title: 'Body Scan',
    subtitle: 'Release physical tension',
    duration: 10,
    emoji: '🌊',
    color: '#8dd9f0',
    stages: [
      { label: 'Settle in', text: 'Find a comfortable position. Close your eyes. Take three slow, deep breaths.', secs: 60 },
      { label: 'Feet & legs', text: 'Bring awareness to your feet. Notice any sensations — warmth, pressure, tingling. Let go of tension.', secs: 90 },
      { label: 'Torso', text: 'Move attention to your belly and chest. Notice your breathing. Let your stomach rise and fall naturally.', secs: 90 },
      { label: 'Shoulders & arms', text: 'Soften your shoulders — let them drop away from your ears. Release any tightness in your arms and hands.', secs: 90 },
      { label: 'Face & head', text: 'Relax your jaw, forehead, and eyes. Let your face become completely soft and still.', secs: 90 },
      { label: 'Whole body', text: 'Rest in full body awareness. You are present, safe, and at ease. Breathe freely.', secs: 60 },
    ],
  },
  {
    id: 'loving-kindness',
    title: 'Loving Kindness',
    subtitle: 'Cultivate compassion',
    duration: 7,
    emoji: '💜',
    color: '#b4a1f3',
    stages: [
      { label: 'Settle', text: 'Sit comfortably. Breathe slowly. Let your body relax.', secs: 40 },
      { label: 'Self', text: 'Place a hand on your heart. Silently say: "May I be happy. May I be healthy. May I be at peace."', secs: 80 },
      { label: 'Someone loved', text: 'Picture a person who makes you smile. Send them: "May you be happy. May you be healthy. May you be at peace."', secs: 80 },
      { label: 'Neutral person', text: 'Think of someone neutral in your life. Offer them the same wishes with a warm heart.', secs: 80 },
      { label: 'All beings', text: 'Expand to everyone, everywhere: "May all beings be happy. May all beings be at peace."', secs: 80 },
      { label: 'Return', text: 'Bring awareness back. Notice the warmth in your chest. Gently open your eyes.', secs: 40 },
    ],
  },
  {
    id: 'focus-reset',
    title: 'Focus Reset',
    subtitle: 'Clear your mind fast',
    duration: 5,
    emoji: '⚡',
    color: '#f0d98d',
    stages: [
      { label: 'Stop', text: 'Stop what you are doing. Set everything aside for 5 minutes. This time is yours.', secs: 30 },
      { label: 'Breathe', text: 'Inhale for 4 counts, hold for 4, exhale for 4. Repeat this 4 times.', secs: 60 },
      { label: 'Observe', text: 'Notice your thoughts without judgement. Let them pass like clouds.', secs: 60 },
      { label: 'Anchor', text: 'Focus on one physical sensation — the weight of your body, the air on your skin.', secs: 60 },
      { label: 'Intention', text: 'Set one clear intention for the next hour. Just one. Carry it forward with focus.', secs: 50 },
    ],
  },
];

// ─── Wellness Challenges ───────────────────────────────────────────────────────
const CHALLENGES_KEY = 'mindbridge_challenges';

const CHALLENGES = [
  { id: 'breathe5', title: '5-Day Breathing', desc: 'Complete a breathing session every day for 5 days.', days: 5, emoji: '🌬️', color: '#a1f3c3' },
  { id: 'journal3', title: '3-Day Journal', desc: 'Write a journal entry 3 days in a row.', days: 3, emoji: '📔', color: '#b4a1f3' },
  { id: 'mood7', title: '7-Day Mood Log', desc: 'Log your mood every day for a week.', days: 7, emoji: '😊', color: '#f0d98d' },
  { id: 'habit5', title: '5-Day Habit Streak', desc: 'Complete all habits for 5 consecutive days.', days: 5, emoji: '✅', color: '#8dd9f0' },
  { id: 'sleep5', title: '5-Day Sleep Tracker', desc: 'Log your sleep quality for 5 days.', days: 5, emoji: '😴', color: '#ffb4ab' },
];

function loadChallengeProgress(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(CHALLENGES_KEY) || '{}'); } catch { return {}; }
}
function saveChallengeProgress(data: Record<string, string[]>) {
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(data));
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: any = {
  page:  { minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-text)', paddingBottom: 100 },
  header: {
    position: 'sticky', top: 0, zIndex: 10,
    background: 'rgba(var(--color-surface-dim-raw, 18,18,30), 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--color-border)',
    padding: '14px 20px',
  },
  headerRow: { maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 },
  backBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
  main: { maxWidth: 480, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 28 },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--color-text-muted)',
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
  },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid',
    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
    background: active ? 'rgba(var(--color-primary-raw, 161,243,195), 0.12)' : 'var(--color-surface)',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
  }),
  breathArea: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
    padding: '32px 0',
  },
  circleWrap: { position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  circleOuter: (color: string, scale: number, animating: boolean): React.CSSProperties => ({
    position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
    background: `${color}18`,
    border: `2px solid ${color}60`,
    transform: `scale(${animating ? scale : 1})`,
    transition: `transform ${animating ? 4 : 0.3}s ease-in-out, background 0.5s, border-color 0.5s`,
  }),
  circleInner: (color: string, scale: number, animating: boolean): React.CSSProperties => ({
    width: 100, height: 100, borderRadius: '50%',
    background: `${color}30`,
    border: `3px solid ${color}`,
    boxShadow: `0 0 40px ${color}50, 0 0 80px ${color}25`,
    transform: `scale(${animating ? scale : 1})`,
    transition: `transform ${animating ? 4 : 0.3}s ease-in-out, background 0.5s, border-color 0.5s, box-shadow 0.5s`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 2,
  }),
  phaseLabel: { fontSize: 13, fontWeight: 700, color: 'var(--color-text)' },
  phaseCount: { fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-heading)' },
  progressRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' },
  dots: { display: 'flex', gap: 6 },
  dot: (filled: boolean): React.CSSProperties => ({
    width: 8, height: 8, borderRadius: 4,
    background: filled ? 'var(--color-primary)' : 'var(--color-surface-bright)',
    transition: 'background 0.3s',
  }),
  ctrlRow: { display: 'flex', gap: 12 },
  ctrlBtn: (variant: 'primary' | 'ghost'): React.CSSProperties => ({
    padding: '10px 24px', borderRadius: 12, border: '1px solid',
    background: variant === 'primary' ? 'var(--color-primary)' : 'var(--color-surface)',
    borderColor: variant === 'primary' ? 'var(--color-primary)' : 'var(--color-border)',
    color: variant === 'primary' ? 'var(--color-background)' : 'var(--color-text-muted)',
    cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.2s',
  }),
  groundStep: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px',
    borderRadius: 14,
    background: active ? 'rgba(var(--color-primary-raw, 161,243,195), 0.08)' : 'var(--color-surface)',
    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
    transition: 'all 0.3s', cursor: 'pointer',
  }),
  groundNum: (active: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: active ? 'var(--color-primary)' : 'var(--color-surface-bright)',
    color: active ? 'var(--color-background)' : 'var(--color-text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 16, transition: 'all 0.3s',
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function WellnessExercises() {
  const navigate = useNavigate();

  // ── exercise tab
  const [exerciseKey, setExerciseKey] = useState<'box' | 'four78'>('box');
  const exercise = EXERCISES[exerciseKey];

  // ── breathing state
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(exercise.phases[0].duration);
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = exercise.phases[phaseIdx];

  // reset when switching exercises
  useEffect(() => {
    reset();
  }, [exerciseKey]);

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setPhaseIdx(0);
    setCountdown(exercise.phases[0].duration);
    setCycle(0);
    setDone(false);
  }

  function startStop() {
    if (done) { reset(); return; }
    setRunning(r => !r);
  }

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c > 1) return c - 1;
        // move to next phase
        setPhaseIdx(pi => {
          const nextPi = (pi + 1) % exercise.phases.length;
          if (nextPi === 0) {
            setCycle(cy => {
              const next = cy + 1;
              if (next >= exercise.totalCycles) {
                setRunning(false);
                setDone(true);
              }
              return next;
            });
          }
          setCountdown(exercise.phases[nextPi].duration);
          return nextPi;
        });
        return 0; // momentary; gets overwritten above
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, exercise]);

  // ── grounding state
  const [groundActive, setGroundActive] = useState<number | null>(null);

  // ── top-level page tab
  const [pageTab, setPageTab] = useState<'breathe' | 'meditate' | 'challenges'>('breathe');

  // ── meditation state
  const [medId, setMedId] = useState<string | null>(null);
  const [medStageIdx, setMedStageIdx] = useState(0);
  const [medSecsLeft, setMedSecsLeft] = useState(0);
  const [medRunning, setMedRunning] = useState(false);
  const [medDone, setMedDone] = useState(false);
  const medTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedMed = MEDITATIONS.find(m => m.id === medId);
  const medStage = selectedMed?.stages[medStageIdx];

  function startMed(id: string) {
    const med = MEDITATIONS.find(m => m.id === id)!;
    setMedId(id);
    setMedStageIdx(0);
    setMedSecsLeft(med.stages[0].secs);
    setMedRunning(true);
    setMedDone(false);
  }

  function resetMed() {
    if (medTimerRef.current) clearInterval(medTimerRef.current);
    setMedId(null); setMedRunning(false); setMedDone(false);
  }

  useEffect(() => {
    if (!medRunning || !selectedMed) {
      if (medTimerRef.current) clearInterval(medTimerRef.current);
      return;
    }
    medTimerRef.current = setInterval(() => {
      setMedSecsLeft(s => {
        if (s > 1) return s - 1;
        // next stage
        setMedStageIdx(si => {
          const next = si + 1;
          if (next >= selectedMed.stages.length) {
            setMedRunning(false);
            setMedDone(true);
            return si;
          }
          setMedSecsLeft(selectedMed.stages[next].secs);
          return next;
        });
        return 0;
      });
    }, 1000);
    return () => { if (medTimerRef.current) clearInterval(medTimerRef.current); };
  }, [medRunning, selectedMed]);

  // ── challenges state
  const [challengeProgress, setChallengeProgress] = useState(loadChallengeProgress);
  const todayKey = new Date().toISOString().slice(0, 10);

  function toggleChallengeDay(id: string) {
    setChallengeProgress(prev => {
      const days = prev[id] || [];
      const updated = days.includes(todayKey)
        ? days.filter(d => d !== todayKey)
        : [...days, todayKey];
      const next = { ...prev, [id]: updated };
      saveChallengeProgress(next);
      return next;
    });
  }

  const PAGE_TABS = [
    { key: 'breathe' as const, label: 'Breathe', icon: Wind },
    { key: 'meditate' as const, label: 'Meditate', icon: Moon },
    { key: 'challenges' as const, label: 'Challenges', icon: Trophy },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-4 bg-surface-container/60 p-4 sm:p-5 rounded-2xl border border-border-structural/80 backdrop-blur-xl shadow-md">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 rounded-xl bg-surface-container-high/70 hover:bg-surface-container-highest text-on-surface-variant hover:text-white border border-border-structural/60 transition-colors active:scale-95 flex items-center justify-center shrink-0 shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Breathe &amp; Reset Studio</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Mindfulness</span>
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
              Guided acoustic relaxation, clinical somatic breathing, and daily wellness challenges.
            </p>
          </div>
        </div>
      </div>

      <main className="space-y-6">
        {/* ── Page-level tabs ── */}
        <div className="flex bg-surface-container-highest/60 backdrop-blur-md rounded-2xl p-1.5 gap-1.5 border border-border-structural">
          {PAGE_TABS.map(({ key, label, icon: Icon }) => (
            <button 
              key={key} 
              onClick={() => setPageTab(key)}
              className={`flex-1 py-2.5 px-3 rounded-xl font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                pageTab === key 
                  ? 'bg-gradient-to-r from-interactive-primary/30 to-secondary/30 text-secondary-fixed border border-interactive-primary/40 shadow-md' 
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={pageTab === key ? 'text-secondary-fixed' : 'text-outline'} /> 
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Guided Breathing ── */}
        {pageTab === 'breathe' && <>
        <section>
          <p style={styles.sectionLabel}><Wind size={12} /> Guided Breathing</p>

          {/* Exercise Selector */}
          <div style={styles.tabRow}>
            {(Object.keys(EXERCISES) as Array<keyof typeof EXERCISES>).map(key => (
              <button key={key} style={styles.tab(exerciseKey === key)} onClick={() => setExerciseKey(key)}>
                {EXERCISES[key].name}
              </button>
            ))}
          </div>

          {/* Description card */}
          <Card style={{ padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{exercise.tagline}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{exercise.description}</p>
          </Card>

          {/* Breathing circle + controls */}
          <Card style={{ padding: '28px 20px' }}>
            <div style={styles.breathArea}>

              {/* Animated circle */}
              <div style={styles.circleWrap}>
                <div style={styles.circleOuter(currentPhase.color, currentPhase.scale, running)} />
                <div style={styles.circleInner(currentPhase.color, currentPhase.scale, running)}>
                  <span style={{ ...styles.phaseCount, color: currentPhase.color }}>
                    {done ? '✓' : countdown}
                  </span>
                  <span style={styles.phaseLabel}>{done ? 'Done!' : currentPhase.label}</span>
                </div>
              </div>

              {/* Cycle progress dots */}
              <div style={styles.progressRow}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {done ? 'Session complete 🎉' : `Cycle ${cycle + 1} of ${exercise.totalCycles}`}
                </span>
                <div style={styles.dots}>
                  {Array.from({ length: exercise.totalCycles }).map((_, i) => (
                    <div key={i} style={styles.dot(i < cycle || done)} />
                  ))}
                </div>
                {/* Phase progress bar */}
                <div style={{ width: '100%', maxWidth: 200, height: 3, background: 'var(--color-surface-bright)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: currentPhase.color,
                    width: `${((currentPhase.duration - countdown) / currentPhase.duration) * 100}%`,
                    transition: 'width 1s linear',
                  }} />
                </div>
              </div>

              {/* Controls */}
              <div style={styles.ctrlRow}>
                <button style={styles.ctrlBtn('primary')} onClick={startStop}>
                  {done ? <RotateCcw size={16} /> : running ? <Pause size={16} /> : <Play size={16} />}
                  {done ? 'Restart' : running ? 'Pause' : 'Start'}
                </button>
                {(running || cycle > 0) && !done && (
                  <button style={styles.ctrlBtn('ghost')} onClick={reset}>
                    <RotateCcw size={16} /> Reset
                  </button>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* ── Grounding Technique ── */}
        <section>
          <p style={styles.sectionLabel}><Sparkles size={12} /> 5-4-3-2-1 Grounding</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            Tap each step to work through this evidence-based anxiety grounding technique.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GROUNDING_STEPS.map(({ num, sense, icon: Icon, prompt }) => {
              const active = groundActive === num;
              return (
                <div
                  key={num}
                  style={styles.groundStep(active)}
                  onClick={() => setGroundActive(active ? null : num)}
                >
                  <div style={styles.groundNum(active)}>{num}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Icon size={14} color={active ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {num} things to {sense}
                      </span>
                    </div>
                    {active && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.6, animation: 'fadeIn 0.3s ease' }}>
                        {prompt}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Affirmation ── */}
        <Card style={{ padding: '20px 18px', background: 'rgba(161,243,195,0.06)', borderColor: 'rgba(161,243,195,0.2)' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Daily Affirmation</p>
          <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.65, fontStyle: 'italic', color: 'var(--color-text)' }}>
            "You don't have to be positive all the time. It's okay to feel whatever you feel right now."
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>— Lori Deschene</p>
        </Card>
        </>}

        {/* ── Meditate ── */}
        {pageTab === 'meditate' && (
          <section>
            {!medId ? (
              <>
                <p style={{ ...styles.sectionLabel, marginBottom: 16 }}><Moon size={12} /> Choose a session</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {MEDITATIONS.map(med => (
                    <Card key={med.id} style={{ padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => startMed(med.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                          background: `${med.color}20`, border: `1px solid ${med.color}50`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        }}>{med.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: 15, margin: 0, marginBottom: 2 }}>{med.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{med.subtitle}</p>
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: med.color, margin: 0 }}>{med.duration} min</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : medDone ? (
              <Card style={{ padding: '40px 20px', textAlign: 'center' as const, borderColor: `${selectedMed!.color}40` }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>🙏</p>
                <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-heading)', color: selectedMed!.color, marginBottom: 6 }}>Session Complete</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>{selectedMed!.title} — {selectedMed!.duration} minutes</p>
                <button onClick={resetMed} style={styles.ctrlBtn('primary')}>
                  <RotateCcw size={15} /> Done
                </button>
              </Card>
            ) : (
              <Card style={{ padding: '24px 20px', borderColor: `${selectedMed!.color}40` }}>
                {/* Stage progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{selectedMed!.title}</p>
                  <button onClick={resetMed} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 12 }}>✕ Exit</button>
                </div>
                <div style={styles.dots}>
                  {selectedMed!.stages.map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= medStageIdx ? selectedMed!.color : 'var(--color-surface-bright)',
                      transition: 'background 0.4s',
                    }} />
                  ))}
                </div>
                {/* Timer orb */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 20px', gap: 16 }}>
                  <div style={{
                    width: 130, height: 130, borderRadius: '50%',
                    background: `${selectedMed!.color}15`,
                    border: `2px solid ${selectedMed!.color}50`,
                    boxShadow: `0 0 50px ${selectedMed!.color}30`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    animation: medRunning ? 'pulse 4s ease-in-out infinite' : 'none',
                  }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: selectedMed!.color, fontFamily: 'var(--font-heading)' }}>
                      {medSecsLeft}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>sec</span>
                  </div>
                  <div style={{ textAlign: 'center' as const }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: selectedMed!.color, marginBottom: 6 }}>{medStage?.label}</p>
                    <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.65, maxWidth: 300, textAlign: 'center' as const }}>{medStage?.text}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <button onClick={() => setMedRunning(r => !r)} style={styles.ctrlBtn('primary')}>
                    {medRunning ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Resume</>}
                  </button>
                  <button onClick={resetMed} style={styles.ctrlBtn('ghost')}><RotateCcw size={15} /> Exit</button>
                </div>
              </Card>
            )}
          </section>
        )}

        {/* ── Challenges ── */}
        {pageTab === 'challenges' && (
          <section>
            <p style={{ ...styles.sectionLabel, marginBottom: 16 }}><Trophy size={12} /> 5-Day Micro-Challenges</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {CHALLENGES.map(ch => {
                const progress = challengeProgress[ch.id] || [];
                const doneToday = progress.includes(todayKey);
                const pct = Math.min(100, Math.round((progress.length / ch.days) * 100));
                const complete = progress.length >= ch.days;
                return (
                  <Card key={ch.id} style={{ padding: '16px 18px', borderColor: complete ? `${ch.color}50` : 'var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 26 }}>{ch.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, margin: 0, marginBottom: 2, color: complete ? ch.color : 'var(--color-text)' }}>{ch.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{ch.desc}</p>
                      </div>
                      {complete
                        ? <CheckCircle2 size={20} color={ch.color} />
                        : <span style={{ fontSize: 11, fontWeight: 700, color: ch.color }}>{progress.length}/{ch.days}d</span>
                      }
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--color-surface-bright)', marginBottom: 10 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: ch.color, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                    </div>
                    {!complete && (
                      <button
                        onClick={() => toggleChallengeDay(ch.id)}
                        style={{
                          width: '100%', padding: '8px', borderRadius: 10,
                          border: `1px solid ${doneToday ? ch.color : 'var(--color-border)'}`,
                          background: doneToday ? `${ch.color}20` : 'var(--color-surface)',
                          color: doneToday ? ch.color : 'var(--color-text-muted)',
                          fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        {doneToday ? <><CheckCircle2 size={14} /> Done today!</> : <><Star size={14} /> Mark today complete</>}
                      </button>
                    )}
                    {complete && (
                      <div style={{ textAlign: 'center' as const, fontSize: 12, color: ch.color, fontWeight: 700 }}>
                        🏆 Challenge complete!
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

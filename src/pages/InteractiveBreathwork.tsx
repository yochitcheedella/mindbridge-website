import React, { useState, useEffect, useRef } from 'react';
import { Wind, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Heart, Zap, ShieldCheck } from 'lucide-react';

interface BreathingRegimen {
  id: string;
  title: string;
  subtitle: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  color: string;
  description: string;
  icon: string;
}

const REGIMENS: BreathingRegimen[] = [
  {
    id: 'box',
    title: 'Box Breathing (4-4-4-4)',
    subtitle: 'Optimal Focus & Exam Anxiety Relief',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    color: 'from-cyan-500 to-blue-600',
    description: 'Used by Navy SEALs and peak academic performers to quickly balance autonomic nervous stimulation during high-stakes exams or presentations.',
    icon: 'center_focus_strong'
  },
  {
    id: 'relax',
    title: 'Deep Calm (4-7-8 Protocol)',
    subtitle: 'Insomnia & Racing Thoughts Alleviation',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    color: 'from-purple-500 to-indigo-600',
    description: 'Developed by clinical neuroscientists to trigger rapid activation of the parasympathetic rest-and-digest response before sleep.',
    icon: 'bedtime'
  },
  {
    id: 'energy',
    title: 'Cognitive Reset (4-2-4)',
    subtitle: 'Mid-Day Mental Fatigue Booster',
    inhale: 4,
    holdIn: 2,
    exhale: 4,
    holdOut: 2,
    color: 'from-emerald-400 to-teal-600',
    description: 'A rhythmic vitalizing routine designed to re-oxygenate neural pathways during intense study sessions and long lecture days.',
    icon: 'bolt'
  }
];

export default function InteractiveBreathwork() {
  const [selectedRegimen, setSelectedRegimen] = useState<BreathingRegimen>(REGIMENS[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Ready' | 'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Ready');
  const [timer, setTimer] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio synths or simple beep cues
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChompBeep = (freq: number, duration: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted by auto-play policies
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      if (phase === 'Ready') {
        setPhase('Inhale');
        setTimer(selectedRegimen.inhale);
        playChompBeep(392, 0.8); // G4 Tone
      }

      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            // Move to next phase
            if (phase === 'Inhale') {
              if (selectedRegimen.holdIn > 0) {
                setPhase('Hold');
                playChompBeep(440, 0.4); // A4 Tone
                return selectedRegimen.holdIn;
              } else {
                setPhase('Exhale');
                playChompBeep(330, 0.8); // E4 Tone
                return selectedRegimen.exhale;
              }
            } else if (phase === 'Hold') {
              setPhase('Exhale');
              playChompBeep(330, 0.8);
              return selectedRegimen.exhale;
            } else if (phase === 'Exhale') {
              if (selectedRegimen.holdOut > 0) {
                setPhase('Pause');
                playChompBeep(261, 0.4); // C4 Tone
                return selectedRegimen.holdOut;
              } else {
                setPhase('Inhale');
                setCyclesCompleted(c => c + 1);
                playChompBeep(392, 0.8);
                return selectedRegimen.inhale;
              }
            } else if (phase === 'Pause') {
              setPhase('Inhale');
              setCyclesCompleted(c => c + 1);
              playChompBeep(392, 0.8);
              return selectedRegimen.inhale;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, phase, selectedRegimen]);

  const toggleStart = () => {
    if (isActive) {
      setIsActive(false);
      setPhase('Ready');
      setTimer(0);
    } else {
      setIsActive(true);
      setPhase('Inhale');
      setTimer(selectedRegimen.inhale);
    }
  };

  // Determine sphere animation style based on active breathing state
  const getSphereStyle = () => {
    if (!isActive) return 'scale-100 opacity-60 shadow-[0_0_30px_rgba(80,216,233,0.3)] duration-700';
    if (phase === 'Inhale') return 'scale-[1.45] opacity-100 shadow-[0_0_80px_rgba(145,241,255,0.9)] duration-[4000ms] ease-out';
    if (phase === 'Hold') return 'scale-[1.45] opacity-90 shadow-[0_0_80px_rgba(255,219,200,0.8)] duration-500';
    if (phase === 'Exhale') return 'scale-[0.85] opacity-50 shadow-[0_0_20px_rgba(94,107,255,0.4)] duration-[4000ms] ease-in';
    return 'scale-[0.85] opacity-50 shadow-[0_0_20px_rgba(94,107,255,0.4)] duration-500';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-container border border-border-structural">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary-fixed text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Wind size={14} />
            <span>Neuro-Somatic Calm Canopy</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-white">Guided Breathwork Studio</h1>
          <p className="text-sm text-on-surface-variant max-w-2xl mt-1">
            Immersive physiological respiration rhythms engineered to lower clinical anxiety and restore focus instantly.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-surface-container-low px-4 py-3 rounded-2xl border border-border-structural">
          <Heart className="text-rose-400 animate-pulse" size={24} />
          <div>
            <div className="text-[11px] font-mono text-on-surface-variant uppercase">Sessions Complete</div>
            <div className="text-lg font-heading font-bold text-white">{cyclesCompleted} Breath Cycles</div>
          </div>
        </div>
      </div>

      {/* Regimen Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REGIMENS.map((r) => {
          const isSelected = selectedRegimen.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => { setSelectedRegimen(r); setIsActive(false); setPhase('Ready'); }}
              disabled={isActive}
              className={`text-left p-6 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected 
                  ? 'bg-panel-high border-secondary shadow-lg shadow-secondary/20 scale-[1.02]' 
                  : 'bg-surface-container-low border-border-structural hover:bg-surface-container opacity-80'
              } ${isActive ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white font-bold shadow-sm`}>
                    <span className="material-symbols-outlined text-xl">{r.icon}</span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-surface-container-highest text-white font-bold">
                    {r.inhale}s - {r.holdIn}s - {r.exhale}s
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-white mb-1">{r.title}</h3>
                <h4 className="text-xs font-semibold text-secondary-fixed/90 mb-2">{r.subtitle}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{r.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Breathing Canopy UI */}
      <div className="glass-panel p-8 sm:p-14 rounded-[40px] border border-border-structural relative overflow-hidden flex flex-col items-center justify-center min-h-[480px] shadow-2xl bg-gradient-to-b from-surface-container-lowest to-canvas-global">
        {/* Ambient Glow Background */}
        <div className="absolute inset-0 bg-radial-gradient from-interactive-primary/5 via-transparent to-transparent pointer-events-none"></div>

        {/* Top Floating Controls */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-11 h-11 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-white transition-colors border border-border-structural"
            title="Toggle Ambient Audio Tones"
          >
            {soundEnabled ? <Volume2 size={20} className="text-secondary-fixed" /> : <VolumeX size={20} />}
          </button>
        </div>

        {/* Breathing Animated Sphere */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-6">
          {/* Outer Ring */}
          <div className={`absolute inset-0 rounded-full border-2 border-dashed border-secondary/30 transition-transform duration-[4000ms] ${
            isActive && (phase === 'Inhale' || phase === 'Hold') ? 'scale-125 rotate-45 border-secondary-fixed' : 'scale-90 -rotate-45'
          }`}></div>

          {/* Inner Glowing Core Sphere */}
          <div className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr ${selectedRegimen.color} flex flex-col items-center justify-center transition-all ${getSphereStyle()}`}>
            <div className="text-center z-10 p-4">
              <span className="block font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wider uppercase drop-shadow-md">
                {phase}
              </span>
              {isActive && (
                <span className="block font-mono text-3xl sm:text-4xl font-black text-white mt-1 drop-shadow-md">
                  {timer}s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Phase Guidance Explanation */}
        <div className="text-center max-w-md my-4 z-10">
          <p className="text-sm font-semibold text-white tracking-wide">
            {phase === 'Ready' && 'Press start below and prepare to synchronize your respiration with the canopy sphere.'}
            {phase === 'Inhale' && 'Breathe in slowly and quietly through your nose, expanding your diaphragm...'}
            {phase === 'Hold' && 'Gently pause and maintain stillness at the peak of your inhalation...'}
            {phase === 'Exhale' && 'Exhale thoroughly through slightly parted lips, releasing all tension...'}
            {phase === 'Pause' && 'Rest quietly at the bottom of your breath before the next cycle...'}
          </p>
        </div>

        {/* Start / Stop Control Buttons */}
        <div className="flex items-center gap-4 mt-6 z-10">
          <button
            onClick={toggleStart}
            className={`px-10 py-4 rounded-full font-heading font-extrabold text-base flex items-center gap-3 transition-all duration-300 shadow-2xl ${
              isActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-interactive-primary to-secondary hover:brightness-110 text-on-primary shadow-interactive-primary/40 scale-105'
            }`}
          >
            {isActive ? (
              <>
                <Pause size={20} />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>Begin Breathwork</span>
              </>
            )}
          </button>

          {isActive && (
            <button
              onClick={() => { setIsActive(false); setPhase('Ready'); setCyclesCompleted(0); }}
              className="w-14 h-14 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-white transition-colors border border-border-structural"
              title="Reset Session"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

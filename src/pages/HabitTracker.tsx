import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Plus, Flame, Trophy, Trash2, X, Sparkles, Activity } from 'lucide-react';
import { apiFetch, isLoggedIn } from '../utils/auth';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  category: string;
  streak: number;
  completions: string[]; // ISO date strings
}

const PRESET_HABITS = [
  { id: 'sleep7', name: 'Sleep 7+ hours', emoji: '😴', category: 'Sleep' },
  { id: 'exercise', name: 'Exercise / Move', emoji: '🏃', category: 'Health' },
  { id: 'no-phone-bed', name: 'No phone before bed', emoji: '📵', category: 'Sleep' },
  { id: 'gratitude', name: 'Write 3 gratitudes', emoji: '🙏', category: 'Mindfulness' },
  { id: 'hydrate', name: 'Drink 8 glasses water', emoji: '💧', category: 'Health' },
  { id: 'meditate', name: 'Meditate 5 min', emoji: '🧘', category: 'Mindfulness' },
  { id: 'journal', name: 'Journal entry', emoji: '📔', category: 'Mindfulness' },
  { id: 'no-caffeine', name: 'Limit caffeine', emoji: '☕', category: 'Health' },
];

const STORAGE_KEY = 'mindbridge_habits';
const today = () => new Date().toISOString().slice(0, 10);
const last7 = (): string[] => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10);
});

function loadHabits(): Habit[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveHabits(h: Habit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
}
function calcStreak(completions: string[]): number {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!completions.includes(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function HabitTracker() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('⭐');
  const todayKey = today();
  const days7 = last7();
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  useEffect(() => {
    async function fetchHabits() {
      if (!isLoggedIn()) {
        setHabits(loadHabits());
        setLoaded(true);
        return;
      }
      try {
        const res = await apiFetch('/api/habits');
        if (res.ok) {
          const data = await res.json();
          setHabits(data);
        } else {
          setHabits(loadHabits());
        }
      } catch (e) {
        setHabits(loadHabits());
      }
      setLoaded(true);
    }
    fetchHabits();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveHabits(habits);
    if (isLoggedIn()) {
      apiFetch('/api/habits', {
        method: 'POST',
        body: JSON.stringify(habits)
      }).catch(console.error);
    }
  }, [habits, loaded]);

  function toggleToday(id: string) {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const done = h.completions.includes(todayKey);
      const completions = done
        ? h.completions.filter(d => d !== todayKey)
        : [...h.completions, todayKey];
      return { ...h, completions, streak: calcStreak(completions) };
    }));
  }

  function addPreset(preset: typeof PRESET_HABITS[0]) {
    if (habits.some(h => h.id === preset.id)) return;
    const newH: Habit = { ...preset, streak: 0, completions: [] };
    setHabits(prev => [...prev, newH]);
  }

  function addCustom() {
    if (!customName.trim()) return;
    const newH: Habit = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      emoji: customEmoji,
      category: 'Custom',
      streak: 0,
      completions: [],
    };
    setHabits(prev => [...prev, newH]);
    setCustomName('');
    setCustomEmoji('⭐');
    setShowAdd(false);
  }

  function removeHabit(id: string) {
    setHabits(prev => prev.filter(h => h.id !== id));
  }

  const totalDoneToday = habits.filter(h => h.completions.includes(todayKey)).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? Math.round((totalDoneToday / totalHabits) * 100) : 0;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
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
              <span>Habit & Routine Studio</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Daily Wellness</span>
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
              Consistent daily positive behavior stacking builds academic resilience.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-interactive-primary to-secondary text-white font-heading font-extrabold text-xs sm:text-sm tracking-wide hover:brightness-110 shadow-lg shadow-interactive-primary/30 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={16} /> <span>Add Habit</span>
        </button>
      </div>

      {/* Stats Banner */}
      {totalHabits > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {[
            { label: "Today's Progress", value: `${completionPct}%`, icon: '✅', color: 'from-emerald-400 to-teal-500' },
            { label: 'Done Today', value: `${totalDoneToday}/${totalHabits}`, icon: '🎯', color: 'from-blue-400 to-indigo-500' },
            { label: 'Best Streak', value: `${longestStreak}d`, icon: '🔥', color: 'from-amber-400 to-orange-500' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="glass-panel p-4 sm:p-5 rounded-2xl border border-border-structural text-center space-y-1 shadow-lg">
              <span className="text-xl sm:text-2xl inline-block">{icon}</span>
              <div className={`text-xl sm:text-3xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r ${color}`}>
                {value}
              </div>
              <div className="text-[10px] sm:text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider truncate">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add habit modal/panel */}
      {showAdd && (
        <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-interactive-primary/40 shadow-2xl space-y-6 relative overflow-hidden bg-surface-container-high/90 animate-slide-up">
          <div className="flex justify-between items-center border-b border-border-structural/60 pb-3">
            <h3 className="font-heading font-bold text-base sm:text-lg text-white flex items-center gap-2">
              <Sparkles className="text-secondary-fixed" size={18} />
              <span>Add a Wellness Habit</span>
            </h3>
            <button 
              onClick={() => setShowAdd(false)} 
              className="p-1 rounded-lg text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant block">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_HABITS.map(p => {
                const already = habits.some(h => h.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addPreset(p)}
                    disabled={already}
                    className={`px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 ${
                      already
                        ? 'border-border-structural bg-surface-container text-on-surface-variant/60 cursor-default'
                        : 'border-interactive-primary/50 bg-interactive-primary/15 text-secondary-fixed hover:bg-interactive-primary/25 cursor-pointer shadow-sm shadow-interactive-primary/10'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom habit input */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant block">
              Or Create Custom Habit
            </label>
            <div className="flex gap-2 sm:gap-3">
              <input
                value={customEmoji}
                onChange={e => setCustomEmoji(e.target.value)}
                className="w-14 text-center text-xl bg-surface-container-lowest border border-border-structural rounded-xl py-2 px-1 text-white focus:outline-none focus:ring-2 focus:ring-secondary-fixed shrink-0"
                maxLength={2}
                title="Choose an emoji"
              />
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Enter routine name..."
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                className="flex-1 bg-surface-container-lowest border border-border-structural rounded-xl py-2 px-3.5 text-sm text-white placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary-fixed"
              />
              <button
                onClick={addCustom}
                className="px-5 py-2 rounded-xl bg-interactive-primary hover:brightness-110 text-white font-heading font-bold text-sm tracking-wide shadow-md active:scale-95 transition-transform shrink-0"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit List */}
      {habits.length === 0 ? (
        <div className="glass-panel py-16 px-6 rounded-3xl border border-border-structural text-center space-y-4 shadow-xl">
          <Trophy size={48} className="mx-auto text-outline/30 animate-pulse" />
          <h4 className="text-lg font-heading font-extrabold text-white">No Routines Configured Yet</h4>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Tap the <span className="text-secondary-fixed font-bold">"+ Add Habit"</span> button above to quickly adopt science-backed sleep, hydration, and mental calm rituals.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs sm:text-sm font-heading font-extrabold text-on-surface-variant uppercase tracking-wider flex items-center gap-2 px-1">
            <Flame size={16} className="text-amber-400 animate-bounce" />
            <span>Active Daily Rituals ({totalDoneToday} / {totalHabits} completed today)</span>
          </h3>
          
          <div className="grid grid-cols-1 gap-3.5">
            {habits.map(habit => {
              const doneToday = habit.completions.includes(todayKey);
              return (
                <div 
                  key={habit.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 sm:gap-5 shadow-md ${
                    doneToday 
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10' 
                      : 'glass-panel border-border-structural hover:border-white/30'
                  }`}
                >
                  {/* Check Toggle Button */}
                  <button
                    onClick={() => toggleToday(habit.id)}
                    className="shrink-0 transition-transform active:scale-90"
                    aria-label={doneToday ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {doneToday
                      ? <CheckCircle2 size={32} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      : <Circle size={32} className="text-outline hover:text-white transition-colors" />
                    }
                  </button>

                  {/* Habit details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl sm:text-2xl filter drop-shadow">{habit.emoji}</span>
                      <span className={`font-heading font-extrabold text-sm sm:text-base truncate ${
                        doneToday ? 'text-emerald-300' : 'text-white'
                      }`}>
                        {habit.name}
                      </span>
                    </div>

                    {/* 7-day visual dots */}
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-2.5 items-center">
                      {days7.map((day, i) => {
                        const isDone = habit.completions.includes(day);
                        return (
                          <div 
                            key={day} 
                            title={day} 
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-extrabold transition-colors ${
                              isDone
                                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-on-primary shadow-sm shadow-emerald-500/30'
                                : 'bg-surface-container-highest text-on-surface-variant/70 border border-border-structural'
                            }`}
                          >
                            {dayLabels[i]}
                          </div>
                        );
                      })}
                      {habit.streak > 0 && (
                        <span className="ml-1 sm:ml-2 px-2.5 py-1 rounded-full text-xs font-mono font-black tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                          <Flame size={12} className="fill-amber-400 text-amber-400" />
                          <span>{habit.streak}d Streak</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeHabit(habit.id)}
                    className="p-2 rounded-xl text-on-surface-variant hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    title="Remove routine"
                    aria-label="Remove habit"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Celebration Motivation Card */}
      {totalDoneToday === totalHabits && totalHabits > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-900/40 to-emerald-950/80 border border-emerald-400/40 text-center space-y-2 shadow-2xl animate-bounce-once">
          <span className="text-4xl inline-block">🎉</span>
          <h4 className="text-lg sm:text-xl font-heading font-black text-emerald-300 tracking-tight">
            Flawless Routine Execution!
          </h4>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
            You have successfully checked off every single wellness routine for today! Keep compounding this positive behavioral momentum tomorrow.
          </p>
        </div>
      )}
    </div>
  );
}

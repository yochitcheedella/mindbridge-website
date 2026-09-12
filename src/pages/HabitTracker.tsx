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
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 bg-[#FAFAFA] p-4 sm:p-5 rounded-2xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 rounded-xl bg-white hover:bg-neutral-100 text-[#111111] border-2 border-[#111111] transition-colors active:scale-95 flex items-center justify-center shrink-0 shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#111111] tracking-tight flex items-center gap-2">
              <span>Habit &amp; Routine Studio</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-extrabold bg-[#F4C542] text-[#111111] border border-[#111111]">Daily Wellness</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#111111]/70 font-medium mt-0.5">
              Consistent daily positive behavior stacking builds academic resilience.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="px-4 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#E5B532] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] font-heading font-extrabold text-xs sm:text-sm tracking-wide active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={16} /> <span>Add Habit</span>
        </button>
      </div>

      {/* Stats Banner */}
      {totalHabits > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {[
            { label: "Today's Progress", value: `${completionPct}%`, icon: '✅' },
            { label: 'Done Today', value: `${totalDoneToday}/${totalHabits}`, icon: '🎯' },
            { label: 'Best Streak', value: `${longestStreak}d`, icon: '🔥' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] text-center space-y-1">
              <span className="text-xl sm:text-2xl inline-block">{icon}</span>
              <div className="text-xl sm:text-3xl font-heading font-black text-[#111111]">
                {value}
              </div>
              <div className="text-[10px] sm:text-xs font-mono font-bold uppercase text-[#111111]/70 tracking-wider truncate">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add habit modal/panel */}
      {showAdd && (
        <div className="p-5 sm:p-7 rounded-3xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-6 relative overflow-hidden bg-white animate-slide-up">
          <div className="flex justify-between items-center border-b border-[#111111]/20 pb-3">
            <h3 className="font-heading font-bold text-base sm:text-lg text-[#111111] flex items-center gap-2">
              <Sparkles className="text-[#111111]" size={18} />
              <span>Add a Wellness Habit</span>
            </h3>
            <button 
              onClick={() => setShowAdd(false)} 
              className="p-1 rounded-lg text-[#111111]/60 hover:text-[#111111] hover:bg-neutral-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] block">
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
                    className={`px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center gap-2 ${
                      already
                        ? 'border-[#111111]/20 bg-neutral-100 text-[#111111]/40 cursor-default'
                        : 'border-[#111111] bg-[#FAFAFA] text-[#111111] hover:bg-[#F4C542] cursor-pointer shadow-sm'
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
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] block">
              Or Create Custom Habit
            </label>
            <div className="flex gap-2 sm:gap-3">
              <input
                value={customEmoji}
                onChange={e => setCustomEmoji(e.target.value)}
                className="w-14 text-center text-xl bg-[#FAFAFA] border-2 border-[#111111] rounded-xl py-2 px-1 text-[#111111] focus:outline-none focus:border-[#F4C542] shrink-0"
                maxLength={2}
                title="Choose an emoji"
              />
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Enter routine name..."
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                className="flex-1 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl py-2 px-3.5 text-sm text-[#111111] placeholder-[#111111]/40 focus:outline-none focus:border-[#F4C542]"
              />
              <button
                onClick={addCustom}
                className="px-5 py-2 rounded-xl bg-[#F4C542] hover:bg-[#E5B532] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] font-heading font-bold text-sm tracking-wide active:scale-95 transition-transform shrink-0"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit List */}
      {habits.length === 0 ? (
        <div className="bg-white py-16 px-6 rounded-3xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] text-center space-y-4">
          <Trophy size={48} className="mx-auto text-[#111111]/40 animate-pulse" />
          <h4 className="text-lg font-heading font-extrabold text-[#111111]">No Routines Configured Yet</h4>
          <p className="text-sm text-[#111111]/70 max-w-md mx-auto leading-relaxed">
            Tap the <span className="text-[#111111] font-bold">"+ Add Habit"</span> button above to quickly adopt science-backed sleep, hydration, and mental calm rituals.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs sm:text-sm font-heading font-extrabold text-[#111111] uppercase tracking-wider flex items-center gap-2 px-1">
            <Flame size={16} className="text-amber-500 animate-bounce" />
            <span>Active Daily Rituals ({totalDoneToday} / {totalHabits} completed today)</span>
          </h3>
          
          <div className="grid grid-cols-1 gap-3.5">
            {habits.map(habit => {
              const doneToday = habit.completions.includes(todayKey);
              return (
                <div 
                  key={habit.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3.5 sm:gap-5 shadow-[3px_3px_0px_#111111] ${
                    doneToday 
                      ? 'bg-emerald-50 border-emerald-600' 
                      : 'bg-white border-[#111111]'
                  }`}
                >
                  {/* Check Toggle Button */}
                  <button
                    onClick={() => toggleToday(habit.id)}
                    className="shrink-0 transition-transform active:scale-90"
                    aria-label={doneToday ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {doneToday
                      ? <CheckCircle2 size={32} className="text-emerald-600" />
                      : <Circle size={32} className="text-[#111111]/40 hover:text-[#111111] transition-colors" />
                    }
                  </button>

                  {/* Habit details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl sm:text-2xl filter drop-shadow">{habit.emoji}</span>
                      <span className={`font-heading font-extrabold text-sm sm:text-base truncate ${
                        doneToday ? 'text-emerald-900 line-through opacity-70' : 'text-[#111111]'
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

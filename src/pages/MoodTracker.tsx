import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SmilePlus, TrendingUp, Calendar, PenLine, CheckCircle2, ArrowLeft, Moon, BedDouble } from 'lucide-react';
import { apiFetch } from '../utils/auth';

interface MoodEntry { id: number; score: number; note: string | null; created_at: string; }

const MOOD_CONFIG = [
  { score: 1, emoji: '😭', label: 'Very Low', color: 'bg-error/70' },
  { score: 2, emoji: '😔', label: 'Low',      color: 'bg-warning/70' },
  { score: 3, emoji: '😐', label: 'Neutral',  color: 'bg-text-muted/50' },
  { score: 4, emoji: '🙂', label: 'Good',     color: 'bg-primary/70' },
  { score: 5, emoji: '🤩', label: 'Excellent', color: 'bg-success/70' },
];

const MOOD_SCORE_COLORS: Record<number, string> = {
  1: '#ffb4ab', 2: '#f7d383', 3: '#3d3f42', 4: '#5E6BFF', 5: '#a1f3c3',
};

function MoodCalendar({ history }: { history: MoodEntry[] }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d;
  });

  const scoreByDate: Record<string, number> = {};
  history.forEach(h => {
    const dateKey = new Date(h.created_at).toDateString();
    scoreByDate[dateKey] = h.score;
  });

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">30-Day Mood Calendar</h3>
      <div className="grid grid-cols-10 gap-1.5">
        {days.map((d, i) => {
          const key = d.toDateString();
          const score = scoreByDate[key];
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div key={i} title={`${d.toLocaleDateString()} — ${score ? MOOD_CONFIG[score - 1].label : 'No data'}`}
              className={`
                aspect-square rounded-md transition-all cursor-default relative
                ${score ? '' : 'bg-surface-bright'}
                ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
              `}
              style={score ? { backgroundColor: MOOD_SCORE_COLORS[score] + '99' } : {}}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {MOOD_CONFIG.map(m => (
          <div key={m.score} className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: MOOD_SCORE_COLORS[m.score] + '99' }} />
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyChart({ history }: { history: MoodEntry[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const weekScores = days.map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i + 1);
    const key = d.toDateString();
    const entry = history.find(h => new Date(h.created_at).toDateString() === key);
    return entry ? entry.score : 0;
  });
  const max = 5;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">This Week</h3>
      <div className="flex items-end gap-2 h-20">
        {weekScores.map((score, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: score ? `${(score / max) * 64}px` : '4px',
                backgroundColor: score ? MOOD_SCORE_COLORS[score] + 'cc' : '#1B1C1E',
              }}
            />
            <span className="text-[10px] text-text-muted">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SleepEntry { id: number; hours: number; quality: string; created_at: string; }

const QUALITY_CONFIG = [
  { key: 'poor',      label: 'Poor',      emoji: '😫', color: '#ffb4ab' },
  { key: 'fair',      label: 'Fair',      emoji: '😐', color: '#f7d383' },
  { key: 'good',      label: 'Good',      emoji: '🙂', color: '#a1f3c3' },
  { key: 'excellent', label: 'Excellent', emoji: '😄', color: '#5E6BFF' },
];

export default function MoodTracker() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'mood' | 'sleep'>('mood');

  // ── Mood state
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Sleep state
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<string | null>(null);
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [sleepSaving, setSleepSaving] = useState(false);
  const [sleepSaved, setSleepSaved] = useState(false);
  const [sleepLoading, setSleepLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/mood/history')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setHistory(data); })
      .finally(() => setLoading(false));
    apiFetch('/api/sleep/history')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSleepHistory(data); })
      .finally(() => setSleepLoading(false));
  }, []);

  const handleSleepLog = async () => {
    if (!sleepQuality) return;
    setSleepSaving(true);
    try {
      const res = await apiFetch('/api/sleep/log', {
        method: 'POST',
        body: JSON.stringify({ hours: sleepHours, quality: sleepQuality }),
      });
      if (res.ok) {
        const entry = await res.json();
        setSleepHistory(prev => [entry, ...prev]);
        setSleepSaved(true);
        setSleepQuality(null);
        setTimeout(() => setSleepSaved(false), 3000);
      }
    } finally { setSleepSaving(false); }
  };

  const handleLog = async () => {
    if (!selectedScore) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/mood/log', {
        method: 'POST',
        body: JSON.stringify({ score: selectedScore, note: note.trim() || null }),
      });
      if (res.ok) {
        const newEntry = await res.json();
        setHistory(prev => [newEntry, ...prev]);
        setSaved(true);
        setNote('');
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const avgScore = history.length ? (history.reduce((s, h) => s + h.score, 0) / history.length).toFixed(1) : '—';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-dim/80 backdrop-blur-xl border-b border-border px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Go back"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-bright transition-all shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-lg">Mood Tracker</h1>
            <p className="text-xs text-text-muted mt-0.5">Track your emotional wellbeing</p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-sm font-mono text-primary font-semibold">{avgScore}<span className="text-text-muted text-xs">/5</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6 animate-fade-in">
        {/* Tab switcher */}
        <div className="flex bg-surface-bright rounded-xl p-1 gap-1">
          {([['mood', SmilePlus, 'Mood Log'], ['sleep', Moon, 'Sleep Tracker']] as const).map(([key, Icon, label]) => (
            <button key={key} onClick={() => setActiveTab(key as 'mood' | 'sleep')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5
                ${activeTab === key ? 'bg-surface-dim text-primary shadow-sm' : 'text-text-muted hover:text-text'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Sleep tab */}
        {activeTab === 'sleep' && (
          <>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <BedDouble size={18} className="text-primary" />
                <h2 className="font-heading font-semibold">Last Night's Sleep</h2>
              </div>

              {/* Hours slider */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Hours slept</p>
                  <span className="font-heading font-bold text-primary text-xl">{sleepHours}h</span>
                </div>
                <input type="range" min={0} max={12} step={0.5} value={sleepHours}
                  onChange={e => setSleepHours(parseFloat(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>0h</span><span>6h</span><span>12h</span>
                </div>
              </div>

              {/* Quality selector */}
              <div className="mb-5">
                <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-3">Sleep quality</p>
                <div className="grid grid-cols-4 gap-2">
                  {QUALITY_CONFIG.map(({ key, label, emoji, color }) => (
                    <button key={key} onClick={() => setSleepQuality(sleepQuality === key ? null : key)}
                      style={sleepQuality === key ? { borderColor: color, background: `${color}20` } : {}}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200
                        ${sleepQuality === key ? 'scale-105 shadow-md' : 'border-border hover:border-primary/30 hover:bg-surface-bright'}`}>
                      <span className="text-xl">{emoji}</span>
                      <span className="text-[10px] text-text-muted font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSleepLog} disabled={!sleepQuality || sleepSaving}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                  ${sleepSaved ? 'bg-success/20 text-success border border-success/30'
                    : !sleepQuality ? 'bg-surface border border-border text-text-muted cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20'}`}>
                {sleepSaved ? <><CheckCircle2 size={16} /> Logged!</>
                  : sleepSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  : <><Moon size={16} /> Log Sleep</>}
              </button>
            </Card>

            {/* 7-day sleep history */}
            {sleepHistory.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                  <Calendar size={14} /> Recent Sleep
                </h2>
                <div className="space-y-2">
                  {sleepHistory.slice(0, 7).map(entry => {
                    const qCfg = QUALITY_CONFIG.find(q => q.key === entry.quality);
                    return (
                      <Card key={entry.id} className="flex items-center gap-4 p-3">
                        <span className="text-2xl">{qCfg?.emoji ?? '😴'}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: qCfg?.color }}>{entry.hours}h</span>
                            <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-surface border-border">{qCfg?.label}</Badge>
                            <span className="text-xs text-text-muted">{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* Mood tab */}
        {activeTab === 'mood' && <>
        {/* Today's Check-in */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <SmilePlus size={18} className="text-primary" />
            <h2 className="font-heading font-semibold">How are you feeling today?</h2>
          </div>
          <div className="flex justify-between gap-2 mb-4">
            {MOOD_CONFIG.map(({ score, emoji, label }) => (
              <button key={score} onClick={() => setSelectedScore(score)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200
                  ${selectedScore === score
                    ? 'border-primary bg-primary/15 shadow-lg shadow-primary/10 scale-105'
                    : 'border-border hover:border-primary/30 hover:bg-surface-bright'
                  }`}>
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-text-muted font-medium leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>

          {selectedScore && (
            <div className="space-y-3 animate-slide-up">
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Optional: add a note about your day..."
                rows={2}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary/50 resize-none transition-all"
              />
              <button onClick={handleLog} disabled={saving}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                  ${saved ? 'bg-success/20 text-success border border-success/30' : 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20'}`}>
                {saved ? <><CheckCircle2 size={16} /> Logged!</> : saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><PenLine size={16} /> Log Today's Mood</>}
              </button>
            </div>
          )}
        </Card>

        {/* Weekly Chart */}
        <Card className="p-5">
          <WeeklyChart history={history} />
        </Card>

        {/* 30-Day Calendar */}
        <Card className="p-5">
          {loading ? (
            <div className="flex items-center justify-center h-24 text-text-muted text-sm">Loading calendar...</div>
          ) : (
            <MoodCalendar history={history} />
          )}
        </Card>

        {/* Recent entries */}
        {history.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              <Calendar size={14} /> Recent Entries
            </h2>
            <div className="space-y-2">
              {history.slice(0, 5).map(entry => {
                const cfg = MOOD_CONFIG[entry.score - 1];
                return (
                  <Card key={entry.id} className="flex items-center gap-4 p-3">
                    <span className="text-2xl">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-surface border-border">{cfg.label}</Badge>
                        <span className="text-xs text-text-muted">{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      {entry.note && <p className="text-xs text-text-muted mt-1 truncate">{entry.note}</p>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
        </>}
      </main>
    </div>
  );
}

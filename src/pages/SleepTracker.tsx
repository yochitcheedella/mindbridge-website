import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Clock, CheckCircle, Sparkles, Flame, Bed, Activity } from 'lucide-react';
import { apiFetch, isLoggedIn } from '../utils/auth';

interface SleepLog {
  id: number;
  hours: number;
  quality: string;
  note: string | null;
  created_at: string;
}

export default function SleepTracker() {
  const navigate = useNavigate();
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState('good');
  const [history, setHistory] = useState<SleepLog[]>([]);
  const [todayLogged, setTodayLogged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }
      try {
        const [histRes, todayRes] = await Promise.all([
          apiFetch('/api/sleep/history'),
          apiFetch('/api/sleep/today')
        ]);
        
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData);
        }
        
        if (todayRes.ok) {
          const todayData = await todayRes.json();
          if (todayData && todayData.hours !== undefined) {
            setTodayLogged(true);
            setHours(todayData.hours);
            setQuality(todayData.quality);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await apiFetch('/api/sleep/log', {
        method: 'POST',
        body: JSON.stringify({ hours, quality, note: null })
      });
      if (res.ok) {
        setTodayLogged(true);
        const newLog = await res.json();
        setHistory(prev => [newLog, ...prev.filter(l => l.id !== newLog.id)]);
      }
    } catch (e) {
        console.error("Failed to save sleep log", e);
    }
  };

  const qualities = [
    { id: 'poor', label: 'Poor', icon: '😫', bg: 'bg-red-500/10 text-red-400 border-red-500/30', active: 'bg-red-500/30 border-red-400 text-white shadow-lg shadow-red-500/20', bar: '#f87171' },
    { id: 'fair', label: 'Fair', icon: '🥱', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', active: 'bg-amber-500/30 border-amber-400 text-white shadow-lg shadow-amber-500/20', bar: '#fbbf24' },
    { id: 'good', label: 'Good', icon: '🙂', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', active: 'bg-indigo-500/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/20', bar: '#6366f1' },
    { id: 'excellent', label: 'Excellent', icon: '🤩', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', active: 'bg-emerald-500/30 border-emerald-400 text-white shadow-lg shadow-emerald-500/20', bar: '#34d399' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Header Bar inside page content */}
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
              <span>Sleep & Recovery Insights</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-extrabold bg-[#F4C542] text-[#111111] border border-[#111111]">Biofeedback</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#111111]/70 font-medium mt-0.5">
              Consistent restorative sleep directly stabilizes neural calm & prevents burnout.
            </p>
          </div>
        </div>
      </div>

      {/* Main interactive cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Logger Section (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-7 rounded-3xl border-2 border-[#111111] bg-white shadow-[4px_4px_0px_#111111] space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] shadow-sm shrink-0">
                  <Moon size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-heading font-extrabold text-[#111111]">How did you rest?</h2>
                  <p className="text-xs sm:text-sm text-[#111111]/70">
                    {todayLogged ? "Your recovery data for today is securely logged." : "Log your sleep duration and perceived quality from last night."}
                  </p>
                </div>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-3 pt-2 relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#111111] uppercase font-mono tracking-wide flex items-center gap-2">
                  <Bed size={16} className="text-[#111111]" />
                  <span>Duration Logged</span>
                </span>
                <span className="text-3xl sm:text-4xl font-heading font-black text-[#111111]">
                  {hours} <span className="text-sm font-semibold text-[#111111]/60 uppercase tracking-normal">hours</span>
                </span>
              </div>
              <input 
                type="range" 
                min="1" max="12" step="0.5" 
                value={hours} 
                onChange={e => setHours(parseFloat(e.target.value))}
                disabled={todayLogged}
                className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#F4C542] focus:outline-none focus:ring-2 focus:ring-[#111111] disabled:opacity-60"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#111111]/70 px-1 font-semibold">
                <span>&lt; 2 hrs (Deficit)</span>
                <span>7-8 hrs (Optimal)</span>
                <span>12+ hrs</span>
              </div>
            </div>

            {/* Quality Picker */}
            <div className="space-y-3.5 relative z-10">
              <span className="text-sm font-bold text-[#111111] uppercase font-mono tracking-wide flex items-center gap-2">
                <Activity size={16} className="text-[#111111]" />
                <span>Perceived Quality</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {qualities.map(q => {
                  const selected = quality === q.id;
                  return (
                    <button 
                      key={q.id}
                      onClick={() => setQuality(q.id)}
                      disabled={todayLogged}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95 select-none ${
                        selected ? 'bg-[#F4C542] border-[#111111] text-[#111111] shadow-[2px_2px_0px_#111111] font-bold scale-[1.02]' : 'bg-[#FAFAFA] border-[#111111]/20 text-[#111111] hover:border-[#111111] font-semibold'
                      } ${todayLogged ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                    >
                      <span className="text-2xl sm:text-3xl filter drop-shadow">{q.icon}</span>
                      <span className="text-xs sm:text-sm tracking-wide">{q.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit / Status */}
            <div className="pt-3 relative z-10">
              {!todayLogged ? (
                <button 
                  onClick={handleSave}
                  className="w-full py-4 sm:py-4.5 rounded-2xl bg-[#F4C542] hover:bg-[#E5B532] text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] font-heading font-extrabold text-base tracking-wide active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
                >
                  <Sparkles size={20} />
                  <span>Log Rest & Update Vitality</span>
                </button>
              ) : (
                <div className="w-full py-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-600 text-emerald-800 font-heading font-extrabold text-sm flex items-center justify-center gap-2.5">
                  <CheckCircle size={20} className="text-emerald-700" />
                  <span>Sleep Logged Successfully Today</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Section (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl border-2 border-[#111111] bg-white shadow-[4px_4px_0px_#111111] space-y-5">
            <h3 className="text-sm font-heading font-extrabold text-[#111111] uppercase tracking-wider flex items-center gap-2 border-b border-[#111111]/15 pb-3.5">
              <Clock size={16} className="text-[#111111]" />
              <span>7-Day Rest & Recovery Curve</span>
            </h3>
            
            {history.length > 0 ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-end justify-between gap-2.5 h-44 px-2 pt-4 border-b border-[#111111]/20 pb-2">
                  {history.slice(0, 7).reverse().map((log, i) => {
                    const heightPct = Math.min(Math.max((log.hours / 12) * 100, 15), 100);
                    const q = qualities.find(x => x.id === log.quality);
                    const barColor = q ? q.bar : '#6366f1';
                    
                    return (
                      <div key={log.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-mono font-bold text-[#111111] opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-1">
                          {log.hours}h
                        </span>
                        <div 
                          className="w-full max-w-[34px] rounded-t-xl transition-all duration-700 ease-out group-hover:brightness-110 relative overflow-hidden shadow-sm border border-[#111111]/30"
                          style={{ height: `${heightPct}%`, backgroundColor: barColor }}
                        />
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-[#111111]/70 uppercase">
                          D{i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex items-center justify-between text-xs text-[#111111]/80 font-medium pt-1 px-1">
                  <span>Average Rest Duration</span>
                  <span className="font-mono font-bold text-[#111111] text-sm">
                    {(history.reduce((acc, l) => acc + l.hours, 0) / history.length).toFixed(1)} hrs / night
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#111111]/60 text-sm flex flex-col items-center gap-3">
                <Bed size={32} className="text-[#111111]/30 animate-pulse" />
                <span>No sleep trends recorded yet. Log your rest above to start tracking!</span>
              </div>
            )}
          </div>

          {/* Quick Tip card */}
          <div className="p-5 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#F4C542] border border-[#111111] text-[#111111] shrink-0 mt-0.5">
              <Flame size={20} />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-[#111111]">Neural Calm Safeguard</h4>
              <p className="text-xs text-[#111111]/70 mt-1 leading-relaxed">
                Sleeping fewer than 5 hours for two consecutive nights raises academic burnout stress indices by up to 45%. Take advantage of Calm Canopy breathing exercises before bed!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

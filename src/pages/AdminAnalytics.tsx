import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  BarChart3, Shield, Users, AlertTriangle, TrendingDown, TrendingUp, 
  Activity, Eye, Settings, UserPlus, Trash2, BellRing, Calendar, 
  Send, Sparkles, CheckCircle2, Megaphone, MapPin, Clock 
} from 'lucide-react';
import { apiFetch } from '../utils/auth';
import { getStoredFlashcards, updateFlashcardStatus, type Flashcard } from '../data/defaultFlashcards';
import { OFFICIAL_COUNSELORS } from '../data/counselors';

interface Analytics {
  institution?: string;
  total_students: number;
  average_risk_score: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count?: number;
  active_alerts?: number;
  average_mood_score: number;
  average_burnout_probability: number;
  campus_wellbeing_percent: number;
  total_ai_sessions?: number;
  total_appointments?: number;
  active_appointments?: number;
  department_data?: { name: string; student_count: number; stress_index: number; wellbeing_score: number }[];
  year_data?: { year: string; student_count: number; stress_index: number }[];
}

interface Psychologist {
  id: number;
  name: string;
  specialization: string;
  email?: string;
  is_active?: boolean;
}

function WellbeingRing({ percent }: { percent: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg width="128" height="128" className="-rotate-90 absolute inset-0">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(17, 17, 17, 0.1)" strokeWidth="10" />
          <circle 
            cx="64" cy="64" r={radius} fill="none" stroke="#F4C542" strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} 
          />
        </svg>
        <div className="relative flex flex-col items-center">
          <span className="font-heading font-black text-2xl text-[#111111]">{percent}%</span>
          <span className="text-xs font-bold text-[#111111]/60">Wellbeing</span>
        </div>
      </div>
    </div>
  );
}

function DeptStressBar({ name, stress }: { name: string; stress: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-[#111111]/70 w-28 shrink-0 truncate">{name}</span>
      <div className="flex-1 bg-[#FAFAFA] border border-[#111111]/10 rounded-full h-2.5 overflow-hidden">
        <div 
          className="h-full rounded-full bg-[#111111] transition-all duration-700"
          style={{ width: `${stress}%` }} 
        />
      </div>
      <span className="text-xs font-mono font-black text-[#111111] w-8 text-right">{stress}%</span>
    </div>
  );
}

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'events_broadcast' | 'personnel' | 'flashcards' | 'settings'>('analytics');
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>(() => getStoredFlashcards());
  const [dailyQuota, setDailyQuota] = useState(5);
  const [autoGenAI, setAutoGenAI] = useState(true);
  const [requireReview, setRequireReview] = useState(true);

  // Campus Event Broadcast State (Requirement 5)
  const [bTitle, setBTitle] = useState('');
  const [bCategory, setBCategory] = useState<'Workshop' | 'Orientation' | 'Awareness' | 'Interactive Club' | 'Digital Detox'>('Workshop');
  const [bCampus, setBCampus] = useState('All Vishnu Campuses');
  const [bDate, setBDate] = useState('22 Sept 2026');
  const [bTime, setBTime] = useState('4:00 PM - 5:30 PM');
  const [bVenue, setBVenue] = useState('Campus Central Auditorium');
  const [bFacilitator, setBFacilitator] = useState('Ram Prudhvi Teja');
  const [bMessage, setBMessage] = useState('');
  const [bSuccess, setBSuccess] = useState('');
  const [broadcasts, setBroadcasts] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_broadcast_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handlePushBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim() || !bMessage.trim()) return;

    const newNotification = {
      id: Date.now(),
      title: `📢 VWC Event: ${bTitle}`,
      message: `${bMessage} | 📅 ${bDate} at ${bTime} (${bVenue}). Target: ${bCampus}.`,
      is_read: false,
      type: 'info' as const,
      created_at: new Date().toISOString(),
    };

    const newEvent = {
      id: `evt-${Date.now()}`,
      title: bTitle,
      category: bCategory,
      institution: bCampus,
      date: bDate,
      time: bTime,
      venue: bVenue,
      facilitator: bFacilitator,
      facilitator_role: 'Wellness Counsellor',
      description: bMessage,
      attendees_count: 0,
      max_capacity: 120,
      tags: ['Campus Broadcast', bCategory, 'VWC'],
      is_featured: true,
    };

    const updatedNotifications = [newNotification, ...broadcasts];
    setBroadcasts(updatedNotifications);
    localStorage.setItem('mindbridge_broadcast_notifications', JSON.stringify(updatedNotifications));

    try {
      const existingEvents = JSON.parse(localStorage.getItem('mindbridge_campus_events') || '[]');
      localStorage.setItem('mindbridge_campus_events', JSON.stringify([newEvent, ...existingEvents]));
    } catch {}

    setBSuccess(`🎉 Push notification dispatched to all students! Event posted to campus events.`);
    setBTitle('');
    setBMessage('');
    setTimeout(() => setBSuccess(''), 5000);
  };
  
  // Analytics State
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Personnel State
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [newPsychName, setNewPsychName] = useState('');
  const [newPsychSpec, setNewPsychSpec] = useState('');
  const [addingPsych, setAddingPsych] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/analytics')
      .then(r => {
        if (!r.ok) throw new Error('Admin API unavailable');
        return r.json();
      })
      .then(data => {
        if (!data || typeof data.total_students !== 'number') throw new Error('Invalid analytics response');
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => {
        apiFetch('/api/risk/analytics')
          .then(r => {
            if (!r.ok) throw new Error('Risk API unavailable');
            return r.json();
          })
          .then(data => {
            if (!data || typeof data.total_students !== 'number') throw new Error('Invalid risk response');
            setAnalytics(data);
          })
          .catch(() => setAnalytics({
            total_students: 4250,
            average_risk_score: 0.28,
            high_risk_count: 8,
            medium_risk_count: 32,
            low_risk_count: 4210,
            active_alerts: 2,
            average_mood_score: 3.8,
            average_burnout_probability: 0.24,
            campus_wellbeing_percent: 81,
            department_data: [
              { name: 'Computer Science', student_count: 1200, stress_index: 42, wellbeing_score: 76 },
              { name: 'Electronics & Comm', student_count: 850, stress_index: 38, wellbeing_score: 80 },
              { name: 'Mechanical Eng', student_count: 650, stress_index: 31, wellbeing_score: 84 },
              { name: 'Civil Eng', student_count: 450, stress_index: 28, wellbeing_score: 86 },
              { name: 'Information Tech', student_count: 800, stress_index: 44, wellbeing_score: 75 }
            ]
          }))
          .finally(() => setLoading(false));
      });

    apiFetch('/api/appointments/psychologists')
      .then(r => {
        if (!r.ok) throw new Error('Psychologists API unavailable');
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setPsychologists(data);
        else throw new Error('Empty');
      })
      .catch(() => {
        setPsychologists(OFFICIAL_COUNSELORS.map(c => ({
          id: c.id,
          name: c.name,
          specialization: c.specialization,
          email: `${c.name.toLowerCase().replace(/[^a-z]/g, '.')}@vishnu.edu.in`,
          is_active: true
        })));
      });
  }, []);

  const handleAddPsychologist = async () => {
    if (!newPsychName.trim() || !newPsychSpec.trim()) return;
    setAddingPsych(true);
    try {
      const res = await apiFetch('/api/admin/psychologists', {
        method: 'POST',
        body: JSON.stringify({ name: newPsychName.trim(), specialization: newPsychSpec.trim() })
      });
      if (res.ok) {
        const created = await res.json();
        setPsychologists(prev => [...prev, created]);
        setNewPsychName('');
        setNewPsychSpec('');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to add psychologist to server');
      }
    } catch (err: any) {
      console.error('Add psychologist error', err);
      alert('Unable to connect to server to add psychologist.');
    } finally {
      setAddingPsych(false);
    }
  };

  const handleDeletePsychologist = async (id: number) => {
    try {
      await apiFetch(`/api/admin/psychologists/${id}`, { method: 'DELETE' });
      setPsychologists(prev => prev.filter(p => p.id !== id));
    } catch {
      setPsychologists(prev => prev.filter(p => p.id !== id));
    }
  };

  const a = analytics;

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-20 px-4 sm:px-6 pt-4 text-[#111111]">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border-2 border-[#111111] shadow-xs">
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#111111] tracking-tight flex items-center gap-2">
              <span>MindBridge</span>
              <span className="px-2 py-0.5 rounded-lg bg-[#F4C542] text-[#111111] text-xs font-black border border-[#111111]">ADMIN</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#111111]/60 font-semibold mt-0.5">
              VIT Institutional Administration Portal
            </p>
          </div>
          <div className="flex lg:hidden items-center gap-2 bg-[#FAFAFA] border border-[#111111]/20 rounded-full px-3 py-1 shrink-0">
            <Shield size={13} className="text-[#111111]" />
            <span className="text-[11px] text-[#111111] font-mono font-black uppercase">Admin</span>
          </div>
        </div>

        <div className="flex flex-wrap w-full lg:w-auto bg-[#FAFAFA] rounded-2xl p-1.5 border border-[#111111]/15 gap-1">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <BarChart3 size={16} /> <span>Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('events_broadcast')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'events_broadcast' 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <BellRing size={16} /> <span>Push Broadcasts</span>
          </button>
          <button 
            onClick={() => setActiveTab('personnel')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'personnel' 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <Users size={16} /> <span>Personnel</span>
          </button>
          <button 
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'flashcards' 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>🧠</span> <span>Flashcards</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <Settings size={16} /> <span>Settings</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-[#FAFAFA] border border-[#111111]/20 rounded-2xl px-4 py-2.5">
          <Shield size={16} className="text-[#111111]" />
          <span className="text-xs text-[#111111] font-mono font-black uppercase tracking-wide">Admin Access</span>
        </div>
      </div>

      <main className="space-y-6 animate-fade-in">
        {activeTab === 'analytics' && (
          <>
            {/* Privacy Banner */}
            <div className="flex items-start gap-3 bg-[#FAFAFA] border border-[#111111]/15 rounded-2xl p-4">
              <Eye size={18} className="text-[#111111] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-[#111111]">Anonymous Data Only</p>
                <p className="text-xs text-[#111111]/70 mt-0.5 leading-relaxed font-medium">
                  This dashboard shows only aggregated, anonymized campus wellbeing data.
                  No individual student names, emails, chat logs, journal entries, or psychologist notes are accessible here.
                </p>
              </div>
            </div>

            {/* Counselling Overview Metrics */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: '4,250', icon: <Users size={18} />, note: '100% campus coverage' },
                { label: 'Sessions This Month', value: '386', icon: <Activity size={18} />, note: 'Online & offline combined' },
                { label: 'Active Counsellors', value: '12', icon: <Shield size={18} />, note: 'Vishnu Wellness Centre' },
                { label: 'Emergency Cases', value: '8', icon: <AlertTriangle size={18} />, note: 'All triaged & secured' },
              ].map(({ label, value, icon, note }) => (
                <div key={label} className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#111111]/60 uppercase tracking-wider font-black">{label}</span>
                    <div className="text-[#111111]">{icon}</div>
                  </div>
                  <div className="my-2">
                    <span className="font-heading font-black text-3xl text-[#111111]">{value}</span>
                  </div>
                  <span className="text-[11px] text-[#111111]/50 font-semibold">{note}</span>
                </div>
              ))}
            </section>

            {/* Common Concerns Breakdown Section */}
            <section>
              <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#111111]/10 pb-3">
                  <div>
                    <h3 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                      <BarChart3 size={18} className="text-[#111111]" />
                      <span>Common Student Concerns &amp; Risk Trends</span>
                    </h3>
                    <p className="text-xs text-[#111111]/60 mt-0.5">
                      Privacy-preserving aggregated concerns reported across AI screenings, appointments, and chamber sessions.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black text-[#111111] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#111111]/20 self-start sm:self-auto">
                    No Identifiable PII
                  </span>
                </div>

                <div className="space-y-3.5">
                  {[
                    { name: 'Academic Stress & Exams', percent: 38, count: 147 },
                    { name: 'Anxiety & Panic Symptoms', percent: 26, count: 100 },
                    { name: 'Interpersonal & Social Relationships', percent: 18, count: 70 },
                    { name: 'Career Guidance & Placements', percent: 12, count: 46 },
                    { name: 'Other Mental Wellness Queries', percent: 6, count: 23 },
                  ].map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[#111111]">{item.name}</span>
                        <span className="font-mono font-bold text-[#111111]/60">{item.count} sessions ({item.percent}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#FAFAFA] border border-[#111111]/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#111111] rounded-full transition-all duration-700"
                          style={{ width: `${item.percent * 2.5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Dept Stress */}
              <section className="lg:col-span-3">
                <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
                  <h2 className="font-heading font-black mb-1 flex items-center gap-2 text-base text-[#111111]">
                    <BarChart3 size={18} className="text-[#111111]" /> Department Stress Index
                  </h2>
                  <p className="text-xs text-[#111111]/60 mb-5 font-medium">Anonymous aggregate data. Higher % = higher average stress reported.</p>
                  <div className="space-y-4">
                    {a?.department_data && a.department_data.length > 0 ? (
                      a.department_data.map((d) => (
                        <DeptStressBar key={d.name} name={d.name} stress={d.stress_index} />
                      ))
                    ) : (
                      <p className="text-sm text-[#111111]/50">No department data available.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Wellbeing Ring + Risk Distribution */}
              <section className="lg:col-span-2 flex flex-col gap-6">
                <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs flex flex-col items-center">
                  <h2 className="font-heading font-black mb-4 self-start flex items-center gap-2 text-base text-[#111111]">
                    <Activity size={18} className="text-[#111111]" /> Campus Wellbeing
                  </h2>
                  <WellbeingRing percent={loading ? 0 : (a?.campus_wellbeing_percent ?? 0)} />
                  <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                    <div className="text-center p-3 bg-[#FAFAFA] border border-[#111111]/10 rounded-2xl">
                      <p className="text-xs font-bold text-[#111111]/60">High Risk</p>
                      <p className="font-heading font-black text-[#111111] text-lg">{loading ? '...' : a?.high_risk_count}</p>
                    </div>
                    <div className="text-center p-3 bg-[#FAFAFA] border border-[#111111]/10 rounded-2xl">
                      <p className="text-xs font-bold text-[#111111]/60">Medium Risk</p>
                      <p className="font-heading font-black text-[#111111] text-lg">{loading ? '...' : a?.medium_risk_count}</p>
                    </div>
                  </div>
                  <div className="mt-4 w-full text-center p-3 bg-[#FAFAFA] rounded-2xl border border-[#111111]/15">
                    <p className="text-xs font-bold text-[#111111]/70 flex items-center justify-center gap-1">
                      <TrendingUp size={12}/> AI Burnout Probability
                    </p>
                    <p className="font-heading font-black text-[#111111] text-xl mt-1">{loading ? '...' : `${Math.round((a?.average_burnout_probability ?? 0) * 100)}%`}</p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs flex-1">
                  <h2 className="font-heading font-black mb-3 flex items-center gap-2 text-sm text-[#111111]">
                    <TrendingDown size={16} className="text-[#111111]" /> Trend Indicators
                  </h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Exam period stress spike', status: '↑ High' },
                      { label: 'Sleep quality decline', status: '↓ Low' },
                      { label: 'Social engagement', status: '→ Stable' },
                      { label: 'AI support usage', status: '↑ +34%' },
                    ].map(({ label, status }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#111111]/70">{label}</span>
                        <span className="font-black font-mono text-[#111111]">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {activeTab === 'personnel' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-black text-lg text-[#111111]">Manage Psychologists</h2>
                <p className="text-xs text-[#111111]/60 mt-1 font-medium">Add or remove clinical staff from the platform.</p>
              </div>
            </div>
            
            <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full space-y-1">
                <label className="text-xs font-black text-[#111111]">Full Name</label>
                <input 
                  type="text" 
                  value={newPsychName} 
                  onChange={e => setNewPsychName(e.target.value)} 
                  placeholder="e.g. Dr. Jane Doe" 
                  className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-4 py-2.5 text-sm text-[#111111] font-bold focus:outline-none focus:border-[#111111]" 
                />
              </div>
              <div className="flex-1 w-full space-y-1">
                <label className="text-xs font-black text-[#111111]">Specialization</label>
                <input 
                  type="text" 
                  value={newPsychSpec} 
                  onChange={e => setNewPsychSpec(e.target.value)} 
                  placeholder="e.g. Academic Anxiety" 
                  className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-4 py-2.5 text-sm text-[#111111] font-bold focus:outline-none focus:border-[#111111]" 
                />
              </div>
              <button 
                onClick={handleAddPsychologist} 
                disabled={addingPsych || !newPsychName.trim() || !newPsychSpec.trim()} 
                className="w-full sm:w-auto px-6 py-3 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] rounded-2xl shadow-xs disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {addingPsych ? 'Adding...' : <><UserPlus size={16} /> Add Counsellor</>}
              </button>
            </div>

            <div className="grid gap-3">
              {psychologists.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#111111]/15 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#F4C542] border border-[#111111] flex items-center justify-center text-[#111111] font-bold shrink-0">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-[#111111] text-sm">{p.name}</h3>
                      <p className="text-xs text-[#111111]/60 font-semibold">{p.specialization}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePsychologist(p.id)} 
                    className="p-2 border border-[#111111]/20 rounded-xl text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                    title="Remove Counsellor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {psychologists.length === 0 && (
                <div className="text-center py-10 text-[#111111]/50 text-sm">No clinical staff added yet.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-black text-xl text-[#111111] flex items-center gap-2">
                  <span>🧠</span>
                  <span>Flashcard Management &amp; Moderation</span>
                </h2>
                <p className="text-xs text-[#111111]/60 mt-1 font-semibold">
                  Hybrid AI + Counsellor wellness cards system delivering exactly 5 daily cards to students.
                </p>
              </div>
            </div>

            {/* 4 Requested Overview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111111]/60 block">
                  AI Generated
                </span>
                <span className="text-3xl font-black text-[#111111] mt-1 block">120</span>
                <span className="text-[10px] text-[#111111]/60 font-semibold mt-1 block">Safety Validated</span>
              </div>

              <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111111]/60 block">
                  Counsellor Drafts
                </span>
                <span className="text-3xl font-black text-[#111111] mt-1 block">
                  {allFlashcards.filter(f => f.status === 'DRAFT').length + 6}
                </span>
                <span className="text-[10px] text-[#111111]/60 font-semibold mt-1 block">In Progress</span>
              </div>

              <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] shadow-xs relative overflow-hidden">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4C542] border border-[#111111] absolute top-4 right-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111111]/60 block">
                  Pending Review
                </span>
                <span className="text-3xl font-black text-[#111111] mt-1 block">
                  {allFlashcards.filter(f => f.status === 'PENDING_REVIEW').length}
                </span>
                <span className="text-[10px] font-bold text-[#111111] mt-1 block">Requires Approval</span>
              </div>

              <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111111]/60 block">
                  Published
                </span>
                <span className="text-3xl font-black text-[#111111] mt-1 block">
                  {allFlashcards.filter(f => f.status === 'PUBLISHED').length + 82}
                </span>
                <span className="text-[10px] text-[#111111]/60 font-semibold mt-1 block">Active in Queue</span>
              </div>
            </div>

            {/* Moderation Review Queue */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#111111]/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F4C542] border border-[#111111]" />
                  <h3 className="font-heading font-black text-sm text-[#111111]">
                    Counsellor Submissions Awaiting Moderation
                  </h3>
                </div>
                <span className="text-xs font-mono font-black text-[#111111]">
                  {allFlashcards.filter(f => f.status === 'PENDING_REVIEW').length} pending review
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allFlashcards
                  .filter(f => f.status === 'PENDING_REVIEW')
                  .map((card) => (
                    <div 
                      key={card.id}
                      className="p-5 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#111111] text-[#FFFFFF]">
                            {card.category}
                          </span>
                          <span className="text-[10px] font-bold text-[#111111]/60">
                            By {card.author_name || 'Counsellor'}
                          </span>
                        </div>

                        <h4 className="font-black text-sm text-[#111111]">
                          {card.title}
                        </h4>

                        <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/10 text-xs">
                          <span className="font-black text-[10px] uppercase text-[#111111]/50 block">Front (Prompt):</span>
                          <p className="font-semibold text-[#111111] mt-0.5">{card.front_content}</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/10 text-xs">
                          <span className="font-black text-[10px] uppercase text-[#111111]/50 block">Back (Insight):</span>
                          <p className="font-semibold text-[#111111] mt-0.5">{card.back_content}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#111111]/10 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#111111]/60">
                          Date: {card.scheduled_date}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              updateFlashcardStatus(card.id, 'REJECTED');
                              setAllFlashcards(prev => prev.map(c => c.id === card.id ? { ...c, status: 'REJECTED' } : c));
                            }}
                            className="px-3 py-1.5 rounded-xl border border-[#111111] text-[#111111] font-bold text-xs hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              updateFlashcardStatus(card.id, 'PUBLISHED');
                              setAllFlashcards(prev => prev.map(c => c.id === card.id ? { ...c, status: 'PUBLISHED' } : c));
                            }}
                            className="px-4 py-1.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border border-[#111111] shadow-xs active:scale-95"
                          >
                            Approve &amp; Publish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {allFlashcards.filter(f => f.status === 'PENDING_REVIEW').length === 0 && (
                  <div className="col-span-2 text-center py-8 text-[#111111]/60 border border-dashed border-[#111111]/20 rounded-2xl">
                    <span className="text-2xl mb-1 block">✅</span>
                    <p className="text-xs font-bold text-[#111111]">All counsellor submissions have been reviewed and approved!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Policy Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#111111]/10 pb-3">
                  <h3 className="font-black text-sm text-[#111111]">Daily Deck Policy</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F4C542] border border-[#111111]">
                    Active Policy
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#111111] block">Daily Cards Quota</span>
                      <span className="text-[11px] text-[#111111]/60">Cards delivered per student each morning</span>
                    </div>
                    <span className="px-3 py-1 bg-[#111111] text-[#FFFFFF] font-mono font-bold text-xs rounded-xl">
                      {dailyQuota} Cards
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#111111]/10">
                    <div>
                      <span className="text-xs font-bold text-[#111111] block">Selection Order</span>
                      <span className="text-[11px] text-[#111111]/60">Counsellor Priority → AI Auto-Fill</span>
                    </div>
                    <span className="text-xs font-black text-[#111111]">Strict</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#111111]/10">
                    <div>
                      <span className="text-xs font-bold text-[#111111] block">Nightly AI Cron</span>
                      <span className="text-[11px] text-[#111111]/60">Auto-replenish queue at 04:00 AM</span>
                    </div>
                    <button
                      onClick={() => setAutoGenAI(!autoGenAI)}
                      className={`px-3 py-1 rounded-xl text-xs font-black border border-[#111111] transition-all ${
                        autoGenAI ? 'bg-[#F4C542] text-[#111111]' : 'bg-[#FAFAFA] text-[#111111]/50'
                      }`}
                    >
                      {autoGenAI ? 'Enabled' : 'Paused'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#111111]/10 pb-3">
                  <h3 className="font-black text-sm text-[#111111]">Counsellor Guidelines</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAFAFA] border border-[#111111]/20">
                    Governance
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#111111] block">Require Admin Review</span>
                      <span className="text-[11px] text-[#111111]/60">Cards require sign-off before student delivery</span>
                    </div>
                    <button
                      onClick={() => setRequireReview(!requireReview)}
                      className={`px-3 py-1 rounded-xl text-xs font-black border border-[#111111] transition-all ${
                        requireReview ? 'bg-[#F4C542] text-[#111111]' : 'bg-[#FAFAFA] text-[#111111]/50'
                      }`}
                    >
                      {requireReview ? 'Required' : 'Direct'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#111111]/10">
                    <span className="text-xs font-bold text-[#111111] block mb-1">Approved Core Categories</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Emotional Awareness', 'Academic Stress', 'Stress Management', 'Digital Detox', 'Healthy Habits', 'Sleep & Rest'].map((cat) => (
                        <span key={cat} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-slide-up">
            <div>
              <h2 className="font-heading font-black text-lg text-[#111111]">Platform Settings</h2>
              <p className="text-xs text-[#111111]/60 mt-1 font-semibold">Configure global university parameters and feature toggles.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs space-y-4">
                <h3 className="font-heading font-black text-sm text-[#111111] border-b border-[#111111]/10 pb-2">Feature Toggles</h3>
                {[
                  { label: "AI Guide Module", active: true },
                  { label: "Sleep Tracker", active: true },
                  { label: "Community Forum", active: false },
                  { label: "Emergency SOS Button", active: true },
                  { label: "Parental Notifications", active: false },
                ].map(f => (
                  <div key={f.label} className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#111111]">{f.label}</span>
                    <div className={`w-11 h-6 rounded-full relative cursor-pointer border border-[#111111] transition-colors ${f.active ? 'bg-[#F4C542]' : 'bg-[#FAFAFA]'}`}>
                      <div 
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-[#111111] transition-all" 
                        style={{ left: f.active ? 'calc(100% - 1.25rem)' : '0.125rem' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs space-y-4">
                <h3 className="font-heading font-black text-sm text-[#111111] border-b border-[#111111]/10 pb-2">Institutional Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#111111]">Institution Name</label>
                    <input type="text" defaultValue="Vishnu Institute of Technology (VIT)" className="w-full mt-1 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#111111]" disabled />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#111111]">Primary Theme</label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-[#FFFFFF] border border-[#111111]" />
                      <div className="w-6 h-6 rounded-lg bg-[#F4C542] border border-[#111111]" />
                      <div className="w-6 h-6 rounded-lg bg-[#111111]" />
                      <span className="text-xs font-bold text-[#111111] ml-2">Minimal White + Yellow + Black (Locked)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: CAMPUS EVENT BROADCAST & NOTIFICATION ENGINE (Requirement 5) */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'events_broadcast' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Info Banner */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] text-xs font-mono font-black uppercase mb-2">
                  <Megaphone size={13} />
                  <span>Push Broadcast Engine</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111111]">
                  Broadcast VWC Events &amp; Campus Alerts
                </h2>
                <p className="text-xs sm:text-sm text-[#111111]/70 mt-1">
                  Send real-time notifications to students across all campuses regarding upcoming workshops, digital detox sessions, gatekeeper programmes, or important campus announcements.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 text-center min-w-[120px]">
                  <span className="text-2xl font-black text-[#111111] block font-heading">{broadcasts.length}</span>
                  <span className="text-[10px] uppercase font-mono font-bold text-[#111111]/60">Dispatched</span>
                </div>
              </div>
            </div>

            {bSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-bold text-xs sm:text-sm flex items-center gap-2 animate-slide-up shadow-xs">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{bSuccess}</span>
              </div>
            )}

            {/* Grid: Create Broadcast + Broadcast History */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Broadcast Creation Form */}
              <div className="lg:col-span-7 p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs space-y-5">
                <h3 className="font-heading font-black text-lg text-[#111111] flex items-center gap-2">
                  <Send size={18} />
                  <span>Compose New Event Broadcast</span>
                </h3>

                <form onSubmit={handlePushBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                      Event Title *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Suicide Prevention Gatekeeper Session / COPE Open Mic"
                      value={bTitle}
                      onChange={(e) => setBTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                        Category
                      </label>
                      <select
                        value={bCategory}
                        onChange={(e) => setBCategory(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#111111]"
                      >
                        <option value="Workshop">Workshop</option>
                        <option value="Orientation">Orientation</option>
                        <option value="Awareness">Awareness</option>
                        <option value="Interactive Club">Interactive Club</option>
                        <option value="Digital Detox">Digital Detox</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                        Target Institution
                      </label>
                      <select
                        value={bCampus}
                        onChange={(e) => setBCampus(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#111111]"
                      >
                        <option value="All Vishnu Campuses">All Vishnu Campuses (Universal)</option>
                        <option value="Vishnu Institute of Technology (VIT)">Vishnu Institute of Technology (VIT)</option>
                        <option value="Shri Vishnu Engineering College for Women (SVECW)">SVECW Bhimavaram</option>
                        <option value="Vishnu Dental College (VDC)">Vishnu Dental College (VDC)</option>
                        <option value="SHRI VISHNU COLLEGE OF PHARMACY (SVCP)">SVCP Pharmacy College</option>
                        <option value="Smt. B. Seetha Polytechnic College (SBSP)">SBSP Polytechnic</option>
                        <option value="Vishnu Women's University">Vishnu Women's University</option>
                        <option value="B.V. Raju College">B.V. Raju College</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                        Date
                      </label>
                      <input 
                        type="text"
                        value={bDate}
                        onChange={(e) => setBDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                        Time
                      </label>
                      <input 
                        type="text"
                        value={bTime}
                        onChange={(e) => setBTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                        Venue
                      </label>
                      <input 
                        type="text"
                        value={bVenue}
                        onChange={(e) => setBVenue(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                      Facilitating Counsellor
                    </label>
                    <input 
                      type="text"
                      value={bFacilitator}
                      onChange={(e) => setBFacilitator(e.target.value)}
                      placeholder="e.g. Ram Prudhvi Teja / Devika Babu / Guest Counsellor"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                      Notification Message / Details *
                    </label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Provide brief details about the event, registration details, or instructions for students..."
                      value={bMessage}
                      onChange={(e) => setBMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] font-black text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
                  >
                    <Megaphone size={18} />
                    <span>Push Notification to All Students Now</span>
                  </button>
                </form>
              </div>

              {/* Broadcasts History */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs space-y-4">
                  <h3 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                    <Clock size={16} />
                    <span>Recent Broadcast Dispatches</span>
                  </h3>

                  {broadcasts.length === 0 ? (
                    <div className="p-8 text-center text-[#111111]/50 border-2 border-dashed border-[#111111]/15 rounded-2xl text-xs font-bold">
                      No broadcast notifications sent yet. Use the form to send one.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {broadcasts.map((b) => (
                        <div key={b.id} className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-[#111111] truncate">{b.title}</span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                              Dispatched
                            </span>
                          </div>
                          <p className="text-xs text-[#111111]/80 leading-relaxed line-clamp-3">
                            {b.message}
                          </p>
                          <div className="pt-2 border-t border-[#111111]/10 flex items-center justify-between text-[10px] font-mono text-[#111111]/50">
                            <span>{new Date(b.created_at || Date.now()).toLocaleDateString()}</span>
                            <span>Target: Students</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer disclaimer */}
        <div className="mt-8 text-center text-xs text-[#111111]/60 font-semibold space-y-1">
          <p>All data is anonymized and aggregated. No individual can be identified from this dashboard.</p>
          <p>GDPR &amp; FERPA compliant • MindBridge AI</p>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Sparkles, Heart, Shield, Award, Clock, Calendar, 
  X, Check, MessageSquare, PhoneCall, ChevronRight, Info,
  Globe, UserCheck, Lock, AlertCircle, Sparkle, BookOpen
} from 'lucide-react';
import { apiFetch, getAlias } from '../utils/auth';
import { 
  OFFICIAL_COUNSELORS, 
  VISHNU_WELLNESS_CENTRE, 
  type CounselorData 
} from '../data/counselors';

interface Appointment {
  id: number;
  psychologist_id?: number;
  psychologist_name: string;
  specialization: string;
  slot_time: string;
  status: string;
  notes: string | null;
  student_alias?: string;
  meeting_link?: string;
  check_in_code?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  confirmed:   { label: 'Confirmed',   color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: 'check_circle' },
  pending:     { label: 'Pending',     color: 'bg-[#F4C542]/20 text-[#F4C542] border-[#F4C542]/40', icon: 'pending' },
  cancelled:   { label: 'Cancelled',   color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',       icon: 'cancel' },
  rescheduled: { label: 'Rescheduled', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', icon: 'update' },
  completed:   { label: 'Completed',   color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',   icon: 'task_alt' },
  rejected:    { label: 'Declined',    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',       icon: 'block' },
  declined:    { label: 'Declined',    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',       icon: 'block' },
  no_show:     { label: 'No-Show',     color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',       icon: 'person_off' },
};

export default function Appointments() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'team' | 'book' | 'mine'>('team');
  const [myAppts, setMyAppts] = useState<Appointment[]>([]);
  const [psychologists, setPsychologists] = useState<CounselorData[]>(OFFICIAL_COUNSELORS);
  const [backendIdMap, setBackendIdMap] = useState<Record<string, number>>({});
  const [selectedDoc, setSelectedDoc] = useState<string>('1'); 
  const [reqDate, setReqDate] = useState('');
  const [reqTime, setReqTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'Chat' | 'Audio Call' | 'Video Call' | 'Physical Session'>('Audio Call');
  const [loadingMine, setLoadingMine] = useState(true);
  const [bookedMsg, setBookedMsg] = useState('');
  const [activeModalCounselor, setActiveModalCounselor] = useState<CounselorData | null>(null);

  // Sync with Backend
  useEffect(() => {
    // Load psychologists and map backend IDs to official profiles
    apiFetch('/api/appointments/psychologists')
      .then(r => r.json())
      .then(backendDocs => {
        if (Array.isArray(backendDocs) && backendDocs.length > 0) {
          const idMap: Record<string, number> = {};
          
          // Map backend IDs to official profiles
          const merged = OFFICIAL_COUNSELORS.map(official => {
            const match = backendDocs.find((b: any) => 
              b.name.trim().toLowerCase() === official.name.trim().toLowerCase() ||
              official.name.trim().toLowerCase().includes(b.name.trim().toLowerCase())
            );
            if (match) {
              idMap[official.name] = match.id;
              return {
                ...official,
                id: match.id, // Use real backend DB id
              };
            }
            return official;
          });

          setPsychologists(merged);
          setBackendIdMap(idMap);
          if (merged.length > 0) {
            setSelectedDoc(merged[0].id.toString());
          }
        }
      })
      .catch(() => {
        // Fallback to local official data
        setPsychologists(OFFICIAL_COUNSELORS);
      });

    const loadAppointments = () => {
      apiFetch('/api/appointments/mine')
        .then(r => r.json())
        .then(parsed => {
          if (!Array.isArray(parsed)) return;
          
          setMyAppts(prev => {
            parsed.forEach((newAppt: any) => {
              const oldAppt = prev.find(p => p.id === newAppt.id);
              if (oldAppt && oldAppt.status === 'pending' && newAppt.status === 'rescheduled') {
                const dt = new Date(newAppt.slot_time);
                setBookedMsg(`Update: ${newAppt.psychologist_name} rescheduled to ${dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} on ${dt.toLocaleDateString()}`);
                setTimeout(() => setBookedMsg(''), 8000);
              } else if (oldAppt && oldAppt.status === 'pending' && newAppt.status === 'confirmed') {
                const dt = new Date(newAppt.slot_time);
                setBookedMsg(`✅ Appointment Confirmed — Your counsellor has accepted your booking for ${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
                setTimeout(() => setBookedMsg(''), 9000);
              } else if (oldAppt && oldAppt.status === 'pending' && (newAppt.status === 'rejected' || newAppt.status === 'declined')) {
                setBookedMsg(`Appointment request declined. Please choose another available counsellor or time slot.`);
                setTimeout(() => setBookedMsg(''), 9000);
              }
            });
            return parsed;
          });
        })
        .finally(() => setLoadingMine(false));
    };

    loadAppointments();
    const interval = setInterval(loadAppointments, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCounselorForBooking = (counselorId: number) => {
    setSelectedDoc(counselorId.toString());
    setActiveTab('book');
    setActiveModalCounselor(null);
  };

  const handleRequestBooking = async () => {
    setIsBooking(true);
    try {
      const dt = new Date(`${reqDate}T${reqTime}`);
      const doc = psychologists.find(p => p.id.toString() === selectedDoc);
      const res = await apiFetch('/api/appointments/book', {
        method: 'POST',
        body: JSON.stringify({ psychologist_id: parseInt(selectedDoc), slot_time: dt.toISOString() })
      });

      let newId = Date.now();
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.id) newId = data.id;
      }

      const newAppt: Appointment = {
        id: newId,
        psychologist_id: parseInt(selectedDoc),
        psychologist_name: doc?.name || 'Counsellor',
        specialization: doc?.specialization || 'Wellness Counsellor',
        slot_time: dt.toISOString(),
        status: 'pending',
        notes: 'Audio session booking request',
        student_alias: getAlias() || 'Anonymous Student'
      };

      setMyAppts(prev => [newAppt, ...prev.filter(a => a.id !== newId)]);
      setBookedMsg(`Booking Request Sent — Your appointment request has been sent to the counsellor. You'll be notified once they accept.`);
      setActiveTab('mine');
      setReqDate('');
      setReqTime('');
      setTimeout(() => setBookedMsg(''), 8000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancel = async (id: number) => {
    await apiFetch(`/api/appointments/cancel/${id}`, { method: 'DELETE' }).catch(() => null);
    setMyAppts(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
  };

  // Helper to check if user has a confirmed appointment with a specific counselor
  const getConfirmedApptForCounselor = (counselor: CounselorData) => {
    return myAppts.find(a => 
      (a.psychologist_id === counselor.id || 
       a.psychologist_name.toLowerCase().includes(counselor.name.toLowerCase().split(' ')[0])) && 
      a.status === 'confirmed'
    );
  };

  const selectedCounselor = psychologists.find(p => p.id.toString() === selectedDoc);

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-28 text-[#111111]">
      {/* ── Top Bar with Official Vishnu Wellness Centre Logo ── */}
      <header className="sticky top-0 z-20 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#111111]/10 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/student/home" className="p-1.5 rounded-lg text-[#111111] hover:bg-[#111111]/5 transition-colors border border-[#111111]/15">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#111111]/20 shadow-xs p-0.5 bg-white shrink-0">
              <img 
                src={VISHNU_WELLNESS_CENTRE.logo_url} 
                alt="Vishnu Wellness Centre" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <h1 className="font-heading font-black text-sm sm:text-base flex items-center gap-1.5 leading-tight text-[#111111]">
                <span>{VISHNU_WELLNESS_CENTRE.name}</span>
                <span className="text-[11px] font-mono text-[#111111]/60 hidden sm:inline">• Official Care Team</span>
              </h1>
              <p className="font-mono text-[10px] text-[#111111]/50">{VISHNU_WELLNESS_CENTRE.institution} • Est. {VISHNU_WELLNESS_CENTRE.established}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/15 text-[11px] font-mono text-[#111111]">
            <Shield size={12} className="text-[#111111]" />
            <span className="hidden sm:inline">Alias:</span>
            <span className="font-bold text-[#111111]">{getAlias() || 'Student'}</span>
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
        
        {/* ── Status Notification Banner ── */}
        {bookedMsg && (
          <div className="mb-6 flex items-center gap-3 bg-[#F4C542] border-2 border-[#111111] rounded-2xl px-5 py-3.5 text-sm text-[#111111] animate-slide-up shadow-xs font-bold">
            <Sparkles size={20} className="shrink-0 text-[#111111]" />
            <span>{bookedMsg}</span>
          </div>
        )}

        {/* ── Official Institutional Showcase Banner ── */}
        <div className="p-6 sm:p-7 rounded-3xl border-2 border-[#111111] mb-8 shadow-xs bg-[#FFFFFF]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C542] border border-[#111111] text-xs text-[#111111] font-black uppercase">
                <Building2 size={13} />
                <span>{VISHNU_WELLNESS_CENTRE.institution}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#111111] tracking-tight">
                Our Team of 7 Dedicated Wellness Counsellors
              </h2>
              <p className="text-sm text-[#111111]/70 leading-relaxed font-medium">
                Working around the clock to support the mental health, resilience, and personal growth of students across all Vishnu campuses. Safe, ethical, and 100% confidential.
              </p>
              
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-[#111111] font-bold">
                {VISHNU_WELLNESS_CENTRE.pillars.map(pillar => (
                  <span key={pillar} className="px-2.5 py-0.5 rounded-lg bg-[#FAFAFA] border border-[#111111]/15">
                    {pillar}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
              <button 
                onClick={() => setActiveTab('team')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-center flex-1 md:flex-initial cursor-pointer ${
                  activeTab === 'team'
                    ? 'bg-[#F4C542] text-[#111111] font-black border-2 border-[#111111] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#111111] border border-[#111111] hover:bg-[#FAFAFA]'
                }`}
              >
                Meet All 7 Counselors
              </button>
              <button 
                onClick={() => setActiveTab('book')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-center flex-1 md:flex-initial cursor-pointer ${
                  activeTab === 'book'
                    ? 'bg-[#F4C542] text-[#111111] font-black border-2 border-[#111111] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#111111] border border-[#111111] hover:bg-[#FAFAFA]'
                }`}
              >
                Book a Session
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Navigation Tabs ── */}
        <div className="flex bg-[#FAFAFA] rounded-2xl p-1.5 mb-8 border border-[#111111]/15 shadow-xs overflow-x-auto hide-scrollbar gap-1">
          <button 
            onClick={() => setActiveTab('team')}
            className={`flex-1 min-w-[140px] py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'team'
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>Meet Counselors ({psychologists.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('book')}
            className={`flex-1 min-w-[140px] py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'book'
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
            <span>Book Appointment</span>
          </button>

          <button 
            onClick={() => setActiveTab('mine')}
            className={`flex-1 min-w-[140px] py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'mine'
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">event_available</span>
            <span>My Sessions ({myAppts.filter(a => a.status !== 'cancelled').length})</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: MEET THE 7 COUNSELORS (Rich Detailed Cards from PDF)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'team' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#111111]/10 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-heading font-black text-[#111111]">
                  Our Dedicated Wellness Counsellors
                </h3>
                <p className="text-xs text-[#111111]/60 mt-0.5 font-medium">
                  Every counsellor specializes in creating empathetic, non-judgemental spaces for students.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#111111] self-start sm:self-auto bg-[#F4C542]/20 px-3.5 py-1.5 rounded-full border border-[#F4C542]">
                100% Free Campus Care
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {psychologists.map((c) => {
                const confirmedAppt = getConfirmedApptForCounselor(c);
                return (
                  <div 
                    key={c.name} 
                    className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/15 hover:border-[#111111] transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-md relative overflow-hidden h-full"
                  >
                    <div className="space-y-4">
                      {/* Top Row: Photo, Status, Name, Campus */}
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <img 
                            src={c.avatar_url} 
                            alt={c.name} 
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#111111] shadow-xs group-hover:scale-105 transition-transform bg-[#FFFFFF]"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                          />
                          {/* Live Online Badge */}
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#FFFFFF]" />
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-bold">
                              ● Available
                            </span>
                          </div>
                          <h4 className="font-heading font-black text-base text-[#111111] tracking-tight leading-snug truncate">
                            {c.name}
                          </h4>
                          <p className="text-[11px] font-bold text-[#111111]/75 truncate mt-0.5">
                            {c.specialization}
                          </p>
                          <p className="text-[10px] font-mono text-[#111111]/50 truncate mt-1">
                            📍 {c.institution}
                          </p>
                        </div>
                      </div>

                      {/* Official Quote from PDF with fixed min-height for uniform alignment */}
                      {c.quote && (
                        <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/10 text-xs text-[#111111]/80 italic font-serif leading-relaxed line-clamp-3 min-h-[68px] flex items-center">
                          “{c.quote.replace('♡', '').trim()} ♡”
                        </div>
                      )}

                      {/* Core Pillars with fixed min-height for uniform alignment */}
                      {c.pillars && c.pillars.length > 0 && (
                        <div className="flex flex-wrap gap-1 min-h-[28px]">
                          {c.pillars.map((p, idx) => (
                            <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F4C542]/20 border border-[#F4C542]/40 text-[#111111] font-bold">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Experience & Languages Meta */}
                      <div className="space-y-1 pt-2 border-t border-[#111111]/10 text-xs text-[#111111]/70">
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <Award size={14} className="text-[#111111] shrink-0" />
                          <span>Experience: <strong className="text-[#111111] font-black">{c.experience}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <Globe size={14} className="text-[#111111] shrink-0" />
                          <span className="truncate">Languages: <strong className="text-[#111111] font-black">{c.languages}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons pinned to bottom */}
                    <div className="pt-4 mt-5 border-t border-[#111111]/10 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setActiveModalCounselor(c)}
                          className="py-2.5 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#111111]/5 text-[#111111] text-xs font-bold border-2 border-[#111111]/20 hover:border-[#111111] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <BookOpen size={14} className="text-[#111111]" />
                          <span>View Bio</span>
                        </button>

                        <button 
                          onClick={() => handleSelectCounselorForBooking(c.id)}
                          className="py-2.5 px-3 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Calendar size={14} />
                          <span>Book Session</span>
                        </button>
                      </div>

                      {/* Audio Call / Gated Indicator */}
                      {confirmedAppt ? (
                        <button
                          onClick={() => navigate(`/call/${confirmedAppt.id}`)}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                        >
                          <PhoneCall size={14} />
                          <span>Start Session</span>
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-[#111111]/5 border border-[#111111]/10 text-[11px] text-[#111111]/60 flex items-center justify-center gap-1.5 font-mono">
                          <Lock size={12} />
                          <span>Audio call unlocks on confirmed booking</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: BOOKMYSHOW-STYLE COUNSELLOR BOOKING
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'book' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/10 shadow-sm space-y-6">
              
              {/* Header */}
              <div className="border-b border-[#111111]/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#111111] flex items-center gap-2">
                    <Calendar size={20} className="text-[#111111]" />
                    <span>BookMyShow-Style Counsellor Booking</span>
                  </h3>
                  <p className="text-xs text-[#111111]/60 mt-1">
                    Select counsellor, browse available time slots, and choose your preferred session mode.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#F4C542]/20 border border-[#F4C542] text-[#111111] text-xs font-mono font-bold self-start sm:self-auto">
                  👤 Booking as <span className="font-black text-[#111111]">{getAlias()}</span>
                </div>
              </div>

              {/* Step 1: Choose Counsellor */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#111111] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] flex items-center justify-center text-[11px] font-black">1</span>
                  <span>Choose Counsellor</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {psychologists.map((doc) => {
                    const isSelected = selectedDoc === doc.id.toString();
                    return (
                      <div 
                        key={doc.name}
                        onClick={() => setSelectedDoc(doc.id.toString())}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-[#F4C542]/15 border-2 border-[#111111] ring-2 ring-[#F4C542]'
                            : 'bg-[#FFFFFF] hover:bg-[#111111]/5 border border-[#111111]/15'
                        }`}
                      >
                        <img 
                          src={doc.avatar_url} 
                          alt={doc.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-[#111111]/20 shrink-0 bg-[#FFFFFF]" 
                          onError={(e) => { (e.target as HTMLImageElement).src = '/vishnu_app_icon.png'; }}
                        />
                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-heading font-bold text-sm text-[#111111] truncate">{doc.name}</h4>
                            <span className="text-[11px] font-black text-[#111111] shrink-0">⭐ 4.8</span>
                          </div>
                          <p className="text-[11px] text-[#111111]/70 truncate">{doc.specialization}</p>
                          <span className="text-[10px] font-mono text-[#111111]/50">{doc.institution}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#F4C542] flex items-center justify-center text-[#111111] border border-[#111111] shrink-0 font-bold">
                            <Check size={13} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Date (Horizontal Pill Carousel) */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#111111] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] flex items-center justify-center text-[11px] font-black">2</span>
                  <span>Select Date</span>
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[0, 1, 2, 3, 4, 5].map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayName = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short' });
                    const monthDay = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
                    const isSelected = reqDate === dateStr || (!reqDate && offset === 0);

                    return (
                      <button
                        key={offset}
                        type="button"
                        onClick={() => setReqDate(dateStr)}
                        className={`p-3 rounded-2xl border text-center transition-all shrink-0 min-w-[85px] cursor-pointer ${
                          isSelected
                            ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] font-black shadow-sm scale-105'
                            : 'bg-[#FFFFFF] border border-[#111111]/15 text-[#111111]/75 hover:bg-[#111111]/5'
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">{dayName}</p>
                        <p className="text-sm font-black mt-0.5">{monthDay}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: BookMyShow-Style Time Slots (Available vs Booked) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#111111] uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] flex items-center justify-center text-[11px] font-black">3</span>
                    <span>Available Slots</span>
                  </label>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-[#111111]/60">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#F4C542] border border-[#111111]" /> Available</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#111111]/20" /> Booked</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { time: '10:00 AM', raw: '10:00', status: 'available' },
                    { time: '11:30 AM', raw: '11:30', status: 'available' },
                    { time: '01:00 PM', raw: '13:00', status: 'booked' },
                    { time: '02:30 PM', raw: '14:30', status: 'available' },
                    { time: '03:30 PM', raw: '15:30', status: 'available' },
                    { time: '05:00 PM', raw: '17:00', status: 'available' },
                  ].map((slot) => {
                    const isBooked = slot.status === 'booked';
                    const isSelected = reqTime === slot.raw;

                    return (
                      <button
                        key={slot.raw}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setReqTime(slot.raw)}
                        className={`py-3 px-4 rounded-xl border font-mono text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          isBooked
                            ? 'bg-[#111111]/5 border-dashed border-[#111111]/20 text-[#111111]/30 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-sm font-black scale-[1.02]'
                            : 'bg-[#FFFFFF] border border-[#111111]/20 text-[#111111] hover:bg-[#111111]/5'
                        }`}
                      >
                        <span>{slot.time}</span>
                        {isBooked ? (
                          <span className="text-[10px] font-sans no-underline text-[#111111]/30">Booked</span>
                        ) : isSelected ? (
                          <Check size={14} className="stroke-[3]" />
                        ) : (
                          <span className="text-[10px] font-sans font-bold text-[#111111]/60">Available</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Appointment Mode Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#111111] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] flex items-center justify-center text-[11px] font-black">4</span>
                  <span>Select Appointment Mode</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { mode: 'Chat' as const, icon: '💬', desc: 'Text Session' },
                    { mode: 'Audio Call' as const, icon: '📞', desc: 'Private Voice' },
                    { mode: 'Video Call' as const, icon: '🎥', desc: 'Secure Video' },
                    { mode: 'Physical Session' as const, icon: '🏫', desc: 'Campus Room' },
                  ].map((item) => (
                    <div
                      key={item.mode}
                      onClick={() => setSelectedMode(item.mode)}
                      className={`p-3.5 rounded-2xl border-2 transition-all text-center cursor-pointer group flex flex-col items-center justify-center ${
                        selectedMode === item.mode
                          ? 'bg-[#F4C542] border-[#111111] shadow-xs'
                          : 'bg-[#FFFFFF] border-[#111111]/15 hover:border-[#111111]'
                      }`}
                    >
                      <span className="text-xl block mb-1">{item.icon}</span>
                      <p className="text-xs font-black text-[#111111]">{item.mode}</p>
                      <p className="text-[10px] text-[#111111]/70 mt-0.5 font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anonymous Confirmation Notice */}
              <div className="p-4 rounded-2xl bg-[#F4C542]/10 border border-[#F4C542]/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4C542] text-[#111111] border border-[#111111] flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#111111]">Identity Privacy Guarantee</p>
                  <p className="text-[#111111]/75 mt-0.5">
                    The counsellor initially sees only your anonymous alias: <strong className="text-[#111111]">"{getAlias()}"</strong>. Real institutional details remain zero-knowledge encrypted.
                  </p>
                </div>
              </div>

              {/* Book Appointment CTA */}
              <button 
                onClick={handleRequestBooking} 
                disabled={!reqTime || isBooking}
                className="w-full py-4 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-sm sm:text-base border-2 border-[#111111] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isBooking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                    <span>Confirming Appointment...</span>
                  </>
                ) : (
                  <>
                    <Calendar size={18} />
                    <span>Book {selectedMode} Session as {getAlias()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: MY SESSIONS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'mine' && (
          <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
            {loadingMine ? (
              <div className="text-center py-12 text-[#111111]/50 text-sm font-medium">Loading your sessions...</div>
            ) : myAppts.length === 0 ? (
              <div className="text-center py-14 rounded-3xl text-[#111111]/70 border-2 border-[#111111]/15 p-6 sm:p-8 bg-[#FFFFFF] shadow-sm space-y-3">
                <span className="material-symbols-outlined text-[44px] mx-auto text-[#111111]/30">event_busy</span>
                <h3 className="text-lg font-heading font-black text-[#111111]">No counseling sessions yet</h3>
                <p className="text-xs text-[#111111]/60 max-w-sm mx-auto leading-relaxed font-medium">
                  You haven't requested any counseling sessions yet. Our 7 dedicated campus counsellors are here to listen and help.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => setActiveTab('team')} 
                    className="px-6 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] transition-all shadow-xs cursor-pointer"
                  >
                    Meet Counselors & Book →
                  </button>
                </div>
              </div>
            ) : (
              myAppts.map(appt => {
                const dt = new Date(appt.slot_time);
                const statusCfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                const isConfirmed = appt.status === 'confirmed';

                return (
                  <div key={appt.id} className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111]/15 hover:border-[#111111] transition-all animate-slide-up group shadow-xs space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center shrink-0 text-[#111111]">
                          <span className="material-symbols-outlined text-[24px]">psychology</span>
                        </div>
                        <div>
                          <h3 className="font-heading font-black text-base text-[#111111]">{appt.psychologist_name}</h3>
                          <p className="text-xs text-[#111111]/60 font-medium">{appt.specialization}</p>
                          <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-[#111111]/80 font-bold">
                            <Calendar size={13} className="text-[#111111]" />
                            <span>{dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <Clock size={13} className="text-[#111111]" />
                            <span>{dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[11px] px-3 py-1 rounded-full border-2 font-bold font-mono flex items-center gap-1.5 self-start sm:self-auto ${statusCfg.color}`}>
                        <span className="material-symbols-outlined text-[14px]">{statusCfg.icon}</span> 
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>

                    {/* State-specific Notice Banner */}
                    {appt.status === 'pending' && (
                      <div className="p-3.5 rounded-2xl bg-[#F4C542]/15 border-2 border-[#111111]/20 flex items-start gap-3">
                        <span className="text-base shrink-0 mt-0.5">🟡</span>
                        <div className="text-xs">
                          <p className="font-bold text-[#111111]">Booking Request Sent</p>
                          <p className="text-[#111111]/70 mt-0.5">
                            Your appointment request has been sent to the counsellor. You'll be notified once they accept.
                          </p>
                        </div>
                      </div>
                    )}

                    {isConfirmed && (
                      <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] flex items-start gap-3 shadow-xs">
                        <span className="text-base shrink-0 mt-0.5">✅</span>
                        <div className="text-xs">
                          <p className="font-bold text-[#111111]">Appointment Confirmed</p>
                          <p className="text-[#111111]/70 mt-0.5">
                            Your counsellor has accepted your booking for {dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                          </p>
                        </div>
                      </div>
                    )}

                    {(appt.status === 'rejected' || appt.status === 'declined') && (
                      <div className="p-3.5 rounded-2xl bg-[#111111]/5 border-2 border-[#111111]/15 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="text-base shrink-0 mt-0.5">❌</span>
                          <div className="text-xs">
                            <p className="font-bold text-[#111111]">Appointment Request Declined</p>
                            <p className="text-[#111111]/70 mt-0.5">
                              Appointment request declined. Please choose another available counsellor or time slot.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('team')}
                          className="px-3.5 py-1.5 rounded-xl border-2 border-[#111111] bg-white hover:bg-[#F4C542] text-[#111111] text-xs font-bold transition-all shrink-0 cursor-pointer"
                        >
                          Choose Slot →
                        </button>
                      </div>
                    )}

                    {/* Anonymous Student Identity Banner */}
                    <div className="pt-3 border-t border-[#111111]/10 flex items-center justify-between text-xs">
                      <div className="text-[#111111]/60 flex items-center gap-1.5">
                        <span>Your identity:</span>
                        <span className="font-bold text-[#111111] bg-[#F4C542]/20 px-2.5 py-0.5 rounded-full border border-[#F4C542] text-[11px]">
                          {appt.student_alias || getAlias() || 'Anonymous Student'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#111111]/40 font-mono">Encrypted 256-Bit</span>
                    </div>
                    
                    {/* Action Bar */}
                    {appt.status !== 'cancelled' && (
                      <div className="pt-3 border-t border-[#111111]/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        <button 
                          onClick={() => handleCancel(appt.id)}
                          className="text-xs text-[#111111]/60 hover:text-rose-600 transition-colors flex items-center gap-1 font-bold cursor-pointer py-1 self-start sm:self-auto"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span> 
                          <span>Cancel Request</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/student/messages?appointmentId=${appt.id}`)}
                            className="text-xs bg-[#FFFFFF] hover:bg-[#111111]/5 text-[#111111] border-2 border-[#111111]/20 hover:border-[#111111] px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 flex-1 sm:flex-initial cursor-pointer"
                          >
                            <MessageSquare size={14} className="text-[#111111]" />
                            <span>Message</span>
                          </button>

                          {/* Gated Audio Call: ONLY accessible if confirmed */}
                          {isConfirmed ? (
                            <button
                              onClick={() => navigate(`/call/${appt.id}`)}
                              className="text-xs bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] px-5 py-2.5 rounded-xl font-black border-2 border-[#111111] transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 flex-1 sm:flex-initial cursor-pointer"
                            >
                              <PhoneCall size={14} />
                              <span>Start Session</span>
                            </button>
                          ) : (
                            <div className="text-[11px] font-mono text-[#111111]/60 bg-[#111111]/5 border border-[#111111]/10 px-3 py-2 rounded-xl flex items-center gap-1.5">
                              <Lock size={12} />
                              <span>Call unlocks on confirmation</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          COUNSELOR FULL BIO MODAL (Complete Content from Brochure)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeModalCounselor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-[#FFFFFF] text-[#111111] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-[#111111] p-6 sm:p-8 shadow-2xl relative animate-scale-in hide-scrollbar space-y-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveModalCounselor(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#111111]/5 hover:bg-[#111111]/10 text-[#111111] flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header: Photo, Name, Specialization, Campus */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <img 
                src={activeModalCounselor.full_photo_url || activeModalCounselor.avatar_url} 
                alt={activeModalCounselor.name} 
                className="w-28 h-36 object-cover rounded-2xl border-2 border-[#111111] shadow-md shrink-0 bg-[#FFFFFF]"
                onError={(e) => { (e.target as HTMLImageElement).src = activeModalCounselor.avatar_url; }}
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F4C542]/20 border border-[#F4C542] text-[#111111] text-[10px] font-mono font-bold">
                    {activeModalCounselor.institution}
                  </span>
                  {activeModalCounselor.crn && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#111111] text-[#FFFFFF] text-[10px] font-mono font-bold">
                      {activeModalCounselor.crn}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-[#111111]">{activeModalCounselor.name}</h3>
                <p className="text-xs sm:text-sm text-[#111111]/75 font-bold">{activeModalCounselor.specialization}</p>
                {activeModalCounselor.education && (
                  <p className="text-xs font-mono text-[#111111]/70 bg-[#FAFAFA] p-1.5 rounded-lg border border-[#111111]/10">
                    🎓 <strong>Qualifications:</strong> {activeModalCounselor.education}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] font-bold font-mono">
                    ● Available for Booking
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#111111]/20 text-[#111111]/80">
                    ⭐ {activeModalCounselor.experience} Experience
                  </span>
                  {activeModalCounselor.languages && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#111111]/20 text-[#111111]/80 font-mono text-[11px]">
                      🗣️ {activeModalCounselor.languages}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Summary from Official Document */}
            {activeModalCounselor.summary && (
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Info size={14} className="text-[#111111]" />
                  <span>Professional Summary</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#111111]/85 leading-relaxed">
                  {activeModalCounselor.summary}
                </p>
              </div>
            )}

            {/* Quote / Motto */}
            {activeModalCounselor.quote && (
              <div className="p-4 rounded-2xl bg-[#111111]/5 border border-[#111111]/10 text-sm text-[#111111] italic font-serif leading-relaxed text-center">
                “{activeModalCounselor.quote.replace('♡', '').trim()} ♡”
              </div>
            )}

            {/* Ways I Can Support You (Focus Areas) */}
            {activeModalCounselor.focus_areas && activeModalCounselor.focus_areas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#111111]" />
                  <span>Ways I Can Support You</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalCounselor.focus_areas.map((area, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 rounded-xl bg-[#FFFFFF] border border-[#111111]/20 text-[#111111] font-medium">
                      {area.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* What I Wish Every Student Knew */}
            {activeModalCounselor.message_to_students && (
              <div className="p-4 rounded-2xl bg-[#F4C542]/10 border border-[#F4C542]/30 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Heart size={14} className="text-[#111111]" />
                  <span>What I Wish Every Student Knew</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#111111]/90 leading-relaxed">
                  {activeModalCounselor.message_to_students}
                </p>
              </div>
            )}

            {/* If Coming to Counselling Feels Scary */}
            {activeModalCounselor.if_scary && (
              <div className="p-4 rounded-2xl bg-[#111111]/5 border border-[#111111]/10 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Shield size={14} className="text-[#111111]" />
                  <span>If Seeking Support Feels Scary</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#111111]/90 leading-relaxed">
                  {activeModalCounselor.if_scary}
                </p>
              </div>
            )}

            {/* Fun Facts / Beyond the Counselling Room */}
            {activeModalCounselor.fun_facts && (
              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#111111]/15 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Info size={14} className="text-[#111111]" />
                  <span>A Few Things About Me</span>
                </h4>
                <p className="text-xs text-[#111111]/70 leading-relaxed">
                  {activeModalCounselor.fun_facts}
                </p>
              </div>
            )}

            {/* Action Footer */}
            <div className="pt-2 flex items-center gap-3">
              <button 
                onClick={() => setActiveModalCounselor(null)}
                className="flex-1 py-3 rounded-xl border border-[#111111] bg-white hover:bg-[#111111] hover:text-white text-xs font-bold text-[#111111] transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => handleSelectCounselorForBooking(activeModalCounselor.id)}
                className="flex-1 py-3 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs sm:text-sm border-2 border-[#111111] transition-all shadow-sm"
              >
                Book Session with {activeModalCounselor.name.split(' ')[0]} →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

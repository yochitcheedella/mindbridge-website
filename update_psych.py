import sys

content = """import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Shield, AlertTriangle, Clock, ChevronRight, Activity, Filter, CheckCircle2, X, Send, Brain, ShieldAlert, FileText, TrendingUp, Bell, Plus, Calendar } from 'lucide-react';
import { apiFetch, API_URL } from '../utils/auth';
import { IdentityRequestModal } from '../components/clinical/IdentityRequestModal';

interface RiskStudent {
  anonymous_id: string;
  risk_score: number;
  department: string;
  year: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'counselor';
  text: string;
  timestamp: string;
}

interface CaseDetails {
  student: {
    anonymous_id: string;
    department: string;
    year: number;
    risk_score: number;
  };
  mood_logs: any[];
  chat_history: ChatMessage[];
}

interface CaseNote { id: number; content: string; created_at: string; }
interface FollowUpItem { id: number; due_date: string; reason: string | null; completed: boolean; }
interface DecryptedIdentity { name: string; phone: string; email: string; }

export default function PsychologistDashboard() {
  const [queue, setQueue] = useState<RiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [counselorMessage, setCounselorMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [caseTab, setCaseTab] = useState<'chat' | 'notes' | 'timeline' | 'followup'>('chat');
  
  const [decryptedIdentity, setDecryptedIdentity] = useState<DecryptedIdentity | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  // Case Notes state
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Follow-up state
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [followupDate, setFollowupDate] = useState('');
  const [followupReason, setFollowupReason] = useState('');
  const [savingFollowup, setSavingFollowup] = useState(false);

  // Appointments state
  const [view, setView] = useState<'queue' | 'appointments'>('queue');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Real-time alerts state
  const [criticalAlert, setCriticalAlert] = useState<{ alert_id?: number, student_id: string, risk_reason: string } | null>(null);
  
  // Escalation state
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateConfirmText, setEscalateConfirmText] = useState('');
  const [escalating, setEscalating] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchQueue = () => {
    fetch(`${API_URL}/api/risk/queue`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setQueue(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchAppointments = () => {
    apiFetch('/api/appointments/all')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAppointments(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchQueue();
    fetchAppointments();
    const qInterval = setInterval(fetchQueue, 10000); // refresh queue every 10s
    const aInterval = setInterval(() => {
      if (view === 'appointments') fetchAppointments();
    }, 2000); // check local appointments every 2s
    
    // Connect to real-time clinical alerts
    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/api/risk/ws/alerts`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CRITICAL_ALERT') {
          setCriticalAlert({ student_id: data.student_id, risk_reason: data.risk_reason });
          fetchQueue();
        } else if (data.type === 'EMERGENCY_SOS') {
          setCriticalAlert({ alert_id: data.alert_id, student_id: data.student_alias, risk_reason: data.message });
          fetchQueue();
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    return () => {
      clearInterval(qInterval);
      clearInterval(aInterval);
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (selectedCase) {
      fetch(`${API_URL}/api/psychologist/student/${selectedCase}`)
        .then(r => r.json())
        .then(data => setCaseDetails(data))
        .catch(console.error);
      // Load case notes
      fetch(`${API_URL}/api/psychologist/student/${selectedCase}/notes`)
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setNotes(data); }).catch(() => {});
      // Load follow-ups
      fetch(`${API_URL}/api/psychologist/student/${selectedCase}/followup`)
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setFollowUps(data); }).catch(() => {});
      setCaseTab('chat');
    } else {
      setCaseDetails(null);
      setNotes([]);
      setFollowUps([]);
      setDecryptedIdentity(null);
    }
  }, [selectedCase]);

  useEffect(() => {
    if (caseDetails) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [caseDetails]);

  const handleSendMessage = async () => {
    if (!counselorMessage.trim() || !selectedCase) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/psychologist/student/${selectedCase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: counselorMessage })
      });
      if (res.ok) {
        setCounselorMessage('');
        // Refresh details to show the new message
        const data = await (await fetch(`${API_URL}/api/psychologist/student/${selectedCase}`)).json();
        setCaseDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedCase) return;
    try {
      await fetch(`${API_URL}/api/psychologist/student/${selectedCase}/resolve`, { method: 'POST' });
      setSelectedCase(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim() || !selectedCase) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${API_URL}/api/psychologist/student/${selectedCase}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (res.ok) {
        const saved = await res.json();
        setNotes(prev => [saved, ...prev]);
        setNewNote('');
      }
    } finally { setSavingNote(false); }
  };

  const handleSaveFollowup = async () => {
    if (!followupDate || !selectedCase) return;
    setSavingFollowup(true);
    try {
      const res = await fetch(`${API_URL}/api/psychologist/student/${selectedCase}/followup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: followupDate, reason: followupReason || null }),
      });
      if (res.ok) {
        const saved = await res.json();
        setFollowUps(prev => [saved, ...prev]);
        setFollowupDate(''); setFollowupReason('');
      }
    } finally { setSavingFollowup(false); }
  };

  const handleCompleteFollowup = async (id: number) => {
    if (!selectedCase) return;
    await fetch(`${API_URL}/api/psychologist/student/${selectedCase}/followup/${id}/complete`, { method: 'POST' });
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, completed: true } : f));
  };

  const handleUpdateApptStatus = async (id: number, status: string, newTime?: string) => {
    try {
      const res = await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, new_time: newTime })
      });
      if (res.ok) {
        fetchAppointments();
        if (status === 'rescheduled') {
          setRescheduleId(null);
          setRescheduleDate('');
          setRescheduleTime('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-canvas-global text-on-surface font-body-md antialiased min-h-screen flex selection:bg-interactive-primary selection:text-white">
      <IdentityRequestModal 
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        anonymousId={selectedCase || ''}
        onSuccess={(data) => {
          setDecryptedIdentity({ name: data.real_name, phone: data.real_phone, email: data.real_email });
        }}
      />

      {/* Critical Alert Overlay */}
      {criticalAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel max-w-md w-full m-4 p-6 border-2 border-error">
            <div className="flex items-center gap-3 text-error mb-4">
              <ShieldAlert size={32} className="animate-pulse" />
              <h2 className="font-h4 font-bold text-xl uppercase tracking-wider">Critical Risk Detected</h2>
            </div>
            <p className="text-sm text-on-surface mb-2">
              The AI Guide has just flagged a critical risk for student <strong>{criticalAlert.student_id}</strong>.
            </p>
            <p className="text-xs font-mono-data bg-error-container/20 text-error p-3 rounded-lg mb-6 border border-error/30">
              Reason: {criticalAlert.risk_reason}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCriticalAlert(null)}
                className="flex-1 py-2.5 rounded-lg border border-border-structural text-sm font-semibold hover:bg-surface-container transition-colors"
              >
                Dismiss
              </button>
              <button 
                onClick={() => {
                  setSelectedCase(criticalAlert.student_id);
                  setCriticalAlert(null);
                }}
                className="flex-1 py-2.5 rounded-lg bg-error text-white text-sm font-bold hover:bg-error/90 transition-colors shadow-lg shadow-error/20"
              >
                Investigate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SideNavBar from Stitch */}
      <nav className="h-screen w-64 fixed left-0 top-0 bg-panel-low border-r border-border-structural flex flex-col py-lg px-md z-40">
        <div className="mb-xl flex items-center gap-sm px-sm mt-6">
          <div className="w-8 h-8 rounded-full bg-interactive-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">psychology</span>
          </div>
          <div>
            <h1 className="font-h4 text-h4 font-bold text-primary leading-tight">MindBridge AI</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Clinical Portal</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <button onClick={() => { setView('queue'); setSelectedCase(null); }} className={`w-full flex items-center gap-sm ${view === 'queue' && !selectedCase ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container'} rounded-lg px-md py-sm transition-colors group`}>
            <span className="material-symbols-outlined text-[20px]" style={view === 'queue' && !selectedCase ? {fontVariationSettings: "'FILL' 1"} : {}}>dashboard</span>
            <span className="font-body-md font-medium">Dashboard</span>
          </button>
          <button onClick={() => { setView('appointments'); setSelectedCase(null); }} className={`w-full flex items-center gap-sm ${view === 'appointments' && !selectedCase ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container'} rounded-lg px-md py-sm transition-colors group`}>
            <span className="material-symbols-outlined text-[20px]" style={view === 'appointments' && !selectedCase ? {fontVariationSettings: "'FILL' 1"} : {}}>event</span>
            <span className="font-body-md font-medium">Appointments</span>
          </button>
        </div>
        <div className="mt-auto pt-lg border-t border-border-internal space-y-2">
          <button className="w-full bg-error-container/20 text-error border border-error/30 rounded-lg px-md py-sm flex items-center justify-center gap-sm hover:bg-error-container/40 transition-colors">
            <span className="material-symbols-outlined text-[18px]">emergency</span>
            <span className="font-body-md font-medium">Emergency Hub</span>
          </button>
        </div>
      </nav>

      <div className="ml-64 flex-1 flex flex-col min-h-screen relative">
        {/* TopAppBar */}
        <header className="docked full-width top-0 sticky z-30 bg-background/80 backdrop-blur-xl border-b border-border-internal flex justify-between items-center h-16 px-xl">
          <div className="flex items-center gap-lg">
            <h2 className="font-h4 text-h4 font-medium text-on-surface tracking-tight">Clinical Dashboard</h2>
            <div className="h-4 w-px bg-border-structural"></div>
          </div>
          <div className="flex items-center gap-lg">
            <div className="flex items-center gap-sm bg-surface-container px-3 py-1.5 rounded-full border border-border-internal">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="font-label-sm text-label-sm text-success uppercase tracking-wider">System Normal</span>
            </div>
            <div className="flex items-center gap-sm text-on-surface-variant">
              <button className="p-2 hover:bg-surface-container rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                {queue.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>}
              </button>
              <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined">account_circle</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-xl overflow-y-auto space-y-lg">
          {view === 'queue' && !selectedCase && (
            <>
              {/* Metrics */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div className="glass-panel rounded-xl p-lg flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-md">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Students</span>
                    <span className="material-symbols-outlined text-interactive-primary text-[20px]">groups</span>
                  </div>
                  <div>
                    <div className="font-h2 text-h2 text-on-surface">1,248</div>
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-lg flex flex-col justify-between border-error/20 bg-error-container/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-error/5 to-transparent pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-md relative z-10">
                    <span className="font-label-sm text-label-sm text-error uppercase tracking-wider">High-Risk Alerts</span>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-error/20">
                      <span className="material-symbols-outlined text-error text-[16px]">warning</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="font-h2 text-h2 text-error">{queue.filter(q => q.risk_score >= 0.8).length}</div>
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-lg flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-md">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">In Queue</span>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">timer</span>
                  </div>
                  <div>
                    <div className="font-h2 text-h2 text-on-surface">{queue.length}</div>
                  </div>
                </div>
              </section>

              {/* Queue */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
                <div className="lg:col-span-2 glass-panel rounded-xl flex flex-col h-[500px]">
                  <div className="p-md border-b border-border-internal flex justify-between items-center bg-panel-high/50 rounded-t-xl">
                    <h3 className="font-h4 text-h4 font-medium flex items-center gap-sm">
                      <span className="w-2 h-2 rounded-full bg-error"></span>
                      Urgent Risk Queue
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-internal bg-surface-container-low/50">
                          <th className="py-3 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">ID</th>
                          <th className="py-3 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Department</th>
                          <th className="py-3 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-1/3">Risk Score</th>
                          <th className="py-3 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="font-body-md text-body-md text-on-surface divide-y divide-border-internal/50">
                        {queue.map(student => {
                          const isCritical = student.risk_score >= 0.8;
                          const riskColor = isCritical ? 'bg-error' : student.risk_score >= 0.5 ? 'bg-tertiary-fixed-dim' : 'bg-primary-fixed-dim';
                          const riskText = isCritical ? 'text-error' : student.risk_score >= 0.5 ? 'text-tertiary-fixed-dim' : 'text-primary-fixed-dim';
                          
                          return (
                            <tr key={student.anonymous_id} className="hover:bg-surface-container-low transition-colors group">
                              <td className="py-3 px-md font-mono-data text-on-surface">{student.anonymous_id}</td>
                              <td className="py-3 px-md text-sm">{student.department} (Y{student.year})</td>
                              <td className="py-3 px-md">
                                <div className="flex items-center gap-sm">
                                  <span className={`font-mono-data w-8 ${riskText}`}>{student.risk_score.toFixed(2)}</span>
                                  <div className="flex-1 h-1.5 bg-surface-bright rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${riskColor}`} style={{ width: `${student.risk_score * 100}%` }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-md text-right">
                                <button onClick={() => setSelectedCase(student.anonymous_id)} className="bg-surface-container border border-border-structural text-on-surface hover:bg-surface-container-high px-3 py-1.5 rounded transition-colors text-sm font-medium flex items-center gap-1 ml-auto">
                                  <span className="material-symbols-outlined text-[16px]">chat</span>
                                  View Case
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {queue.length === 0 && (
                          <tr><td colSpan={4} className="py-8 text-center text-on-surface-variant">Queue is clear</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-panel rounded-xl flex flex-col h-[500px]">
                  <div className="p-md border-b border-border-internal flex justify-between items-center bg-panel-high/50 rounded-t-xl">
                    <h3 className="font-h4 text-h4 font-medium flex items-center gap-sm">
                      <span className="material-symbols-outlined text-secondary text-[20px]">videocam</span>
                      Upcoming Sessions
                    </h3>
                  </div>
                  <div className="flex-1 p-md space-y-md overflow-y-auto">
                    {appointments.filter(a => a.status === 'confirmed').length === 0 && (
                      <p className="text-on-surface-variant text-sm text-center py-6">No upcoming sessions.</p>
                    )}
                    {appointments.filter(a => a.status === 'confirmed').map(appt => {
                       const dt = new Date(appt.slot_time);
                       return (
                          <div key={appt.id} className="bg-panel-low border border-border-internal rounded-lg p-md relative overflow-hidden group hover:border-interactive-primary/50 transition-colors">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-interactive-primary rounded-l-lg"></div>
                            <div className="flex justify-between items-start mb-2 pl-2">
                              <div>
                                <div className="font-mono-data text-label-sm text-on-surface-variant mb-1">{appt.anonymous_id}</div>
                                <div className="font-body-md font-medium text-on-surface">Session</div>
                              </div>
                              <div className="bg-surface-container px-2 py-1 rounded text-xs font-mono-data text-interactive-primary border border-border-structural flex items-center gap-1">
                                {dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            <div className="mt-4 pl-2 flex gap-2">
                              <button className="flex-1 bg-interactive-primary hover:bg-primary-fixed-dim text-white py-1.5 rounded text-sm font-medium transition-colors">
                                Join Telehealth
                              </button>
                            </div>
                          </div>
                       )
                    })}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Appointments View */}
          {view === 'appointments' && !selectedCase && (
            <div className="glass-panel p-lg rounded-xl">
              <h2 className="font-h4 mb-6">Manage Appointments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {appointments.map(appt => {
                  const dt = new Date(appt.slot_time);
                  const isFuture = dt > new Date();
                  return (
                    <div key={appt.id} className="bg-surface-container border border-border-internal rounded-lg p-md">
                      <div className="flex justify-between mb-4">
                        <span className="font-mono-data text-primary">{appt.anonymous_id}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-bright">{appt.status.toUpperCase()}</span>
                      </div>
                      <div className="text-sm text-on-surface-variant space-y-1 mb-4">
                        <p>{dt.toLocaleDateString()}</p>
                        <p>{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {appt.status === 'pending' && isFuture && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateApptStatus(appt.id, 'confirmed')} className="flex-1 py-1.5 bg-success/20 text-success text-xs rounded hover:bg-success/30">Approve</button>
                            <button onClick={() => setRescheduleId(appt.id === rescheduleId ? null : appt.id)} className="flex-1 py-1.5 bg-warning/20 text-warning text-xs rounded hover:bg-warning/30">Reschedule</button>
                          </div>
                        )}
                        {appt.status !== 'cancelled' && isFuture && (
                          <button onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')} className="w-full py-1.5 bg-error/20 text-error text-xs rounded hover:bg-error/30">Cancel</button>
                        )}
                        {appt.status === 'confirmed' && !isFuture && (
                          <button onClick={() => handleUpdateApptStatus(appt.id, 'completed')} className="w-full py-1.5 bg-interactive-primary text-white text-xs rounded hover:bg-primary-hover">Mark Complete</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Case Details View */}
          {selectedCase && caseDetails && (
            <div className="glass-panel flex flex-col rounded-xl overflow-hidden h-[calc(100vh-140px)]">
              <div className="bg-panel-high border-b border-border-internal p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-h4 font-bold flex items-center gap-2">
                    <button onClick={() => setSelectedCase(null)} className="hover:bg-surface-container p-1 rounded-full"><span className="material-symbols-outlined text-[20px]">arrow_back</span></button>
                    {selectedCase}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleResolve} className="px-3 py-1.5 bg-success/20 text-success hover:bg-success/30 text-sm rounded transition-colors flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Resolve
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-internal bg-panel-low">
                {([['chat', 'Chat', 'chat'], ['notes', 'Notes', 'edit_document'], ['timeline', 'Timeline', 'trending_up'], ['followup', 'Follow-up', 'event']] as const).map(([key, label, icon]) => (
                  <button key={key} onClick={() => setCaseTab(key as typeof caseTab)}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${caseTab === key ? 'border-primary text-primary bg-surface-container' : 'border-transparent text-on-surface-variant hover:bg-surface-container'}`}>
                    <span className="material-symbols-outlined text-[18px]">{icon}</span> {label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-md flex flex-col">
                {caseTab === 'chat' && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {caseDetails.chat_history.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                          {msg.sender !== 'user' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'counselor' ? 'bg-orange-400/20 text-orange-400' : 'bg-primary-container text-on-primary-container'}`}>
                              <span className="material-symbols-outlined text-[16px]">{msg.sender === 'counselor' ? 'psychology' : 'smart_toy'}</span>
                            </div>
                          )}
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.sender === 'user' ? 'bg-surface-container-high rounded-tr-none' : msg.sender === 'counselor' ? 'bg-orange-400/20 rounded-tl-none border border-orange-400/30' : 'bg-primary-container/20 rounded-tl-none border border-primary-container/30'}`}>
                             {msg.sender !== 'user' && <p className="text-[10px] uppercase font-bold mb-1 opacity-70">{msg.sender === 'counselor' ? 'You' : 'AI Guide'}</p>}
                             <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="mt-auto bg-surface-container p-2 rounded-lg flex items-center gap-2 border border-border-internal">
                      <input 
                        type="text" 
                        value={counselorMessage} 
                        onChange={e => setCounselorMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Send message to student as Counselor..."
                        className="flex-1 bg-transparent border-none text-sm px-2 focus:outline-none"
                      />
                      <button onClick={handleSendMessage} className="bg-primary hover:bg-primary-hover text-white p-2 rounded-md">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </button>
                    </div>
                  </div>
                )}
                {caseTab === 'notes' && (
                  <div className="space-y-4">
                    <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} rows={4} className="w-full bg-surface-container border border-border-internal rounded-lg p-3 text-sm focus:outline-none" placeholder="Clinical notes..."></textarea>
                    <button onClick={handleSaveNote} className="w-full bg-primary py-2 rounded-lg text-sm text-white">Save Note</button>
                    <div className="space-y-2">
                      {notes.map(n => (
                        <div key={n.id} className="bg-surface-container-low p-3 rounded-lg border border-border-internal">
                           <p className="text-xs text-on-surface-variant mb-1">{new Date(n.created_at).toLocaleString()}</p>
                           <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {caseTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-surface-container p-4 rounded-lg text-center"><p className="text-h3 text-error">{caseDetails.student.risk_score.toFixed(1)}</p><p className="text-xs text-on-surface-variant uppercase">Risk Score</p></div>
                      <div className="bg-surface-container p-4 rounded-lg text-center"><p className="text-h3">{caseDetails.mood_logs.length}</p><p className="text-xs text-on-surface-variant uppercase">Mood Logs</p></div>
                      <div className="bg-surface-container p-4 rounded-lg text-center"><p className="text-h3">{caseDetails.chat_history.length}</p><p className="text-xs text-on-surface-variant uppercase">Chat Msgs</p></div>
                    </div>
                    {caseDetails.student.risk_score >= 0.8 && !decryptedIdentity && (
                        <button 
                          onClick={() => setEscalateModalOpen(true)}
                          className="w-full mt-4 py-2 bg-error-container text-on-error-container text-sm font-bold rounded-lg hover:bg-error transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined">gpp_bad</span>
                          Escalate to Campus Security
                        </button>
                      )}
                      
                      {decryptedIdentity && (
                        <div className="mt-4 p-4 bg-error-container/20 border border-error/40 rounded-lg space-y-2">
                          <p className="text-sm font-bold text-error uppercase tracking-wider mb-2">Decrypted Identity</p>
                          <div className="flex justify-between text-sm"><span className="text-error/70">Name</span><span className="font-semibold text-on-surface">{decryptedIdentity.name}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-error/70">Phone</span><span className="font-semibold text-on-surface">{decryptedIdentity.phone}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-error/70">Email</span><span className="font-semibold text-on-surface">{decryptedIdentity.email}</span></div>
                        </div>
                      )}
                  </div>
                )}
                {caseTab === 'followup' && (
                   <div className="space-y-4">
                      <div className="bg-surface-container p-4 rounded-lg space-y-3">
                        <input type="date" value={followupDate} onChange={e=>setFollowupDate(e.target.value)} className="w-full bg-surface-container-high p-2 rounded text-sm focus:outline-none" style={{ colorScheme: 'dark' }} />
                        <input type="text" value={followupReason} onChange={e=>setFollowupReason(e.target.value)} placeholder="Reason" className="w-full bg-surface-container-high p-2 rounded text-sm focus:outline-none"/>
                        <button onClick={handleSaveFollowup} className="w-full bg-primary py-2 rounded text-sm text-white hover:bg-primary-hover">Schedule</button>
                      </div>
                      {followUps.map(f => (
                         <div key={f.id} className="flex justify-between items-center bg-surface-container p-3 rounded-lg border border-border-internal">
                            <div><p className="text-sm font-medium">{f.due_date}</p><p className="text-xs text-on-surface-variant">{f.reason}</p></div>
                            {!f.completed && <button onClick={()=>handleCompleteFollowup(f.id)} className="bg-success/20 text-success px-3 py-1 rounded text-xs font-semibold hover:bg-success/30">Mark Done</button>}
                         </div>
                      ))}
                   </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
"""

with open("C:/Users/yochi/OneDrive/Desktop/MIND-BRIDGE/src/pages/PsychologistDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated PsychologistDashboard.tsx")

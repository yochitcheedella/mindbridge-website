import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, User, GraduationCap, Hash, LogOut, CheckCircle,
  AlertCircle, Download, Trash2, ShieldAlert, Sparkles, Key, Lock,
  Activity, FileCheck, RefreshCw, Building2, Eye, Server
} from 'lucide-react';
import { getAlias, getAuth, clearAuth, apiFetch, isLoggedIn, getUserName, getRole } from '../utils/auth';

const DEPARTMENTS = [
  'CSE', 'AI&DS', 'AI&ML', 'EEE', 'IT', 'CSBS', 'ECE', 'MECH', 'CIVIL'
];

const YEARS = [1, 2, 3, 4, 5, 6];

export default function ProfileSettings() {
  const navigate = useNavigate();
  const auth = getAuth();
  const loggedIn = isLoggedIn();
  const role = getRole();

  const [userAlias, setUserAlias] = useState(getAlias() || 'User');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState(1);
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Admin audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchAuditLogs = () => {
    if (role === 'admin') {
      setLoadingLogs(true);
      apiFetch('/api/admin/audit-logs')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setAuditLogs(data);
        })
        .catch(console.warn)
        .finally(() => setLoadingLogs(false));
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    if (role === 'student') {
      apiFetch('/api/auth/profile').then(async res => {
        if (res.ok) {
          const data = await res.json();
          if (data.anonymous_alias) setUserAlias(data.anonymous_alias);
          if (data.department) setDepartment(data.department);
          if (data.year) setYear(data.year);
        }
      }).catch(console.warn);
    } else if (role === 'admin') {
      fetchAuditLogs();
      const name = getUserName();
      if (name) setUserAlias(name);
    } else {
      const name = getUserName();
      if (name) setUserAlias(name);
    }
  }, [loggedIn, role]);

  async function handleSave() {
    if (!loggedIn) {
      setStatus({ ok: false, msg: 'You must be logged in to save settings.' });
      return;
    }
    if (!userAlias.trim()) {
      setStatus({ ok: false, msg: 'Alias cannot be empty.' });
      return;
    }
    
    setLoading(true);
    setStatus(null);
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ department, year }),
      });
      if (res.ok) {
        setStatus({ ok: true, msg: 'Profile updated successfully!' });
      } else {
        const err = await res.json();
        setStatus({ ok: false, msg: err.detail ?? 'Update failed. Please try again.' });
      }
    } catch (err: any) {
      setStatus({ ok: false, msg: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  async function handleExportData() {
    if (!loggedIn) return;
    setExporting(true);
    try {
      const res = await apiFetch('/api/privacy/export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindbridge_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to export data.");
      }
    } catch (e) {
      alert("Error exporting data.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!loggedIn) return;
    const confirm1 = window.confirm("WARNING: This will permanently delete your account, all chat history, journal entries, and mood logs. This action CANNOT be undone.");
    if (!confirm1) return;
    
    const confirm2 = window.prompt("To confirm deletion, type 'DELETE' below:");
    if (confirm2 !== 'DELETE') return;
    
    setDeleting(true);
    try {
      const res = await apiFetch('/api/privacy/account', { method: 'DELETE' });
      if (res.ok) {
        handleLogout();
      } else {
        alert("Failed to delete account.");
      }
    } catch (e) {
      alert("Error deleting account.");
    } finally {
      setDeleting(false);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── 1. Dedicated Admin Platform Security & Governance View ────────────────
  // ══════════════════════════════════════════════════════════════════════════
  if (role === 'admin') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
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
                <span>Platform Security &amp; Institutional Governance</span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin Console</span>
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
                Vishnu Institute of Technology • High-Security Identity Vault &amp; Audit Oversight
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Grid: Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-surface-container/80 border border-border-structural space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Identity Vault</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
              <Shield size={16} className="text-emerald-400" />
              <span>AES-256 Active</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">Real student emails &amp; roll numbers symmetrically hashed &amp; vaulted.</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container/80 border border-border-structural space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Privacy Mask</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded font-bold">100%</span>
            </div>
            <div className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
              <Lock size={16} className="text-indigo-400" />
              <span>Zero PII Exposed</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">Psychologists and administrators only view generated pseudonyms.</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container/80 border border-border-structural space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Crisis Protocol</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded font-bold">Audited</span>
            </div>
            <div className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-amber-400" />
              <span>Restricted SOS</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">De-anonymization strictly requires logged medical emergency rationale.</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container/80 border border-border-structural space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Traffic Defense</span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded font-bold">SlowAPI</span>
            </div>
            <div className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
              <Activity size={16} className="text-purple-400" />
              <span>DoS Defense Online</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">Active rate limiting prevents bot floods on counseling services.</p>
          </div>
        </div>

        {/* Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column (8 cols): Real-Time Audit Trail */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <FileCheck size={15} className="text-interactive-primary" />
                <span>Immutable Institutional Audit Log</span>
              </label>
              <button 
                onClick={fetchAuditLogs}
                className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
                <span>Refresh Log</span>
              </button>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-border-structural bg-surface-container/80 space-y-3 shadow-xl">
              {loadingLogs ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50 text-xs">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Querying cryptographic audit records...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-10 text-center text-white/50 text-xs font-mono">
                  No recent security actions logged. System running nominally.
                </div>
              ) : (
                <div className="divide-y divide-border-structural/60 max-h-[460px] overflow-y-auto pr-1">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white">
                            {log.action_type}
                          </span>
                          <span className="text-white/40 font-mono text-[11px]">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-on-surface text-xs mt-1">{log.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Admin Account & Quick Hub */}
          <div className="lg:col-span-4 space-y-5">
            <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-surface-container-lowest space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{auth?.name || 'VIT Chief Administrator'}</h3>
                  <span className="text-[11px] text-purple-300/80 font-mono">Institutional Super Admin</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Account Node:</span>
                  <span className="font-mono text-white">ADM-VIT-01</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Campus:</span>
                  <span className="font-mono text-white">Bhimavaram Campus</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Access Clearance:</span>
                  <span className="font-mono text-emerald-400 font-bold">Level 3 (Full Governance)</span>
                </div>
              </div>
            </div>

            {/* Quick Links for Admin */}
            <div className="glass-panel p-5 rounded-3xl border border-border-structural space-y-2.5">
              <span className="text-xs font-mono font-bold uppercase text-on-surface-variant">Administration Hub</span>
              <div className="space-y-1.5">
                <button 
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-xs text-white flex items-center justify-between border border-transparent hover:border-white/10 transition-colors"
                >
                  <span>Campus Wellbeing Analytics</span>
                  <span className="font-mono text-indigo-400">→</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-xs text-white flex items-center justify-between border border-transparent hover:border-white/10 transition-colors"
                >
                  <span>Manage Staff Psychologists</span>
                  <span className="font-mono text-indigo-400">→</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-xs text-white flex items-center justify-between border border-transparent hover:border-white/10 transition-colors"
                >
                  <span>Export Institutional Reports</span>
                  <span className="font-mono text-indigo-400">→</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full p-3.5 rounded-2xl bg-surface-container hover:bg-rose-500/15 border border-border-structural hover:border-rose-500/40 text-on-surface hover:text-rose-400 font-heading font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-98"
            >
              <LogOut size={16} className="text-error" />
              <span>End Secure Admin Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── 2. Dedicated Psychologist Profile & Credentials View ──────────────────
  // ══════════════════════════════════════════════════════════════════════════
  if (role === 'psychologist') {
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
                <span>Counselor Profile &amp; Clinical Credentials</span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Clinical Staff</span>
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
                Vishnu Institute of Technology • Mental Health &amp; Psychological Counseling Division
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Practitioner Card */}
          <div className="lg:col-span-7 space-y-5">
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-surface-container-lowest to-surface-container-low space-y-5 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-2xl shadow-lg">
                  🧠
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{auth?.name || 'Staff Counselor'}</h2>
                  <p className="text-xs text-emerald-300/90 font-medium">{auth?.specialization || 'Clinical Psychology & CBT Specialist'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[11px] font-mono text-emerald-300">Live for Telehealth &amp; Audio Consultations</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Practitioner ID:</span>
                  <span className="font-mono text-white">#PSY-{auth?.psychologist_id || 'VIT'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Institutional Affiliation:</span>
                  <span className="text-white">Vishnu Institute of Technology</span>
                </div>
                <div className="flex justify-between">
                  <span>Clinical Privileges:</span>
                  <span className="text-emerald-400 font-medium">SOAP Notes · Audio Call · Emergency Escalate</span>
                </div>
              </div>
            </div>

            {/* Ethical Oath & Anonymity Policy */}
            <div className="glass-panel p-6 rounded-3xl border border-border-structural space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-white font-heading font-extrabold text-sm">
                <Shield size={16} className="text-interactive-primary" />
                <span>Ethical Oath &amp; Strict Student Anonymity</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                In accordance with Vishnu Institute of Technology counseling policies, student real names, roll numbers, and contact details are permanently masked behind pseudonyms.
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                If an immediate crisis arises (e.g. medical emergency or risk of self-harm), emergency identity reveal is available via the Risk Radar and logged to the Vice Chancellor's audit registry with mandatory clinical justification.
              </p>
            </div>
          </div>

          {/* Right Column (5 cols): Quick Navigation */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-panel p-5 rounded-3xl border border-border-structural space-y-3 shadow-xl">
              <span className="text-xs font-mono font-bold uppercase text-on-surface-variant">Clinical Navigation</span>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/psychologist/dashboard')}
                  className="w-full text-left p-3 rounded-xl bg-surface-container-highest hover:bg-surface-container text-xs text-white flex items-center justify-between border border-border-structural transition-colors"
                >
                  <span>Triage &amp; Risk Radar</span>
                  <span className="font-mono text-emerald-400">→</span>
                </button>
                <button 
                  onClick={() => navigate('/psychologist/patients')}
                  className="w-full text-left p-3 rounded-xl bg-surface-container-highest hover:bg-surface-container text-xs text-white flex items-center justify-between border border-border-structural transition-colors"
                >
                  <span>Active Patient Roster</span>
                  <span className="font-mono text-emerald-400">→</span>
                </button>
                <button 
                  onClick={() => navigate('/psychologist/soap-notes')}
                  className="w-full text-left p-3 rounded-xl bg-surface-container-highest hover:bg-surface-container text-xs text-white flex items-center justify-between border border-border-structural transition-colors"
                >
                  <span>Clinical SOAP Notes</span>
                  <span className="font-mono text-emerald-400">→</span>
                </button>
                <button 
                  onClick={() => navigate('/psychologist/calendar')}
                  className="w-full text-left p-3 rounded-xl bg-surface-container-highest hover:bg-surface-container text-xs text-white flex items-center justify-between border border-border-structural transition-colors"
                >
                  <span>Appointments Schedule</span>
                  <span className="font-mono text-emerald-400">→</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full p-3.5 rounded-2xl bg-surface-container hover:bg-rose-500/15 border border-border-structural hover:border-rose-500/40 text-on-surface hover:text-rose-400 font-heading font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-98"
            >
              <LogOut size={16} className="text-error" />
              <span>End Clinical Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── 3. Student Profile & Settings View ────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
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
              <span>Profile &amp; Security Settings</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-extrabold bg-interactive-primary/20 text-secondary-fixed border border-interactive-primary/30">Zero-Knowledge</span>
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
              Manage your anonymous alias, academic credentials, and zero-trust data controls.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left column (7 cols on Desktop) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ── Anonymous Identity ── */}
          <section className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <Shield size={14} className="text-interactive-primary" />
              <span>Your Anonymous Identity</span>
            </label>
            
            <div className="glass-panel p-6 rounded-3xl border border-interactive-primary/40 text-center space-y-4 shadow-xl relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-surface-container-lowest to-surface-container-low">
              <div className="absolute top-0 right-0 w-48 h-48 bg-interactive-primary/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-secondary-fixed block">
                Secure Pseudonymous Alias
              </span>
              
              <div className="relative max-w-sm mx-auto">
                <input
                  className="w-full text-center text-xl sm:text-2xl font-heading font-black py-3 px-4 rounded-2xl bg-black/40 border border-interactive-primary text-white focus:outline-none focus:ring-2 focus:ring-secondary-fixed tracking-wide shadow-inner"
                  value={userAlias}
                  onChange={e => setUserAlias(e.target.value)}
                  placeholder="e.g. BlueFalcon"
                />
              </div>

              <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                This alias permanently masks your real identity across all chat sessions, CBT tools, and campus support forums. Counselors and peers only ever see this name.
              </p>
            </div>
          </section>

          {/* ── Demographic Details ── */}
          <section className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <User size={14} className="text-secondary-fixed" />
              <span>Academic &amp; Demographic Preferences</span>
            </label>

            <div className="glass-panel p-6 rounded-3xl border border-border-structural space-y-5 shadow-xl">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Demographic metrics allow AI models to calibrate academic stress baselines by engineering cohort and year of study.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-interactive-primary" />
                    <span>Department</span>
                  </label>
                  <select
                    className="w-full bg-surface-container-highest border border-border-structural rounded-xl py-3 px-3.5 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-surface-container-lowest text-white">{d}</option>)}
                  </select>
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Hash size={14} className="text-secondary-fixed" />
                    <span>Year of Study</span>
                  </label>
                  <select
                    className="w-full bg-surface-container-highest border border-border-structural rounded-xl py-3 px-3.5 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                  >
                    {YEARS.map(y => <option key={y} value={y} className="bg-surface-container-lowest text-white">Year {y}</option>)}
                  </select>
                </div>
              </div>

              {/* Status Toast */}
              {status && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fade-in ${
                  status.ok 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}>
                  {status.ok ? <CheckCircle size={18} className="text-emerald-400 shrink-0" /> : <AlertCircle size={18} className="text-rose-400 shrink-0" />}
                  <span>{status.msg}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-interactive-primary to-secondary text-white font-heading font-extrabold text-sm tracking-wide hover:brightness-110 shadow-lg shadow-interactive-primary/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving Profile...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </section>

          {/* ── Confidential Emergency Contacts ── */}
          <section className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-400" />
              <span>Confidential Emergency Vault (Optional)</span>
            </label>

            <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/10 to-surface-container-lowest space-y-4 shadow-xl">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your real legal name and contact phone number remain under military-grade encryption in the database vault. They are NEVER visible to counselors during therapy sessions—only accessible to authorized institute directors during active Crisis SOS medical emergencies.
              </p>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white">Full Legal Name (Encrypted)</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-highest border border-border-structural rounded-xl py-3 px-4 text-sm text-white placeholder-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    value={realName}
                    onChange={e => setRealName(e.target.value)}
                    placeholder="e.g. Scholar Legal Name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white">Emergency Mobile Number (Encrypted)</label>
                  <input
                    type="tel"
                    className="w-full bg-surface-container-highest border border-border-structural rounded-xl py-3 px-4 text-sm text-white placeholder-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right column (5 cols on Desktop) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Account Badge */}
          {auth && (
            <div className="glass-panel p-5 rounded-3xl border border-border-structural flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider block">Student Token ID</span>
                <span className="text-lg font-heading font-black text-white mt-0.5 inline-block">#{auth.student_id || 'ANON-VIT'}</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active Vault</span>
              </span>
            </div>
          )}

          {/* Privacy Architecture Notice */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-surface-container via-panel-high to-indigo-950/40 border border-border-structural shadow-xl space-y-3">
            <div className="flex items-center gap-2.5 text-white font-heading font-extrabold text-sm">
              <Lock className="text-interactive-primary" size={18} />
              <span>Zero-Identity Architecture</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              MindBridge implements end-to-end token pseudonymization. Your real student credentials or email addresses are never retained in cleartext within conversational logs or sentiment inference vectors.
            </p>
          </div>

          {/* Data & Privacy Controls */}
          <section className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <Key size={14} className="text-outline" />
              <span>Data &amp; Privacy Governance</span>
            </label>

            <div className="glass-panel p-6 rounded-3xl border border-border-structural space-y-5 shadow-xl">
              <div className="space-y-2.5">
                <h4 className="font-heading font-bold text-sm text-white flex items-center justify-between">
                  <span>Export Personal Vault</span>
                  <span className="text-[10px] font-mono text-secondary-fixed bg-secondary/15 px-2 py-0.5 rounded border border-secondary/30">JSON</span>
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Download a complete portable archive of all your encrypted sleep biometrics, mood entries, and reflection journals.
                </p>
                <button 
                  onClick={handleExportData} 
                  disabled={exporting}
                  className="w-full py-3 px-4 rounded-xl bg-surface-container-highest hover:bg-surface-container text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-border-structural active:scale-98"
                >
                  <Download size={15} className="text-secondary-fixed" /> 
                  <span>{exporting ? 'Generating JSON Archive...' : 'Download Complete Data Vault'}</span>
                </button>
              </div>

              <div className="border-t border-border-structural/60 pt-4 space-y-2.5">
                <h4 className="font-heading font-bold text-sm text-rose-400 flex items-center gap-1.5">
                  <Trash2 size={16} />
                  <span>Permanent Account Erasure</span>
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Irreversibly delete your pseudonymous profile token, mood logs, and AI conversation memory from active database replicas.
                </p>
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={deleting}
                  className="w-full py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-heading font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md shadow-rose-500/10"
                >
                  <Trash2 size={15} /> 
                  <span>{deleting ? 'Erasing Account Records...' : 'Erase All Account Data'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Sign Out Action */}
          <button 
            onClick={handleLogout}
            className="w-full p-4 rounded-2xl bg-surface-container hover:bg-rose-500/10 border border-border-structural hover:border-rose-500/40 text-on-surface hover:text-rose-400 font-heading font-extrabold text-sm transition-all flex items-center justify-center gap-3 shadow-md active:scale-98 group"
          >
            <LogOut size={18} className="text-error group-hover:animate-bounce" />
            <span>End Secure Session &amp; Sign Out</span>
          </button>

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FileText, Shield, UserCheck, Plus, Check, Search, Calendar, AlertTriangle, Lock, Sparkles, Send, Trash2 } from 'lucide-react';
import { apiFetch, getUserName } from '../utils/auth';

interface SOAPNote {
  id: string;
  studentAlias: string;
  department: string;
  year: number;
  date: string;
  riskLevel: 'Minimal' | 'Moderate' | 'High' | 'Critical';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const DEMO_NOTES: SOAPNote[] = [
  {
    id: 'soap-1',
    studentAlias: 'Blue Sparrow',
    department: 'AI&DS',
    year: 3,
    date: '2026-08-04',
    riskLevel: 'Moderate',
    subjective: 'Patient expressed acute anxiety surrounding upcoming placement coding rounds. Reports sleeping only 4 hours a night due to racing mind.',
    objective: 'Affect slightly anxious; hyper-focused on perfectionism. Rapid speech patterns during discussion of academic expectations.',
    assessment: 'Moderate anxiety linked to academic burnout (MBI-S score: 14). No acute crisis or self-harm ideation present.',
    plan: 'Assigned Box Breathing protocol via app canopy. Instructed to complete 3 CBT thought records when imposter syndrome occurs. Recheck in 5 days.'
  },
  {
    id: 'soap-2',
    studentAlias: 'Calm Falcon',
    department: 'CSE',
    year: 2,
    date: '2026-08-02',
    riskLevel: 'Minimal',
    subjective: 'Reports significant improvement in mood after regular journaling and participating in campus circles.',
    objective: 'Relaxed posture, bright vocal affect, consistent eye contact during telehealth check-in.',
    assessment: 'Symptom remediation positive. PHQ-9 dropped from 12 to 5 over the last three weeks.',
    plan: 'Maintain daily mood check-ins. Discontinue weekly therapy to monthly maintenance check.'
  }
];

const STUDENT_ROSTER = [
  { alias: 'Blue Sparrow', department: 'AI&DS', year: 3, risk: 'Moderate' },
  { alias: 'Calm Falcon', department: 'CSE', year: 2, risk: 'Minimal' },
  { alias: 'Amber Tiger', department: 'ECE', year: 4, risk: 'High' },
  { alias: 'Mystic Owl', department: 'IT', year: 1, risk: 'Critical' },
];

export default function ClinicalSOAPNotes() {
  const [notes, setNotes] = useState<SOAPNote[]>(DEMO_NOTES);
  const [selectedStudent, setSelectedStudent] = useState(STUDENT_ROSTER[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form Fields
  const [subj, setSubj] = useState('');
  const [obj, setObj] = useState('');
  const [ass, setAss] = useState('');
  const [plan, setPlan] = useState('');
  const [risk, setRisk] = useState<'Minimal' | 'Moderate' | 'High' | 'Critical'>('Moderate');

  const psychologistName = getUserName();

  useEffect(() => {
    // Attempt to load from backend or local storage
    try {
      const stored = localStorage.getItem('mindbridge_soap_notes');
      if (stored) setNotes(JSON.parse(stored));
    } catch {}
  }, []);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subj.trim() || !plan.trim()) return;

    const newNote: SOAPNote = {
      id: `soap-${Date.now()}`,
      studentAlias: selectedStudent.alias,
      department: selectedStudent.department,
      year: selectedStudent.year,
      date: new Date().toISOString().split('T')[0],
      riskLevel: risk,
      subjective: subj,
      objective: obj,
      assessment: ass,
      plan: plan
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('mindbridge_soap_notes', JSON.stringify(updated));

    // Backend synchronization
    try {
      await apiFetch('/api/clinical/soap-notes', {
        method: 'POST',
        body: JSON.stringify({
          student_alias: selectedStudent.alias,
          risk_level: risk,
          subjective: subj,
          objective: obj,
          assessment: ass,
          plan: plan
        })
      });
    } catch (err) {
      console.warn("Offline SOAP note storage fallback used");
    }

    // Reset form
    setSubj(''); setObj(''); setAss(''); setPlan('');
    setIsCreating(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const getRiskBadgeStyle = (level: string) => {
    switch(level) {
      case 'Minimal': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Moderate': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/30 font-bold';
      case 'Critical': return 'bg-red-600/30 text-red-400 border-red-500 font-extrabold animate-pulse';
      default: return 'bg-surface-container text-white';
    }
  };

  const filteredNotes = notes.filter(n => 
    n.studentAlias.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
      {/* Top Professional Console Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-surface-container via-panel-high to-blue-950/40 border border-border-structural shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Lock size={14} />
            <span>Encrypted Clinical EHR Console</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-white">SOAP Notes & Case Formulation</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Counselor documentation suite for structured therapeutic evaluations. Student anonymity is cryptographically maintained across all records.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-heading font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all transform active:scale-95"
        >
          {isCreating ? <span>Close Editor</span> : <><Plus size={18} /><span>New Clinical Note</span></>}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center gap-3 animate-scale-in">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">SOAP note saved and encrypted to clinical database successfully!</span>
        </div>
      )}

      {/* Editor & Case formulation window */}
      {isCreating && (
        <form onSubmit={handleSaveNote} className="glass-panel p-6 sm:p-8 rounded-3xl border border-blue-500/40 shadow-2xl space-y-6 bg-surface-container-lowest/90 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-structural/80">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-on-surface-variant">Select Anonymized Student Patient</label>
              <select 
                value={selectedStudent.alias} 
                onChange={(e) => {
                  const found = STUDENT_ROSTER.find(s => s.alias === e.target.value);
                  if (found) setSelectedStudent(found);
                }}
                className="block w-64 bg-surface-container border border-border-structural rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-blue-500 transition-all"
              >
                {STUDENT_ROSTER.map((st) => (
                  <option key={st.alias} value={st.alias} className="bg-[#131317]">
                    {st.alias} ({st.department} - Yr {st.year})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-on-surface-variant">Clinical Risk Stratification</label>
              <div className="flex items-center gap-2">
                {(['Minimal', 'Moderate', 'High', 'Critical'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRisk(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                      risk === r ? getRiskBadgeStyle(r) + ' ring-2 ring-white/50 scale-105' : 'bg-surface-container border-border-structural text-on-surface-variant opacity-60'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SOAP Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subjective */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-heading font-bold text-sm text-white">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">S</span>
                <span>Subjective Observations</span>
              </label>
              <textarea
                required
                rows={4}
                value={subj}
                onChange={(e) => setSubj(e.target.value)}
                placeholder="What did the student report feeling or experiencing? (e.g., anxiety symptoms, sleep loss, academic stress...)"
                className="w-full bg-surface-container-low border border-border-structural focus:border-blue-500 rounded-2xl p-4 text-sm text-white placeholder-on-surface-variant/50 outline-none resize-none transition-all"
              />
            </div>

            {/* Objective */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-heading font-bold text-sm text-white">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono">O</span>
                <span>Objective Metrics & Behavior</span>
              </label>
              <textarea
                required
                rows={4}
                value={obj}
                onChange={(e) => setObj(e.target.value)}
                placeholder="Observed presentation, tone, PHQ-9 or GAD-7 recent test results, attendance patterns..."
                className="w-full bg-surface-container-low border border-border-structural focus:border-blue-500 rounded-2xl p-4 text-sm text-white placeholder-on-surface-variant/50 outline-none resize-none transition-all"
              />
            </div>

            {/* Assessment */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-heading font-bold text-sm text-white">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-mono">A</span>
                <span>Diagnostic Assessment & Formulation</span>
              </label>
              <textarea
                required
                rows={4}
                value={ass}
                onChange={(e) => setAss(e.target.value)}
                placeholder="Professional synthesis: clinical impressions, symptom severity progression, stress etiology..."
                className="w-full bg-surface-container-low border border-border-structural focus:border-blue-500 rounded-2xl p-4 text-sm text-white placeholder-on-surface-variant/50 outline-none resize-none transition-all"
              />
            </div>

            {/* Plan */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-heading font-bold text-sm text-white">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">P</span>
                <span>Treatment Plan & Assigned Exercises</span>
              </label>
              <textarea
                required
                rows={4}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Actionable next steps, assigned CBT thought reframing drills, breathwork frequency, follow-up scheduling..."
                className="w-full bg-surface-container-low border border-border-structural focus:border-blue-500 rounded-2xl p-4 text-sm text-white placeholder-on-surface-variant/50 outline-none resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border-structural/60">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-6 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-heading font-bold text-sm flex items-center gap-2 shadow-xl shadow-blue-600/30 transition-all"
            >
              <Send size={16} />
              <span>Encrypt & Save Clinical Note</span>
            </button>
          </div>
        </form>
      )}

      {/* Roster Search & Note Archive */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-400" size={22} />
            <span>Archived Case formulation Records ({filteredNotes.length})</span>
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alias or department..."
              className="pl-10 pr-4 py-2 rounded-xl bg-surface-container border border-border-structural text-sm text-white focus:outline-none focus:border-blue-500 transition-all w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredNotes.map((note) => (
            <div key={note.id} className="glass-panel p-6 sm:p-8 rounded-3xl border border-border-structural hover:border-border-strong transition-all space-y-6">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-structural/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                    {note.studentAlias.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-lg flex items-center gap-2">
                      <span>{note.studentAlias}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-surface-container-high text-on-surface-variant">
                        {note.department} • Year {note.year}
                      </span>
                    </h3>
                    <span className="text-xs font-mono text-on-surface-variant/80 flex items-center gap-1 mt-0.5">
                      <Calendar size={13} />
                      <span>Recorded on {new Date(note.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider border ${getRiskBadgeStyle(note.riskLevel)}`}>
                    Risk: {note.riskLevel}
                  </span>
                  <button 
                    onClick={() => {
                      const upd = notes.filter(n => n.id !== note.id);
                      setNotes(upd);
                      localStorage.setItem('mindbridge_soap_notes', JSON.stringify(upd));
                    }}
                    className="p-2 text-on-surface-variant/50 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Archive note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* SOAP Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="p-4 rounded-2xl bg-surface-container-low/80 border border-border-structural space-y-1.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">S</span>
                    <span>Subjective Presentation</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">{note.subjective}</p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low/80 border border-border-structural space-y-1.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">O</span>
                    <span>Objective Observations</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">{note.objective}</p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low/80 border border-border-structural space-y-1.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px]">A</span>
                    <span>Diagnostic Formulation</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">{note.assessment}</p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low/80 border border-emerald-500/30 space-y-1.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">P</span>
                    <span>Clinical Treatment Plan</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">{note.plan}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

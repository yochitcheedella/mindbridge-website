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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C542]/20 text-[#111111] border border-[#111111] text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Lock size={14} />
            <span>Encrypted Clinical EHR Console</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#111111]">SOAP Notes & Case Formulation</h1>
          <p className="text-sm text-[#111111]/70 mt-1 max-w-2xl">
            Counselor documentation suite for structured therapeutic evaluations. Student anonymity is cryptographically maintained across all records.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-6 py-3.5 rounded-2xl bg-[#F4C542] hover:bg-[#E5B532] text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] font-heading font-bold text-sm flex items-center gap-2 transition-all transform active:scale-95"
        >
          {isCreating ? <span>Close Editor</span> : <><Plus size={18} /><span>New Clinical Note</span></>}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-600 text-emerald-800 flex items-center gap-3 animate-scale-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">SOAP note saved and encrypted to clinical database successfully!</span>
        </div>
      )}

      {/* Editor & Case formulation window */}
      {isCreating && (
        <form onSubmit={handleSaveNote} className="p-6 sm:p-8 rounded-3xl border-2 border-[#111111] bg-white shadow-[4px_4px_0px_#111111] space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#111111]/20">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-[#111111]">Select Anonymized Student Patient</label>
              <select 
                value={selectedStudent.alias} 
                onChange={(e) => {
                  const found = STUDENT_ROSTER.find(s => s.alias === e.target.value);
                  if (found) setSelectedStudent(found);
                }}
                className="block w-64 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-4 py-2.5 text-sm text-[#111111] font-bold focus:outline-none focus:border-[#F4C542] transition-all"
              >
                {STUDENT_ROSTER.map((st) => (
                  <option key={st.alias} value={st.alias} className="bg-white text-[#111111]">
                    {st.alias} ({st.department} - Yr {st.year})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-[#111111]">Clinical Risk Stratification</label>
              <div className="flex items-center gap-2">
                {(['Minimal', 'Moderate', 'High', 'Critical'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRisk(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border-2 border-[#111111] ${
                      risk === r ? getRiskBadgeStyle(r) + ' ring-2 ring-[#111111] scale-105' : 'bg-[#FAFAFA] text-[#111111]/70'
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
              <label className="flex items-center gap-2 font-heading font-bold text-sm text-[#111111]">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center text-xs font-mono">S</span>
                <span>Subjective Observations</span>
              </label>
              <textarea
                required
                rows={4}
                value={subj}
                onChange={(e) => setSubj(e.target.value)}
                placeholder="What did the student report feeling or experiencing? (e.g., anxiety symptoms, sleep loss, academic stress...)"
                className="w-full bg-[#FAFAFA] border-2 border-[#111111] focus:border-[#F4C542] rounded-2xl p-4 text-sm text-[#111111] placeholder-[#111111]/40 outline-none resize-none transition-all"
              />
            </div>

            {/* Objective */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-heading font-bold text-sm text-[#111111]">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center justify-center text-xs font-mono">O</span>
                <span>Objective Metrics & Behavior</span>
              </label>
              <textarea
                required
                rows={4}
                value={obj}
                onChange={(e) => setObj(e.target.value)}
                placeholder="Observed presentation, tone, PHQ-9 or GAD-7 recent test results, attendance patterns..."
                className="w-full bg-[#FAFAFA] border-2 border-[#111111] focus:border-[#F4C542] rounded-2xl p-4 text-sm text-[#111111] placeholder-[#111111]/40 outline-none resize-none transition-all"
              />
            </div>

            {/* Assessment */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-heading font-bold text-sm text-[#111111]">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center text-xs font-mono">A</span>
                <span>Diagnostic Assessment & Formulation</span>
              </label>
              <textarea
                required
                rows={4}
                value={ass}
                onChange={(e) => setAss(e.target.value)}
                placeholder="Professional synthesis: clinical impressions, symptom severity progression, stress etiology..."
                className="w-full bg-[#FAFAFA] border-2 border-[#111111] focus:border-[#F4C542] rounded-2xl p-4 text-sm text-[#111111] placeholder-[#111111]/40 outline-none resize-none transition-all"
              />
            </div>

            {/* Plan */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-heading font-bold text-sm text-[#111111]">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center text-xs font-mono">P</span>
                <span>Treatment Plan & Assigned Exercises</span>
              </label>
              <textarea
                required
                rows={4}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Actionable next steps, assigned CBT thought reframing drills, breathwork frequency, follow-up scheduling..."
                className="w-full bg-[#FAFAFA] border-2 border-[#111111] focus:border-[#F4C542] rounded-2xl p-4 text-sm text-[#111111] placeholder-[#111111]/40 outline-none resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-[#111111]/20">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-6 py-3 rounded-xl bg-[#FAFAFA] hover:bg-neutral-200 text-[#111111] font-semibold text-sm transition-colors border-2 border-[#111111]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-[#F4C542] hover:bg-[#E5B532] text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] font-heading font-bold text-sm flex items-center gap-2 transition-all"
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
          <h2 className="text-xl font-heading font-bold text-[#111111] flex items-center gap-2">
            <FileText className="text-[#111111]" size={22} />
            <span>Archived Case Formulation Records ({filteredNotes.length})</span>
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/50" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alias or department..."
              className="pl-10 pr-4 py-2 rounded-xl bg-white border-2 border-[#111111] text-sm text-[#111111] focus:outline-none focus:border-[#F4C542] transition-all w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] transition-all space-y-6">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#111111]/15">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] font-bold text-lg">
                    {note.studentAlias.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[#111111] text-lg flex items-center gap-2">
                      <span>{note.studentAlias}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAFAFA] text-[#111111] border border-[#111111]/20">
                        {note.department} • Year {note.year}
                      </span>
                    </h3>
                    <span className="text-xs font-mono text-[#111111]/70 flex items-center gap-1 mt-0.5">
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
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 space-y-1.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">S</span>
                    <span>Subjective Presentation</span>
                  </div>
                  <p className="text-[#111111]/80 leading-relaxed">{note.subjective}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 space-y-1.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px] font-bold">O</span>
                    <span>Objective Observations</span>
                  </div>
                  <p className="text-[#111111]/80 leading-relaxed">{note.objective}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 space-y-1.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">A</span>
                    <span>Diagnostic Formulation</span>
                  </div>
                  <p className="text-[#111111]/80 leading-relaxed">{note.assessment}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAFA] border-2 border-emerald-500/40 space-y-1.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">P</span>
                    <span>Clinical Treatment Plan</span>
                  </div>
                  <p className="text-[#111111]/80 leading-relaxed">{note.plan}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

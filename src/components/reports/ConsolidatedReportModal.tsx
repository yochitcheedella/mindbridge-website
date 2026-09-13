import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle2, Plus, Trash2, Building2, BarChart2, ShieldCheck } from 'lucide-react';
import { generateConsolidatedReportPDF, type ConsolidatedReportData, type InstitutionStat } from '../../utils/consolidatedReportPdf';

interface ConsolidatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReport?: (report: ConsolidatedReportData) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DEFAULT_INSTITUTIONS: InstitutionStat[] = [
  { institution: 'Vishnu Institute of Technology (VIT)', code: 'VIT', activeStudents: 4250, individualSessions: 52, groupSessions: 4, totalSessions: 56, highRiskCount: 3 },
  { institution: 'Shri Vishnu Engineering College for Women (SVECW)', code: 'SVECW', activeStudents: 3900, individualSessions: 48, groupSessions: 6, totalSessions: 54, highRiskCount: 2 },
  { institution: 'Vishnu Dental College (VDC)', code: 'VDC', activeStudents: 1100, individualSessions: 22, groupSessions: 2, totalSessions: 24, highRiskCount: 1 },
  { institution: 'Shri Vishnu College of Pharmacy (SVCP)', code: 'SVCP', activeStudents: 850, individualSessions: 18, groupSessions: 2, totalSessions: 20, highRiskCount: 1 },
  { institution: 'Smt. B. Seetha Polytechnic College (SBSP)', code: 'SBSP', activeStudents: 1400, individualSessions: 16, groupSessions: 1, totalSessions: 17, highRiskCount: 0 },
  { institution: 'B V Raju Degree and PG College (BVRC)', code: 'BVRC', activeStudents: 1650, individualSessions: 19, groupSessions: 2, totalSessions: 21, highRiskCount: 1 },
  { institution: 'Shri Vishnu School (SVS)', code: 'SVS', activeStudents: 600, individualSessions: 3, groupSessions: 0, totalSessions: 3, highRiskCount: 0 },
];

export default function ConsolidatedReportModal({
  isOpen,
  onClose,
  onSaveReport,
}: ConsolidatedReportModalProps) {
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(MONTH_NAMES[currentMonthIdx]);
  const [year, setYear] = useState(currentYear);
  const [compiledBy, setCompiledBy] = useState('Central Wellness Administration');
  const [approvedBy, setApprovedBy] = useState('Dr. P. Srinivasa Rao (Dean of Student Affairs)');

  const [institutions, setInstitutions] = useState<InstitutionStat[]>(DEFAULT_INSTITUTIONS);

  const [keyInitiatives, setKeyInitiatives] = useState([
    { title: 'Digital Detox Hour & Screen-Free Lounge', reach: '1,450 Students', impact: 'Reduced late-night anxiety reported in hostels by 24%.' },
    { title: 'MINDTAP Peer Resilience Circles', reach: '820 Students', impact: 'Fostered early peer-to-peer identification and stigma reduction.' },
    { title: 'Campus Stalls on Sleep Architecture', reach: '2,100 Students', impact: 'Distributed 900+ sleep hygiene logs and breathing guides.' }
  ]);

  const [facultyTraining, setFacultyTraining] = useState(
    'Conducted 4 gatekeeper awareness sessions for 112 faculty mentors across VIT and SVECW on detecting early signs of academic burnout and depressive withdrawal.'
  );

  const [directives, setDirectives] = useState([
    'Scale up pre-exam stress decompression booths across library zones.',
    'Initiate bi-weekly hostel rounds by clinical psychologists in evening hours.',
    'Roll out institutional psycho-social screening for incoming cohorts.'
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const totalSessions = institutions.reduce((sum, i) => sum + i.totalSessions, 0);
  const totalStudents = institutions.reduce((sum, i) => sum + i.activeStudents, 0);
  const totalHighRisk = institutions.reduce((sum, i) => sum + i.highRiskCount, 0);

  const handleUpdateInstitution = (idx: number, field: keyof InstitutionStat, val: any) => {
    const updated = [...institutions];
    (updated[idx] as any)[field] = val;
    if (field === 'individualSessions' || field === 'groupSessions') {
      updated[idx].totalSessions = Number(updated[idx].individualSessions) + Number(updated[idx].groupSessions);
    }
    setInstitutions(updated);
  };

  const buildReportData = (): ConsolidatedReportData => {
    return {
      id: `cons-${Date.now()}`,
      reportTitle: `SVES Central Wellness Consolidated Monthly Report — ${month} ${year}`,
      month,
      year,
      compiledBy,
      approvedBy,
      submittedAt: new Date().toISOString(),
      executiveSummary: {
        totalSocietyStudents: totalStudents,
        totalSessionsAcrossCampuses: totalSessions,
        avgSatisfactionIndex: '95.4%',
        sosCrisisHandled: totalHighRisk,
        workshopsConducted: 14,
      },
      institutionBreakdown: institutions,
      concernDistribution: [
        { concern: 'Academic Pressure & Exam Anxiety', count: Math.round(totalSessions * 0.36), percentage: '36%' },
        { concern: 'Emotional Dysregulation & Generalized Worry', count: Math.round(totalSessions * 0.28), percentage: '28%' },
        { concern: 'Interpersonal & Family Adjustment', count: Math.round(totalSessions * 0.16), percentage: '16%' },
        { concern: 'Placement & Career Direction', count: Math.round(totalSessions * 0.12), percentage: '12%' },
        { concern: 'Habit Modification & Digital Fatigue', count: Math.round(totalSessions * 0.08), percentage: '8%' },
      ],
      clinicalRiskSummary: {
        lowRisk: Math.round(totalSessions * 0.72),
        mediumRisk: Math.round(totalSessions * 0.23),
        highRiskEmergency: totalHighRisk,
      },
      keyInitiatives,
      facultyTrainingSummary: facultyTraining,
      upcomingDirectives: directives,
    };
  };

  const handleSaveAndExport = () => {
    setIsSubmitting(true);
    const data = buildReportData();

    try {
      const stored = localStorage.getItem('mindbridge_consolidated_monthly_reports');
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [data, ...existing];
      localStorage.setItem('mindbridge_consolidated_monthly_reports', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }

    if (onSaveReport) onSaveReport(data);

    // Export PDF
    generateConsolidatedReportPDF(data);

    setSaveSuccess(true);
    setIsSubmitting(false);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl my-8 text-[#111111]">
        {/* Header */}
        <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#111111]/15 px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center font-bold text-[#111111]">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                  Attachment 5 Format
                </span>
                <span className="text-xs text-[#111111]/60 font-mono">Central SVES Governance</span>
              </div>
              <h2 className="text-lg font-heading font-black text-[#111111]">
                Admin Consolidated Monthly Report Hub
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#111111]/60 hover:text-[#111111] hover:bg-[#111111]/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111]/70 mb-1">
                Month & Year
              </label>
              <div className="flex gap-2">
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="w-2/3 text-xs font-semibold bg-[#FFFFFF] border border-[#111111]/30 rounded-xl px-2 py-2"
                >
                  {MONTH_NAMES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="w-1/3 text-xs font-semibold bg-[#FFFFFF] border border-[#111111]/30 rounded-xl px-2 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111]/70 mb-1">
                Compiled By
              </label>
              <input
                type="text"
                value={compiledBy}
                onChange={e => setCompiledBy(e.target.value)}
                className="w-full text-xs font-semibold bg-[#FFFFFF] border border-[#111111]/30 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111]/70 mb-1">
                Approved By
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={e => setApprovedBy(e.target.value)}
                className="w-full text-xs font-semibold bg-[#FFFFFF] border border-[#111111]/30 rounded-xl px-3 py-2"
              />
            </div>
            <div className="bg-[#F4C542] border border-[#111111] rounded-xl p-2.5 text-center flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase font-black">All Campuses Sessions</span>
              <span className="text-xl font-heading font-black">{totalSessions} Consultations</span>
            </div>
          </div>

          {/* Institution Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111] flex items-center justify-between">
              <span>Institution-wise Session Breakdown</span>
              <span className="text-xs font-mono text-[#111111]/60 font-normal">
                {institutions.length} Campuses Active
              </span>
            </h3>
            <div className="overflow-x-auto border border-[#111111]/20 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111111] text-white font-mono font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Campus / Institution</th>
                    <th className="p-3 text-center">Code</th>
                    <th className="p-3 text-center">Individual</th>
                    <th className="p-3 text-center">Group</th>
                    <th className="p-3 text-center">Total</th>
                    <th className="p-3 text-center text-[#F4C542]">High-Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/10 bg-white">
                  {institutions.map((inst, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA]">
                      <td className="p-3 font-semibold text-[#111111]">{inst.institution}</td>
                      <td className="p-3 text-center font-mono text-[#111111]/60">{inst.code}</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={inst.individualSessions}
                          onChange={e => handleUpdateInstitution(idx, 'individualSessions', Number(e.target.value))}
                          className="w-16 text-center font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg py-1"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={inst.groupSessions}
                          onChange={e => handleUpdateInstitution(idx, 'groupSessions', Number(e.target.value))}
                          className="w-16 text-center font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg py-1"
                        />
                      </td>
                      <td className="p-3 text-center font-heading font-black text-sm text-[#111111]">
                        {inst.totalSessions}
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={inst.highRiskCount}
                          onChange={e => handleUpdateInstitution(idx, 'highRiskCount', Number(e.target.value))}
                          className="w-16 text-center font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Initiatives */}
          <div className="space-y-3">
            <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111]">
              Key Initiatives & Digital Detox Campaigns
            </h3>
            <div className="space-y-2">
              {keyInitiatives.map((init, idx) => (
                <div key={idx} className="p-3 bg-[#FFFFFF] border border-[#111111]/15 rounded-xl flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={init.title}
                    placeholder="Initiative Title"
                    onChange={e => {
                      const updated = [...keyInitiatives];
                      updated[idx].title = e.target.value;
                      setKeyInitiatives(updated);
                    }}
                    className="w-56 text-xs font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                  <input
                    type="text"
                    value={init.reach}
                    placeholder="Reach"
                    onChange={e => {
                      const updated = [...keyInitiatives];
                      updated[idx].reach = e.target.value;
                      setKeyInitiatives(updated);
                    }}
                    className="w-36 text-xs bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                  <input
                    type="text"
                    value={init.impact}
                    placeholder="Clinical Impact"
                    onChange={e => {
                      const updated = [...keyInitiatives];
                      updated[idx].impact = e.target.value;
                      setKeyInitiatives(updated);
                    }}
                    className="flex-1 text-xs bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Training */}
          <div className="space-y-2">
            <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111]">
              Faculty & Mentor Gatekeeper Training Summary
            </h3>
            <textarea
              rows={2}
              value={facultyTraining}
              onChange={e => setFacultyTraining(e.target.value)}
              className="w-full text-xs bg-[#FAFAFA] border border-[#111111]/20 rounded-2xl p-3 text-[#111111]"
            />
          </div>

          {/* Strategic Directives */}
          <div className="space-y-2">
            <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111]">
              Strategic Directives for Next Month
            </h3>
            <div className="space-y-2">
              {directives.map((dir, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#111111]/50">{idx + 1}.</span>
                  <input
                    type="text"
                    value={dir}
                    onChange={e => {
                      const updated = [...directives];
                      updated[idx] = e.target.value;
                      setDirectives(updated);
                    }}
                    className="flex-1 text-xs font-semibold bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-3 py-2"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#FFFFFF] border-t border-[#111111]/15 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-2 text-xs font-mono text-[#111111]/70">
            <ShieldCheck size={16} className="text-green-600" />
            <span>Attachment 5 Zero-Drift PDF Engine Loaded</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-[#111111]/30 font-bold text-xs hover:bg-[#111111]/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndExport}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] border-2 border-[#111111] font-black text-xs text-[#111111] flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download size={15} />
              <span>{saveSuccess ? 'Saved & Exported!' : 'Save & Export Consolidated PDF (Attachment 5)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

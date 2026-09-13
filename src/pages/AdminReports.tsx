import React, { useState, useEffect } from 'react';
import {
  FileText, Download, RefreshCw, Building2, TrendingUp,
  Users, Calendar, AlertTriangle, CheckCircle2, BarChart2, Plus, ShieldCheck
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../utils/auth';
import ConsolidatedReportModal from '../components/reports/ConsolidatedReportModal';
import { generateConsolidatedReportPDF, type ConsolidatedReportData } from '../utils/consolidatedReportPdf';

interface WellbeingReport {
  report_title: string;
  generated_by: string;
  summary: {
    total_enrolled_students_on_platform: number;
    campus_wellbeing_score: number;
    high_risk_students_percent: number;
    total_counseling_appointments: number;
  };
  department_breakdown: Array<{
    department: string;
    students: number;
    avg_stress_score: number;
    wellbeing_score: number;
  }>;
  note: string;
}

export default function AdminReports() {
  const [report, setReport] = useState<WellbeingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'consolidated_reports'>('consolidated_reports');
  const [showConsolidatedModal, setShowConsolidatedModal] = useState(false);

  const [consolidatedReports, setConsolidatedReports] = useState<ConsolidatedReportData[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_consolidated_monthly_reports');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'cons-demo-1',
        reportTitle: 'SVES Central Wellness Consolidated Monthly Report — September 2026',
        month: 'September',
        year: 2026,
        compiledBy: 'Central Wellness Administration',
        approvedBy: 'Dr. P. Srinivasa Rao (Dean of Student Affairs)',
        submittedAt: new Date().toISOString(),
        executiveSummary: {
          totalSocietyStudents: 13750,
          totalSessionsAcrossCampuses: 195,
          avgSatisfactionIndex: '95.4%',
          sosCrisisHandled: 8,
          workshopsConducted: 14
        },
        institutionBreakdown: [
          { institution: 'Vishnu Institute of Technology (VIT)', code: 'VIT', activeStudents: 4250, individualSessions: 52, groupSessions: 4, totalSessions: 56, highRiskCount: 3 },
          { institution: 'Shri Vishnu Engineering College for Women (SVECW)', code: 'SVECW', activeStudents: 3900, individualSessions: 48, groupSessions: 6, totalSessions: 54, highRiskCount: 2 },
          { institution: 'Vishnu Dental College (VDC)', code: 'VDC', activeStudents: 1100, individualSessions: 22, groupSessions: 2, totalSessions: 24, highRiskCount: 1 },
          { institution: 'Shri Vishnu College of Pharmacy (SVCP)', code: 'SVCP', activeStudents: 850, individualSessions: 18, groupSessions: 2, totalSessions: 20, highRiskCount: 1 },
          { institution: 'Smt. B. Seetha Polytechnic College (SBSP)', code: 'SBSP', activeStudents: 1400, individualSessions: 16, groupSessions: 1, totalSessions: 17, highRiskCount: 0 },
          { institution: 'B V Raju Degree and PG College (BVRC)', code: 'BVRC', activeStudents: 1650, individualSessions: 19, groupSessions: 2, totalSessions: 21, highRiskCount: 1 },
          { institution: 'Shri Vishnu School (SVS)', code: 'SVS', activeStudents: 600, individualSessions: 3, groupSessions: 0, totalSessions: 3, highRiskCount: 0 },
        ],
        concernDistribution: [
          { concern: 'Academic Pressure & Exam Anxiety', count: 70, percentage: '36%' },
          { concern: 'Emotional Dysregulation & Generalized Worry', count: 55, percentage: '28%' },
          { concern: 'Interpersonal & Family Adjustment', count: 31, percentage: '16%' },
          { concern: 'Placement & Career Direction', count: 23, percentage: '12%' },
          { concern: 'Habit Modification & Digital Fatigue', count: 16, percentage: '8%' },
        ],
        clinicalRiskSummary: {
          lowRisk: 140,
          mediumRisk: 45,
          highRiskEmergency: 8
        },
        keyInitiatives: [
          { title: 'Digital Detox Hour & Screen-Free Lounge', reach: '1,450 Students', impact: 'Reduced late-night anxiety reported in hostels by 24%.' },
          { title: 'MINDTAP Peer Resilience Circles', reach: '820 Students', impact: 'Fostered early peer-to-peer identification and stigma reduction.' },
          { title: 'Campus Stalls on Sleep Architecture', reach: '2,100 Students', impact: 'Distributed 900+ sleep hygiene logs and breathing guides.' }
        ],
        facultyTrainingSummary: 'Conducted 4 gatekeeper awareness sessions for 112 faculty mentors across VIT and SVECW on detecting early signs of academic burnout and depressive withdrawal.',
        upcomingDirectives: [
          'Scale up pre-exam stress decompression booths across library zones.',
          'Initiate bi-weekly hostel rounds by clinical psychologists in evening hours.',
          'Roll out institutional psycho-social screening for incoming cohorts.'
        ]
      }
    ];
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/reports/wellbeing');
      if (res.ok) setReport(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const downloadJSON = () => {
    if (!report) return;
    setDownloading(true);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institutional_Wellbeing_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 1000);
  };

  const downloadCSV = () => {
    if (!report) return;
    const header = 'Department,Students,Stress Score,Wellbeing Score\n';
    const rows = report.department_breakdown
      .map(d => `${d.department},${d.students},${d.avg_stress_score},${d.wellbeing_score}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institutional_Wellbeing_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFFFF] p-4 md:p-6 pb-24 text-[#111111] animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111111]/15 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                Administrative Reports Engine
              </span>
              <span className="text-xs font-mono text-[#111111]/60">SVES Central Portal</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#111111] flex items-center gap-2">
              <FileText className="text-[#111111]" size={28} />
              <span>Institutional Reports &amp; Governance</span>
            </h1>
            <p className="text-[#111111]/60 text-xs mt-0.5">
              Consolidated Attachment 5 reports and campus-wide anonymized wellbeing telemetry
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('consolidated_reports')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-black border transition-all cursor-pointer ${
                activeTab === 'consolidated_reports'
                  ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
                  : 'bg-[#FAFAFA] text-[#111111]/70 border-[#111111]/20 hover:border-[#111111]'
              }`}
            >
              Consolidated Reports ({consolidatedReports.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-black border transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
                  : 'bg-[#FAFAFA] text-[#111111]/70 border-[#111111]/20 hover:border-[#111111]'
              }`}
            >
              Campus Analytics
            </button>
          </div>
        </div>

        {/* TAB 1: CONSOLIDATED MONTHLY REPORTS (REQ 3 & REQ 15) */}
        {activeTab === 'consolidated_reports' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-xs">
              <div>
                <h2 className="text-xl font-heading font-black text-[#111111]">
                  Consolidated Monthly Reports (Attachment 5 Format)
                </h2>
                <p className="text-xs text-[#111111]/70 mt-1 max-w-xl">
                  Central administration combines individual counsellor logs, workshop records, and campus audits into official consolidated reports reflecting directly to the Super Admin.
                </p>
              </div>

              <button
                onClick={() => setShowConsolidatedModal(true)}
                className="px-5 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus size={16} />
                <span>+ Add Consolidated Report (Manual)</span>
              </button>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {consolidatedReports.map((rep) => (
                <div 
                  key={rep.id}
                  className="p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm space-y-4 hover:border-[#F4C542] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111111]/10 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                        Attachment 5 Standard
                      </span>
                      <h3 className="text-lg font-heading font-black text-[#111111] mt-1">
                        {rep.reportTitle}
                      </h3>
                      <p className="text-xs text-[#111111]/60 font-mono">
                        Compiled by: {rep.compiledBy} · Approved by: {rep.approvedBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-green-100 text-green-900 border border-green-300">
                        OFFICIALLY CONSOLIDATED
                      </span>
                    </div>
                  </div>

                  {/* Key Indicators Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#FAFAFA] p-4 rounded-2xl border border-[#111111]/15 text-center font-mono">
                    <div>
                      <span className="block text-[10px] text-[#111111]/60 uppercase">Campuses</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.institutionBreakdown.length}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#111111]/60 uppercase">Total Sessions</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.totalSessionsAcrossCampuses}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#111111]/60 uppercase">Students Covered</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.totalSocietyStudents.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#111111]/60 uppercase">Workshops</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.workshopsConducted}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-[#F4C542]/30 rounded-xl py-1 border border-[#111111]/10">
                      <span className="block text-[10px] text-[#111111] uppercase font-bold">Satisfaction</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.avgSatisfactionIndex}</span>
                    </div>
                  </div>

                  {/* Institution-wise mini row */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/60">
                      Campus Breakdown:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      {rep.institutionBreakdown.map(inst => (
                        <span key={inst.code} className="px-2.5 py-1 bg-[#FAFAFA] border border-[#111111]/15 rounded-lg text-[#111111]">
                          <strong>{inst.code}:</strong> {inst.totalSessions} sessions
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => generateConsolidatedReportPDF(rep)}
                      className="px-6 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Download size={14} />
                      <span>Export Attachment 5 PDF (Zero Alignment Drift)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CAMPUS TELEMETRY ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-end gap-2">
              <button
                onClick={fetchReport}
                className="p-2 bg-[#FFFFFF] border border-[#111111]/20 rounded-xl text-[#111111] hover:bg-[#111111]/5 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={downloadJSON}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] rounded-xl text-xs font-black border-2 border-[#111111] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} /> {downloading ? 'Downloading...' : 'Download JSON'}
              </button>
            </div>

            {!report ? (
              <Card className="p-12 text-center bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl">
                <FileText className="text-[#111111]/30 mx-auto mb-3" size={32} />
                <p className="text-[#111111]/60 font-medium">No report data available</p>
              </Card>
            ) : (
              <>
                {/* 4 Summary Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm">
                    <span className="text-[10px] font-mono uppercase font-black text-[#111111]/60">Total Students</span>
                    <p className="text-3xl font-heading font-black text-[#111111] mt-1">
                      {report.summary.total_enrolled_students_on_platform.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-5 rounded-3xl border-2 border-[#111111] bg-[#F4C542]/20 shadow-sm">
                    <span className="text-[10px] font-mono uppercase font-black text-[#111111]">Campus Vitality</span>
                    <p className="text-3xl font-heading font-black text-[#111111] mt-1">
                      {report.summary.campus_wellbeing_score}%
                    </p>
                  </div>
                  <div className="p-5 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm">
                    <span className="text-[10px] font-mono uppercase font-black text-[#111111]/60">High-Risk Tiers</span>
                    <p className="text-3xl font-heading font-black text-amber-700 mt-1">
                      {report.summary.high_risk_students_percent}%
                    </p>
                  </div>
                  <div className="p-5 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm">
                    <span className="text-[10px] font-mono uppercase font-black text-[#111111]/60">Completed Sessions</span>
                    <p className="text-3xl font-heading font-black text-[#111111] mt-1">
                      {report.summary.total_counseling_appointments}
                    </p>
                  </div>
                </div>

                {/* Department Breakdown */}
                <Card className="p-6 border-2 border-[#111111] bg-[#FFFFFF] rounded-3xl shadow-sm">
                  <h3 className="font-heading font-black text-lg text-[#111111] mb-4">
                    Departmental Vitality Breakdown
                  </h3>
                  <div className="space-y-4">
                    {report.department_breakdown.map(dept => (
                      <div key={dept.department}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#111111]">{dept.department}</span>
                            <span className="text-xs text-[#111111]/50">({dept.students} students)</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <span className="text-[#111111]/70">Stress: {dept.avg_stress_score}%</span>
                            <span className="font-black text-[#111111]">Wellbeing: {dept.wellbeing_score}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-[#111111]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all bg-[#F4C542]"
                            style={{ width: `${dept.wellbeing_score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal for drafting new consolidated report */}
      <ConsolidatedReportModal
        isOpen={showConsolidatedModal}
        onClose={() => setShowConsolidatedModal(false)}
        onSaveReport={(newReport) => {
          setConsolidatedReports(prev => [newReport, ...prev]);
        }}
      />
    </div>
  );
}

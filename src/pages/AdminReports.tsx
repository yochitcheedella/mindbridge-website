import React, { useState, useEffect } from 'react';
import {
  FileText, Download, RefreshCw, Building2, TrendingUp,
  Users, Calendar, AlertTriangle, CheckCircle2, BarChart2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../utils/auth';

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FFFFFF] min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFFFF] p-4 md:p-6 pb-24 text-[#111111]">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-2xl text-[#111111] flex items-center gap-2">
              <FileText className="text-[#111111]" size={24} />
              Wellbeing Reports
            </h1>
            <p className="text-[#111111]/60 text-sm mt-0.5">
              Anonymized campus wellbeing data — no individual identity included
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
        </div>

        {!report ? (
          <Card className="p-12 text-center bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl">
            <FileText className="text-[#111111]/30 mx-auto mb-3" size={32} />
            <p className="text-[#111111]/60 font-medium">No report data available</p>
          </Card>
        ) : (
          <>
            {/* Report Header */}
            <Card className="p-6 border-2 border-[#111111] bg-[#FFFFFF] rounded-3xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F4C542]/20 border border-[#111111]/20 flex items-center justify-center shrink-0">
                  <Building2 className="text-[#111111]" size={22} />
                </div>
                <div>
                  <h2 className="font-heading font-black text-[#111111] text-lg">{report.report_title}</h2>
                  <p className="text-[#111111]/60 text-xs mt-0.5 font-medium">
                    Generated by: {report.generated_by} ·{' '}
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[#111111]/75 font-semibold">
                    <CheckCircle2 size={13} className="text-[#111111]" /> {report.note}
                  </div>
                </div>
              </div>
            </Card>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <Card className="p-5 bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-[#111111]/60">
                  <Users size={14} className="text-[#111111]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Students</span>
                </div>
                <p className="font-heading font-black text-2xl text-[#111111]">
                  {report.summary.total_enrolled_students_on_platform}
                </p>
                <p className="text-xs text-[#111111]/50 mt-0.5">On platform</p>
              </Card>

              <Card className="p-5 bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-[#111111]/60">
                  <TrendingUp size={14} className="text-[#111111]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Wellbeing</span>
                </div>
                <p className="font-heading font-black text-2xl text-[#111111]">
                  {report.summary.campus_wellbeing_score}%
                </p>
                <p className="text-xs text-[#111111]/60 font-bold mt-0.5">Campus score</p>
              </Card>

              <Card className="p-5 bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-[#111111]/60">
                  <AlertTriangle size={14} className="text-[#111111]" />
                  <span className="text-xs font-bold uppercase tracking-wider">High Risk</span>
                </div>
                <p className="font-heading font-black text-2xl text-[#111111]">
                  {report.summary.high_risk_students_percent}%
                </p>
                <p className="text-xs text-[#111111]/50 mt-0.5">Of students</p>
              </Card>

              <Card className="p-5 bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-[#111111]/60">
                  <Calendar size={14} className="text-[#111111]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Appointments</span>
                </div>
                <p className="font-heading font-black text-2xl text-[#111111]">
                  {report.summary.total_counseling_appointments}
                </p>
                <p className="text-xs text-[#111111]/50 mt-0.5">Total sessions</p>
              </Card>
            </div>

            {/* Department Breakdown */}
            <Card className="p-6 bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl shadow-sm">
              <h2 className="font-heading font-black text-[#111111] mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-[#111111]" />
                Department Wellbeing Breakdown
              </h2>
              {report.department_breakdown.length === 0 ? (
                <p className="text-[#111111]/50 text-sm">No department data available yet.</p>
              ) : (
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
                      {/* Wellbeing bar */}
                      <div className="h-2.5 bg-[#111111]/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-[#F4C542]"
                          style={{ width: `${dept.wellbeing_score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Privacy Notice */}
            <div className="p-4 bg-[#F4C542]/10 border border-[#F4C542]/40 rounded-2xl">
              <p className="text-xs text-[#111111]/80 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#111111] shrink-0" />
                <span>
                  This report contains <strong>no individual student identities, chat content, or journal entries</strong>.
                  All data is anonymized and aggregated per institutional privacy policy.
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

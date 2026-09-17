import React, { useState } from 'react';
import { 
  Building2, Users, ShieldAlert, Cpu, Activity, Plus, Search, 
  Settings, Lock, CheckCircle2, ChevronRight, AlertTriangle, Key, 
  Database, RefreshCw, BarChart3, Sliders, ExternalLink, FileText, Download
} from 'lucide-react';
import { getAuth } from '../utils/auth';
import { generateConsolidatedReportPDF, type ConsolidatedReportData } from '../utils/consolidatedReportPdf';
import { generateCounselorMonthlyReportPDF, type CounselorMonthlyReportData } from '../utils/counselorReportPdf';

interface CollegeDeployment {
  id: string;
  name: string;
  code: string;
  adminName: string;
  adminEmail: string;
  studentsCount: number;
  counselorsCount: number;
  status: 'active' | 'maintenance' | 'provisioning';
  joinedDate: string;
}

const INITIAL_COLLEGES: CollegeDeployment[] = [
  {
    id: 'col-1',
    name: 'Vishnu Institute of Technology (VIT)',
    code: 'VIT-BVRM',
    adminName: 'Prof. K. Satyanarayana',
    adminEmail: 'admin@vishnu.edu.in',
    studentsCount: 4250,
    counselorsCount: 7,
    status: 'active',
    joinedDate: 'August 2024',
  },
  {
    id: 'col-2',
    name: 'BVRIT Hyderabad College of Engineering for Women',
    code: 'BVRITH-HYD',
    adminName: 'Dr. Radhika Sharma',
    adminEmail: 'admin@bvrith.ac.in',
    studentsCount: 2800,
    counselorsCount: 5,
    status: 'active',
    joinedDate: 'November 2024',
  },
  {
    id: 'col-3',
    name: 'Shri Vishnu Engineering College for Women (SVECW)',
    code: 'SVECW-BVRM',
    adminName: 'Dr. P. Srinivasa Rao',
    adminEmail: 'admin@svecw.edu.in',
    studentsCount: 3900,
    counselorsCount: 6,
    status: 'active',
    joinedDate: 'January 2025',
  }
];

export default function SuperAdminDashboard() {
  const auth = getAuth();
  const [colleges, setColleges] = useState<CollegeDeployment[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_society_colleges');
      return stored ? JSON.parse(stored) : INITIAL_COLLEGES;
    } catch {
      return INITIAL_COLLEGES;
    }
  });
  const [activeTab, setActiveTab] = useState<'colleges' | 'consolidated_reports' | 'counselor_reports' | 'ai_config' | 'security' | 'audit'>('colleges');
  const [consolidatedReports, setConsolidatedReports] = useState<ConsolidatedReportData[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_consolidated_monthly_reports');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'cons-aug-2026',
        reportTitle: 'SHRI VISHNU EDUCATIONAL SOCIETY — CONSOLIDATED MONTHLY REPORT – AUGUST 2026',
        month: 'August',
        year: 2026,
        compiledBy: 'Vishnu Wellness Centre Administration',
        approvedBy: 'Sri Vishnu Educational Society Central Governance',
        submittedAt: '2026-08-31T18:00:00.000Z',
        executiveSummary: {
          totalSocietyStudents: 14200,
          totalSessionsAcrossCampuses: 195,
          avgSatisfactionIndex: '96.2%',
          sosCrisisHandled: 4,
          workshopsConducted: 7
        },
        institutionBreakdown: [
          { institution: 'VIT', code: 'VIT', counselorName: 'Ram Prudhvi Teja', activeStudents: 4200, individualSessions: 31, groupSessions: 2, totalSessions: 33, highRiskCount: 1 },
          { institution: 'SVECW + VIT', code: 'SVECW', counselorName: 'Sahithi Challa', activeStudents: 3950, individualSessions: 32, groupSessions: 2, totalSessions: 34, highRiskCount: 1 },
          { institution: 'VDC', code: 'VDC', counselorName: 'Angel', activeStudents: 1150, individualSessions: 29, groupSessions: 1, totalSessions: 30, highRiskCount: 0 },
          { institution: 'SVCP', code: 'SVCP', counselorName: 'Akshitha Selvaraj', activeStudents: 900, individualSessions: 27, groupSessions: 1, totalSessions: 28, highRiskCount: 0 },
          { institution: 'SBSP', code: 'SBSP', counselorName: 'Bantu Anumitha', activeStudents: 1400, individualSessions: 28, groupSessions: 1, totalSessions: 29, highRiskCount: 0 },
          { institution: "Vishnu Women's University", code: 'VWU', counselorName: 'Wellness Counsellor', activeStudents: 1800, individualSessions: 46, groupSessions: 1, totalSessions: 47, highRiskCount: 2 },
          { institution: 'B.V. Raju College', code: 'BVRC', counselorName: 'G. Navya Sri', activeStudents: 1600, individualSessions: 2, groupSessions: 4, totalSessions: 6, highRiskCount: 0 },
        ]
      }
    ];
  });
  const [counselorReports, setCounselorReports] = useState<CounselorMonthlyReportData[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_counselor_monthly_reports');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'rep-ram-aug-2026',
        counselorName: 'Ram Prudhvi Teja',
        counselorEmail: 'prudhvi.v@vishnu.edu.in',
        department: 'Vishnu Wellness Centre',
        institution: 'Vishnu Institute of Technology (VIT), Bhimavaram',
        month: 'August',
        year: 2026,
        submittedAt: '2026-08-31T17:00:00.000Z',
        administrativeMeetings: [
          {
            meetingName: 'VEDIC Meeting',
            purposeOutcome: 'Attended the VEDIC Meeting on 24th August 2026 and discussed the activities and programmes conducted by the Vishnu Wellness Centre during July, along with updates and follow-up on ongoing wellness initiatives.',
            text: 'Attended the VEDIC Meeting on 24th August 2026 and discussed the activities and programmes conducted by the Vishnu Wellness Centre during July, along with updates and follow-up on ongoing wellness initiatives.'
          },
          {
            meetingName: 'Wellness Counsellors Team Meeting',
            purposeOutcome: 'Conducted a team meeting with the Wellness Counsellors to review ongoing activities and discuss upcoming events for the current and following months.',
            text: 'Conducted a team meeting with the Wellness Counsellors to review ongoing activities and discuss upcoming events for the current and following months. The discussions included updates on previously planned initiatives, event planning and preparation, timelines, resource requirements, and coordination among team members. Duties and responsibilities were delegated for the month to ensure smooth execution of programmes, with follow-up on progress and necessary preparations for upcoming activities.'
          },
          {
            meetingName: 'VWU & VIT Induction Programme',
            purposeOutcome: 'Attended the Induction Programme for VWU & VIT on 23rd August 2026 as part of the institutional orientation and engagement activities.',
            text: 'Attended the Induction Programme for VWU & VIT on 23rd August 2026 as part of the institutional orientation and engagement activities.'
          },
          {
            meetingName: 'Learning & Development (L&D) Programme',
            purposeOutcome: 'Attended the Learning & Development (L&D) Programme conducted by Ms. Akshitha on 28th and 29th August 2026.',
            text: 'Attended the Learning & Development (L&D) Programme conducted by Ms. Akshitha on 28th and 29th August 2026.'
          },
          {
            meetingName: 'VWC Social Media Platform Launch',
            purposeOutcome: 'Created the Vishnu Wellness Centre Social Media Account to establish an online platform for sharing mental health awareness content, wellness initiatives, programmes, and student-support resources.',
            text: 'Created the Vishnu Wellness Centre Social Media Account to establish an online platform for sharing mental health awareness content, wellness initiatives, programmes, and student-support resources.'
          },
          {
            meetingName: 'Flyers and Banners Preparation',
            purposeOutcome: 'Designed and prepared flyers and banners for upcoming wellness events in accordance with the Vishnu Wellness Calendar to support programme communication and campus-wide awareness.',
            text: 'Designed and prepared flyers and banners for upcoming wellness events in accordance with the Vishnu Wellness Calendar to support programme communication and campus-wide awareness.'
          }
        ],
        activitiesConducted: [
          {
            activityName: 'Orientation Programme for First-Year Students',
            targetAudience: '1st Year B.Tech Students (VIT & VWU)',
            participantsCount: 350,
            keyTakeaway: 'Conducted an Orientation Programme for first-year students, introducing students to the importance of mental health and the psychological and wellness support services available through the Vishnu Wellness Centre.',
            text: 'Conducted an Orientation Programme for first-year students, introducing students to the importance of mental health and the psychological and wellness support services available through the Vishnu Wellness Centre.'
          },
          {
            activityName: 'MINDTAP – Radio Vishnu Programme',
            targetAudience: 'Campus Community',
            participantsCount: 500,
            keyTakeaway: 'Recorded 5 episodes of the MINDTAP – Radio Vishnu programme, continuing the initiative of providing psychological awareness and wellness-oriented content to the campus community through radio.',
            text: 'Recorded 5 episodes of the MINDTAP – Radio Vishnu programme, continuing the initiative of providing psychological awareness and wellness-oriented content to the campus community through radio.'
          },
          {
            activityName: 'Gatekeeper Training (NIMHANS e-Learning)',
            targetAudience: 'Wellness Counsellors & Key Faculty',
            participantsCount: 20,
            keyTakeaway: 'Successfully completed the Gatekeeper Training through the NIMHANS e-Learning Programme, strengthening knowledge and preparedness for identifying individuals experiencing psychological distress and facilitating appropriate support and referral.',
            text: 'Successfully completed the Gatekeeper Training through the NIMHANS e-Learning Programme, strengthening knowledge and preparedness for identifying individuals experiencing psychological distress and facilitating appropriate support and referral.'
          }
        ],
        sessionStats: {
          week1: '8 + 3 day leave',
          week2: 10,
          week3: 7,
          week4: 5,
          week5: 1,
          total: 31,
          week1Label: '01-08-2026 to 08-08-2026 (1st Week)',
          week2Label: '10-08-2026 to 15-08-2026 (2nd Week)',
          week3Label: '17-08-2026 to 22-08-2026 (3rd Week)',
          week4Label: '24-08-2026 to 29-08-2026 (4th Week)',
          week5Label: '31-08-2026 (5th Week)',
          academicStress: 12,
          emotionalAnxiety: 10,
          familyInterpersonal: 5,
          careerGuidance: 3,
          generalWellbeing: 1,
          crisisSos: 0,
          genderBreakdown: { male: 14, female: 17, other: 0 }
        },
        upcomingGoals: [
          'Continue regular individual and group counselling sessions for students.',
          'Plan and conduct a Suicide Prevention Programme to promote awareness, help-seeking behaviour, early identification, and appropriate support.',
          'Conduct the COPE Programme on Open Mic to encourage student expression, participation, and open conversations around mental health and well-being.',
          'Conduct a Psychology Club/HOPE Club group session on “Understanding Human Behaviour from a Layman’s Perspective”, helping students understand basic psychological concepts and everyday human behaviour in an accessible manner.'
        ],
        generalRemarks: 'All activities for August 2026 completed in accordance with the Vishnu Wellness Calendar.'
      }
    ];
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI Config State
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'local'>('gemini');
  const [safetyThreshold, setSafetyThreshold] = useState<number>(75);
  const [autoEscalateEmergency, setAutoEscalateEmergency] = useState<boolean>(true);
  const [configSaved, setConfigSaved] = useState<boolean>(false);

  // New College Modal
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColCode, setNewColCode] = useState('');
  const [newColAdmin, setNewColAdmin] = useState('');
  const [newColEmail, setNewColEmail] = useState('');

  const handleAddCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName || !newColCode || !newColEmail) return;
    const item: CollegeDeployment = {
      id: `col-${Date.now()}`,
      name: newColName,
      code: newColCode.toUpperCase(),
      adminName: newColAdmin || 'Campus Admin',
      adminEmail: newColEmail,
      studentsCount: 0,
      counselorsCount: 0,
      status: 'active',
      joinedDate: 'Today',
    };
    const updated = [item, ...colleges];
    setColleges(updated);
    localStorage.setItem('mindbridge_society_colleges', JSON.stringify(updated));
    setShowAddCollege(false);
    setNewColName('');
    setNewColCode('');
    setNewColAdmin('');
    setNewColEmail('');
  };

  const handleSaveAiConfig = () => {
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const filteredColleges = colleges.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = colleges.reduce((sum, c) => sum + c.studentsCount, 0);
  const totalCounselors = colleges.reduce((sum, c) => sum + c.counselorsCount, 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto pb-20 text-[#111111]">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] text-[#111111] flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111111]">
                Super Admin Console
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#F4C542] text-[#111111] text-[10px] font-black tracking-wider border border-[#111111]">
                ROOT
              </span>
            </div>
            <p className="text-xs text-[#111111]/60 font-bold mt-0.5">
              Multi-Campus Deployment &amp; Governance · Sri Vishnu Educational Society
            </p>
          </div>
        </div>

        {/* Global Quick Action */}
        <button
          onClick={() => setShowAddCollege(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Deploy New College</span>
        </button>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Institutions</span>
            <Building2 size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{colleges.length}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">100% Active Campuses</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Total Students</span>
            <Users size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{totalStudents.toLocaleString()}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">All Protected Anonymously</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Active Counsellors</span>
            <Activity size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{totalCounselors}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">Licensed Clinical Staff</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">AI Sentinel</span>
            <Cpu size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">Online</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">Clinical Sentiment Active</p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FAFAFA] border border-[#111111]/15 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('colleges')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'colleges'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <Building2 size={14} />
          <span>Colleges &amp; Campuses ({colleges.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ai_config')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'ai_config'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <Sliders size={14} />
          <span>AI Engine Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <Lock size={14} />
          <span>RBAC &amp; Access Control</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <BarChart3 size={14} />
          <span>Platform Audit Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('consolidated_reports')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'consolidated_reports'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <FileText size={14} />
          <span>Consolidated Reports ({consolidatedReports.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('counselor_reports')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'counselor_reports'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <Building2 size={14} />
          <span>Counsellor Reports ({counselorReports.length})</span>
        </button>
      </div>

      {/* ── TAB: CONSOLIDATED REPORTS (ATTACHMENT 5) ── */}
      {activeTab === 'consolidated_reports' && (
        <div className="space-y-6 animate-fade-in text-[#111111]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                  Attachment 5 Governance
                </span>
                <span className="text-xs font-mono text-[#111111]/60">SVES Centralized Repository</span>
              </div>
              <h2 className="text-2xl font-heading font-black text-[#111111]">
                Consolidated Society Reports ({consolidatedReports.length})
              </h2>
              <p className="text-xs text-[#111111]/70 mt-1">
                All monthly reports consolidated across Sri Vishnu Educational Society campuses submitted by Central Admin.
              </p>
            </div>
          </div>

          {consolidatedReports.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-[#111111]/20 rounded-3xl bg-[#FFFFFF] space-y-2">
              <FileText size={36} className="mx-auto text-[#111111]/30" />
              <p className="text-sm font-bold text-[#111111]">No Consolidated Reports filed yet</p>
              <p className="text-xs text-[#111111]/60 max-w-sm mx-auto">
                Reports compiled by campus administrators will appear here automatically for executive society review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {consolidatedReports.map((rep) => (
                <div 
                  key={rep.id}
                  className="p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111111]/10 pb-3">
                    <div>
                      <h3 className="text-lg font-heading font-black text-[#111111]">
                        {rep.reportTitle}
                      </h3>
                      <p className="text-xs text-[#111111]/60 font-mono">
                        Compiled by: {rep.compiledBy} · Approved by: {rep.approvedBy}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-green-100 text-green-900 border border-green-300">
                      SOCIETY LEVEL AUDIT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAFAFA] p-4 rounded-2xl border border-[#111111]/15 text-center font-mono">
                    <div>
                      <span className="block text-[10px] text-[#111111]/60 uppercase">Society Campuses</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.institutionBreakdown.length}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#111111]/60 uppercase">Total Sessions</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.totalSessionsAcrossCampuses}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#111111]/60 uppercase">Students Reach</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.totalSocietyStudents.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#111111]/60 uppercase">Satisfaction</span>
                      <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.avgSatisfactionIndex}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => generateConsolidatedReportPDF(rep)}
                      className="px-5 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Download size={14} />
                      <span>Download Attachment 5 Vector PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: COUNSELLOR MONTHLY REPORTS (ATTACHMENT 4) ── */}
      {activeTab === 'counselor_reports' && (
        <div className="space-y-6 animate-fade-in text-[#111111]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] text-[#111111] px-2 py-0.5 rounded-full border border-[#111111]">
                  Attachment 4 Clinical Archive
                </span>
                <span className="text-xs font-mono text-[#111111]/60">All Institutional Counsellors</span>
              </div>
              <h2 className="text-2xl font-heading font-black text-[#111111]">
                Counsellor Monthly Reports ({counselorReports.length})
              </h2>
              <p className="text-xs text-[#111111]/70 mt-1">
                Review individualized psychologist submissions across SVECW, VIT, VDC, SVCP, SBSP, and BVRC campuses.
              </p>
            </div>
          </div>

          {counselorReports.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-[#111111]/20 rounded-3xl bg-[#FFFFFF] space-y-2">
              <Building2 size={36} className="mx-auto text-[#111111]/30" />
              <p className="text-sm font-bold text-[#111111]">No Counsellor Reports filed yet</p>
              <p className="text-xs text-[#111111]/60 max-w-sm mx-auto">
                When psychologists file their monthly reports from their clinical portal, they reflect here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {counselorReports.map((cRep) => (
                <div 
                  key={cRep.id}
                  className="p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm space-y-4 hover:border-[#F4C542] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-black uppercase text-[#111111]/60">
                          {cRep.institution}
                        </span>
                        <h3 className="text-lg font-heading font-black text-[#111111] mt-0.5">
                          {cRep.counselorName} · {cRep.month} {cRep.year}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-green-100 text-green-900 border border-green-300">
                        OFFICIALLY FILED
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#FAFAFA] p-3 rounded-2xl border border-[#111111]/15 text-center font-mono">
                      <div>
                        <span className="block text-[9px] text-[#111111]/60 uppercase">Sessions</span>
                        <span className="text-base font-heading font-black text-[#111111]">{cRep.sessionStats.total}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#111111]/60 uppercase">Meetings</span>
                        <span className="text-base font-heading font-black text-[#111111]">{cRep.administrativeMeetings.length}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#111111]/60 uppercase">Workshops</span>
                        <span className="text-base font-heading font-black text-[#111111]">{cRep.activitiesConducted.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#111111]/10">
                    <button
                      onClick={() => generateCounselorMonthlyReportPDF(cRep)}
                      className="w-full py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Download size={14} />
                      <span>Download Attachment 4 Vector PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 1: COLLEGES DIRECTORY ── */}
      {activeTab === 'colleges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-[#FFFFFF] p-3 rounded-2xl border border-[#111111]/15">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40" />
              <input
                type="text"
                placeholder="Search college name, code, or administrator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAFAFA] rounded-xl border border-[#111111]/15 text-[#111111] font-bold focus:outline-none focus:border-[#111111]"
              />
            </div>
            <span className="text-xs text-[#111111]/60 font-bold">
              Showing {filteredColleges.length} campuses
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredColleges.map((col) => (
              <div
                key={col.id}
                className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 hover:border-[#111111] transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#FAFAFA] text-[#111111] font-mono text-[11px] font-black border border-[#111111]/20">
                      {col.code}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#111111] bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                      ● Live
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[#111111] leading-tight mb-2">
                    {col.name}
                  </h3>

                  <div className="space-y-1.5 text-xs text-[#111111]/70 border-t border-[#111111]/10 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span>Administrator:</span>
                      <span className="font-bold text-[#111111]">{col.adminName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Official Email:</span>
                      <span className="font-mono text-[#111111] text-[11px]">{col.adminEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enrolled Students:</span>
                      <span className="font-bold text-[#111111]">{col.studentsCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Counsellors:</span>
                      <span className="font-bold text-[#111111]">{col.counselorsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#111111]/10 flex items-center justify-between">
                  <span className="text-[10px] text-[#111111]/50 font-mono">Joined {col.joinedDate}</span>
                  <button className="text-xs font-black text-[#111111] hover:underline flex items-center gap-1 cursor-pointer">
                    Manage Campus <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: AI ENGINE CONFIGURATION ── */}
      {activeTab === 'ai_config' && (
        <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#111111] shadow-xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-black text-[#111111]">AI Screening &amp; Sentiment Guard</h2>
            <p className="text-xs text-[#111111]/60 mt-0.5 font-medium">
              Control the neural parameters driving automated triage, distress indicators, and risk classification.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#111111] mb-1.5">
                Primary Clinical Reasoning Model
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    aiProvider === 'gemini' 
                      ? 'border-2 border-[#111111] bg-[#F4C542] text-[#111111]' 
                      : 'border-[#111111]/15 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-xs font-black">Google Gemini</p>
                  <p className="text-[10px] text-[#111111]/70 mt-0.5">Optimized clinical empathy</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('openai')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    aiProvider === 'openai' 
                      ? 'border-2 border-[#111111] bg-[#F4C542] text-[#111111]' 
                      : 'border-[#111111]/15 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-xs font-black">OpenAI GPT-4o</p>
                  <p className="text-[10px] text-[#111111]/70 mt-0.5">Analytical screening</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('local')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    aiProvider === 'local' 
                      ? 'border-2 border-[#111111] bg-[#F4C542] text-[#111111]' 
                      : 'border-[#111111]/15 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-xs font-black">Air-Gapped Local</p>
                  <p className="text-[10px] text-[#111111]/70 mt-0.5">On-premise zero leakage</p>
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-black text-[#111111]">
                  Emergency Escalation Threshold
                </label>
                <span className="px-2 py-0.5 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] text-xs font-black">
                  Score ≥ {safetyThreshold}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                value={safetyThreshold}
                onChange={(e) => setSafetyThreshold(Number(e.target.value))}
                className="w-full accent-[#111111] cursor-pointer"
              />
              <p className="text-[11px] text-[#111111]/60 mt-1">
                When student conversations or journal entries cross this sentiment risk score, counsellors receive immediate alerts.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15">
              <div>
                <p className="text-xs font-black text-[#111111]">Auto-Escalate Severe Crisis SOS</p>
                <p className="text-[11px] text-[#111111]/60 font-medium">
                  Trigger immediate notifications to on-duty Vishnu Wellness Centre counsellors when distress triggers are detected.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoEscalateEmergency}
                onChange={(e) => setAutoEscalateEmergency(e.target.checked)}
                className="w-4 h-4 accent-[#111111] rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSaveAiConfig}
              className="px-6 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Save Configuration
            </button>
            {configSaved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#111111] animate-fade-in">
                <CheckCircle2 size={16} /> Saved &amp; deployed across campuses
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: RBAC & ACCESS CONTROL ── */}
      {activeTab === 'security' && (
        <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#111111]/15 shadow-xs max-w-3xl space-y-4">
          <h2 className="text-base font-black text-[#111111]">Role-Based Access Control (RBAC)</h2>
          <div className="divide-y divide-[#111111]/10 text-xs">
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-black text-[#111111]">Super Admin</p>
                <p className="text-[#111111]/60 text-[11px]">Deploy institutions, manage college admins, global system audit, AI parameters</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#111111] text-[#FFFFFF] font-black text-[10px]">ALL PRIVILEGES</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-black text-[#111111]">College Admin</p>
                <p className="text-[#111111]/60 text-[11px]">Manage campus counsellors, view anonymized trends, appointments &amp; offline records</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] font-black text-[10px]">CAMPUS ROOT</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-black text-[#111111]">Licensed Counsellor</p>
                <p className="text-[#111111]/60 text-[11px]">Conduct student sessions, manage to-dos, log offline records, request identity under protocol</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F4C542] border border-[#111111] text-[#111111] font-black text-[10px]">CLINICAL ACCESS</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-black text-[#111111]">Student (Anonymous)</p>
                <p className="text-[#111111]/60 text-[11px]">Private journals, scheduled appointments, AI emotional chat, digital detox, mind puzzles</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] font-bold text-[10px]">PRIVACY-FIRST</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: AUDIT LOGS ── */}
      {activeTab === 'audit' && (
        <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#111111]/15 shadow-xs max-w-4xl">
          <h2 className="text-base font-black text-[#111111] mb-4">Platform Audit Trails</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] text-[#111111]/60 font-black uppercase tracking-wider text-[10px] border-b border-[#111111]/10">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Campus</th>
                  <th className="p-3">Actor Role</th>
                  <th className="p-3">Action Description</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/10">
                <tr>
                  <td className="p-3 font-mono text-[11px] text-[#111111]/60">08/09/2026 18:45</td>
                  <td className="p-3 font-bold text-[#111111]">VIT-BVRM</td>
                  <td className="p-3 font-black text-[#111111]">Counsellor</td>
                  <td className="p-3 font-medium">Manual Offline Session recorded for alias BlueSky27</td>
                  <td className="p-3 text-[#111111] font-black">Verified</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] text-[#111111]/60">08/09/2026 17:30</td>
                  <td className="p-3 font-bold text-[#111111]">VIT-BVRM</td>
                  <td className="p-3 font-black text-[#111111]">Admin</td>
                  <td className="p-3 font-medium">Monthly counselling privacy report generated</td>
                  <td className="p-3 text-[#111111] font-black">Success</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] text-[#111111]/60">08/09/2026 16:15</td>
                  <td className="p-3 font-bold text-[#111111]">BVRITH-HYD</td>
                  <td className="p-3 font-black text-[#111111]">Counsellor</td>
                  <td className="p-3 font-medium">Completed audio session with Student_482</td>
                  <td className="p-3 text-[#111111] font-black">Archived</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: Deploy New College ── */}
      {showAddCollege && (
        <div className="fixed inset-0 z-50 bg-[#111111]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] text-[#111111] w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-[#111111] animate-scale-up space-y-4">
            <div>
              <h2 className="text-base font-black text-[#111111]">Deploy New Campus</h2>
              <p className="text-xs text-[#111111]/60 mt-0.5">
                Provision a new college instance with independent RBAC and dedicated counselling team.
              </p>
            </div>

            <form onSubmit={handleAddCollege} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vishnu Dental College"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Campus Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VDC-BVRM"
                  value={newColCode}
                  onChange={(e) => setNewColCode(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Designated Administrator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Suresh Varma"
                  value={newColAdmin}
                  onChange={(e) => setNewColAdmin(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Administrator Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@vdc.edu.in"
                  value={newColEmail}
                  onChange={(e) => setNewColEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCollege(false)}
                  className="px-4 py-2 rounded-xl text-[#111111] border border-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4C542] text-[#111111] font-black border-2 border-[#111111] hover:bg-[#e0b435] shadow-xs cursor-pointer active:scale-95"
                >
                  Provision Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
